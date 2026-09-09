import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
  requireRoleAction,
} from '@/lib/auth/authorization';
import { errorResponse, ok } from '@/lib/api/response';
import { getJudgeProjects } from '@/services/evaluation.service';

/** GET /api/judges/me/projects — JUDGE or ADMIN */
export async function GET(): Promise<Response> {
  try {
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    requireRoleAction(actor, 'EVALUATE_ASSIGNED_PROJECT');

    const projects = await getJudgeProjects(actor.id);
    return ok(projects);
  } catch (err) {
    return errorResponse(err);
  }
}
