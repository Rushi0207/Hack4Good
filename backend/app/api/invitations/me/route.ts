import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { errorResponse, ok } from '@/lib/api/response';
import { listMyInvitations } from '@/services/team.service';

/** GET /api/invitations/me — pending invitations for the current user */
export async function GET(): Promise<Response> {
  try {
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    const invitations = await listMyInvitations(actor.id);
    return ok(invitations);
  } catch (err) {
    return errorResponse(err);
  }
}
