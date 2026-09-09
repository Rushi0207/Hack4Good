import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { badRequest, errorResponse, notFound, ok } from '@/lib/api/response';
import {
  deleteProblem,
  getProblemById,
  updateProblem,
} from '@/services/problem.service';
import { updateProblemSchema } from '@/types/problem';

type Params = { params: Promise<{ id: string }> };

/** GET /api/problems/:id — public */
export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const problem = await getProblemById(id);
    if (!problem) return notFound('Problem not found.');
    return ok(problem);
  } catch (err) {
    return errorResponse(err);
  }
}

/** PATCH /api/problems/:id — owner or ADMIN */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const existing = await getProblemById(id);
    if (!existing) return notFound('Problem not found.');

    const isOwner = existing.created_by === actor.id;
    const isAdmin = actor.role === 'ADMIN';
    if (!isOwner && !isAdmin) throw new ForbiddenError();

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = updateProblemSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const updated = await updateProblem(id, parsed.data);
    if (!updated) return notFound('Problem not found.');
    return ok(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/problems/:id — owner or ADMIN */
export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const existing = await getProblemById(id);
    if (!existing) return notFound('Problem not found.');

    const isOwner = existing.created_by === actor.id;
    const isAdmin = actor.role === 'ADMIN';
    if (!isOwner && !isAdmin) throw new ForbiddenError();

    await deleteProblem(id);
    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
