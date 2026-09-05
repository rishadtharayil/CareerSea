import { Hono, Handler } from 'hono';
import { Env, AuthUser } from '../types';
import { getSupabase } from '../services/db';
import { hashPassword, verifyPassword, generateTokens, verifyToken } from '../services/auth';

const auth = new Hono<{ Bindings: Env }>();

const registerHandler: Handler<{ Bindings: Env }> = async (c) => {
  const body = await c.req.json<{ username?: string; email?: string; password?: string }>();
  const username = body.username?.trim();
  const email = body.email?.trim() || '';
  const password = body.password;

  if (!username || !password) {
    return c.json({ error: 'Username and password are required.' }, 400);
  }

  const supabase = getSupabase(c.env);

  // Check if username already exists
  const { data: existingUser } = await supabase
    .from('auth_user')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existingUser) {
    return c.json({ username: ['A user with that username already exists.'] }, 400);
  }

  // Hash password with Django-compatible PBKDF2-SHA256
  const hashedPassword = await hashPassword(password);
  const now = new Date().toISOString();

  const { data: newUser, error: insertError } = await supabase
    .from('auth_user')
    .insert([
      {
        username,
        email,
        password: hashedPassword,
        is_superuser: false,
        is_staff: false,
        is_active: true,
        date_joined: now,
        first_name: '',
        last_name: '',
      },
    ])
    .select('id, username, email')
    .single();

  if (insertError) {
    console.error('Registration insert error:', insertError);
    return c.json({ error: 'Failed to create user account.' }, 500);
  }

  return c.json({ username: newUser.username, email: newUser.email }, 201);
};

const tokenHandler: Handler<{ Bindings: Env }> = async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>();
  const username = body.username?.trim();
  const password = body.password;

  if (!username || !password) {
    return c.json({ detail: 'No active account found with the given credentials' }, 401);
  }

  const supabase = getSupabase(c.env);

  const { data: user, error: fetchError } = await supabase
    .from('auth_user')
    .select('*')
    .eq('username', username)
    .maybeSingle<AuthUser>();

  if (fetchError || !user) {
    return c.json({ detail: 'No active account found with the given credentials' }, 401);
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return c.json({ detail: 'No active account found with the given credentials' }, 401);
  }

  // Update last_login
  await supabase
    .from('auth_user')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);

  const jwtSecret = c.env.JWT_SECRET || 'careersea-default-jwt-secret';
  const tokens = await generateTokens(user.id, user.username, jwtSecret);

  return c.json(tokens, 200);
};

const refreshHandler: Handler<{ Bindings: Env }> = async (c) => {
  const body = await c.req.json<{ refresh?: string }>();
  const refreshToken = body.refresh;

  if (!refreshToken) {
    return c.json({ detail: 'Refresh token required' }, 400);
  }

  const jwtSecret = c.env.JWT_SECRET || 'careersea-default-jwt-secret';
  const payload = await verifyToken(refreshToken, jwtSecret);

  if (!payload || payload.token_type !== 'refresh') {
    return c.json({ detail: 'Token is invalid or expired', code: 'token_not_valid' }, 401);
  }

  // Generate new token pair
  const tokens = await generateTokens(payload.user_id, payload.username, jwtSecret);

  return c.json({ access: tokens.access, refresh: tokens.refresh }, 200);
};

auth.post('/register', registerHandler);
auth.post('/register/', registerHandler);

auth.post('/token', tokenHandler);
auth.post('/token/', tokenHandler);

auth.post('/token/refresh', refreshHandler);
auth.post('/token/refresh/', refreshHandler);

export default auth;
