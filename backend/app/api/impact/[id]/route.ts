import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { badRequest, errorResponse, notFound, ok } from '@/lib/api/response';
import { updateImpact } from '@/services/impact.service';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { updateImpactSchema } from '@/types/impact';

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/impact/:id — team member or ADMIN */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    // Verify ownership: fetch the impact record and check team membership
    const supabase = await createSupabaseServerClient();
    const { data: impact } = await supabase
      .from('impact_records')
      .select('id, project_id, projects(team_id)')
      .eq('id', id)
      .maybeSingle();

    if (!impact) return notFound('Impact record not found.');

    const proj = impact.projects as unknown as { team_id: string } | null;
    const teamId = proj?.team_id;
    if (!teamId && actor.role !== 'ADMIN') throw new ForbiddenError();

    if (actor.role !== 'ADMIN' && teamId) {
      const { data: membership } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', actor.id)
        .maybeSingle();
      if (!membership) throw new ForbiddenError();
    }

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = updateImpactSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const updated = await updateImpact(id, parsed.data);
    if (!updated) return notFound('Impact record not found.');
    return ok(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
