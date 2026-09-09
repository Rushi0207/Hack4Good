import { z } from 'zod';

export const hackathonStatusSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
]);
export type HackathonStatus = z.infer<typeof hackathonStatusSchema>;

export const hackathonSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string(),
  theme: z.string().nullable(),
  rules: z.string().nullable(),
  location: z.string().nullable(),
  registration_deadline: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  max_team_size: z.number().int(),
  status: hackathonStatusSchema,
  created_by: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Hackathon = z.infer<typeof hackathonSchema>;

const dateString = z.string().datetime({ offset: true });

export const createHackathonSchema = z
  .object({
    title: z.string().trim().refine((v) => v.length > 0, 'Title is required').max(300),
    description: z
      .string()
      .trim()
      .refine((v) => v.length > 0, 'Description is required'),
    theme: z.string().trim().nullable().optional(),
    rules: z.string().trim().nullable().optional(),
    location: z.string().trim().nullable().optional(),
    registration_deadline: dateString,
    start_date: dateString,
    end_date: dateString,
    max_team_size: z.number().int().min(1).max(10),
  })
  .refine((d) => d.registration_deadline <= d.start_date, {
    message: 'registration_deadline must be at or before start_date',
    path: ['registration_deadline'],
  })
  .refine((d) => d.start_date < d.end_date, {
    message: 'start_date must be before end_date',
    path: ['start_date'],
  });
export type CreateHackathonInput = z.infer<typeof createHackathonSchema>;

export const updateHackathonSchema = z
  .object({
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
    theme: z.string().trim().nullable().optional(),
    rules: z.string().trim().nullable().optional(),
    location: z.string().trim().nullable().optional(),
    registration_deadline: dateString.optional(),
    start_date: dateString.optional(),
    end_date: dateString.optional(),
    max_team_size: z.number().int().min(1).max(10).optional(),
    status: hackathonStatusSchema.optional(),
  })
  .refine(
    (d) =>
      !d.registration_deadline ||
      !d.start_date ||
      d.registration_deadline <= d.start_date,
    {
      message: 'registration_deadline must be at or before start_date',
      path: ['registration_deadline'],
    },
  )
  .refine(
    (d) => !d.start_date || !d.end_date || d.start_date < d.end_date,
    { message: 'start_date must be before end_date', path: ['start_date'] },
  );
export type UpdateHackathonInput = z.infer<typeof updateHackathonSchema>;

export const hackathonListQuerySchema = z.object({
  status: hackathonStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
