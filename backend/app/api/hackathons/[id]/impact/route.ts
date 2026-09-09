import { type NextRequest } from 'next/server';

import { errorResponse, notFound, ok } from '@/lib/api/response';
import { listImpactByHackathon } from '@/services/impact.service';
import { getHackathonById } from '@/services/hackathon.service';

type Params = { params: Promise<{ id: string }> };

/** GET /api/hackathons/:id/impact — public */
export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const hackathon = await getHackathonById(id);
    if (!hackathon) return notFound('Hackathon not found.');

    const records = await listImpactByHackathon(id);
    return ok(records);
  } catch (err) {
    return errorResponse(err);
  }
}
