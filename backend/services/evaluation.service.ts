import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  type AssignJudgeInput,
  type CreateCriterionInput,
  type CreateEvaluationInput,
  type Evaluation,
  evaluationSchema,
  type LeaderboardEntry,
  type UpdateEvaluationInput,
} from '@/types/evaluation';

const EVALUATION_FIELDS =
  'id, project_id, judge_id, feedback, total_score, created_at, updated_at';

export async function listCriteria(hackathonId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('evaluation_criteria')
    .select('id, hackathon_id, name, max_score, weight')
    .eq('hackathon_id', hackathonId)
    .order('name');

  if (error || !data) return [];
  return data;
}

export async function createCriterion(
  hackathonId: string,
  input: CreateCriterionInput,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('evaluation_criteria')
    .insert({ hackathon_id: hackathonId, ...input })
    .select('id, hackathon_id, name, max_score, weight')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') return { error: 'A criterion with that name already exists.' };
    return { error: 'Failed to create criterion.' };
  }
  return { data };
}

export async function assignJudge(
  hackathonId: string,
  input: AssignJudgeInput,
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('hackathon_judges')
    .insert({ hackathon_id: hackathonId, judge_id: input.judge_id });

  if (error) {
    if (error.code === '23505') return { error: 'Judge is already assigned to this hackathon.' };
    return { error: 'Failed to assign judge.' };
  }
  return {};
}

export async function unassignJudge(
  hackathonId: string,
  judgeId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('hackathon_judges')
    .delete()
    .eq('hackathon_id', hackathonId)
    .eq('judge_id', judgeId);
  return !error;
}

export async function getJudgeProjects(judgeId: string) {
  const supabase = await createSupabaseServerClient();
  // Projects in hackathons where this judge is assigned, that are SUBMITTED
  const { data, error } = await supabase
    .from('hackathon_judges')
    .select(`
      hackathon_id,
      hackathons(title),
      projects:hackathons!inner(
        teams!inner(projects(id, title, description, status, team_id, problem_id, created_at))
      )
    `)
    .eq('judge_id', judgeId);

  if (error || !data) return [];
  return data;
}

export async function getEvaluationsForProject(projectId: string): Promise<Evaluation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('evaluations')
    .select(EVALUATION_FIELDS)
    .eq('project_id', projectId);

  if (error || !data) return [];
  return data.map((row) => evaluationSchema.parse(row));
}

export async function createEvaluation(
  projectId: string,
  judgeId: string,
  input: CreateEvaluationInput,
): Promise<{ data?: Evaluation; error?: string }> {
  const supabase = await createSupabaseServerClient();

  // Insert evaluation
  const { data: ev, error: evErr } = await supabase
    .from('evaluations')
    .insert({ project_id: projectId, judge_id: judgeId, feedback: input.feedback ?? null })
    .select(EVALUATION_FIELDS)
    .maybeSingle();

  if (evErr) {
    if (evErr.message?.includes('Only submitted')) return { error: 'Project must be submitted before evaluation.' };
    if (evErr.message?.includes('not assigned')) return { error: 'Judge is not assigned to this hackathon.' };
    if (evErr.message?.includes('own team')) return { error: 'A judge cannot evaluate a project from their own team.' };
    if (evErr.code === '23505') return { error: 'Evaluation already exists.' };
    return { error: 'Failed to create evaluation.' };
  }
  if (!ev) return { error: 'Failed to create evaluation.' };

  // Insert scores
  const scoreRows = input.scores.map((s) => ({
    evaluation_id: ev.id,
    criterion_id: s.criterion_id,
    score: s.score,
  }));

  const { error: scoreErr } = await supabase.from('evaluation_scores').insert(scoreRows);
  if (scoreErr) {
    if (scoreErr.message?.includes('Score exceeds')) return { error: 'One or more scores exceed the criterion maximum.' };
    if (scoreErr.message?.includes('not for this project')) return { error: 'Criterion does not belong to this hackathon.' };
    // Clean up orphan evaluation
    await supabase.from('evaluations').delete().eq('id', ev.id);
    return { error: 'Failed to record scores.' };
  }

  const result = evaluationSchema.safeParse(ev);
  return result.success ? { data: result.data } : { error: 'Failed to create evaluation.' };
}

export async function updateEvaluation(
  evaluationId: string,
  input: UpdateEvaluationInput,
): Promise<{ data?: Evaluation; error?: string }> {
  const supabase = await createSupabaseServerClient();

  if (input.feedback !== undefined) {
    const { error } = await supabase
      .from('evaluations')
      .update({ feedback: input.feedback })
      .eq('id', evaluationId);
    if (error) return { error: 'Failed to update feedback.' };
  }

  if (input.scores && input.scores.length > 0) {
    for (const s of input.scores) {
      const { error } = await supabase
        .from('evaluation_scores')
        .upsert(
          { evaluation_id: evaluationId, criterion_id: s.criterion_id, score: s.score },
          { onConflict: 'evaluation_id,criterion_id' },
        );
      if (error) {
        if (error.message?.includes('Score exceeds')) return { error: 'Score exceeds criterion maximum.' };
        return { error: 'Failed to update score.' };
      }
    }
  }

  const { data, error } = await supabase
    .from('evaluations')
    .select(EVALUATION_FIELDS)
    .eq('id', evaluationId)
    .maybeSingle();

  if (error || !data) return { error: 'Evaluation not found.' };
  const result = evaluationSchema.safeParse(data);
  return result.success ? { data: result.data } : { error: 'Failed to update evaluation.' };
}

export async function getLeaderboard(hackathonId: string): Promise<LeaderboardEntry[]> {
  const supabase = await createSupabaseServerClient();

  // Aggregate average total_score per project, join team name
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      team_id,
      teams!inner(name, hackathon_id),
      evaluations(total_score)
    `)
    .eq('teams.hackathon_id', hackathonId)
    .eq('status', 'SUBMITTED');

  if (error || !data) return [];

  const entries: LeaderboardEntry[] = data
    .map((p) => {
      const scores = (p.evaluations as { total_score: number }[]) ?? [];
      const avg =
        scores.length > 0
          ? scores.reduce((sum, e) => sum + e.total_score, 0) / scores.length
          : 0;
      const team = p.teams as unknown as { name: string };
      return {
        team_id: p.team_id,
        team_name: team.name,
        project_id: p.id,
        project_title: p.title,
        total_score: Math.round(avg * 100) / 100,
        rank: 0,
      };
    })
    .sort((a, b) => b.total_score - a.total_score)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return entries;
}
