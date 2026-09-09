import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { errorResponse, ok } from '@/lib/api/response';
import { listNotifications } from '@/services/notification.service';

/** GET /api/notifications — authenticated user's own notifications */
export async function GET(): Promise<Response> {
  try {
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    const notifications = await listNotifications(actor.id);
    return ok(notifications);
  } catch (err) {
    return errorResponse(err);
  }
}
