import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { badRequest, conflict, errorResponse, notFound, ok } from '@/lib/api/response';
import { assignJudge } from '@/services/evaluation.service';
import { getHackathonById } from '@/services/hackathon.service';
import { assignJudgeSchema } from '@/types/evaluation';

type Params = { params: Promise<{ id: string }> };

/** POST /api/hackathons/:id/judges — hackathon manager or ADMIN */
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

    const parsed = assignJudgeSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const result = await assignJudge(id, parsed.data);
    if (result.error) return conflict(result.error);

    return ok({ success: true }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
