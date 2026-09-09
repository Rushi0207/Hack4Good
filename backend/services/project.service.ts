import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  type CreateProjectInput,
  type Project,
  projectSchema,
  type SubmitProjectInput,
  type UpdateProjectInput,
} from '@/types/project';

const PROJECT_FIELDS =
  'id, team_id, problem_id, title, description, technologies, impact, github_url, demo_url, status, created_at, updated_at';

export async function listProjects(opts: {
  team_id?: string;
  hackathon_id?: string;
  limit: number;
  offset: number;
}): Promise<Project[]> {
  const supabase = await createSupabaseServerClient();

  if (opts.hackathon_id) {
    // Join through teams to filter by hackathon
    const { data, error } = await supabase
      .from('projects')
      .select(`${PROJECT_FIELDS}, teams!inner(hackathon_id)`)
      .eq('teams.hackathon_id', opts.hackathon_id)
      .order('created_at', { ascending: false })
      .range(opts.offset, opts.offset + opts.limit - 1);

    if (error || !data) return [];
    return data.map((row) => projectSchema.parse(row));
  }

  let q = supabase
    .from('projects')
    .select(PROJECT_FIELDS)
    .order('created_at', { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1);

  if (opts.team_id) q = q.eq('team_id', opts.team_id);

  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((row) => projectSchema.parse(row));
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_FIELDS)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  const result = projectSchema.safeParse(data);
  return result.success ? result.data : null;
}

export async function createProject(
  input: CreateProjectInput,
): Promise<{ data?: Project; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .insert(input)
    .select(PROJECT_FIELDS)
    .maybeSingle();

  if (error) {
    if (error.code === '23505') return { error: 'This team already has a project for that problem.' };
    if (error.message?.includes('problem must belong to the team hackathon'))
      return { error: 'The selected problem is not part of this hackathon.' };
    return { error: 'Failed to create project.' };
  }
  if (!data) return { error: 'Failed to create project.' };
  const result = projectSchema.safeParse(data);
  return result.success ? { data: result.data } : { error: 'Failed to create project.' };
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<Project | null> {
  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  const fields = ['title', 'description', 'technologies', 'impact', 'github_url', 'demo_url'] as const;
  for (const f of fields) {
    if (input[f] !== undefined) patch[f] = input[f];
  }

  if (Object.keys(patch).length === 0) return getProjectById(id);

  const { data, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', id)
    .eq('status', 'DRAFT') // guard: only drafts can be updated
    .select(PROJECT_FIELDS)
    .maybeSingle();

  if (error || !data) return null;
  const result = projectSchema.safeParse(data);
  return result.success ? result.data : null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('status', 'DRAFT');
  return !error;
}

export async function submitProject(
  projectId: string,
  input: SubmitProjectInput,
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();

  // Set status to SUBMITTED first
  const { error: statusErr } = await supabase
    .from('projects')
    .update({ status: 'SUBMITTED' })
    .eq('id', projectId)
    .eq('status', 'DRAFT');

  if (statusErr) return { error: 'Failed to submit project.' };

  // Insert submission record (DB trigger validates deadline + team members)
  const { error: subErr } = await supabase
    .from('project_submissions')
    .insert({ project_id: projectId, document_url: input.document_url ?? null });

  if (subErr) {
    // Rollback status
    await supabase
      .from('projects')
      .update({ status: 'DRAFT' })
      .eq('id', projectId);

    if (subErr.message?.includes('deadline')) return { error: 'Submission deadline has passed.' };
    if (subErr.message?.includes('must have members')) return { error: 'Team has no members.' };
    return { error: 'Failed to record submission.' };
  }

  return {};
}
