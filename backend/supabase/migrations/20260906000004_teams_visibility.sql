-- Migration: restrict teams table visibility
--
-- Previously: "teams are readable" used (true) — visible to everyone including
--             unauthenticated users.
-- Now: a team is visible only to its members, its leader, the hackathon manager,
--      or an admin.  Unauthenticated and unrelated users see nothing.
--
-- The hackathons/[id] page uses GET /api/hackathons/:id/teams to list teams
-- for a given hackathon — that endpoint reads through the hackathon manager
-- check, so organizers still see all teams for their hackathons.

-- Drop the old open policy
drop policy if exists "teams are readable" on public.teams;

-- New restricted policy
create policy "teams visible to members managers and admins"
  on public.teams
  for select
  to authenticated
  using (
    leader_id = auth.uid()
    or public.is_team_member(id)
    or public.is_hackathon_manager(hackathon_id)
    or public.is_admin()
  );
