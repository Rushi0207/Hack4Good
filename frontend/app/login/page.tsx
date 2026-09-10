'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(signInError)
      setLoading(false)
      return
    }

    router.push(next)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Link href="/" className="flex items-center justify-center gap-2 text-xl font-semibold">
          <Leaf className="size-5 text-primary" />
          <span className="text-primary">Hack</span>4Good
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue your impact journey.</p>
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

          <label className="grid gap-2 text-sm font-medium">
            Password
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-primary">Forgot password?</Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Log in'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            New to Hack4Good?{' '}
            <Link href="/register" className="font-medium text-primary">Create an account</Link>
          </p>
        </form>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
