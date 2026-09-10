'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import type { UserRole } from '@/lib/api/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** If provided, user must have one of these roles or they see a 403 screen */
  roles?: UserRole[]
}

/**
 * Client-side auth guard — a second layer after middleware.
 * Middleware handles the server-side redirect; this handles:
 *  - the brief window before middleware cookies are parsed
 *  - role-based access (middleware only checks authentication, not role)
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [user, loading, router, pathname])

  // Still resolving session
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-label="Loading" />
      </div>
    )
  }

  // Not authenticated
  if (!user) return null

  // Role check — profile may still be loading, show spinner until it arrives
  if (roles && roles.length > 0) {
    if (!profile) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-label="Loading profile" />
        </div>
      )
    }

    if (!roles.includes(profile.role)) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
          <p className="text-4xl font-semibold">403</p>
          <p className="text-lg font-medium">Access denied</p>
          <p className="text-sm text-muted-foreground">
            Your role (<span className="font-medium">{profile.role}</span>) does not have
            permission to view this page.
          </p>
          <a href="/dashboard" className="mt-2 text-sm font-medium text-primary hover:underline">
            Go to dashboard
          </a>
        </div>
      )
    }
  }

  return <>{children}</>
}
