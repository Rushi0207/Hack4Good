'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, MessageCircle, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, SectionCard, StatusPill } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { problemsApi } from '@/lib/api/problems'
import type { Comment, Problem } from '@/lib/api/types'
import { useAuth, getInitials } from '@/context/auth-context'

const STATUS_TONE: Record<string, 'success' | 'warning' | 'default'> = {
  OPEN: 'success', IN_PROGRESS: 'warning', SELECTED: 'warning',
  SOLVED: 'default', CLOSED: 'default',
}

function ProblemDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [problem, setProblem]   = useState<Problem | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      problemsApi.get(id),
      problemsApi.listComments(id).catch(() => [] as Comment[]),
    ]).then(([p, c]) => { setProblem(p); setComments(c) })
      .catch((err) => setError(err.message ?? 'Failed to load problem.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleVote() {
    try {
      if (hasVoted) { await problemsApi.unvote(id); setHasVoted(false) }
      else          { await problemsApi.vote(id);   setHasVoted(true)  }
    } catch { /* ignore */ }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const c = await problemsApi.addComment(id, newComment.trim())
      setComments((prev) => [...prev, c])
      setNewComment('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post comment.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <AppShell title="Problem">
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </AppShell>
  )

  if (error || !problem) return (
    <AppShell title="Problem">
      <EmptyState title="Problem not found" description={error ?? 'This problem does not exist.'}
        action={<Button onClick={() => router.push('/problems')}>Back to problems</Button>} />
    </AppShell>
  )

  return (
    <AppShell title={problem.title}>
      <div className="mb-6">
        <Link href="/problems" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to problems
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{problem.title}</h1>
            <StatusPill tone={STATUS_TONE[problem.status] ?? 'default'}>{problem.status.replace('_', ' ')}</StatusPill>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {problem.category && <span className="rounded-full bg-muted px-2.5 py-1">{problem.category}</span>}
            {problem.location && (
              <span className="flex items-center gap-1.5"><MapPin className="size-4" />{problem.location}</span>
            )}
          </div>
        </div>
        {user && (
          <Button variant={hasVoted ? 'outline' : 'default'} onClick={handleVote}>
            <ThumbsUp className="size-4" />
            {hasVoted ? 'Supported' : 'Support this'}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <div className="grid gap-6">
          {/* Description */}
          <SectionCard title="Problem description">
            <p className="text-sm leading-7 text-muted-foreground whitespace-pre-line">{problem.description}</p>
          </SectionCard>

          {/* Expected impact */}
          {problem.expected_impact && (
            <SectionCard title="Expected impact">
              <p className="text-sm leading-7 text-muted-foreground whitespace-pre-line">{problem.expected_impact}</p>
            </SectionCard>
          )}

          {/* Comments */}
          <SectionCard title={`Comments (${comments.length})`}
            action={<MessageCircle className="size-4 text-muted-foreground" />}>
            <div className="grid gap-4">
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(c.user_id.slice(0, 4))}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm">{c.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {user && (
              <form onSubmit={handleComment} className="mt-5 flex gap-3">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment…"
                  className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" size="sm" disabled={submitting || !newComment.trim()}>
                  {submitting ? '…' : 'Post'}
                </Button>
              </form>
            )}
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="grid gap-6 self-start">
          <SectionCard title="Details">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusPill tone={STATUS_TONE[problem.status] ?? 'default'}>{problem.status.replace('_', ' ')}</StatusPill>
              </div>
              {problem.category && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{problem.category}</span>
                </div>
              )}
              {problem.location && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{problem.location}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium">{new Date(problem.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  )
}

export default function ProblemDetailPage() {
  return <ProtectedRoute><ProblemDetail /></ProtectedRoute>
}
