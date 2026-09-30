/**
 * bootstrap-admin.ts
 *
 * ONE-TIME local-development script.
 * Promotes admin@hack4good.dev to role = 'ADMIN' by calling the
 * public.bootstrap_first_admin(uuid) database function via the
 * service-role client.
 *
 * WHY A DATABASE FUNCTION INSTEAD OF A DIRECT UPDATE
 * ───────────────────────────────────────────────────
 * protect_profile_role() is a BEFORE UPDATE trigger that fires for every
 * caller, including postgres/service_role.  The service-role key bypasses
 * RLS policies but NOT database triggers.  A direct UPDATE therefore always
 * raises "Only an administrator can change a user role" when no ADMIN exists.
 *
 * public.bootstrap_first_admin() is a SECURITY DEFINER function that uses
 * SET LOCAL session_replication_role = 'replica' to suppress user-defined
 * triggers for its own UPDATE only, then immediately restores normal
 * behaviour.  It is granted EXECUTE to service_role only.
 *
 * SAFETY GUARANTEES
 * ─────────────────
 * - Requires explicit --confirm flag; refuses to run without it.
 * - Verifies the Auth user exists before calling the DB function.
 * - Idempotent: if the target is already ADMIN the DB function raises
 *   a typed exception (H0001) which the script maps to a clean success.
 * - If any other ADMIN already exists, the DB function raises H0002 and
 *   the script reports it clearly.
 * - Verifies the resulting profiles.role after the RPC returns.
 * - Touches ONLY admin@hack4good.dev.
 * - Never reaches the network via any public HTTP endpoint.
 *
 * USAGE
 * ─────
 * 1. Apply the migration:
 *      npx supabase db push   (or paste migration into Supabase SQL editor)
 * 2. Add SUPABASE_SERVICE_ROLE_KEY to backend/.env.local
 * 3. npm run bootstrap:admin -- --confirm
 *
 * AFTER SUCCESS
 * ─────────────
 * Remove SUPABASE_SERVICE_ROLE_KEY from .env.local so it is never
 * accidentally committed or exposed.
 */

import { createClient } from '@supabase/supabase-js';

// ─── Guard: explicit --confirm flag required ──────────────────────────────────

if (!process.argv.includes('--confirm')) {
  console.error('');
  console.error('✖  Safety check: pass --confirm to run this script.');
  console.error('');
  console.error('   npm run bootstrap:admin -- --confirm');
  console.error('');
  process.exit(1);
}

// ─── Environment ──────────────────────────────────────────────────────────────

const TARGET_EMAIL = 'admin@hack4good.dev';

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('');
  console.error('✖  Missing environment variables.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL  :', SUPABASE_URL     ? '✓ set' : '✗ missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY :', SERVICE_ROLE_KEY  ? '✓ set' : '✗ missing');
  console.error('');
  console.error('   Add SUPABASE_SERVICE_ROLE_KEY to backend/.env.local');
  console.error('   (Supabase Dashboard → Project Settings → API → service_role secret)');
  process.exit(1);
}

// ─── Service-role client ──────────────────────────────────────────────────────
// Bypasses RLS policies.  Used here only to:
//   a) call auth.admin.listUsers() — requires service_role
//   b) call the bootstrap_first_admin RPC  — granted to service_role only

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Typed exception codes from the DB function ───────────────────────────────
// H0001 = target is already ADMIN (idempotent success)
// H0002 = another ADMIN already exists (safe failure)

