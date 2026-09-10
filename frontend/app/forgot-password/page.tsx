'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Leaf, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    // redirectTo must be the URL Supabase will send the user back to.
    // It must be listed in your Supabase project's "Allowed Redirect URLs".
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'}/reset-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-5 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Leaf className="size-7 text-primary" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold">Check your email</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We sent a password reset link to{' '}
            <span className="font-medium text-foreground">{email}</span>.
            Click the link in the email to set a new password.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Didn't get it? Check your spam folder or{' '}
            <button
              onClick={() => setSent(false)}
              className="font-medium text-primary hover:underline"
            >
              try again
            </button>
            .
          </p>
          <div className="mt-8">
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Link href="/" className="flex items-center justify-center gap-2 text-xl font-semibold">
          <Leaf className="size-5 text-primary" />
          <span className="text-primary">Hack</span>4Good
        </Link>

        <div className="mt-8">
          <h1 className="text-2xl font-semibold">Forgot your password?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          {error && (
            <div role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <label className="grid gap-2 text-sm font-medium">
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </form>
      </div>
    </main>
  )
}
