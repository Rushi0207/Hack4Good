import { type NextRequest } from 'next/server';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { badRequest, errorResponse, notFound, ok } from '@/lib/api/response';
import { getProfileById, updateProfile } from '@/services/profile.service';
import { updateProfileSchema } from '@/types/profile';

/**
 * GET /api/profiles/me
 * Returns the authenticated user's full profile.
 */
export async function GET(): Promise<Response> {
  try {
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    const profile = await getProfileById(actor.id);

    if (!profile) {
      return notFound('Profile not found.');
    }

    return ok(profile);
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * PATCH /api/profiles/me
 * Partially updates the authenticated user's profile.
 * Role changes are not permitted through this endpoint.
 */
export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest('Request body must be valid JSON.');
    }

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    const updated = await updateProfile(actor.id, parsed.data);
    if (!updated) {
      return notFound('Profile not found.');
    }

    return ok(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
