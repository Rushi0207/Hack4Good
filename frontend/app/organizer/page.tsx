'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, PageHeader, SectionCard, StatCard, StatusPill } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { hackathonsApi } from '@/lib/api/hackathons'
import { teamsApi } from '@/lib/api/teams'
import { projectsApi } from '@/lib/api/projects'
import type { Hackathon, Team, Project } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', PUBLISHED: 'Registration open',
  ONGOING: 'Submissions open', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}
const STATUS_TONE: Record<string, 'success' | 'warning' | 'default'> = {
  PUBLISHED: 'success', ONGOING: 'success', DRAFT: 'warning',
  COMPLETED: 'default', CANCELLED: 'default',
}

function OrganizerContent() {
  const { user } = useAuth()
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [teams, setTeams]           = useState<Team[]>([])
  const [projects, setProjects]     = useState<Project[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      hackathonsApi.list().catch(() => [] as Hackathon[]),
      teamsApi.list().catch(() => [] as Team[]),
      projectsApi.list().catch(() => [] as Project[]),
    ]).then(([h, t, p]) => {
      setHackathons(h); setTeams(t); setProjects(p)
    }).catch((err) => setError(err.message ?? 'Failed to load data.'))
      .finally(() => setLoading(false))
  }, [user])

  const submitted = projects.filter((p) => p.status === 'SUBMITTED')
  const active    = hackathons.filter((h) => h.status === 'PUBLISHED' || h.status === 'ONGOING')

  return (
    <AppShell title="Organizer dashboard">
      <PageHeader
        eyebrow="Manage your programs"
        title="Organizer dashboard"
        description="Keep hackathons, teams, judges, and results moving in one place."
        action={<Button asChild><Link href="/hackathons">Manage hackathons</Link></Button>}
      />

      {error && <div className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Hackathons"   value={loading ? '…' : String(hackathons.length)} detail="All time" />
        <StatCard label="Active"       value={loading ? '…' : String(active.length)}     detail="Open or ongoing" />
        <StatCard label="Teams"        value={loading ? '…' : String(teams.length)}      detail="Registered teams" />
        <StatCard label="Projects"     value={loading ? '…' : String(projects.length)}   detail="Created" />
        <StatCard label="Submitted"    value={loading ? '…' : String(submitted.length)}  detail="Ready for evaluation" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* My hackathons */}
        <SectionCard title="My hackathons"
          action={<Button variant="ghost" size="sm" asChild><Link href="/hackathons">View all</Link></Button>}>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : hackathons.length === 0
            ? <EmptyState title="No hackathons yet" description="Create your first hackathon." />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      {['Hackathon', 'Teams', 'Projects', 'Status'].map((h) => (
                        <th key={h} className="px-3 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hackathons.slice(0, 8).map((h) => {
                      const hTeams    = teams.filter((t) => t.hackathon_id === h.id)
                      const hProjects = projects.filter((p) =>
                        hTeams.some((t) => t.id === p.team_id))
                      return (
                        <tr key={h.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-3">
                            <Link href={`/hackathons/${h.id}`} className="font-medium hover:text-primary">
                              {h.title}
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{hTeams.length}</td>
                          <td className="px-3 py-3 text-muted-foreground">{hProjects.length}</td>
                          <td className="px-3 py-3">
                            <StatusPill tone={STATUS_TONE[h.status] ?? 'default'}>
                              {STATUS_LABEL[h.status] ?? h.status}
                            </StatusPill>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </SectionCard>

        {/* Quick actions */}
        <SectionCard title="Organizer actions">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'View problems',        href: '/problems' },
              { label: 'View teams',           href: '/teams' },
              { label: 'Review projects',      href: '/projects' },
              { label: 'Check leaderboard',    href: '/leaderboard' },
            ].map(({ label, href }) => (
              <Button key={label} variant="outline" className="justify-start" asChild>
                <Link href={href}>{label}</Link>
              </Button>
            ))}
          </div>

          {/* Pending submissions callout */}
          {submitted.length > 0 && (
            <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold">
                {submitted.length} project{submitted.length > 1 ? 's' : ''} awaiting evaluation
              </p>
              <Button size="sm" className="mt-3" asChild>
                <Link href="/projects">Review now</Link>
              </Button>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Recent submitted projects */}
      {submitted.length > 0 && (
        <div className="mt-6">
          <SectionCard title="Submitted projects">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    {['Project', 'Team', 'Status', 'Submitted'].map((h) => (
                      <th key={h} className="px-3 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submitted.slice(0, 10).map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-3">
                        <Link href={`/projects/${p.id}`} className="font-medium hover:text-primary">{p.title}</Link>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{p.team_id.slice(0, 8)}…</td>
                      <td className="px-3 py-3"><StatusPill tone="success">Submitted</StatusPill></td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {new Date(p.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}
    </AppShell>
  )
}

export default function OrganizerPage() {
  return <ProtectedRoute roles={['ORGANIZER', 'ADMIN']}><OrganizerContent /></ProtectedRoute>
}
