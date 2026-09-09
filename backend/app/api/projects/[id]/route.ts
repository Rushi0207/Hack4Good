import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { badRequest, errorResponse, notFound, ok } from '@/lib/api/response';
import {
  deleteProject,
  getProjectById,
  updateProject,
} from '@/services/project.service';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { updateProjectSchema } from '@/types/project';

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

/** GET /api/projects/:id — public (SUBMITTED) or team member */
export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) return notFound('Project not found.');
    return ok(project);
  } catch (err) {
    return errorResponse(err);
  }
}

/** PATCH /api/projects/:id — team member (DRAFT only) or ADMIN */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const project = await getProjectById(id);
    if (!project) return notFound('Project not found.');

    if (project.status !== 'DRAFT' && actor.role !== 'ADMIN') {
      return badRequest('Submitted projects cannot be edited.');
    }

    const member = actor.role === 'ADMIN' || (await isTeamMember(project.team_id, actor.id));
    if (!member) throw new ForbiddenError();

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const updated = await updateProject(id, parsed.data);
    if (!updated) return notFound('Project not found or not a draft.');
    return ok(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/projects/:id — team member (DRAFT only) or ADMIN */
export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const project = await getProjectById(id);
    if (!project) return notFound('Project not found.');

    if (project.status !== 'DRAFT' && actor.role !== 'ADMIN') {
      return badRequest('Submitted projects cannot be deleted.');
    }

    const member = actor.role === 'ADMIN' || (await isTeamMember(project.team_id, actor.id));
    if (!member) throw new ForbiddenError();

    await deleteProject(id);
    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
