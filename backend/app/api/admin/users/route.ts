import { type NextRequest } from 'next/server';
import { z } from 'zod';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
  requireRoleAction,
} from '@/lib/auth/authorization';
import { errorResponse, ok } from '@/lib/api/response';
import { adminListUsers } from '@/services/admin.service';

/** GET /api/admin/users — ADMIN only */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    requireRoleAction(actor, 'MANAGE_USERS');

    const p = request.nextUrl.searchParams;
    const query = z.object({
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      offset: z.coerce.number().int().min(0).optional().default(0),
    }).safeParse(Object.fromEntries(p));

    if (!query.success) return errorResponse(query.error);

    const users = await adminListUsers(query.data);
    return ok(users);
  } catch (err) {
    return errorResponse(err);
  }
}
