import { type NextRequest } from 'next/server';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { errorResponse, notFound, ok } from '@/lib/api/response';
import { markAsRead } from '@/services/notification.service';

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/notifications/:id/read */
export async function PATCH(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());

    const updated = await markAsRead(id, actor.id);
    if (!updated) return notFound('Notification not found.');
    return ok(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
