import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Authentication is delegated to Supabase Auth.
 *
 * The Worker no longer hashes passwords or issues its own JWTs. The browser
 * signs in through supabase-js, which returns a Supabase access token, and the
 * Worker validates that token on protected routes.
 *
 * Note: the previous hand-rolled PBKDF2 scheme was capped at 100000 iterations
 * because Cloudflare Workers' Web Crypto rejects anything higher. Supabase Auth
 * removes that constraint entirely by hashing server-side.
 */

/** Shape of the subset of the Supabase user record this project relies on. */
export interface AuthenticatedUser {
  id: string;
  email: string | null;
  username: string | null;
}

function bearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  return token || null;
}

/**
 * Resolves the caller's Supabase user id, or null when the request is
 * unauthenticated or the token is invalid/expired.
 *
 * Validation is delegated to Supabase so token signing, rotation and expiry
 * stay consistent with the auth service that issued the token.
 */
export async function getAuthenticatedUser(
  authHeader: string | undefined,
  supabase: SupabaseClient
): Promise<AuthenticatedUser | null> {
  const token = bearerToken(authHeader);
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  const metadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const username = typeof metadata.username === 'string' ? metadata.username : null;

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    username,
  };
}

/** Extracts a named cookie from a raw Cookie header. */
export function getCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}