const ERRCODE_ALREADY_ADMIN     = 'H0001';
const ERRCODE_OTHER_ADMIN_EXISTS = 'H0002';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  console.log('');
  console.log('Hack4Good — Admin Bootstrap');
  console.log('────────────────────────────────────────────');
  console.log(`Target  : ${TARGET_EMAIL}`);
  console.log(`Role    : ADMIN`);
  console.log('');

  // ── Step 1: look up the Auth user by email ────────────────────────────────
  console.log('Step 1/4  Looking up Auth user…');

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('✖  Failed to list Auth users:', listError.message);
    process.exit(1);
  }

  const authUser = listData.users.find((u) => u.email === TARGET_EMAIL);
  if (!authUser) {
    console.error(`✖  No Auth user found with email "${TARGET_EMAIL}".`);
    console.error('   Verify the user was created in Supabase Auth.');
    process.exit(1);
  }

  const userId = authUser.id;
  console.log(`         Found  : ${userId}`);
  console.log(`         Email  : ${authUser.email}`);

  // ── Step 2: read current profiles row ────────────────────────────────────
  console.log('Step 2/4  Reading current profiles row…');

  const { data: profile, error: readError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single();

  if (readError || !profile) {
    console.error('✖  profiles row not found for this user.');
    console.error('   Has the user signed in at least once?  The provisioning');
    console.error('   trigger creates the profiles row on first Auth sign-up.');
    if (readError) console.error('   DB error:', readError.message);
    process.exit(1);
  }

  console.log(`         Name   : ${profile.full_name}`);
  console.log(`         Role   : ${profile.role}`);

  // ── Step 3: call the bootstrap RPC ───────────────────────────────────────
  // public.bootstrap_first_admin(uuid) uses SECURITY DEFINER +
  // SET LOCAL session_replication_role = 'replica' to suppress
  // protect_profile_role for this single UPDATE, then verifies the result.
  console.log('Step 3/4  Calling bootstrap_first_admin RPC…');

  const { error: rpcError } = await supabase.rpc('bootstrap_first_admin', {
    target_id: userId,
  });

  if (rpcError) {
    // H0001 — target is already ADMIN: treat as idempotent success
    if (rpcError.code === ERRCODE_ALREADY_ADMIN ||
        rpcError.message.includes('already ADMIN')) {
      console.log('');
      console.log('✓  Target is already ADMIN — nothing to do.');
      printNextSteps();
      process.exit(0);
    }

    // H0002 — another ADMIN already exists
    if (rpcError.code === ERRCODE_OTHER_ADMIN_EXISTS ||
        rpcError.message.includes('already exists')) {
      console.error('');
      console.error('✖  An ADMIN already exists in profiles.');
      console.error('   Use the /admin UI to manage roles from here.');
      process.exit(1);
    }

    // Unexpected error
    console.error('✖  RPC failed:', rpcError.message);
    console.error('');
    console.error('   If you see "function public.bootstrap_first_admin does not exist":');
    console.error('   apply the migration first:');
    console.error('     npx supabase db push');
    console.error('   or paste migration 20260906000003_bootstrap_first_admin.sql');
    console.error('   into the Supabase SQL Editor and run it.');
    process.exit(1);
  }

  // ── Step 4: verify the result ────────────────────────────────────────────
  console.log('Step 4/4  Verifying result…');

  const { data: verify, error: verifyError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (verifyError || !verify) {
    console.error('✖  Verification read failed:', verifyError?.message);
    process.exit(1);
  }

  if (verify.role !== 'ADMIN') {
    console.error(`✖  Verification failed: expected ADMIN, got "${verify.role}".`);
    process.exit(1);
  }

  // ── Success ───────────────────────────────────────────────────────────────
  console.log('');
  console.log(`✓  ${TARGET_EMAIL} is now ADMIN.`);
  console.log(`   Verified: profiles.role = "${verify.role}"`);
  printNextSteps();
}

function printNextSteps(): void {
  console.log('');
  console.log('  Next steps:');
  console.log('  1. Remove SUPABASE_SERVICE_ROLE_KEY from backend/.env.local');
  console.log('  2. Log in as admin@hack4good.dev to verify /admin dashboard access');
  console.log('  3. Use /admin to promote organizer@hack4good.dev → ORGANIZER');
  console.log('                  and judge@hack4good.dev       → JUDGE');
  console.log('');
}

bootstrap();
