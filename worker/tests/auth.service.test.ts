import { describe, it, expect, vi } from 'vitest';
import { getAuthenticatedUser, getCookie } from '../src/services/auth';

function mockSupabase(result: { user?: any; error?: any }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: result.user ?? null },
        error: result.error ?? null,
      }),
    },
  } as any;
}

const VALID_USER = {
  id: '5f7c1b2e-1111-4222-8333-444455556666',
  email: 'user@example.com',
  user_metadata: { username: 'risha' },
};

describe('getAuthenticatedUser', () => {
  it('returns the user for a valid Bearer token', async () => {
    const supabase = mockSupabase({ user: VALID_USER });
    const user = await getAuthenticatedUser('Bearer valid-jwt', supabase);
    expect(user).toEqual({
      id: VALID_USER.id,
      email: 'user@example.com',
      username: 'risha',
    });
    expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-jwt');
  });

  it('returns null when the Authorization header is missing or malformed', async () => {
    const supabase = mockSupabase({ user: VALID_USER });
    expect(await getAuthenticatedUser(undefined, supabase)).toBeNull();
    expect(await getAuthenticatedUser('', supabase)).toBeNull();
    expect(await getAuthenticatedUser('Token abc', supabase)).toBeNull();
    expect(await getAuthenticatedUser('Bearer ', supabase)).toBeNull();
    expect(await getAuthenticatedUser('Bearer', supabase)).toBeNull();
    // Must not call Supabase at all when there is no usable token.
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });

  it('returns null when Supabase rejects or cannot resolve the token', async () => {
    expect(
      await getAuthenticatedUser('Bearer bad', mockSupabase({ error: { message: 'invalid' } }))
    ).toBeNull();
    expect(await getAuthenticatedUser('Bearer bad', mockSupabase({ user: null }))).toBeNull();
  });

  it('tolerates missing user_metadata and null email', async () => {
    const user = await getAuthenticatedUser(
      'Bearer t',
      mockSupabase({ user: { id: 'abc', email: null, user_metadata: null } })
    );
    expect(user).toEqual({ id: 'abc', email: null, username: null });
  });

  it('ignores a non-string username in user_metadata', async () => {
    const user = await getAuthenticatedUser(
      'Bearer t',
      mockSupabase({ user: { id: 'abc', email: null, user_metadata: { username: 42 } } })
    );
    expect(user?.username).toBeNull();
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
