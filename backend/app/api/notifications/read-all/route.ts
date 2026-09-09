import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { errorResponse, ok } from '@/lib/api/response';
import { markAllAsRead } from '@/services/notification.service';

/** PATCH /api/notifications/read-all */
export async function PATCH(): Promise<Response> {
  try {
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    await markAllAsRead(actor.id);
    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
