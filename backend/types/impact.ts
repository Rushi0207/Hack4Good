import { z } from 'zod';

export const impactStatusSchema = z.enum([
  'PLANNED',
  'IN_PROGRESS',
  'IMPLEMENTED',
  'DISCONTINUED',
]);
export type ImpactStatus = z.infer<typeof impactStatusSchema>;

export const impactRecordSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  status: impactStatusSchema,
  people_benefited: z.number().int().nullable(),
  metric_name: z.string().nullable(),
  metric_value: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ImpactRecord = z.infer<typeof impactRecordSchema>;

export const createImpactSchema = z.object({
  status: impactStatusSchema.optional().default('PLANNED'),
  people_benefited: z.number().int().min(0).nullable().optional(),
  metric_name: z.string().trim().nullable().optional(),
  metric_value: z.number().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});
export type CreateImpactInput = z.infer<typeof createImpactSchema>;

export const updateImpactSchema = z.object({
  status: impactStatusSchema.optional(),
  people_benefited: z.number().int().min(0).nullable().optional(),
  metric_name: z.string().trim().nullable().optional(),
  metric_value: z.number().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});
export type UpdateImpactInput = z.infer<typeof updateImpactSchema>;
