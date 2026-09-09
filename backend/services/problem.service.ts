import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  type Comment,
  commentSchema,
  type CreateCommentInput,
  type CreateProblemInput,
  type Problem,
  problemSchema,
  type ProblemListQuery,
  type UpdateProblemInput,
} from '@/types/problem';

const PROBLEM_FIELDS =
  'id, title, description, category, location, expected_impact, image_url, status, created_by, created_at, updated_at';

export async function listProblems(query: ProblemListQuery): Promise<Problem[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from('problems')
    .select(PROBLEM_FIELDS)
    .order('created_at', { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (query.status) q = q.eq('status', query.status);
  if (query.category) q = q.ilike('category', `%${query.category}%`);
  if (query.location) q = q.ilike('location', `%${query.location}%`);

  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((row) => problemSchema.parse(row));
}

export async function getProblemById(id: string): Promise<Problem | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('problems')
    .select(PROBLEM_FIELDS)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  const result = problemSchema.safeParse(data);
  return result.success ? result.data : null;
}

export async function createProblem(
  userId: string,
  input: CreateProblemInput,
): Promise<Problem | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('problems')
    .insert({ ...input, created_by: userId })
    .select(PROBLEM_FIELDS)
    .maybeSingle();

  if (error || !data) return null;
  const result = problemSchema.safeParse(data);
  return result.success ? result.data : null;
}

export async function updateProblem(
  id: string,
  input: UpdateProblemInput,
): Promise<Problem | null> {
  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch['title'] = input.title;
  if (input.description !== undefined) patch['description'] = input.description;
  if (input.category !== undefined) patch['category'] = input.category;
  if (input.location !== undefined) patch['location'] = input.location;
  if (input.expected_impact !== undefined) patch['expected_impact'] = input.expected_impact;
  if (input.image_url !== undefined) patch['image_url'] = input.image_url;
  if (input.status !== undefined) patch['status'] = input.status;

  if (Object.keys(patch).length === 0) return getProblemById(id);

  const { data, error } = await supabase
    .from('problems')
    .update(patch)
    .eq('id', id)
    .select(PROBLEM_FIELDS)
    .maybeSingle();

  if (error || !data) return null;
  const result = problemSchema.safeParse(data);
  return result.success ? result.data : null;
}

export async function deleteProblem(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('problems').delete().eq('id', id);
  return !error;
}

export async function listComments(problemId: string): Promise<Comment[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('comments')
    .select('id, user_id, problem_id, content, created_at')
    .eq('problem_id', problemId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data.map((row) => commentSchema.parse(row));
}

export async function createComment(
  userId: string,
  problemId: string,
  input: CreateCommentInput,
): Promise<Comment | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: userId, problem_id: problemId, content: input.content })
    .select('id, user_id, problem_id, content, created_at')
    .maybeSingle();

  if (error || !data) return null;
  const result = commentSchema.safeParse(data);
  return result.success ? result.data : null;
}
