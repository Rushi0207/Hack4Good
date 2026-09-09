import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  type CreateTeamInput,
  type Team,
  teamSchema,
  type TeamInvitation,
  teamInvitationSchema,
  type TeamMember,
  teamMemberSchema,
  type UpdateTeamInput,
} from '@/types/team';

const TEAM_FIELDS = 'id, hackathon_id, name, description, leader_id, created_at, updated_at';

export async function listTeams(opts: {
  hackathon_id?: string;
  limit: number;
  offset: number;
}): Promise<Team[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from('teams')
    .select(TEAM_FIELDS)
    .order('created_at', { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1);

  if (opts.hackathon_id) q = q.eq('hackathon_id', opts.hackathon_id);

  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((row) => teamSchema.parse(row));
}

export async function getTeamById(id: string): Promise<Team | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('teams')
    .select(TEAM_FIELDS)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  const result = teamSchema.safeParse(data);
  return result.success ? result.data : null;
}

export async function createTeam(
  userId: string,
  input: CreateTeamInput,
): Promise<{ data?: Team; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('teams')
    .insert({ ...input, leader_id: userId })
    .select(TEAM_FIELDS)
    .maybeSingle();

  if (error) {
    if (error.code === '23505') return { error: 'A team with that name already exists in this hackathon.' };
    // Trigger errors from validate_team
    if (error.message?.includes('team leader must be a participant'))
      return { error: 'Only participants can lead teams.' };
    if (error.message?.includes('team leader must be registered'))
      return { error: 'You must be registered for the hackathon to create a team.' };
    return { error: 'Failed to create team.' };
  }

  if (!data) return { error: 'Failed to create team.' };
  const result = teamSchema.safeParse(data);
  return result.success ? { data: result.data } : { error: 'Failed to create team.' };
}

export async function updateTeam(
  id: string,
  input: UpdateTeamInput,
): Promise<Team | null> {
  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch['name'] = input.name;
  if (input.description !== undefined) patch['description'] = input.description;

  if (Object.keys(patch).length === 0) return getTeamById(id);

  const { data, error } = await supabase
    .from('teams')
    .update(patch)
    .eq('id', id)
    .select(TEAM_FIELDS)
    .maybeSingle();

  if (error || !data) return null;
  const result = teamSchema.safeParse(data);
  return result.success ? result.data : null;
}

export async function deleteTeam(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('teams').delete().eq('id', id);
  return !error;
}

export async function listTeamMembers(teamId: string): Promise<TeamMember[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('team_members')
    .select('id, team_id, user_id, joined_at')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true });

  if (error || !data) return [];
  return data.map((row) => teamMemberSchema.parse(row));
}

export async function inviteMember(
  teamId: string,
  userId: string,
): Promise<{ data?: TeamInvitation; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('team_invitations')
    .insert({ team_id: teamId, user_id: userId, status: 'PENDING' })
    .select('id, team_id, user_id, status, created_at')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') return { error: 'User has already been invited to this team.' };
    return { error: 'Failed to send invitation.' };
  }
  if (!data) return { error: 'Failed to send invitation.' };
  const result = teamInvitationSchema.safeParse(data);
  return result.success ? { data: result.data } : { error: 'Failed to send invitation.' };
}

export async function respondToInvitation(
  invitationId: string,
  userId: string,
  accept: boolean,
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();

  // Verify invitation belongs to caller and is still pending
  const { data: inv, error: fetchErr } = await supabase
    .from('team_invitations')
    .select('id, team_id, user_id, status')
    .eq('id', invitationId)
    .maybeSingle();

  if (fetchErr || !inv) return { error: 'Invitation not found.' };
  if (inv.user_id !== userId) return { error: 'Forbidden.' };
  if (inv.status !== 'PENDING') return { error: 'Invitation is no longer pending.' };

  const newStatus = accept ? 'ACCEPTED' : 'REJECTED';
  const { error: updateErr } = await supabase
    .from('team_invitations')
    .update({ status: newStatus })
    .eq('id', invitationId);

  if (updateErr) return { error: 'Failed to update invitation.' };

  // If accepted, add to team_members
  if (accept) {
    const { error: memberErr } = await supabase
      .from('team_members')
      .insert({ team_id: inv.team_id, user_id: userId });

    if (memberErr) {
      // Rollback status change
      await supabase
        .from('team_invitations')
        .update({ status: 'PENDING' })
        .eq('id', invitationId);
      if (memberErr.message?.includes('one team per hackathon'))
        return { error: 'You already belong to a team in this hackathon.' };
      if (memberErr.message?.includes('Team size cannot exceed'))
        return { error: 'Team is full.' };
      return { error: 'Failed to join team.' };
    }
  }

  return {};
}

export async function removeMember(
  teamId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);
  return !error;
}
