import { type NextRequest } from 'next/server';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
  requireRoleAction,
} from '@/lib/auth/authorization';
import { conflict, errorResponse, notFound, ok } from '@/lib/api/response';
import {
  getHackathonById,
  registerForHackathon,
  unregisterFromHackathon,
} from '@/services/hackathon.service';

type Params = { params: Promise<{ id: string }> };

/** POST /api/hackathons/:id/register — PARTICIPANT or ADMIN */
export async function POST(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    requireRoleAction(actor, 'REGISTER_HACKATHON');

    const hackathon = await getHackathonById(id);
    if (!hackathon) return notFound('Hackathon not found.');

    const result = await registerForHackathon(id, actor.id);
    if (result.error) return conflict(result.error);

    return ok({ success: true }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/hackathons/:id/register — PARTICIPANT or ADMIN */
export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    requireRoleAction(actor, 'REGISTER_HACKATHON');

    const hackathon = await getHackathonById(id);
    if (!hackathon) return notFound('Hackathon not found.');

    await unregisterFromHackathon(id, actor.id);
    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
