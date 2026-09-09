import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  type CreateImpactInput,
  type ImpactRecord,
  impactRecordSchema,
  type UpdateImpactInput,
} from '@/types/impact';

const IMPACT_FIELDS =
  'id, project_id, status, people_benefited, metric_name, metric_value, notes, created_at, updated_at';

export async function listImpactByProject(projectId: string): Promise<ImpactRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('impact_records')
    .select(IMPACT_FIELDS)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row) => impactRecordSchema.parse(row));
}

export async function listImpactByHackathon(hackathonId: string): Promise<ImpactRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('impact_records')
    .select(`${IMPACT_FIELDS}, projects!inner(team_id, teams!inner(hackathon_id))`)
    .eq('projects.teams.hackathon_id', hackathonId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row) => impactRecordSchema.parse(row));
}

export async function createImpact(
  projectId: string,
  input: CreateImpactInput,
): Promise<ImpactRecord | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('impact_records')
    .insert({ project_id: projectId, ...input })
    .select(IMPACT_FIELDS)
    .maybeSingle();

  if (error || !data) return null;
  const result = impactRecordSchema.safeParse(data);
  return result.success ? result.data : null;
}

export async function updateImpact(
  id: string,
  input: UpdateImpactInput,
): Promise<ImpactRecord | null> {
  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  const fields = ['status', 'people_benefited', 'metric_name', 'metric_value', 'notes'] as const;
  for (const f of fields) {
    if (input[f] !== undefined) patch[f] = input[f];
  }

  if (Object.keys(patch).length === 0) {
    const { data } = await supabase
      .from('impact_records')
      .select(IMPACT_FIELDS)
      .eq('id', id)
      .maybeSingle();
    if (!data) return null;
    const r = impactRecordSchema.safeParse(data);
    return r.success ? r.data : null;
  }

  const { data, error } = await supabase
    .from('impact_records')
    .update(patch)
    .eq('id', id)
    .select(IMPACT_FIELDS)
    .maybeSingle();

  if (error || !data) return null;
  const result = impactRecordSchema.safeParse(data);
  return result.success ? result.data : null;
}
