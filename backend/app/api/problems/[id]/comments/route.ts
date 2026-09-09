import { type NextRequest } from 'next/server';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { badRequest, errorResponse, notFound, ok } from '@/lib/api/response';
import { createComment, getProblemById, listComments } from '@/services/problem.service';
import { createCommentSchema } from '@/types/problem';

type Params = { params: Promise<{ id: string }> };

/** GET /api/problems/:id/comments — public */
export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const problem = await getProblemById(id);
    if (!problem) return notFound('Problem not found.');

    const comments = await listComments(id);
    return ok(comments);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/problems/:id/comments — authenticated */
export async function POST(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const problem = await getProblemById(id);
    if (!problem) return notFound('Problem not found.');

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const comment = await createComment(actor.id, id, parsed.data);
    if (!comment) return errorResponse(new Error('Failed to create comment.'));

    return ok(comment, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
