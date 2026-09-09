import type { NextRequest } from 'next/server';

import { updateSupabaseSession } from '@/lib/supabase/proxy';

/**
 * Runs on every request to refresh the Supabase Auth session cookie so
 * server components and route handlers always receive a valid token.
 */
export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static assets so auth
     * cookies are refreshed on every API call.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
