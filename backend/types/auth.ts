import { z } from 'zod';

export const userRoleSchema = z.enum([
  'PARTICIPANT',
  'ORGANIZER',
  'JUDGE',
  'ADMIN',
]);

export type UserRole = z.infer<typeof userRoleSchema>;

export type AuthenticatedActor = {
  id: string;
  role: UserRole;
};
