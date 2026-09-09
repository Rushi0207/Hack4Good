import { type NextRequest } from 'next/server';
import { z } from 'zod';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
  requireRoleAction,
} from '@/lib/auth/authorization';
import { badRequest, conflict, errorResponse, ok } from '@/lib/api/response';
import { createProject, listProjects } from '@/services/project.service';
import { createProjectSchema } from '@/types/project';

/** GET /api/projects — public, ?team_id= or ?hackathon_id= */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const p = request.nextUrl.searchParams;
    const query = z.object({
      team_id: z.uuid().optional(),
      hackathon_id: z.uuid().optional(),
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      offset: z.coerce.number().int().min(0).optional().default(0),
    }).safeParse(Object.fromEntries(p));

    if (!query.success) return errorResponse(query.error);
    const projects = await listProjects(query.data);
    return ok(projects);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/projects — PARTICIPANT or ADMIN (must be team member) */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    requireRoleAction(actor, 'SUBMIT_PROJECT');

    let body: unknown;
    try { body = await request.json(); } catch { return badRequest('Request body must be valid JSON.'); }

    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);

    const result = await createProject(parsed.data);
    if (result.error) return conflict(result.error);
    if (!result.data) return errorResponse(new Error('Failed to create project.'));

    return ok(result.data, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
