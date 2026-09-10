'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, FilterBar, PageHeader } from '@/components/app-shell'
import { HackathonCard } from '@/components/shared/hackathon-card'
import { hackathonsApi } from '@/lib/api/hackathons'
import type { Hackathon, HackathonStatus } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

function formatDateRange(start: string, end: string): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt(new Date(start))} – ${fmt(new Date(end))}`
}

const statusColor: Record<HackathonStatus, string> = {
  PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  ONGOING:   'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  COMPLETED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  DRAFT:     'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
}

const statusDisplayLabel: Record<HackathonStatus, string> = {
  DRAFT:     'Draft',
  PUBLISHED: 'Open',
  ONGOING:   'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export default function HackathonsPage() {
  const { profile } = useAuth()
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    hackathonsApi.list()
      .then(setHackathons)
      .catch((err) => setError(err.message ?? 'Failed to load hackathons.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = hackathons.filter((h) =>
    h.title.toLowerCase().includes(search.toLowerCase()),
  )

  const canHost = profile?.role === 'ORGANIZER' || profile?.role === 'ADMIN'

  return (
    <AppShell title="Hackathons">
      <PageHeader
        eyebrow="Discover opportunities"
        title="Hackathons"
        description="Find a challenge that matches your skills and the change you want to create."
        action={canHost ? <Button>Host a hackathon</Button> : undefined}
      />
      <FilterBar placeholder="Search hackathons..." value={search} onChange={setSearch} />

      {loading && <p className="mt-8 text-center text-sm text-muted-foreground">Loading hackathons…</p>}
      {error && <div className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="No hackathons found" description="Check back soon — new hackathons are added regularly." />
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {filtered.map((h) => (
            <HackathonCard
              key={h.id}
              id={h.id}
              title={h.title}
              tag={h.theme ?? 'Hackathon'}
              date={formatDateRange(h.start_date, h.end_date)}
              place={h.location ?? 'Online'}
              image="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80"
              color={statusColor[h.status]}
              status={statusDisplayLabel[h.status]}
            />
          ))}
        </div>
      )}
    </AppShell>
  )
}
