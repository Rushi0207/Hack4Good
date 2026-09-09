import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { badRequest, errorResponse, notFound, ok } from '@/lib/api/response';
import { updateEvaluation } from '@/services/evaluation.service';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { updateEvaluationSchema } from '@/types/evaluation';

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/evaluations/:id — owning judge or ADMIN */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    // Verify ownership
    const supabase = await createSupabaseServerClient();
    const { data: ev } = await supabase
      .from('evaluations')
      .select('judge_id')
      .eq('id', id)
      .maybeSingle();

    if (!ev) return notFound('Evaluation not found.');
    if (ev.judge_id !== actor.id && actor.role !== 'ADMIN') throw new ForbiddenError();

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = updateEvaluationSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const result = await updateEvaluation(id, parsed.data);
    if (result.error) return notFound(result.error);

    return ok(result.data);
  } catch (err) {
    return errorResponse(err);
  }
}
