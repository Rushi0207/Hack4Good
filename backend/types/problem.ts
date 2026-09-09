import { z } from 'zod';

export const problemStatusSchema = z.enum([
  'OPEN',
  'SELECTED',
  'IN_PROGRESS',
  'SOLVED',
  'CLOSED',
]);
export type ProblemStatus = z.infer<typeof problemStatusSchema>;

export const problemSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string(),
  category: z.string().nullable(),
  location: z.string().nullable(),
  expected_impact: z.string().nullable(),
  image_url: z.string().nullable(),
  status: problemStatusSchema,
  created_by: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Problem = z.infer<typeof problemSchema>;

export const createProblemSchema = z.object({
  title: z.string().trim().refine((v) => v.length > 0, 'Title is required').max(300),
  description: z.string().trim().refine((v) => v.length > 0, 'Description is required'),
  category: z.string().trim().nullable().optional(),
  location: z.string().trim().nullable().optional(),
  expected_impact: z.string().trim().nullable().optional(),
  image_url: z.url('image_url must be a valid URL').nullable().optional(),
});
export type CreateProblemInput = z.infer<typeof createProblemSchema>;

export const updateProblemSchema = z.object({
  title: z.string().trim().refine((v) => v.length > 0, 'Title is required').max(300).optional(),
  description: z
    .string()
    .trim()
    .refine((v) => v.length > 0, 'Description is required')
    .optional(),
  category: z.string().trim().nullable().optional(),
  location: z.string().trim().nullable().optional(),
  expected_impact: z.string().trim().nullable().optional(),
  image_url: z.url('image_url must be a valid URL').nullable().optional(),
  status: problemStatusSchema.optional(),
});
export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .refine((v) => v.length > 0, 'Comment content is required')
    .max(2000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const commentSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  problem_id: z.uuid(),
  content: z.string(),
  created_at: z.string(),
});
export type Comment = z.infer<typeof commentSchema>;

export const problemListQuerySchema = z.object({
  status: problemStatusSchema.optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
export type ProblemListQuery = z.infer<typeof problemListQuerySchema>;
