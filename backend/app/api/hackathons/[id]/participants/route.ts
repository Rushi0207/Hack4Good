import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { errorResponse, notFound, ok } from '@/lib/api/response';
import {
  getHackathonById,
  listParticipants,
} from '@/services/hackathon.service';

type Params = { params: Promise<{ id: string }> };

/** GET /api/hackathons/:id/participants — manager or ADMIN */
export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const hackathon = await getHackathonById(id);
    if (!hackathon) return notFound('Hackathon not found.');

    const isManager = hackathon.created_by === actor.id || actor.role === 'ADMIN';
    if (!isManager) throw new ForbiddenError();

    const participants = await listParticipants(id);
    return ok(participants);
  } catch (err) {
    return errorResponse(err);
  }
}
