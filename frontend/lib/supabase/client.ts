import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client.
 * Use this inside Client Components and event handlers.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
