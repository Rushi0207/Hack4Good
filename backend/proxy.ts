import { type NextRequest, NextResponse } from 'next/server';
import { updateSupabaseSession } from '@/lib/supabase/proxy';

/**
 * Next.js 16 renamed middleware.ts → proxy.ts.
 * This file handles two concerns:
 *  1. CORS headers for cross-origin requests from the frontend (dev: :3001)
 *  2. Supabase session cookie refresh on every API request
 */

const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  // Add your production frontend URL here:
  // 'https://your-frontend-domain.com',
];

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

export async function proxy(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  // Respond to CORS preflight immediately — before any auth work
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: isAllowed ? corsHeaders(origin) : {},
    });
  }

  // Refresh Supabase session cookies
  const response = await updateSupabaseSession(request);

  // Attach CORS headers to the real response
  if (isAllowed) {
    Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
