import { type NextRequest } from 'next/server';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
  requireRoleAction,
} from '@/lib/auth/authorization';
import { badRequest, conflict, errorResponse, notFound, ok } from '@/lib/api/response';
import {
  createEvaluation,
  getEvaluationsForProject,
} from '@/services/evaluation.service';
import { getProjectById } from '@/services/project.service';
import { createEvaluationSchema } from '@/types/evaluation';

type Params = { params: Promise<{ id: string }> };

/** GET /api/projects/:id/evaluation — judge, team member, manager, or ADMIN */
export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    requireAuthenticatedActor(await getAuthenticatedActor());

    const project = await getProjectById(id);
    if (!project) return notFound('Project not found.');

    const evaluations = await getEvaluationsForProject(id);
    return ok(evaluations);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/projects/:id/evaluation — JUDGE or ADMIN */
export async function POST(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    requireRoleAction(actor, 'EVALUATE_ASSIGNED_PROJECT');

    const project = await getProjectById(id);
    if (!project) return notFound('Project not found.');

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = createEvaluationSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const result = await createEvaluation(id, actor.id, parsed.data);
    if (result.error) return conflict(result.error);

    return ok(result.data, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
