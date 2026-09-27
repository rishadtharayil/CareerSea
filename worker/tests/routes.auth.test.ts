import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/services/rateLimit', () => ({
  rateLimit: () => async (_c: any, next: any) => next(),
}));

vi.mock('../src/services/db', () => ({
  getSupabase: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } }),
    },
    from: vi.fn(),
  })),
}));

import app from '../src/index';

const ENV = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
} as any;

function post(path: string, body: unknown) {
  return app.request(
    path,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    ENV
  );
}

describe('protected routes reject unauthenticated requests', () => {
  it('GET /api/history/ without a token returns 401', async () => {
    const res = await app.request('/api/history/', {}, ENV);
    expect(res.status).toBe(401);
  });

  it('GET /api/steps/:id without a token returns 401', async () => {
    const res = await app.request('/api/steps/1/', {}, ENV);
    expect(res.status).toBe(401);
    expect(await res.json()).toHaveProperty('detail');
  });

  it('GET /api/steps/:id with a non-numeric id returns 400', async () => {
    const res = await app.request('/api/steps/abc/', {}, ENV);
    expect(res.status).toBe(400);
  });

  it('POST /api/steps/:id/chat without a token returns 401', async () => {
    const res = await post('/api/steps/1/chat/', { text: 'hello' });
    expect(res.status).toBe(401);
  });

  it('GET /api/steps/:id with an invalid token returns 401', async () => {
    const res = await app.request('/api/steps/1/', { headers: { Authorization: 'Bearer not-a-jwt' } }, ENV);
    expect(res.status).toBe(401);
  });
});

describe('public routes', () => {
  it('health check is reachable without auth', async () => {
    const res = await app.request('/api/health/', {}, ENV);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'healthy' });
  });

  it('the custom auth routes are gone (Supabase Auth now handles sign-in)', async () => {
    for (const path of ['/api/register/', '/api/token/', '/api/token/refresh/', '/api/token/logout/']) {
      const res = await post(path, {});
      expect(res.status, `${path} should no longer exist`).toBe(404);
    }
  });
});
