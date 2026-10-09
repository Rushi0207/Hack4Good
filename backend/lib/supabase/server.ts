import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

import { getSupabaseEnvironment } from './config';

/**
 * Creates a request-scoped Supabase client.
 *
 * Forwards `Authorization: Bearer` when present so PostgREST RLS sees
 * `auth.uid()` for cross-origin API calls (frontend :3001 → backend :3000).
 * Cookie session still works for same-origin requests.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } =
    getSupabaseEnvironment();

  const authHeader =
    headerStore.get('authorization') ?? headerStore.get('Authorization');
  const globalHeaders: Record<string, string> = {};
  if (authHeader?.startsWith('Bearer ')) {
    globalHeaders['Authorization'] = authHeader;
  }

  return createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      global: { headers: globalHeaders },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Parameters<typeof cookieStore.set>[2];
          }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Route handlers can persist refreshed auth cookies; Server Components cannot.
          }
        },
      },
    },
  );
}
