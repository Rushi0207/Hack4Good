import { z } from 'zod';

export const projectStatusSchema = z.enum(['DRAFT', 'SUBMITTED']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const projectSchema = z.object({
  id: z.uuid(),
  team_id: z.uuid(),
  problem_id: z.uuid(),
  title: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  impact: z.string().nullable(),
  github_url: z.string().nullable(),
  demo_url: z.string().nullable(),
  status: projectStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
});
export type Project = z.infer<typeof projectSchema>;

export const createProjectSchema = z.object({
  team_id: z.uuid(),
  problem_id: z.uuid(),
  title: z.string().trim().refine((v) => v.length > 0, 'Title is required').max(300),
  description: z
    .string()
    .trim()
    .refine((v) => v.length > 0, 'Description is required'),
  technologies: z.array(z.string().trim().min(1)).optional().default([]),
  impact: z.string().trim().nullable().optional(),
  github_url: z.url().nullable().optional(),
  demo_url: z.url().nullable().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .refine((v) => v.length > 0, 'Title is required')
    .max(300)
    .optional(),
  description: z
    .string()
    .trim()
    .refine((v) => v.length > 0, 'Description is required')
    .optional(),
  technologies: z.array(z.string().trim().min(1)).optional(),
  impact: z.string().trim().nullable().optional(),
  github_url: z.url().nullable().optional(),
  demo_url: z.url().nullable().optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const submitProjectSchema = z.object({
  document_url: z.url().nullable().optional(),
});
export type SubmitProjectInput = z.infer<typeof submitProjectSchema>;
