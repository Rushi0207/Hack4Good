'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, MapPin, Settings, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, SectionCard, StatCard, StatusPill } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { hackathonsApi } from '@/lib/api/hackathons'
import { problemsApi } from '@/lib/api/problems'
import { teamsApi } from '@/lib/api/teams'
import type { Hackathon, HackathonStatus, Problem, Team } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<HackathonStatus, string> = {
  DRAFT: 'Draft', PUBLISHED: 'Open', ONGOING: 'Active',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}
const STATUS_TONE: Record<HackathonStatus, 'success' | 'warning' | 'default'> = {
  PUBLISHED: 'success', ONGOING: 'success', DRAFT: 'warning',
  COMPLETED: 'default', CANCELLED: 'default',
}

/** Which statuses an organizer can move TO from the current one */
const ALLOWED_TRANSITIONS: Record<HackathonStatus, HackathonStatus[]> = {
  DRAFT:     ['PUBLISHED', 'CANCELLED'],
  PUBLISHED: ['ONGOING', 'CANCELLED'],
  ONGOING:   ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

const TRANSITION_LABEL: Record<HackathonStatus, string> = {
  PUBLISHED: '🟢 Publish (open to participants)',
  ONGOING:   '▶️ Mark as active',
  COMPLETED: '✅ Mark as completed',
  CANCELLED: '🚫 Cancel hackathon',
  DRAFT:     'Move back to draft',
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function toDateInput(iso: string): string {
  return iso.slice(0, 10) // YYYY-MM-DD
}
function toISODateTime(date: string): string {
  return new Date(date + 'T00:00:00').toISOString()
}

// ─── Manage panel (organizer/admin only) ─────────────────────────────────────

function ManagePanel({
  hackathon,
  onUpdated,
}: {
  hackathon: Hackathon
  onUpdated: (h: Hackathon) => void
}) {
  const [open, setOpen]             = useState(false)
  const [updating, setUpdating]     = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  // Edit form state
  const [editMode, setEditMode]         = useState(false)
  const [title, setTitle]               = useState(hackathon.title)
  const [description, setDescription]   = useState(hackathon.description)
  const [theme, setTheme]               = useState(hackathon.theme ?? '')
  const [location, setLocation]         = useState(hackathon.location ?? '')
  const [rules, setRules]               = useState(hackathon.rules ?? '')
  const [regDeadline, setRegDeadline]   = useState(toDateInput(hackathon.registration_deadline))
  const [startDate, setStartDate]       = useState(toDateInput(hackathon.start_date))
  const [endDate, setEndDate]           = useState(toDateInput(hackathon.end_date))
  const [maxTeamSize, setMaxTeamSize]   = useState(String(hackathon.max_team_size))
  const [editError, setEditError]       = useState<string | null>(null)
  const [saving, setSaving]             = useState(false)

  async function handleStatusChange(newStatus: HackathonStatus) {
    setUpdating(true); setStatusError(null)
    try {
      const updated = await hackathonsApi.update(hackathon.id, { status: newStatus })
      onUpdated(updated)
    } catch (err: unknown) {
      setStatusError(err instanceof Error ? err.message : 'Failed to update status.')
    } finally {
      setUpdating(false)
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    setEditError(null)
    if (regDeadline > startDate) { setEditError('Registration deadline must be ≤ start date.'); return }
    if (startDate >= endDate)    { setEditError('Start date must be before end date.');         return }
    const size = parseInt(maxTeamSize, 10)
    if (isNaN(size) || size < 1 || size > 10) { setEditError('Max team size must be 1–10.'); return }

    setSaving(true)
    try {
      const updated = await hackathonsApi.update(hackathon.id, {
        title:                 title.trim(),
        description:           description.trim(),
        theme:                 theme.trim() || null,
        location:              location.trim() || null,
        rules:                 rules.trim() || null,
        registration_deadline: toISODateTime(regDeadline),
        start_date:            toISODateTime(startDate),
        end_date:              toISODateTime(endDate),
        max_team_size:         size,
      })
      onUpdated(updated)
      setEditMode(false)
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const transitions = ALLOWED_TRANSITIONS[hackathon.status]

  return (
    <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
      {/* Toggle header */}
      <button
        className="flex w-full items-center justify-between gap-3 text-sm font-semibold"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2">
          <Settings className="size-4" /> Organizer controls
        </span>
        <span className="text-muted-foreground text-xs">{open ? 'Hide ▲' : 'Show ▼'}</span>
      </button>

      {open && (
        <div className="mt-4 grid gap-5">

          {/* Status transitions */}
          <div>
            <p className="mb-2 text-sm font-medium">
              Current status: <StatusPill tone={STATUS_TONE[hackathon.status]}>{STATUS_LABEL[hackathon.status]}</StatusPill>
            </p>

            {statusError && (
              <p className="mb-2 text-sm text-destructive">{statusError}</p>
            )}

            {transitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No further status changes are available.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {transitions.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === 'CANCELLED' ? 'outline' : 'default'}
                    disabled={updating}
                    onClick={() => handleStatusChange(s)}
                  >
                    {updating ? 'Updating…' : TRANSITION_LABEL[s]}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Edit details */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Edit details</p>
              {!editMode && (
                <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              )}
            </div>

            {editMode && (
              <form onSubmit={handleSaveEdit} className="mt-4 grid gap-4">
                {editError && (
                  <div role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {editError}
                  </div>
                )}

                <label className="grid gap-1.5 text-sm font-medium">
                  Title
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    required maxLength={300}
                    className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
                </label>

                <label className="grid gap-1.5 text-sm font-medium">
                  Description
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    required rows={3}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring" />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-medium">
                    Theme
                    <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)}
                      placeholder="optional"
                      className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium">
                    Location
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                      placeholder="optional"
                      className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="grid gap-1.5 text-sm font-medium">
                    Reg. deadline
                    <input type="date" value={regDeadline} onChange={(e) => setRegDeadline(e.target.value)}
                      required
                      className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium">
                    Start date
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium">
                    End date
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
                  </label>
                </div>

                <label className="grid gap-1.5 text-sm font-medium">
                  Max team size (1–10)
                  <input type="number" min={1} max={10} value={maxTeamSize}
                    onChange={(e) => setMaxTeamSize(e.target.value)} required
                    className="h-10 w-24 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
                </label>

                <label className="grid gap-1.5 text-sm font-medium">
                  Rules
                  <textarea value={rules} onChange={(e) => setRules(e.target.value)}
                    placeholder="optional" rows={3}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring" />
                </label>

                <div className="flex gap-3">
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => { setEditMode(false); setEditError(null) }}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Detail page ──────────────────────────────────────────────────────────────

function HackathonDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { profile } = useAuth()

  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [problems, setProblems]   = useState<Problem[]>([])
  const [teams, setTeams]         = useState<Team[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered]   = useState(false)

  useEffect(() => {
    Promise.all([
      hackathonsApi.get(id),
      hackathonsApi.listProblems(id).catch(() => [] as Problem[]),
      teamsApi.list(id).catch(() => [] as Team[]),
    ]).then(([h, p, t]) => {
      setHackathon(h); setProblems(p); setTeams(t)
    }).catch((err) => setError(err.message ?? 'Failed to load hackathon.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleRegister() {
    if (!hackathon) return
    setRegistering(true)
    try {
      if (registered) {
        await hackathonsApi.unregister(hackathon.id)
        setRegistered(false)
      } else {
        await hackathonsApi.register(hackathon.id)
        setRegistered(true)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setRegistering(false)
    }
  }

  if (loading) return (
    <AppShell title="Hackathon">
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </AppShell>
  )

  if (error || !hackathon) return (
    <AppShell title="Hackathon">
      <EmptyState title="Hackathon not found"
        description={error ?? 'This hackathon does not exist.'}
        action={<Button onClick={() => router.push('/hackathons')}>Back to hackathons</Button>} />
    </AppShell>
  )

  const isManager  = profile?.role === 'ORGANIZER' || profile?.role === 'ADMIN'
  const isParticipant = profile?.role === 'PARTICIPANT'
  const canRegister   = isParticipant && hackathon.status === 'PUBLISHED'

  return (
    <AppShell title={hackathon.title}>
      <div className="mb-6">
        <Link href="/hackathons" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to hackathons
        </Link>
      </div>

      {/* Organizer controls — visible to manager/admin only */}
      {isManager && (
        <ManagePanel hackathon={hackathon} onUpdated={setHackathon} />
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{hackathon.title}</h1>
            <StatusPill tone={STATUS_TONE[hackathon.status] ?? 'default'}>
              {STATUS_LABEL[hackathon.status] ?? hackathon.status}
            </StatusPill>
          </div>
          {hackathon.theme && <p className="mt-2 text-muted-foreground">{hackathon.theme}</p>}
        </div>
        {canRegister && (
          <Button onClick={handleRegister} disabled={registering}>
            {registering ? 'Processing…' : registered ? 'Unregister' : 'Register now'}
          </Button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registration deadline" value={fmt(hackathon.registration_deadline)} detail="Sign up by this date" />
        <StatCard label="Start date"  value={fmt(hackathon.start_date)}  detail="Hacking begins" />
        <StatCard label="End date"    value={fmt(hackathon.end_date)}    detail="Submissions close" />
        <StatCard label="Max team size" value={String(hackathon.max_team_size)} detail="Members per team" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <div className="grid gap-6">
          {/* About */}
          <SectionCard title="About this hackathon">
            <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{hackathon.description}</p>
            {hackathon.rules && (
              <>
                <h4 className="mt-5 font-semibold">Rules</h4>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{hackathon.rules}</p>
              </>
            )}
          </SectionCard>

          {/* Problem statements */}
          <SectionCard title={`Problem statements (${problems.length})`}>
            {problems.length === 0
              ? <p className="text-sm text-muted-foreground">No problems linked yet.</p>
              : (
                <div className="grid gap-4">
                  {problems.map((p) => (
                    <Link key={p.id} href={`/problems/${p.id}`}
                      className="rounded-lg border border-border p-4 hover:bg-muted/50">
                      <p className="font-medium">{p.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                        {p.category && <span>{p.category}</span>}
                        {p.location && <span className="flex items-center gap-1"><MapPin className="size-3" />{p.location}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )
            }
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="grid gap-6 self-start">
          <SectionCard title="Details">
            <div className="grid gap-3 text-sm">
              {hackathon.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4 shrink-0" /><span>{hackathon.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-4 shrink-0" />
                <span>{fmt(hackathon.start_date)} – {fmt(hackathon.end_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4 shrink-0" />
                <span>Max {hackathon.max_team_size} per team</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title={`Teams (${teams.length})`}>
            {teams.length === 0
              ? <p className="text-sm text-muted-foreground">No teams yet.</p>
              : (
                <div className="grid gap-2">
                  {teams.slice(0, 8).map((t) => (
                    <Link key={t.id} href={`/teams/${t.id}`}
                      className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-muted">
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {t.name.slice(0, 2).toUpperCase()}
                      </span>
                      {t.name}
                    </Link>
                  ))}
                  {teams.length > 8 && <p className="text-xs text-muted-foreground">+{teams.length - 8} more</p>}
                </div>
              )
            }
          </SectionCard>
        </div>
      </div>
    </AppShell>
  )
}

export default function HackathonDetailPage() {
  return <ProtectedRoute><HackathonDetail /></ProtectedRoute>
}
