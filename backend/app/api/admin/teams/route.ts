import { type NextRequest } from 'next/server';
import { z } from 'zod';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
  requireRoleAction,
} from '@/lib/auth/authorization';
import { errorResponse, ok } from '@/lib/api/response';
import { adminList } from '@/services/admin.service';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/** GET /api/admin/teams — ADMIN only */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    requireRoleAction(actor, 'MANAGE_ALL_CONTENT');

    const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return errorResponse(parsed.error);

    return ok(await adminList('teams', parsed.data));
  } catch (err) {
    return errorResponse(err);
  }
}
