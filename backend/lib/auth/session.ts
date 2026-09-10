import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Returns the verified Auth subject ID, or null when no valid session exists.
 *
 * Accepts authentication from two sources (in priority order):
 *  1. Authorization: Bearer <access_token>  — used by the frontend API client
 *     for cross-origin requests (frontend :3001 → backend :3000)
 *  2. Supabase Auth session cookie           — used for same-origin requests
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  // 1. Try Bearer token from Authorization header
  const headerStore = await headers();
  const authHeader = headerStore.get('authorization') ?? headerStore.get('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user?.id) {
        return data.user.id;
      }
    }
  }

  // 2. Fall back to session cookie
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return null;
  }

  return data.claims.sub;
}
