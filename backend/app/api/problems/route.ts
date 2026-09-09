import { type NextRequest } from 'next/server';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
  requireRoleAction,
} from '@/lib/auth/authorization';
import { badRequest, errorResponse, ok } from '@/lib/api/response';
import { createProblem, listProblems } from '@/services/problem.service';
import { createProblemSchema, problemListQuerySchema } from '@/types/problem';

/** GET /api/problems — public, supports ?status=, ?category=, ?location= */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = problemListQuerySchema.safeParse(params);
    if (!parsed.success) return errorResponse(parsed.error);

    const problems = await listProblems(parsed.data);
    return ok(problems);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/problems — PARTICIPANT or ADMIN only */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    requireRoleAction(actor, 'SUBMIT_PROBLEM');

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = createProblemSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const problem = await createProblem(actor.id, parsed.data);
    if (!problem) return errorResponse(new Error('Failed to create problem.'));

    return ok(problem, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
