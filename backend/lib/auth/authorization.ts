import { z } from 'zod';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAuthenticatedUserId } from '@/lib/auth/session';
import {
  type AuthenticatedActor,
  type UserRole,
  userRoleSchema,
} from '@/types/auth';

export const roleActionSchema = z.enum([
  'PUBLIC_READ',
  'SUBMIT_PROBLEM',
  'MANAGE_HACKATHONS',
  'REGISTER_HACKATHON',
  'CREATE_OR_JOIN_TEAM',
  'SUBMIT_PROJECT',
  'EVALUATE_ASSIGNED_PROJECT',
  'MANAGE_USERS',
  'MANAGE_OWN_CONTENT',
  'MANAGE_ALL_CONTENT',
]);

export type RoleAction = z.infer<typeof roleActionSchema>;

const profileSchema = z.object({
  id: z.uuid(),
  role: userRoleSchema,
});

const permissions: Record<UserRole, readonly RoleAction[]> = {
  PARTICIPANT: [
    'PUBLIC_READ',
    'SUBMIT_PROBLEM',
    'REGISTER_HACKATHON',
    'CREATE_OR_JOIN_TEAM',
    'SUBMIT_PROJECT',
  ],
  ORGANIZER: ['PUBLIC_READ', 'MANAGE_HACKATHONS', 'MANAGE_OWN_CONTENT'],
  JUDGE: ['PUBLIC_READ', 'EVALUATE_ASSIGNED_PROJECT'],
  ADMIN: [
    'PUBLIC_READ',
    'SUBMIT_PROBLEM',
    'MANAGE_HACKATHONS',
    'REGISTER_HACKATHON',
    'CREATE_OR_JOIN_TEAM',
    'SUBMIT_PROJECT',
    'EVALUATE_ASSIGNED_PROJECT',
    'MANAGE_USERS',
    'MANAGE_OWN_CONTENT',
    'MANAGE_ALL_CONTENT',
  ],
};

export class UnauthenticatedError extends Error {
  constructor() {
    super('Authentication is required.');
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super('You do not have permission to perform this action.');
  }
}

/** Resolves the verified Auth subject to its application role. */
export async function getAuthenticatedActor(): Promise<AuthenticatedActor | null> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  const result = profileSchema.safeParse(data);

  if (!result.success || result.data.id !== userId) {
    return null;
  }

  return result.data;
}

export function canPerformRoleAction(role: UserRole, action: RoleAction): boolean {
  return permissions[role].includes(action);
}

export function requireAuthenticatedActor(
  actor: AuthenticatedActor | null,
): AuthenticatedActor {
  if (!actor) {
    throw new UnauthenticatedError();
  }

  return actor;
}

/** Checks role authorization only; handlers must additionally check resource rules. */
export function requireRoleAction(
  actor: AuthenticatedActor,
  action: RoleAction,
): void {
  if (!canPerformRoleAction(actor.role, action)) {
    throw new ForbiddenError();
  }
}
