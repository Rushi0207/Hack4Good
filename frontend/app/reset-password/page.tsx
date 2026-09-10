'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

/**
 * Supabase sends the user to this page after they click the reset link.
 * The URL looks like:
 *   /reset-password#access_token=...&type=recovery
 *
 * @supabase/ssr automatically parses the hash and creates a session,
 * so we just need to call updateUser() with the new password.
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [validToken, setValidToken] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verify there is an active recovery session when the page mounts
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setValidToken(true)
      }
      setChecking(false)
    })

    // Also check existing session (in case the event already fired)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setValidToken(true)
      }
      setChecking(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setDone(true)
    // Redirect to dashboard after a short delay
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  // Still checking session
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Invalid / expired link
  if (!validToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-5 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="mt-6 text-2xl font-semibold">Link expired or invalid</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This password reset link is no longer valid. Links expire after 1 hour.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  // Success
  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-5 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold">Password updated</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your password has been changed. Redirecting you to the dashboard…
          </p>
        </div>
      </main>
    )
  }

  // Main form
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Link href="/" className="flex items-center justify-center gap-2 text-xl font-semibold">
          <Leaf className="size-5 text-primary" />
          <span className="text-primary">Hack</span>4Good
        </Link>

        <div className="mt-8">
          <h1 className="text-2xl font-semibold">Set a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a strong password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          {error && (
            <div role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <label className="grid gap-2 text-sm font-medium">
            New password
            <input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Confirm new password
            <input
              type="password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          {/* Password strength hint */}
          {password.length > 0 && (
            <div className="grid gap-1.5">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    password.length < 8
                      ? 'w-1/4 bg-destructive'
                      : password.length < 12
                      ? 'w-2/4 bg-amber-500'
                      : 'w-full bg-emerald-500'
                  }`}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {password.length < 8
                  ? 'Too short'
                  : password.length < 12
                  ? 'Good — consider making it longer'
                  : 'Strong password'}
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>
    </main>
  )
}
