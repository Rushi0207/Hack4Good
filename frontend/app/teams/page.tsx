'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, PageHeader, SectionCard, StatusPill } from '@/components/app-shell'
import { teamsApi } from '@/lib/api/teams'
import { hackathonsApi } from '@/lib/api/hackathons'
import type { Hackathon, Team } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

// ─── Inline create-team modal ─────────────────────────────────────────────────

function CreateTeamModal({
  hackathons,
  onClose,
  onCreated,
}: {
  hackathons: Hackathon[]
  onClose: () => void
  onCreated: (team: Team) => void
}) {
  const [name, setName]             = useState('')
  const [description, setDescription] = useState('')
  const [hackathonId, setHackathonId] = useState(hackathons[0]?.id ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim())      { setError('Team name is required.');       return }
    if (!hackathonId)      { setError('Please select a hackathon.');   return }

    setSubmitting(true)
    try {
      const team = await teamsApi.create({
        name: name.trim(),
        hackathon_id: hackathonId,
        description: description.trim() || null,
      })
      onCreated(team)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create team.')
      setSubmitting(false)
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create a team</h2>
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

          {/* Hackathon selector */}
          <label className="grid gap-2 text-sm font-medium">
            Hackathon <span className="text-destructive">*</span>
            {hackathons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open hackathons available.{' '}
                <Link href="/hackathons" className="text-primary hover:underline">Browse hackathons</Link>
              </p>
            ) : (
              <select
                value={hackathonId}
                onChange={(e) => setHackathonId(e.target.value)}
                required
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>{h.title}</option>
                ))}
              </select>
            )}
          </label>

          {/* Team name */}
          <label className="grid gap-2 text-sm font-medium">
            Team name <span className="text-destructive">*</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Green Warriors"
              required
              maxLength={100}
              className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          {/* Description */}
          <label className="grid gap-2 text-sm font-medium">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is your team working on?"
              rows={3}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting || hackathons.length === 0} className="flex-1">
              {submitting ? 'Creating…' : 'Create team'}
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

// ─── Teams page ───────────────────────────────────────────────────────────────

export default function TeamsPage() {
  const { user } = useAuth()
  const [teams, setTeams]         = useState<Team[]>([])
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      teamsApi.list().catch(() => [] as Team[]),
      // Only show hackathons that are open for registration
      hackathonsApi.list().catch(() => [] as Hackathon[]),
    ]).then(([t, h]) => {
      setTeams(t)
      // Filter to hackathons where creating a team makes sense
      setHackathons(h.filter((h) => h.status === 'PUBLISHED' || h.status === 'ONGOING'))
    }).catch((err) => setError(err.message ?? 'Failed to load teams.'))
      .finally(() => setLoading(false))
  }, [user])

  function handleCreated(team: Team) {
    setTeams((prev) => [team, ...prev])
    setShowModal(false)
  }

  const createButton = (
    <Button onClick={() => setShowModal(true)}>Create team</Button>
  )

  return (
    <AppShell title="Teams">
      <PageHeader
        eyebrow="Collaborate"
        title="My teams"
        description="Work with people who bring different skills and perspectives."
        action={createButton}
      />

      {loading && <p className="text-sm text-muted-foreground">Loading teams…</p>}
      {error && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {!loading && !error && teams.length === 0 && (
        <EmptyState
          title="No teams yet"
          description="Create a team or join one through a hackathon."
          action={createButton}
        />
      )}

      {!loading && !error && teams.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-3">
          {teams.map((t) => (
            <SectionCard key={t.id} title={t.name} action={<StatusPill tone="success">Active</StatusPill>}>
              {t.description && (
                <p className="text-sm text-muted-foreground">{t.description}</p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                Leader: <span className="font-medium text-foreground">{t.leader_id.slice(0, 8)}…</span>
              </p>
              <Button className="mt-5 w-full" variant="outline" asChild>
                <Link href={`/teams/${t.id}`}>View team</Link>
              </Button>
            </SectionCard>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CreateTeamModal
          hackathons={hackathons}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </AppShell>
  )
}
