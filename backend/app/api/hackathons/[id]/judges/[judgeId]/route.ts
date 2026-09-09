import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { errorResponse, notFound, ok } from '@/lib/api/response';
import { unassignJudge } from '@/services/evaluation.service';
import { getHackathonById } from '@/services/hackathon.service';

type Params = { params: Promise<{ id: string; judgeId: string }> };

/** DELETE /api/hackathons/:id/judges/:judgeId — hackathon manager or ADMIN */
export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id, judgeId } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const hackathon = await getHackathonById(id);
    if (!hackathon) return notFound('Hackathon not found.');

    const isManager = hackathon.created_by === actor.id || actor.role === 'ADMIN';
    if (!isManager) throw new ForbiddenError();

    await unassignJudge(id, judgeId);
    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
