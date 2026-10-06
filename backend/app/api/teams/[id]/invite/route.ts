import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { badRequest, conflict, errorResponse, notFound, ok } from '@/lib/api/response';
import { getTeamById, inviteMember } from '@/services/team.service';
import { getProfileById } from '@/services/profile.service';
import { inviteMemberSchema } from '@/types/team';

type Params = { params: Promise<{ id: string }> };

/** POST /api/teams/:id/invite — team leader or ADMIN
 *  Body: { email: string }
 */
export async function POST(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const team = await getTeamById(id);
    if (!team) return notFound('Team not found.');

    if (team.leader_id !== actor.id && actor.role !== 'ADMIN') throw new ForbiddenError();

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = inviteMemberSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    // Resolve the inviter's display name for the notification message
    const inviterProfile = await getProfileById(actor.id);
    const inviterName = inviterProfile?.full_name ?? 'A team leader';

    const result = await inviteMember(id, inviterName, parsed.data.email);
    if (result.error) return conflict(result.error);

    return ok(result.data, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
