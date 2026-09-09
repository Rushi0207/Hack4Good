import { z } from 'zod';

import { userRoleSchema } from '@/types/auth';

// ─── Stored profile (as returned from DB) ────────────────────────────────────

export const profileSchema = z.object({
  id: z.uuid(),
  full_name: z.string(),
  role: userRoleSchema,
  bio: z.string().nullable(),
  skills: z.array(z.string()),
  location: z.string().nullable(),
  // image_url may be null; when present it should be a URL string.
  image_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Profile = z.infer<typeof profileSchema>;

// ─── PATCH /api/profiles/me input ─────────────────────────────────────────────

/**
 * Builds a non-empty trimmed string field.
 * In Zod v4, trim() is a transform that runs after checks, so we use refine()
 * to reject strings that become empty after trimming.
 */
function nonEmptyTrimmedString(maxLen: number, label: string) {
  return z
    .string()
    .max(maxLen, `${label} must be ${maxLen} characters or fewer`)
    .trim()
    .refine((v) => v.length > 0, `${label} is required`);
}

export const updateProfileSchema = z.object({
  full_name: nonEmptyTrimmedString(200, 'Full name').optional(),
  bio: z
    .string()
    .max(2000, 'Bio must be 2000 characters or fewer')
    .trim()
    .nullable()
    .optional(),
  skills: z
    .array(z.string().trim().refine((v) => v.length > 0, 'Skill must not be blank'))
    .max(30, 'You may list up to 30 skills')
    .optional(),
  location: z.string().max(200).trim().nullable().optional(),
  image_url: z.url('image_url must be a valid URL').nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
