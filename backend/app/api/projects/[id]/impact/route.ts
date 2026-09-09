import { type NextRequest } from 'next/server';

import {
  ForbiddenError,
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { errorResponse, notFound, ok } from '@/lib/api/response';
import { createImpact, listImpactByProject } from '@/services/impact.service';
import { getProjectById } from '@/services/project.service';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createImpactSchema } from '@/types/impact';

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

/** GET /api/projects/:id/impact — public */
export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) return notFound('Project not found.');

    const records = await listImpactByProject(id);
    return ok(records);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/projects/:id/impact — team member or ADMIN */
export async function POST(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const project = await getProjectById(id);
    if (!project) return notFound('Project not found.');

    const member = actor.role === 'ADMIN' || (await isTeamMember(project.team_id, actor.id));
    if (!member) throw new ForbiddenError();

    let body: unknown;
    try { body = await request.json(); } catch { body = {}; }

    const parsed = createImpactSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const record = await createImpact(id, parsed.data);
    if (!record) return errorResponse(new Error('Failed to create impact record.'));

    return ok(record, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
