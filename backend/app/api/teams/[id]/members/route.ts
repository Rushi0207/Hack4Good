import { type NextRequest } from 'next/server';

import { errorResponse, notFound, ok } from '@/lib/api/response';
import { getTeamById, listTeamMembers } from '@/services/team.service';

type Params = { params: Promise<{ id: string }> };

/** GET /api/teams/:id/members — public */
export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const team = await getTeamById(id);
    if (!team) return notFound('Team not found.');

    const members = await listTeamMembers(id);
    return ok(members);
  } catch (err) {
    return errorResponse(err);
  }
}
