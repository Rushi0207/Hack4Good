import { z } from 'zod';

export const invitationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REJECTED']);
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;

export const teamSchema = z.object({
  id: z.uuid(),
  hackathon_id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  leader_id: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Team = z.infer<typeof teamSchema>;

export const createTeamSchema = z.object({
  hackathon_id: z.uuid(),
  name: z
    .string()
    .trim()
    .refine((v) => v.length > 0, 'Team name is required')
    .max(100, 'Team name must be 100 characters or fewer'),
  description: z.string().trim().nullable().optional(),
});
export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .refine((v) => v.length > 0, 'Team name is required')
    .max(100)
    .optional(),
  description: z.string().trim().nullable().optional(),
});
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

export const inviteMemberSchema = z.object({
  user_id: z.uuid(),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const teamMemberSchema = z.object({
  id: z.uuid(),
  team_id: z.uuid(),
  user_id: z.uuid(),
  joined_at: z.string(),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;

export const teamInvitationSchema = z.object({
  id: z.uuid(),
  team_id: z.uuid(),
  user_id: z.uuid(),
  status: invitationStatusSchema,
  created_at: z.string(),
});
export type TeamInvitation = z.infer<typeof teamInvitationSchema>;
