import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { badRequest, errorResponse, notFound, ok } from '@/lib/api/response';
import {
  deleteHackathon,
  getHackathonById,
  updateHackathon,
} from '@/services/hackathon.service';
import { updateHackathonSchema } from '@/types/hackathon';

type Params = { params: Promise<{ id: string }> };

/** GET /api/hackathons/:id — public */
export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const hackathon = await getHackathonById(id);
    if (!hackathon) return notFound('Hackathon not found.');
    return ok(hackathon);
  } catch (err) {
    return errorResponse(err);
  }
}

/** PATCH /api/hackathons/:id — owner ORGANIZER or ADMIN */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const existing = await getHackathonById(id);
    if (!existing) return notFound('Hackathon not found.');

    const isManager = existing.created_by === actor.id || actor.role === 'ADMIN';
    if (!isManager) throw new ForbiddenError();

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = updateHackathonSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const updated = await updateHackathon(id, parsed.data);
    if (!updated) return notFound('Hackathon not found.');
    return ok(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/hackathons/:id — owner ORGANIZER or ADMIN */
export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const existing = await getHackathonById(id);
    if (!existing) return notFound('Hackathon not found.');

    const isManager = existing.created_by === actor.id || actor.role === 'ADMIN';
    if (!isManager) throw new ForbiddenError();

    await deleteHackathon(id);
    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
