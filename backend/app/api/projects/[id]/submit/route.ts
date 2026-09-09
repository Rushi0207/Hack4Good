import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { badRequest, conflict, errorResponse, notFound, ok } from '@/lib/api/response';
import { getProjectById, submitProject } from '@/services/project.service';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { submitProjectSchema } from '@/types/project';

type Params = { params: Promise<{ id: string }> };

async function isTeamMember(teamId: string, userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

/** POST /api/projects/:id/submit — team member or ADMIN */
export async function POST(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const project = await getProjectById(id);
    if (!project) return notFound('Project not found.');

    if (project.status === 'SUBMITTED') return badRequest('Project has already been submitted.');

    const member = actor.role === 'ADMIN' || (await isTeamMember(project.team_id, actor.id));
    if (!member) throw new ForbiddenError();

    let body: unknown;
    try { body = await request.json(); } catch { body = {}; }

    const parsed = submitProjectSchema.safeParse(body ?? {});
    if (!parsed.success) return errorResponse(parsed.error);

    const result = await submitProject(id, parsed.data);
    if (result.error) return conflict(result.error);

    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
