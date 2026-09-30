'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, FilterBar, PageHeader } from '@/components/app-shell'
import { HackathonCard } from '@/components/shared/hackathon-card'
import { hackathonsApi } from '@/lib/api/hackathons'
import type { CreateHackathonInput, Hackathon, HackathonStatus } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt(new Date(start))} – ${fmt(new Date(end))}`
}

/** Convert a local date string (YYYY-MM-DD) to an ISO 8601 UTC datetime string */
function toISODateTime(localDate: string): string {
  return new Date(localDate + 'T00:00:00').toISOString()
}

const statusColor: Record<HackathonStatus, string> = {
  PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  ONGOING:   'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  COMPLETED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  DRAFT:     'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
}

const statusDisplayLabel: Record<HackathonStatus, string> = {
  DRAFT: 'Draft', PUBLISHED: 'Open', ONGOING: 'Active',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}

// ─── Create hackathon modal ───────────────────────────────────────────────────

function CreateHackathonModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (h: Hackathon) => void
}) {
  const [title, setTitle]                       = useState('')
  const [description, setDescription]           = useState('')
  const [theme, setTheme]                       = useState('')
  const [location, setLocation]                 = useState('')
  const [rules, setRules]                       = useState('')
  const [registrationDeadline, setRegDeadline]  = useState('')
  const [startDate, setStartDate]               = useState('')
  const [endDate, setEndDate]                   = useState('')
  const [maxTeamSize, setMaxTeamSize]           = useState('5')
  const [submitting, setSubmitting]             = useState(false)
  const [error, setError]                       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Client-side date validation matching backend rules
    if (registrationDeadline > startDate) {
      setError('Registration deadline must be on or before the start date.')
      return
    }
    if (startDate >= endDate) {
      setError('Start date must be before end date.')
      return
    }

    const teamSize = parseInt(maxTeamSize, 10)
    if (isNaN(teamSize) || teamSize < 1 || teamSize > 10) {
      setError('Max team size must be between 1 and 10.')
      return
    }

    setSubmitting(true)
    try {
      const input: CreateHackathonInput = {
        title:                  title.trim(),
        description:            description.trim(),
        theme:                  theme.trim() || null,
        location:               location.trim() || null,
        rules:                  rules.trim() || null,
        registration_deadline:  toISODateTime(registrationDeadline),
        start_date:             toISODateTime(startDate),
        end_date:               toISODateTime(endDate),
        max_team_size:          teamSize,
      }
      const hackathon = await hackathonsApi.create(input)
      onCreated(hackathon)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create hackathon.')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 px-4 py-10"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Host a hackathon</h2>
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
            Title <span className="text-destructive">*</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Green Cities Hackathon 2026"
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
              placeholder="What is this hackathon about? What problems will participants solve?"
              rows={3}
              required
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          {/* Theme + Location */}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Theme <span className="font-normal text-muted-foreground">(optional)</span>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Climate & sustainability"
                className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Location <span className="font-normal text-muted-foreground">(optional)</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Online, or city name"
                className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>

          {/* Dates */}
          <div className="grid gap-5 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">
              Registration deadline <span className="text-destructive">*</span>
              <input
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegDeadline(e.target.value)}
                required
                className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Start date <span className="text-destructive">*</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              End date <span className="text-destructive">*</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>

          {/* Max team size */}
          <label className="grid gap-2 text-sm font-medium">
            Max team size <span className="text-destructive">*</span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(e.target.value)}
                min={1}
                max={10}
                required
                className="h-10 w-24 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">members per team (1–10)</span>
            </div>
          </label>

          {/* Rules */}
          <label className="grid gap-2 text-sm font-medium">
            Rules <span className="font-normal text-muted-foreground">(optional)</span>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Participation rules, judging criteria, code of conduct…"
              rows={3}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          {/* Note: hackathon is created as DRAFT — organizer publishes it later */}
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Hackathon is created as <strong>DRAFT</strong>. Open it to participants by
            updating the status to <strong>Published</strong> from the hackathon detail page.
          </p>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Creating…' : 'Create hackathon'}
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

// ─── Hackathons page ──────────────────────────────────────────────────────────

export default function HackathonsPage() {
  const { profile } = useAuth()
  const [hackathons, setHackathons]   = useState<Hackathon[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [showModal, setShowModal]     = useState(false)

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

  function handleCreated(h: Hackathon) {
    setHackathons((prev) => [h, ...prev])
    setShowModal(false)
  }

  return (
    <AppShell title="Hackathons">
      <PageHeader
        eyebrow="Discover opportunities"
        title="Hackathons"
        description="Find a challenge that matches your skills and the change you want to create."
        action={canHost
          ? <Button onClick={() => setShowModal(true)}>Host a hackathon</Button>
          : undefined
        }
      />
      <FilterBar placeholder="Search hackathons..." value={search} onChange={setSearch} />

      {loading && <p className="mt-8 text-center text-sm text-muted-foreground">Loading hackathons…</p>}
      {error && <div className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title="No hackathons yet"
          description={canHost ? 'Create your first hackathon.' : 'Check back soon — new hackathons are added regularly.'}
          action={canHost ? <Button onClick={() => setShowModal(true)}>Host a hackathon</Button> : undefined}
        />
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

      {showModal && (
        <CreateHackathonModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </AppShell>
  )
}
