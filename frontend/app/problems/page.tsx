'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, FilterBar, PageHeader } from '@/components/app-shell'
import { ProblemCard } from '@/components/shared/problem-card'
import { problemsApi } from '@/lib/api/problems'
import type { CreateProblemInput, Problem } from '@/lib/api/types'
import { useAuth, getInitials } from '@/context/auth-context'

// ─── Submit problem modal ─────────────────────────────────────────────────────

function SubmitProblemModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (p: Problem) => void
}) {
  const [title, setTitle]                   = useState('')
  const [description, setDescription]       = useState('')
  const [category, setCategory]             = useState('')
  const [location, setLocation]             = useState('')
  const [expectedImpact, setExpectedImpact] = useState('')
  const [submitting, setSubmitting]         = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const input: CreateProblemInput = {
        title:           title.trim(),
        description:     description.trim(),
        category:        category.trim() || null,
        location:        location.trim() || null,
        expected_impact: expectedImpact.trim() || null,
      }
      const problem = await problemsApi.create(input)
      onCreated(problem)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit problem.')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 px-4 py-10"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Submit a problem</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          {error && (
            <div role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Title */}
          <label className="grid gap-2 text-sm font-medium">
            Problem title <span className="text-destructive">*</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Waste Segregation in Colleges"
              required
              maxLength={300}
              className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          {/* Description */}
          <label className="grid gap-2 text-sm font-medium">
            Description <span className="text-destructive">*</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem in detail. What is happening? Who is affected? What causes it?"
              rows={4}
              required
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          {/* Category + Location */}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Category <span className="font-normal text-muted-foreground">(optional)</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a category…</option>
                {[
                  'Environment', 'Education', 'Health', 'Infrastructure',
                  'Community', 'Technology', 'Economy', 'Wellbeing', 'Other',
                ].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Location <span className="font-normal text-muted-foreground">(optional)</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>

          {/* Expected impact */}
          <label className="grid gap-2 text-sm font-medium">
            Expected impact <span className="font-normal text-muted-foreground">(optional)</span>
            <textarea
              value={expectedImpact}
              onChange={(e) => setExpectedImpact(e.target.value)}
              placeholder="If this problem were solved, what would change? How many people would benefit?"
              rows={3}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Submitting…' : 'Submit problem'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Problems page ────────────────────────────────────────────────────────────

export default function ProblemsPage() {
  const { user, profile } = useAuth()
  const [problems, setProblems]   = useState<Problem[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    problemsApi.list()
      .then(setProblems)
      .catch((err) => setError(err.message ?? 'Failed to load problems.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = problems.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  // Only PARTICIPANT and ADMIN can submit problems (backend enforces this too)
  const canSubmit = user && (profile?.role === 'PARTICIPANT' || profile?.role === 'ADMIN')

  function handleCreated(problem: Problem) {
    setProblems((prev) => [problem, ...prev])
    setShowModal(false)
  }

  const submitButton = canSubmit
    ? <Button onClick={() => setShowModal(true)}>Submit a problem</Button>
    : undefined

  return (
    <AppShell title="Problems">
      <PageHeader
        eyebrow="Community voice"
        title="Problems worth solving"
        description="Explore real challenges submitted by communities around the world."
        action={submitButton}
      />
      <FilterBar placeholder="Search community problems..." value={search} onChange={setSearch} />

      {loading && <p className="mt-8 text-center text-sm text-muted-foreground">Loading problems…</p>}
      {error && (
        <div className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title="No problems found"
          description="Be the first to submit a problem your community is facing."
          action={submitButton}
        />
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="mt-6 grid gap-4">
          {filtered.map((p) => (
            <ProblemCard
              key={p.id}
              id={p.id}
              title={p.title}
              category={p.category ?? 'General'}
              place={p.location ?? 'Unknown location'}
              votes={0}
              avatar={getInitials(p.created_by.slice(0, 8))}
              creator={p.created_by}
            />
          ))}
        </div>
      )}

      {showModal && (
        <SubmitProblemModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </AppShell>
  )
}
