import { type NextRequest } from 'next/server';

import {
  getAuthenticatedActor,
  requireAuthenticatedActor,
} from '@/lib/auth/authorization';
import { errorResponse, ok } from '@/lib/api/response';
import { deleteNotification } from '@/services/notification.service';

type Params = { params: Promise<{ id: string }> };

/** DELETE /api/notifications/:id */
export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const actor = requireAuthenticatedActor(await getAuthenticatedActor());
    await deleteNotification(id, actor.id);
    return ok({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
