import { type NextRequest } from 'next/server';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { conflict, errorResponse, ok } from '@/lib/api/response';
import { respondToInvitation } from '@/services/team.service';

type Params = { params: Promise<{ id: string }> };

/** POST /api/invitations/:id/accept */
export async function POST(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const result = await respondToInvitation(id, actor.id, true);
    if (result.error) return conflict(result.error);

    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
