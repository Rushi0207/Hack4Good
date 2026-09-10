'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, SectionCard, StatCard, StatusPill } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { hackathonsApi } from '@/lib/api/hackathons'
import { problemsApi } from '@/lib/api/problems'
import { teamsApi } from '@/lib/api/teams'
import type { Hackathon, Problem, Team } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', PUBLISHED: 'Open', ONGOING: 'Active',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}
const STATUS_TONE: Record<string, 'success' | 'warning' | 'default'> = {
  PUBLISHED: 'success', ONGOING: 'success', DRAFT: 'warning',
  COMPLETED: 'default', CANCELLED: 'default',
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

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
      <EmptyState title="Hackathon not found" description={error ?? 'This hackathon does not exist.'}
        action={<Button onClick={() => router.push('/hackathons')}>Back to hackathons</Button>} />
    </AppShell>
  )

  const isParticipant = profile?.role === 'PARTICIPANT'
  const canRegister   = isParticipant && (hackathon.status === 'PUBLISHED')

  return (
    <AppShell title={hackathon.title}>
      <div className="mb-6">
        <Link href="/hackathons" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to hackathons
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-3">
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

      {/* Key info */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registration deadline" value={fmt(hackathon.registration_deadline)} detail="Sign up by this date" />
        <StatCard label="Start date"  value={fmt(hackathon.start_date)}  detail="Hacking begins" />
        <StatCard label="End date"    value={fmt(hackathon.end_date)}    detail="Submissions close" />
        <StatCard label="Max team size" value={String(hackathon.max_team_size)} detail="Members per team" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        {/* Main info */}
        <div className="grid gap-6">
          <SectionCard title="About this hackathon">
            <p className="text-sm leading-7 text-muted-foreground whitespace-pre-line">{hackathon.description}</p>
            {hackathon.rules && (
              <>
                <h4 className="mt-5 font-semibold">Rules</h4>
                <p className="mt-2 text-sm leading-7 text-muted-foreground whitespace-pre-line">{hackathon.rules}</p>
              </>
            )}
          </SectionCard>

          {/* Problems */}
          <SectionCard title={`Problem statements (${problems.length})`}>
            {problems.length === 0
              ? <p className="text-sm text-muted-foreground">No problems linked yet.</p>
              : (
                <div className="grid gap-4">
                  {problems.map((p) => (
                    <Link key={p.id} href={`/problems/${p.id}`}
                      className="rounded-lg border border-border p-4 hover:bg-muted/50">
                      <p className="font-medium">{p.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
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
                  <MapPin className="size-4 shrink-0" />
                  <span>{hackathon.location}</span>
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
                  {teams.length > 8 && (
                    <p className="text-xs text-muted-foreground">+{teams.length - 8} more</p>
                  )}
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
