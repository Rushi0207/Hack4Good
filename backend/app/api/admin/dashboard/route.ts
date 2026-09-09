import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
  requireRoleAction,
} from '@/lib/auth/authorization';
import { errorResponse, ok } from '@/lib/api/response';
import { adminDashboard } from '@/services/admin.service';

/** GET /api/admin/dashboard — ADMIN only */
export async function GET(): Promise<Response> {
  try {
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    requireRoleAction(actor, 'MANAGE_USERS');

    const stats = await adminDashboard();
    return ok(stats);
  } catch (err) {
    return errorResponse(err);
  }
}
