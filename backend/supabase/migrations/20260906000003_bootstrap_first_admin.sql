-- Migration: bootstrap_first_admin
-- Adds a one-time bootstrap function for promoting the very first ADMIN.
--
-- WHY THIS IS NEEDED
-- ──────────────────
-- protect_profile_role() is a BEFORE UPDATE trigger that fires for every
-- caller, including the service-role / postgres superuser.  RLS bypass does
-- NOT bypass triggers.  A normal UPDATE therefore always fails when no ADMIN
-- exists yet, because is_admin() → auth.uid() → NULL → false.
--
-- APPROACH
-- ────────
-- A SECURITY DEFINER function runs as its owner (postgres superuser inside
-- the DB engine).  We use SET LOCAL session_replication_role = 'replica'
-- for the duration of the UPDATE only.  That is a PostgreSQL-native,
-- transaction-scoped mechanism that suppresses user-defined triggers
-- (replica mode skips non-constraint triggers).  It has no effect outside
-- this function's transaction.
--
-- SAFETY CONSTRAINTS INSIDE THE FUNCTION
-- ───────────────────────────────────────
-- 1. Verifies that the target profiles row exists.
-- 2. Allows promotion ONLY when there is currently zero ADMIN in profiles.
--    (If any ADMIN already exists, raises an exception.)
-- 3. Verifies the resulting role after the UPDATE.
-- 4. Grants EXECUTE to the service_role only — not to authenticated/anon.
--
-- REMOVAL AFTER USE
-- ─────────────────
-- Once the first ADMIN is set, revoke and drop this function:
--   REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin(uuid) FROM service_role;
--   DROP FUNCTION IF EXISTS public.bootstrap_first_admin(uuid);
-- Or simply leave it: the zero-ADMIN guard makes it permanently a no-op
-- once any ADMIN exists.

create or replace function public.bootstrap_first_admin(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_role  public.user_role;
  admin_count    integer;
begin
  -- 1. Verify the target profile exists
  select role
    into existing_role
    from public.profiles
   where id = target_id;

  if not found then
    raise exception
      'bootstrap_first_admin: no profile row found for id %', target_id;
  end if;

  -- 2. Idempotency: target is already ADMIN
  if existing_role = 'ADMIN' then
    raise exception
      'bootstrap_first_admin: target is already ADMIN — nothing to do'
      using errcode = 'H0001';
  end if;

  -- 3. Refuse if any ADMIN already exists
  select count(*)
    into admin_count
    from public.profiles
   where role = 'ADMIN';

  if admin_count > 0 then
    raise exception
      'bootstrap_first_admin: an ADMIN already exists — use the /admin UI to manage roles'
      using errcode = 'H0002';
  end if;

  -- 4. Temporarily enter replica mode for this transaction so that the
  --    profiles_protect_role trigger does not fire for this single UPDATE.
  --    SET LOCAL is transaction-scoped; it reverts automatically on commit/rollback.
  set local session_replication_role = 'replica';

  update public.profiles
     set role = 'ADMIN'
   where id = target_id;

  -- 5. Restore normal trigger behaviour immediately (belt-and-suspenders,
  --    SET LOCAL already handles this at transaction end).
  set local session_replication_role = 'origin';

  -- 6. Verify the write landed
  select role
    into existing_role
    from public.profiles
   where id = target_id;

  if existing_role <> 'ADMIN' then
    raise exception
      'bootstrap_first_admin: UPDATE appeared to succeed but role is still %',
      existing_role;
  end if;
end;
$$;

-- Grant EXECUTE to service_role only.
-- The anon and authenticated roles cannot call this function.
revoke execute on function public.bootstrap_first_admin(uuid) from public;
revoke execute on function public.bootstrap_first_admin(uuid) from anon;
revoke execute on function public.bootstrap_first_admin(uuid) from authenticated;
grant  execute on function public.bootstrap_first_admin(uuid) to   service_role;
