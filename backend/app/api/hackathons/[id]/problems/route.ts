import { type NextRequest } from 'next/server';
import { z } from 'zod';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { badRequest, conflict, errorResponse, notFound, ok } from '@/lib/api/response';
import {
  addProblemToHackathon,
  getHackathonById,
  listHackathonProblems,
} from '@/services/hackathon.service';

type Params = { params: Promise<{ id: string }> };

/** GET /api/hackathons/:id/problems — public */
export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const hackathon = await getHackathonById(id);
    if (!hackathon) return notFound('Hackathon not found.');

    const problems = await listHackathonProblems(id);
    return ok(problems);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/hackathons/:id/problems — hackathon manager or ADMIN */
export async function POST(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const hackathon = await getHackathonById(id);
    if (!hackathon) return notFound('Hackathon not found.');

    const isManager = hackathon.created_by === actor.id || actor.role === 'ADMIN';
    if (!isManager) throw new ForbiddenError();

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = z.object({ problem_id: z.uuid() }).safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const result = await addProblemToHackathon(id, parsed.data.problem_id);
    if (result.error) return conflict(result.error);

    return ok({ success: true }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
