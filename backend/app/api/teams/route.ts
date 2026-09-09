import { type NextRequest } from 'next/server';
import { z } from 'zod';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
  requireRoleAction,
} from '@/lib/auth/authorization';
import { badRequest, conflict, errorResponse, ok } from '@/lib/api/response';
import { createTeam, listTeams } from '@/services/team.service';
import { createTeamSchema } from '@/types/team';

/** GET /api/teams — public, ?hackathon_id= filter */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const p = request.nextUrl.searchParams;
    const query = z.object({
      hackathon_id: z.uuid().optional(),
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      offset: z.coerce.number().int().min(0).optional().default(0),
    }).safeParse(Object.fromEntries(p));

    if (!query.success) return errorResponse(query.error);
    const teams = await listTeams(query.data);
    return ok(teams);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/teams — PARTICIPANT or ADMIN (also becomes team leader + first member) */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    requireRoleAction(actor, 'CREATE_OR_JOIN_TEAM');

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const result = await createTeam(actor.id, parsed.data);
    if (result.error) return conflict(result.error);
    if (!result.data) return errorResponse(new Error('Failed to create team.'));

    return ok(result.data, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
