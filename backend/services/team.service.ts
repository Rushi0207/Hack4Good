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
  let admin: ReturnType<typeof getAdminClient>;
  try {
    admin = getAdminClient();
  } catch {
    return { error: 'Invite service unavailable — SUPABASE_SERVICE_ROLE_KEY may be missing.' };
  }

  const { data: list, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    console.error('[invite] listUsers error:', listErr.message);
    return { error: 'Could not look up user. Please try again.' };
  }

  const match = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!match) {
    return { error: `No account found for "${email}". Ask them to sign up at Hack4Good first.` };
  }
  const inviteeId = match.id;

  // 2. Get team details for the notification message
  const team = await getTeamById(teamId);
  if (!team) return { error: 'Team not found.' };

  // 3. Create the invitation row (uses the inviter's session — RLS allows leaders)
  const { data, error: inviteErr } = await supabase
    .from('team_invitations')
    .insert({ team_id: teamId, user_id: inviteeId, status: 'PENDING' })
    .select('id, team_id, user_id, status, created_at')
    .maybeSingle();

  if (inviteErr) {
    console.error('[invite] insert invitation error:', inviteErr.message);
    if (inviteErr.code === '23505')
      return { error: 'This person has already been invited to the team.' };
    return { error: 'Failed to create invitation.' };
  }
  if (!data) return { error: 'Failed to create invitation.' };

  const result = teamInvitationSchema.safeParse(data);
  if (!result.success) return { error: 'Failed to parse invitation.' };

  // 4. Insert in-app notification using the admin (service-role) client
  //    because the RLS INSERT policy requires the inserting session to own
  //    the notification, but here we're writing on behalf of the invitee.
  const notifMessage =
    `${inviterName} invited you to join team "${team.name}". ` +
    `Go to Notifications to accept or decline.`;

  const { error: notifErr } = await admin
    .from('notifications')
    .insert({ user_id: inviteeId, type: 'TEAM_INVITE', message: notifMessage });

  if (notifErr) {
    // Non-fatal — log but continue so the invitation itself still succeeds
    console.error('[invite] notification insert error:', notifErr.message);
  }

  // 5. Send email via Supabase Auth.
  //    generateLink('magiclink') creates a one-click sign-in link that
  //    lands the user on /notifications. Supabase sends the email when
  //    shouldCreateUser is false and the user already exists.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

  const { error: linkErr } = await admin.auth.admin.generateLink({
    type:  'magiclink',
    email,
    options: {
      redirectTo: `${siteUrl}/notifications`,
    },
  });

  if (linkErr) {
    console.error('[invite] generateLink error:', linkErr.message);
    // Non-fatal — in-app notification was already sent
  }

  return { data: result.data };
}

export async function listMyInvitations(userId: string): Promise<
  Array<{ id: string; team_id: string; team_name: string; status: string; created_at: string }>
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('team_invitations')
    .select('id, team_id, status, created_at, teams(name)')
    .eq('user_id', userId)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    id:         row.id,
    team_id:    row.team_id,
    team_name:  (row.teams as unknown as { name: string } | null)?.name ?? 'Unknown team',
    status:     row.status,
    created_at: row.created_at,
  }));
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
