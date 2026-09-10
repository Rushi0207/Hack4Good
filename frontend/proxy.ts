import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Routes that require a valid session */
const PROTECTED = [
  '/dashboard',
  '/hackathons',
  '/problems',
  '/teams',
  '/projects',
  '/leaderboard',
  '/notifications',
  '/profile',
  '/settings',
  '/admin',
  '/judge',
  '/organizer',
  '/impact',
]

/** Routes only for guests — redirect logged-in users to dashboard */
const GUEST_ONLY = ['/login', '/register']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Build a response we can attach refreshed cookies to
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refreshes session and persists updated cookies
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )
  const isGuestOnly = GUEST_ONLY.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isGuestOnly && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static assets.
     * API routes are excluded — those go to the backend, not this app.
     */
    '/((?!_next/static|_next/image|favicon|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
