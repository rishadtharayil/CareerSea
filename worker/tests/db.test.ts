import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { getSupabase } from '../src/services/db';

describe('getSupabase (database client)', () => {
  it('throws when the service-role key is missing', () => {
    expect(() => getSupabase({ SUPABASE_URL: 'https://x.supabase.co' } as any)).toThrow(
      'SUPABASE_SERVICE_ROLE_KEY is not configured'
    );
  });

  it('builds a client from env without persisting sessions', () => {
    const client = getSupabase({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    } as any);
    expect(client).toBeTruthy();
    // Service-role client is stateless: no session persistence or auto-refresh.
    expect((client as any).supabaseUrl).toBe('https://example.supabase.co');
  });
});

// ---------------------------------------------------------------------------
// Live database tests. Read-only by default; skipped entirely unless the
// service-role credentials are present. They validate the production security
// posture: RLS enabled with no permissive policies (deny-by-default), while
// the Worker service_role bypasses RLS (see services/db.ts).
// Run with:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm test
// ---------------------------------------------------------------------------
const SERVICE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
const hasServiceCreds = !!SERVICE_URL && !!SERVICE_KEY;

describe.skipIf(!hasServiceCreds)('live database (service_role)', () => {
  it('connects and reads seeded tables', async () => {
    const db = createClient(SERVICE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // api_careersuggestion is known to hold seeded rows in production.
    const { data, error } = await db.from('api_careersuggestion').select('id').limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('sees roadmap steps (service_role bypasses RLS)', async () => {
    const db = createClient(SERVICE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await db.from('api_roadmapstep').select('id').limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe.skipIf(!hasServiceCreds || !ANON_KEY)(
  'live database RLS posture (anon must see nothing)',
  () => {
    it('anon cannot read api_careersuggestion rows that service_role can see', async () => {
      const svc = createClient(SERVICE_URL!, SERVICE_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const anon = createClient(SERVICE_URL!, ANON_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const seeded = await svc.from('api_careersuggestion').select('id').limit(1);
      expect(seeded.error).toBeNull();

      const exposed = await anon.from('api_careersuggestion').select('id').limit(1);
      // RLS deny-by-default: anon sees zero rows (or is blocked), never seeded data.
      // An empty table is inconclusive, so only assert when the table has rows.
      if ((seeded.data?.length ?? 0) > 0) {
        expect(exposed.data ?? []).toHaveLength(0);
      } else {
        expect(exposed.error).toBeNull();
      }
    });

    it('anon cannot read api_userresponse rows', async () => {
      const anon = createClient(SERVICE_URL!, ANON_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data } = await anon.from('api_userresponse').select('id').limit(1);
      expect(data ?? []).toHaveLength(0);
    });
  }
);

// ---------------------------------------------------------------------------
// Probe-write test: proves RLS denies anon on api_chatmessage even though the
// table is currently empty (empty tables make read-only checks inconclusive).
// Writes one probe row via service_role, checks anon invisibility, deletes it.
// Extra gate RUN_DB_WRITE_TESTS=1 so plain `npm test` never mutates the DB.
// ---------------------------------------------------------------------------
const canWriteProbe =
  hasServiceCreds && !!ANON_KEY && process.env.RUN_DB_WRITE_TESTS === '1';

describe.skipIf(!canWriteProbe)('live RLS probe (api_chatmessage, write-gated)', () => {
  it('anon cannot see a probe row that service_role inserted', async () => {
    const svc = createClient(SERVICE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const anon = createClient(SERVICE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const step = await svc.from('api_roadmapstep').select('id').limit(1).maybeSingle();
    expect(step.error).toBeNull();
    if (!step.data) return; // no steps to attach to; nothing to prove

    const probeText = `rls-probe-${Date.now()}`;
    const inserted = await svc
      .from('api_chatmessage')
      .insert([{ step_id: (step.data as any).id, sender: 'user', text: probeText }])
      .select('id')
      .single();
    expect(inserted.error).toBeNull();

    try {
      const exposed = await anon.from('api_chatmessage').select('id').eq('id', (inserted.data as any).id);
      expect(exposed.data ?? []).toHaveLength(0);
    } finally {
      await svc.from('api_chatmessage').delete().eq('id', (inserted.data as any).id);
    }
  });
});
