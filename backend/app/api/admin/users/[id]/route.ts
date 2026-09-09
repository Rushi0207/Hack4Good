import { type NextRequest } from 'next/server';
import { z } from 'zod';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
  requireRoleAction,
} from '@/lib/auth/authorization';
import { badRequest, errorResponse, notFound, ok } from '@/lib/api/response';
import { adminDeleteUser, adminUpdateUser } from '@/services/admin.service';
import { userRoleSchema } from '@/types/auth';

type Params = { params: Promise<{ id: string }> };

const patchUserSchema = z.object({
  role: userRoleSchema.optional(),
  full_name: z.string().trim().refine((v) => v.length > 0).max(200).optional(),
});

/** PATCH /api/admin/users/:id — ADMIN only */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    requireRoleAction(actor, 'MANAGE_USERS');

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = patchUserSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const updated = await adminUpdateUser(id, parsed.data);
    if (!updated) return notFound('User not found.');
    return ok(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/admin/users/:id — ADMIN only */
export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    requireRoleAction(actor, 'MANAGE_USERS');

    await adminDeleteUser(id);
    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
