import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { errorResponse, notFound, ok } from '@/lib/api/response';
import { getTeamById, removeMember } from '@/services/team.service';

type Params = { params: Promise<{ id: string; userId: string }> };

/** DELETE /api/teams/:id/members/:userId — team leader, the member themselves, or ADMIN */
export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id, userId } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const team = await getTeamById(id);
    if (!team) return notFound('Team not found.');

    const isSelf = actor.id === userId;
    const isLeader = team.leader_id === actor.id;
    const isAdmin = actor.role === 'ADMIN';

    if (!isSelf && !isLeader && !isAdmin) throw new ForbiddenError();

    await removeMember(id, userId);
    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
