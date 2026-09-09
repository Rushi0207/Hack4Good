import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { badRequest, errorResponse, notFound, ok } from '@/lib/api/response';
import {
  deleteTeam,
  getTeamById,
  updateTeam,
} from '@/services/team.service';
import { updateTeamSchema } from '@/types/team';

type Params = { params: Promise<{ id: string }> };

/** GET /api/teams/:id — public */
export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const team = await getTeamById(id);
    if (!team) return notFound('Team not found.');
    return ok(team);
  } catch (err) {
    return errorResponse(err);
  }
}

/** PATCH /api/teams/:id — team leader or ADMIN */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const team = await getTeamById(id);
    if (!team) return notFound('Team not found.');

    if (team.leader_id !== actor.id && actor.role !== 'ADMIN') throw new ForbiddenError();

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = updateTeamSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const updated = await updateTeam(id, parsed.data);
    if (!updated) return notFound('Team not found.');
    return ok(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/teams/:id — team leader or ADMIN */
export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const team = await getTeamById(id);
    if (!team) return notFound('Team not found.');

    if (team.leader_id !== actor.id && actor.role !== 'ADMIN') throw new ForbiddenError();

    await deleteTeam(id);
    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
