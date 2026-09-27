import { describe, it, expect, vi, beforeEach } from 'vitest';

// Rate limiting is covered separately; bypass it so route tests are deterministic.
vi.mock('../src/services/rateLimit', () => ({
  rateLimit: () => async (_c: any, next: any) => next(),
}));

vi.mock('../src/services/db', () => ({
  getSupabase: vi.fn(),
}));

import auth from '../src/routes/auth';
import { getSupabase } from '../src/services/db';
import { hashPassword, generateTokens } from '../src/services/auth';

const ENV = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  JWT_SECRET: 'test-secret-at-least-32-chars-long!!',
};

function jsonRequest(path: string, method: string, body?: unknown, headers: Record<string, string> = {}) {
  return auth.request(
    path,
    {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    ENV as any
  );
}

/** Chain for: from().select().eq().maybeSingle() */
function selectMaybeSingle(result: { data: any; error?: any }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: result.data, error: result.error ?? null }),
        }),
        maybeSingle: vi.fn().mockResolvedValue({ data: result.data, error: result.error ?? null }),
      }),
    }),
  };
}

/** Chain for: from().insert().select().single() */
function insertSingle(result: { data: any; error?: any }) {
  return {
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: result.data, error: result.error ?? null }),
      }),
    }),
  };
}

describe('POST /register (login: account creation)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a user and returns 201', async () => {
    const from = vi
      .fn()
      .mockReturnValueOnce(selectMaybeSingle({ data: null })) // username free
      .mockReturnValueOnce(
        insertSingle({ data: { id: 1, username: 'newuser', email: 'n@example.com' } })
      );
    vi.mocked(getSupabase).mockReturnValue({ from } as any);

    const res = await jsonRequest('/register', 'POST', {
      username: 'newuser',
      email: 'n@example.com',
      password: 'long-enough-password-123',
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ username: 'newuser' });
  });

  it('rejects duplicate usernames with 400', async () => {
    const from = vi.fn().mockReturnValueOnce(selectMaybeSingle({ data: { id: 9 } }));
    vi.mocked(getSupabase).mockReturnValue({ from } as any);

    const res = await jsonRequest('/register', 'POST', {
      username: 'taken',
      email: 't@example.com',
      password: 'long-enough-password-123',
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toHaveProperty('username');
  });

  it('rejects short passwords with 400', async () => {
    const res = await jsonRequest('/register', 'POST', {
      username: 'u',
      email: 'u@example.com',
      password: 'short',
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid email with 400', async () => {
    const res = await jsonRequest('/register', 'POST', {
      username: 'u',
      email: 'not-an-email',
      password: 'long-enough-password-123',
    });
    expect(res.status).toBe(400);
  });

  it('rejects oversized bodies with 400', async () => {
    const res = await jsonRequest(
      '/register',
      'POST',
      { username: 'u', password: 'long-enough-password-123', pad: 'x'.repeat(9000) },
      { 'content-length': '9001' }
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /token (login)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns an access token and sets the refresh cookie on valid credentials', async () => {
    const stored = await hashPassword('correct-password-123');
    const from = vi
      .fn()
      // fetch user for verification
      .mockReturnValueOnce(
        selectMaybeSingle({ data: { id: 5, username: 'alice', password: stored, is_active: true } })
      )
      // last_login update (update().eq() awaited directly)
      .mockReturnValueOnce({
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }),
      });
    vi.mocked(getSupabase).mockReturnValue({ from } as any);

    const res = await jsonRequest('/token/', 'POST', {
      username: 'alice',
      password: 'correct-password-123',
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.access).toBeTruthy();
    expect(res.headers.get('Set-Cookie')).toContain('refresh_token=');
  });

  it('returns 401 for wrong passwords and unknown users', async () => {
    const stored = await hashPassword('correct-password-123');
    const from = vi
      .fn()
      .mockReturnValue(selectMaybeSingle({ data: { id: 5, username: 'alice', password: stored, is_active: true } }));
    vi.mocked(getSupabase).mockReturnValue({ from } as any);

    const wrong = await jsonRequest('/token/', 'POST', { username: 'alice', password: 'nope-nope-nope-123' });
    expect(wrong.status).toBe(401);

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(selectMaybeSingle({ data: null })),
    } as any);
    const unknown = await jsonRequest('/token/', 'POST', { username: 'ghost', password: 'long-enough-password-123' });
    expect(unknown.status).toBe(401);
  });
});

describe('POST /token/refresh + /token/logout (login: sessions)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rotates tokens when the refresh cookie is valid', async () => {
    const tokens = await generateTokens(5, 'alice', ENV.JWT_SECRET);
    const from = vi
      .fn()
      .mockReturnValueOnce(selectMaybeSingle({ data: { id: 5, username: 'alice', is_active: true } }));
    vi.mocked(getSupabase).mockReturnValue({ from } as any);

    const res = await jsonRequest('/token/refresh/', 'POST', {}, { Cookie: `refresh_token=${tokens.refresh}` });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.access).toBeTruthy();
    expect(body.access).not.toBe(tokens.access);
  });

  it('returns 400 without a refresh cookie and 401 for a bad one', async () => {
    const missing = await jsonRequest('/token/refresh/', 'POST', {});
    expect(missing.status).toBe(400);

    const bad = await jsonRequest('/token/refresh/', 'POST', {}, { Cookie: 'refresh_token=garbage' });
    expect(bad.status).toBe(401);
  });

  it('clears the refresh cookie on logout', async () => {
    const res = await jsonRequest('/token/logout/', 'POST', {});
    expect(res.status).toBe(200);
    expect(res.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });
});
