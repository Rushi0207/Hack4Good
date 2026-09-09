import { type NextRequest } from 'next/server';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { conflict, errorResponse, notFound, ok } from '@/lib/api/response';
import { getProblemById } from '@/services/problem.service';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

/** POST /api/problems/:id/vote — authenticated, adds an upvote */
export async function POST(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const problem = await getProblemById(id);
    if (!problem) return notFound('Problem not found.');

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('problem_votes')
      .insert({ problem_id: id, user_id: actor.id });

    if (error) {
      if (error.code === '23505') return conflict('You have already voted for this problem.');
      return errorResponse(new Error('Failed to record vote.'));
    }

    return ok({ success: true }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/problems/:id/vote — authenticated, removes the upvote */
export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const supabase = await createSupabaseServerClient();
    await supabase
      .from('problem_votes')
      .delete()
      .eq('problem_id', id)
      .eq('user_id', actor.id);

    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
