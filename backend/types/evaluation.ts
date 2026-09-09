import { z } from 'zod';

export const evaluationCriterionSchema = z.object({
  id: z.uuid(),
  hackathon_id: z.uuid(),
  name: z.string(),
  max_score: z.number(),
  weight: z.number(),
});
export type EvaluationCriterion = z.infer<typeof evaluationCriterionSchema>;

export const createCriterionSchema = z.object({
  name: z.string().trim().refine((v) => v.length > 0, 'Criterion name is required').max(200),
  max_score: z.number().positive('max_score must be positive'),
  weight: z.number().positive('weight must be positive'),
});
export type CreateCriterionInput = z.infer<typeof createCriterionSchema>;

export const evaluationSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  judge_id: z.uuid(),
  feedback: z.string().nullable(),
  total_score: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Evaluation = z.infer<typeof evaluationSchema>;

export const evaluationScoreSchema = z.object({
  id: z.uuid(),
  evaluation_id: z.uuid(),
  criterion_id: z.uuid(),
  score: z.number(),
});
export type EvaluationScore = z.infer<typeof evaluationScoreSchema>;

export const scoreInputSchema = z.object({
  criterion_id: z.uuid(),
  score: z.number().min(0, 'Score must be non-negative'),
});

export const createEvaluationSchema = z.object({
  feedback: z.string().trim().nullable().optional(),
  scores: z
    .array(scoreInputSchema)
    .min(1, 'At least one score is required'),
});
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;

export const updateEvaluationSchema = z.object({
  feedback: z.string().trim().nullable().optional(),
  scores: z.array(scoreInputSchema).min(1).optional(),
});
export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;

export const assignJudgeSchema = z.object({
  judge_id: z.uuid(),
});
export type AssignJudgeInput = z.infer<typeof assignJudgeSchema>;

export const leaderboardEntrySchema = z.object({
  team_id: z.uuid(),
  team_name: z.string(),
  project_id: z.uuid(),
  project_title: z.string(),
  total_score: z.number(),
  rank: z.number().int(),
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
