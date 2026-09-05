import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env } from './types';
import auth from './routes/auth';
import questions from './routes/questions';
import assessment from './routes/assessment';
import steps from './routes/steps';
import history from './routes/history';
import seed from './routes/seed';

const app = new Hono<{ Bindings: Env }>();

// Logger
app.use('*', logger());

// CORS configuration matching existing CareerSea security settings
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Allow production domains and local development
      if (
        !origin ||
        origin.endsWith('careersea.in') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.pages.dev')
      ) {
        return origin || '*';
      }
      return 'https://careersea.in';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
    credentials: true,
  })
);

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'CareerSea Cloudflare Edge API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/', (c) => {
  return c.json({ status: 'healthy', edge: true });
});

// Mount modular sub-routers
app.route('/api', auth);
app.route('/api/questions', questions);
app.route('/api/submit', assessment);
app.route('/api/steps', steps);
app.route('/api/history', history);
app.route('/api/seed', seed);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Endpoint not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled Worker Exception:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred.',
    },
    500
  );
});

export default app;
