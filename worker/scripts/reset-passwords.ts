/**
 * One-off admin tool: re-derive password hashes for accounts created under the
 * legacy Django defaults (1,000,000 iterations).
 *
 * Cloudflare Workers' Web Crypto refuses PBKDF2 above 100000 iterations, so
 * those hashes can never be verified by the Worker and those users are locked
 * out. This rewrites each hash at the supported iteration count.
 *
 * Passwords are prompted for with echo disabled and are never logged or stored
 * anywhere except the database.
 *
 * Usage (from the worker/ directory):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx vite-node scripts/reset-passwords.ts
 *
 * Pass --username=<name> to reset a single account.
 */
import { createClient } from '@supabase/supabase-js';
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { readFileSync } from 'node:fs';
import { hashPassword, PBKDF2_ITERATIONS } from '../src/services/auth';

const MIN_PASSWORD_LENGTH = 12;

/** Minimal KEY=VALUE loader for .dev.vars / .env. Never overrides real env vars. */
function loadDotEnv(file: string) {
  try {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // Optional: credentials may already be present in the environment.
  }
}

/** Prompts on stdout while discarding echoed keystrokes. */
function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    rl.output = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });
    process.stdout.write(question);
    rl.question('', (answer) => {
      process.stdout.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

function iterationsOf(stored: string): number {
  const parts = (stored || '').split('$');
  return parts[0] === 'pbkdf2_sha256' ? parseInt(parts[1], 10) : NaN;
}

async function main() {
  loadDotEnv('.dev.vars');
  loadDotEnv('.env');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const only = process.argv.find((a) => a.startsWith('--username='))?.split('=')[1];

  let query = supabase
    .from('auth_user')
    .select('id, username, password, is_active')
    .order('id');
  if (only) query = query.eq('username', only);

  const { data: users, error } = await query;
  if (error) {
    console.error('Failed to read users:', error.message);
    process.exit(1);
  }
  if (!users?.length) {
    console.log('No matching accounts found.');
    return;
  }

  const needsReset = users.filter((u) => {
    const iterations = iterationsOf(u.password);
    return !Number.isInteger(iterations) || iterations > PBKDF2_ITERATIONS;
  });

  console.log(
    `Found ${users.length} account(s); ${needsReset.length} need re-hashing at ${PBKDF2_ITERATIONS} iterations.`
  );

  for (const user of needsReset) {
    console.log(`\n- ${user.username} (id ${user.id}) currently at ${iterationsOf(user.password)} iterations`);

    let password = '';
    while (true) {
      password = await askHidden(`  New password (min ${MIN_PASSWORD_LENGTH} chars): `);
      if (password.length >= MIN_PASSWORD_LENGTH) break;
      console.log('  Too short. Try again.');
    }

    const confirmation = await askHidden('  Confirm password: ');
    if (confirmation !== password) {
      console.log('  Mismatch - skipped.');
      continue;
    }

    const hashed = await hashPassword(password);
    const { error: updateError } = await supabase
      .from('auth_user')
      .update({ password: hashed })
      .eq('id', user.id);

    if (updateError) {
      console.error(`  Failed to update: ${updateError.message}`);
    } else {
      console.log(`  Updated to ${PBKDF2_ITERATIONS} iterations.`);
    }
  }

  console.log('\nDone.');
}

main();
