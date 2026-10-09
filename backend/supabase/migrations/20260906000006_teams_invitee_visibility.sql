-- Allow pending invitees to SELECT the team they were invited to.
-- Needed so GET /api/invitations/me can resolve teams(name) under RLS.
-- Without this, invitees see "Unknown team" and the join often returns null.

drop policy if exists "teams visible to members managers and admins" on public.teams;

create policy "teams visible to members managers invitees and admins"
  on public.teams
  for select
  to authenticated
  using (
    leader_id = auth.uid()
    or public.is_team_member(id)
    or public.is_hackathon_manager(hackathon_id)
    or public.is_admin()
    or exists (
      select 1
      from public.team_invitations
      where team_id = teams.id
        and user_id = auth.uid()
        and status = 'PENDING'
    )
  );
