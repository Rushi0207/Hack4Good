'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, FilterBar, PageHeader } from '@/components/app-shell'
import { ProblemCard } from '@/components/shared/problem-card'
import { problemsApi } from '@/lib/api/problems'
import type { Problem } from '@/lib/api/types'
import { useAuth, getInitials } from '@/context/auth-context'

export default function ProblemsPage() {
  const { user } = useAuth()
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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

  return (
    <AppShell title="Problems">
      <PageHeader
        eyebrow="Community voice"
        title="Problems worth solving"
        description="Explore real challenges submitted by communities around the world."
        action={user ? <Button>Submit a problem</Button> : undefined}
      />
      <FilterBar placeholder="Search community problems..." value={search} onChange={setSearch} />

      {loading && <p className="mt-8 text-center text-sm text-muted-foreground">Loading problems…</p>}
      {error && <div className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="No problems found" description="Be the first to submit a problem your community is facing." />
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
              votes={0}                         // vote_count not returned by API
              avatar={getInitials(p.created_by.slice(0, 8))}
              creator={p.created_by}
            />
          ))}
        </div>
      )}
    </AppShell>
  )
}
