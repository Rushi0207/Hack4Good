import { createSupabaseServerClient } from '@/lib/supabase/server';

/** Returns the verified Auth subject ID, or null when no valid session exists. */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) {
    return null;
  }

  return data.claims.sub;
}
