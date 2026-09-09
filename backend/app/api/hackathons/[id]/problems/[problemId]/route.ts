import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { errorResponse, notFound, ok } from '@/lib/api/response';
import {
  getHackathonById,
  removeProblemFromHackathon,
} from '@/services/hackathon.service';

type Params = { params: Promise<{ id: string; problemId: string }> };

/** DELETE /api/hackathons/:id/problems/:problemId — hackathon manager or ADMIN */
export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id, problemId } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const hackathon = await getHackathonById(id);
    if (!hackathon) return notFound('Hackathon not found.');

    const isManager = hackathon.created_by === actor.id || actor.role === 'ADMIN';
    if (!isManager) throw new ForbiddenError();

    await removeProblemFromHackathon(id, problemId);
    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
