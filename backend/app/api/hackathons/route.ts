import { type NextRequest } from 'next/server';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
  requireRoleAction,
} from '@/lib/auth/authorization';
import { badRequest, errorResponse, ok } from '@/lib/api/response';
import { createHackathon, listHackathons } from '@/services/hackathon.service';
import { createHackathonSchema, hackathonListQuerySchema } from '@/types/hackathon';

/** GET /api/hackathons — public, ?status= filter */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = hackathonListQuerySchema.safeParse(params);
    if (!parsed.success) return errorResponse(parsed.error);

    const hackathons = await listHackathons(parsed.data);
    return ok(hackathons);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/hackathons — ORGANIZER or ADMIN */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    requireRoleAction(actor, 'MANAGE_HACKATHONS');

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = createHackathonSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const hackathon = await createHackathon(actor.id, parsed.data);
    if (!hackathon) return errorResponse(new Error('Failed to create hackathon.'));

    return ok(hackathon, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
