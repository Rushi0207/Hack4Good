import { createBrowserClient } from '@supabase/ssr';

import { getSupabaseEnvironment } from './config';

/** Creates a browser-scoped Supabase client for future client integrations. */
export function createSupabaseBrowserClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } =
    getSupabaseEnvironment();

  return createBrowserClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
