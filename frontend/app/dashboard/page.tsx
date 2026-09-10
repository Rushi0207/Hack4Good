'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, CheckCircle2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AccentButton, AppShell, PageHeader, ProgressBar,
  SectionCard, StatCard, StatusPill,
} from '@/components/app-shell'
import { hackathonsApi } from '@/lib/api/hackathons'
import { problemsApi } from '@/lib/api/problems'
import { notificationsApi } from '@/lib/api/notifications'
import { teamsApi } from '@/lib/api/teams'
import { projectsApi } from '@/lib/api/projects'
import { isUnread } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'
import type { Hackathon, Problem, Notification, Team, Project } from '@/lib/api/types'

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [problems, setProblems] = useState<Problem[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      hackathonsApi.list().catch(() => [] as Hackathon[]),
      problemsApi.list().catch(() => [] as Problem[]),
      notificationsApi.list().catch(() => [] as Notification[]),
      teamsApi.list().catch(() => [] as Team[]),
      projectsApi.list().catch(() => [] as Project[]),
    ]).then(([h, p, n, t, pr]) => {
      setHackathons(h); setProblems(p); setNotifications(n)
      setTeams(t); setProjects(pr); setLoading(false)
    })
  }, [user])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const unreadCount = notifications.filter(isUnread).length

  return (
    <AppShell>
      <PageHeader
        eyebrow="Good morning"
        title={`Welcome back, ${firstName}`}
        description="Here is what is moving forward in your impact journey."
        action={<AccentButton href="/projects/new">Submit a project</AccentButton>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My teams"    value={String(teams.length)}    detail={`${teams.length} active`} />
        <StatCard label="My projects" value={String(projects.length)} detail={`${projects.filter(p => p.status === 'SUBMITTED').length} submitted`} />
        <StatCard label="Hackathons"  value={String(hackathons.length)} detail="available now" />
        <StatCard label="Unread"      value={String(unreadCount)}     detail="notifications" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <SectionCard
          title="Upcoming hackathons"
          action={<Button variant="ghost" size="sm" asChild><Link href="/hackathons">View all <ArrowRight data-icon="inline-end" /></Link></Button>}
        >
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : hackathons.length === 0 ? <p className="text-sm text-muted-foreground">No hackathons yet.</p>
            : (
              <div className="grid gap-4">
                {hackathons.slice(0, 3).map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><CalendarDays /></span>
                      <div>
                        <p className="font-medium">{h.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(h.start_date).toLocaleDateString()} · {h.location ?? 'Online'}
                        </p>
                      </div>
                    </div>
                    <StatusPill tone={h.status === 'PUBLISHED' || h.status === 'ONGOING' ? 'success' : 'default'}>
                      {h.status === 'PUBLISHED' ? 'Open' : h.status === 'ONGOING' ? 'Active' : h.status.toLowerCase()}
                    </StatusPill>
                  </div>
                ))}
              </div>
            )
          }
        </SectionCard>

        <SectionCard title="Tasks & progress">
          <div className="grid gap-5">
            <div>
              <div className="flex justify-between text-sm">
                <span>Profile completeness</span>
                <span className="text-muted-foreground">
                  {profile ? (profile.bio && profile.location && profile.skills?.length ? '100' : '60') : '0'}%
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar value={profile ? (profile.bio && profile.location && profile.skills?.length ? 100 : 60) : 0} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Project submissions</span>
                <span className="text-muted-foreground">
                  {projects.filter(p => p.status === 'SUBMITTED').length}/{projects.length || 1}
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar value={projects.length ? Math.round((projects.filter(p => p.status === 'SUBMITTED').length / projects.length) * 100) : 0} />
              </div>
            </div>
            {teams.length === 0 && (
              <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3 text-sm">
                <CheckCircle2 className="size-4 text-primary" /> Join a team to get started
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Recent activity">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : notifications.length === 0 ? <p className="text-sm text-muted-foreground">No notifications yet.</p>
            : (
              <div className="grid gap-4">
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="flex gap-3">
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${isUnread(n) ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                    <div>
                      <p className="text-sm">{n.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </SectionCard>

        <SectionCard title="Recommended problems">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : problems.length === 0 ? <p className="text-sm text-muted-foreground">No problems yet.</p>
            : (
              <div className="grid gap-4">
                {problems.slice(0, 4).map((p) => (
                  <Link key={p.id} href={`/problems/${p.id}`}
                    className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-sm text-muted-foreground">{p.category ?? ''} {p.location ? `· ${p.location}` : ''}</p>
                    </div>
                    <Users className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )
          }
        </SectionCard>
      </div>
    </AppShell>
  )
}
