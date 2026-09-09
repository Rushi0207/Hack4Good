import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  type CreateHackathonInput,
  type Hackathon,
  hackathonSchema,
  type UpdateHackathonInput,
} from '@/types/hackathon';

const HACKATHON_FIELDS =
  'id, title, description, theme, rules, location, registration_deadline, start_date, end_date, max_team_size, status, created_by, created_at, updated_at';

export async function listHackathons(opts: {
  status?: string;
  limit: number;
  offset: number;
}): Promise<Hackathon[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from('hackathons')
    .select(HACKATHON_FIELDS)
    .order('created_at', { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1);

  if (opts.status) q = q.eq('status', opts.status);

  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((row) => hackathonSchema.parse(row));
}

export async function getHackathonById(id: string): Promise<Hackathon | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('hackathons')
    .select(HACKATHON_FIELDS)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  const result = hackathonSchema.safeParse(data);
  return result.success ? result.data : null;
}

export async function createHackathon(
  userId: string,
  input: CreateHackathonInput,
): Promise<Hackathon | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('hackathons')
    .insert({ ...input, created_by: userId, status: 'DRAFT' })
    .select(HACKATHON_FIELDS)
    .maybeSingle();

  if (error || !data) return null;
  const result = hackathonSchema.safeParse(data);
  return result.success ? result.data : null;
}

export async function updateHackathon(
  id: string,
  input: UpdateHackathonInput,
): Promise<Hackathon | null> {
  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  const fields = [
    'title', 'description', 'theme', 'rules', 'location',
    'registration_deadline', 'start_date', 'end_date', 'max_team_size', 'status',
  ] as const;
  for (const f of fields) {
    if (input[f] !== undefined) patch[f] = input[f];
  }

  if (Object.keys(patch).length === 0) return getHackathonById(id);

  const { data, error } = await supabase
    .from('hackathons')
    .update(patch)
    .eq('id', id)
    .select(HACKATHON_FIELDS)
    .maybeSingle();

  if (error || !data) return null;
  const result = hackathonSchema.safeParse(data);
  return result.success ? result.data : null;
}

export async function deleteHackathon(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('hackathons').delete().eq('id', id);
  return !error;
}

export async function registerForHackathon(
  hackathonId: string,
  userId: string,
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('hackathon_registrations')
    .insert({ hackathon_id: hackathonId, user_id: userId });

  if (error) {
    if (error.code === '23505') return { error: 'Already registered for this hackathon.' };
    return { error: 'Registration failed.' };
  }
  return {};
}

export async function unregisterFromHackathon(
  hackathonId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('hackathon_registrations')
    .delete()
    .eq('hackathon_id', hackathonId)
    .eq('user_id', userId);
  return !error;
}

export async function listParticipants(hackathonId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('hackathon_registrations')
    .select('id, user_id, created_at, profiles(id, full_name, role, image_url)')
    .eq('hackathon_id', hackathonId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function listHackathonProblems(hackathonId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('hackathon_problems')
    .select('problem_id, problems(id, title, description, category, status, created_by, created_at)')
    .eq('hackathon_id', hackathonId);

  if (error || !data) return [];
  return data.map((r) => r.problems);
}

export async function addProblemToHackathon(
  hackathonId: string,
  problemId: string,
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('hackathon_problems')
    .insert({ hackathon_id: hackathonId, problem_id: problemId });

  if (error) {
    if (error.code === '23505') return { error: 'Problem already linked to this hackathon.' };
    return { error: 'Failed to link problem.' };
  }
  return {};
}

export async function removeProblemFromHackathon(
  hackathonId: string,
  problemId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('hackathon_problems')
    .delete()
    .eq('hackathon_id', hackathonId)
    .eq('problem_id', problemId);
  return !error;
}
