import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
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

/** Service-role client — used only for Auth admin look-ups (email → uuid).
 *  Never used to bypass RLS on data tables. */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for invite-by-email.');
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

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
  inviterName: string,
  email: string,
): Promise<{ data?: TeamInvitation; error?: string }> {
  const supabase = await createSupabaseServerClient();

  // 1. Look up the invitee's UUID by email via admin API
  let inviteeId: string;
  try {
    const admin = getAdminClient();
    const { data: list, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) return { error: 'Could not look up user. Please try again.' };
    const match = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!match) return { error: `No account found for ${email}. Ask them to sign up first.` };
    inviteeId = match.id;
  } catch {
    return { error: 'Invite service unavailable — SUPABASE_SERVICE_ROLE_KEY may be missing.' };
  }

  // 2. Get team details for the email message
  const team = await getTeamById(teamId);
  if (!team) return { error: 'Team not found.' };

  // 3. Create the invitation row
  const { data, error } = await supabase
    .from('team_invitations')
    .insert({ team_id: teamId, user_id: inviteeId, status: 'PENDING' })
    .select('id, team_id, user_id, status, created_at')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') return { error: 'This person has already been invited to the team.' };
    return { error: 'Failed to send invitation.' };
  }
  if (!data) return { error: 'Failed to send invitation.' };

  const result = teamInvitationSchema.safeParse(data);
  if (!result.success) return { error: 'Failed to send invitation.' };

  // 4. Create an in-app notification for the invitee
  await supabase.from('notifications').insert({
    user_id: inviteeId,
    type:    'TEAM_INVITE',
    message: `${inviterName} invited you to join team "${team.name}". Open your notifications to accept or decline.`,
  });

  // 5. Send an email via Supabase Auth magic link (invite flow)
  //    We use generateLink('magiclink') pointed at /notifications so they
  //    land on the app after clicking. This does NOT create a new account —
  //    the user already exists.
  try {
    const admin = getAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
    await admin.auth.admin.generateLink({
      type:       'magiclink',
      email,
      options: {
        redirectTo: `${siteUrl}/notifications`,
        data: {
          invitation_team: team.name,
          invitation_id:   result.data.id,
        },
      },
    });
    // generateLink returns the link but does NOT email it automatically
    // unless "Send email" is enabled in Supabase Auth settings.
    // As a fallback we use inviteUserByEmail which always sends.
    // inviteUserByEmail creates a new user if one doesn't exist, so we
    // only call it here where we already verified the user exists.
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/notifications`,
      data: {
        invitation_team: team.name,
        invitation_id:   result.data.id,
      },
    });
  } catch {
    // Email sending is best-effort — the in-app notification is the
    // reliable delivery mechanism. Don't fail the whole operation.
  }

  return { data: result.data };
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
