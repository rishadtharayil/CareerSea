import { describe, it, expect, vi } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  timingSafeEqual,
  getJwtSecret,
  getCookie,
  setRefreshCookie,
  generateTokens,
  verifyToken,
  authenticateAccessToken,
  PBKDF2_ITERATIONS,
} from '../src/services/auth';

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!';

describe('password hashing (Django-compatible PBKDF2-SHA256)', () => {
  it('stays within the iteration ceiling the Workers runtime supports', () => {
    // Cloudflare rejects >100000 with NotSupportedError, which surfaced as a
    // production 500 on both register and login.
    expect(PBKDF2_ITERATIONS).toBe(100000);
    expect(PBKDF2_ITERATIONS).toBeLessThanOrEqual(100000);
  });

  it('produces a Django-format hash that verifies with the correct password', async () => {
    const hash = await hashPassword('correct-password-123');
    expect(hash).toMatch(/^pbkdf2_sha256\$100000\$.+\$.+$/);
    expect(await verifyPassword('correct-password-123', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct-password-123');
    expect(await verifyPassword('wrong-password-xyz', hash)).toBe(false);
  });

  it('rejects malformed or unsupported hashes without throwing', async () => {
    expect(await verifyPassword('anything', '')).toBe(false);
    expect(await verifyPassword('anything', 'not-a-hash')).toBe(false);
    expect(await verifyPassword('anything', 'bcrypt$10$salt$hash')).toBe(false);
    expect(await verifyPassword('anything', 'pbkdf2_sha256$600000$$hash')).toBe(false);
  });

  it('rejects absurd iteration counts before deriving (DoS guard)', async () => {
    // 99999999 iterations would hang if actually derived; must fail fast.
    const evil = 'pbkdf2_sha256$99999999$salt$aGFzaA==';
    const start = Date.now();
    expect(await verifyPassword('anything', evil)).toBe(false);
    expect(Date.now() - start).toBeLessThan(5_000);
  });

  it('fails closed (not throws) on legacy Django hashes above the Workers ceiling', async () => {
    // Production regression: real users carry 1,000,000-iteration Django hashes.
    // Deriving these throws NotSupportedError in Workers, which escaped as a 500
    // from /api/token/. Verification must return false so login yields 401.
    const legacy = 'pbkdf2_sha256$1000000$c2FsdHNhbHQ$aGFzaGhhc2hoYXNoaGFzaA==';
    await expect(verifyPassword('any-password', legacy)).resolves.toBe(false);
  });

  it('generates unique salts per password', async () => {
    const a = await hashPassword('same-password-123');
    const b = await hashPassword('same-password-123');
    expect(a).not.toBe(b);
    expect(await verifyPassword('same-password-123', a)).toBe(true);
    expect(await verifyPassword('same-password-123', b)).toBe(true);
  });
});

describe('timingSafeEqual', () => {
  it('compares strings correctly', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('getJwtSecret', () => {
  it('returns the secret when configured', () => {
    expect(getJwtSecret('s')).toBe('s');
  });

  it('throws when the secret is missing', () => {
    expect(() => getJwtSecret(undefined)).toThrow('JWT_SECRET is not configured.');
    expect(() => getJwtSecret('')).toThrow('JWT_SECRET is not configured.');
  });
});

describe('getCookie', () => {
  it('extracts a named cookie from the header', () => {
    expect(getCookie('a=1; refresh_token=tok123; b=2', 'refresh_token')).toBe('tok123');
  });

  it('decodes URI-encoded values', () => {
    expect(getCookie('refresh_token=abc%20def', 'refresh_token')).toBe('abc def');
  });

  it('returns null when absent or malformed', () => {
    expect(getCookie(undefined, 'refresh_token')).toBeNull();
    expect(getCookie('a=1; b=2', 'refresh_token')).toBeNull();
    expect(getCookie('refresh_token=%E0%A4%A', 'refresh_token')).toBeNull();
  });
});

describe('setRefreshCookie', () => {
  function mockContext(url: string) {
    const headers: Record<string, string> = {};
    return {
      c: {
        req: { url },
        header: (k: string, v: string) => {
          headers[k] = v;
        },
      } as any,
      headers,
    };
  }

  it('sets HttpOnly cookie without Secure on localhost', () => {
    const { c, headers } = mockContext('http://localhost:8787/api/token/');
    setRefreshCookie(c, 'tok');
    expect(headers['Set-Cookie']).toContain('refresh_token=tok');
    expect(headers['Set-Cookie']).toContain('HttpOnly');
    expect(headers['Set-Cookie']).not.toContain('Secure');
    expect(headers['Set-Cookie']).toContain('Path=/api/token');
  });

  it('sets Secure on production hosts', () => {
    const { c, headers } = mockContext('https://api.careersea.in/api/token/');
    setRefreshCookie(c, 'tok');
    expect(headers['Set-Cookie']).toContain('Secure');
  });

  it('clears the cookie on logout (Max-Age=0)', () => {
    const { c, headers } = mockContext('https://api.careersea.in/api/token/logout/');
    setRefreshCookie(c, null);
    expect(headers['Set-Cookie']).toContain('refresh_token=;');
    expect(headers['Set-Cookie']).toContain('Max-Age=0');
  });
});

describe('JWT tokens', () => {
  it('generateTokens produces verifiable access + refresh tokens', async () => {
    const tokens = await generateTokens(42, 'alice', JWT_SECRET);
    expect(tokens.access).toBeTruthy();
    expect(tokens.refresh).toBeTruthy();
    expect(tokens.access).not.toBe(tokens.refresh);

    const access = await verifyToken(tokens.access, JWT_SECRET);
    expect(access).toMatchObject({ user_id: 42, username: 'alice', token_type: 'access' });

    const refresh = await verifyToken(tokens.refresh, JWT_SECRET);
    expect(refresh).toMatchObject({ user_id: 42, username: 'alice', token_type: 'refresh' });
  });

  it('rejects tokens signed with another secret or tampered', async () => {
    const tokens = await generateTokens(1, 'bob', JWT_SECRET);
    expect(await verifyToken(tokens.access, 'different-secret')).toBeNull();
    expect(await verifyToken(tokens.access.slice(0, -2) + 'xx', JWT_SECRET)).toBeNull();
    expect(await verifyToken('not-a-token', JWT_SECRET)).toBeNull();
  });
});

describe('authenticateAccessToken', () => {
  function mockSupabase(userRow: any) {
    return {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: userRow, error: null }),
            }),
          }),
        }),
      }),
    } as any;
  }

  it('returns the user id for a valid access token of an active user', async () => {
    const { access } = await generateTokens(7, 'carol', JWT_SECRET);
    const id = await authenticateAccessToken(
      `Bearer ${access}`,
      JWT_SECRET,
      mockSupabase({ id: 7, username: 'carol', is_active: true })
    );
    expect(id).toBe(7);
  });

  it('returns null without a Bearer header', async () => {
    expect(await authenticateAccessToken(undefined, JWT_SECRET, mockSupabase(null))).toBeNull();
    expect(await authenticateAccessToken('Token abc', JWT_SECRET, mockSupabase(null))).toBeNull();
    expect(await authenticateAccessToken('Bearer ', JWT_SECRET, mockSupabase(null))).toBeNull();
  });

  it('rejects refresh tokens used as access tokens', async () => {
    const { refresh } = await generateTokens(7, 'carol', JWT_SECRET);
    const id = await authenticateAccessToken(
      `Bearer ${refresh}`,
      JWT_SECRET,
      mockSupabase({ id: 7, username: 'carol', is_active: true })
    );
    expect(id).toBeNull();
  });

  it('rejects inactive users, missing users, and username mismatches', async () => {
    const { access } = await generateTokens(7, 'carol', JWT_SECRET);
    const header = `Bearer ${access}`;
    expect(await authenticateAccessToken(header, JWT_SECRET, mockSupabase(null))).toBeNull();
    expect(
      await authenticateAccessToken(
        header,
        JWT_SECRET,
        mockSupabase({ id: 7, username: 'mallory', is_active: true })
      )
    ).toBeNull();
  });
});
