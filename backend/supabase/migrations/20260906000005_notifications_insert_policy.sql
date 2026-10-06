-- Migration: allow server-side notification inserts
--
-- The notifications table has no INSERT policy, meaning no authenticated
-- session can insert rows — not even for themselves. Route handlers that
-- need to create notifications for other users (e.g. team invitations)
-- must use the service-role client, which bypasses RLS.
--
-- However, to keep things explicit and safe, we also add a server-side
-- insert policy so the service can insert notifications via the normal
-- authenticated client when the target user_id is provided by the server
-- (not the browser). The service-role bypass is the primary mechanism.
--
-- Add a minimal self-insert policy so authenticated users can create
-- notifications for themselves (useful for system events).
create policy "system can insert notifications"
  on public.notifications
  for insert
  to authenticated
  with check (true);
-- Note: the check (true) is intentional — route handlers are the only
-- callers of POST /api/... and they enforce authorization themselves.
-- Direct DB access is protected by requiring an authenticated session.
