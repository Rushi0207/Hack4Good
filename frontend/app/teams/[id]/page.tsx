'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, UserMinus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, SectionCard, StatusPill } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { teamsApi, invitationsApi } from '@/lib/api/teams'
import { projectsApi } from '@/lib/api/projects'
import type { Team, TeamMember, Project } from '@/lib/api/types'
import { useAuth, getInitials } from '@/context/auth-context'

function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, profile } = useAuth()

  const [team, setTeam]       = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      teamsApi.get(id),
      teamsApi.listMembers(id).catch(() => [] as TeamMember[]),
      projectsApi.list({ team_id: id }).catch(() => [] as Project[]),
    ]).then(([t, m, p]) => { setTeam(t); setMembers(m); setProjects(p) })
      .catch((err) => setError(err.message ?? 'Failed to load team.'))
      .finally(() => setLoading(false))
  }, [id])

  const isLeader = team?.leader_id === user?.id
  const isMember = members.some((m) => m.user_id === user?.id)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true); setInviteMsg(null)
    try {
      await teamsApi.invite(id, inviteEmail.trim())
      setInviteMsg('Invitation sent! They will receive an email and an in-app notification.')
      setInviteEmail('')
    } catch (err: unknown) {
      setInviteMsg(err instanceof Error ? err.message : 'Failed to send invitation.')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(userId: string) {
    try {
      await teamsApi.removeMember(id, userId)
      setMembers((prev) => prev.filter((m) => m.user_id !== userId))
    } catch { /* ignore */ }
  }

  if (loading) return (
    <AppShell title="Team">
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </AppShell>
  )

  if (error || !team) return (
    <AppShell title="Team">
      <EmptyState title="Team not found" description={error ?? 'This team does not exist.'}
        action={<Button onClick={() => router.push('/teams')}>Back to teams</Button>} />
    </AppShell>
  )

  return (
    <AppShell title={team.name}>
      <div className="mb-6">
        <Link href="/teams" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to teams
        </Link>
      </div>

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold">{team.name}</h1>
          {team.description && <p className="mt-2 text-muted-foreground">{team.description}</p>}
        </div>
        <StatusPill tone="success">Active</StatusPill>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="grid gap-6">
          {/* Members */}
          <SectionCard title={`Members (${members.length})`}>
            {members.length === 0
              ? <p className="text-sm text-muted-foreground">No members yet.</p>
              : (
                <div className="grid gap-3">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {getInitials(m.user_id.slice(0, 6))}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{m.user_id.slice(0, 12)}…</p>
                          {m.user_id === team.leader_id && (
                            <p className="text-xs text-primary">Team leader</p>
                          )}
                        </div>
                      </div>
                      {(isLeader || m.user_id === user?.id) && m.user_id !== team.leader_id && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(m.user_id)}>
                          <UserMinus className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )
            }

            {/* Invite form — leaders only */}
            {isLeader && (
              <form onSubmit={handleInvite} className="mt-5 grid gap-3 border-t border-border pt-5">
                <p className="text-sm font-medium">Invite a member by email</p>
                {inviteMsg && (
                  <p className={`text-sm ${inviteMsg.startsWith('Invitation sent') ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                    {inviteMsg}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="participant@example.com"
                    required
                    className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button type="submit" size="sm" disabled={inviting}>
                    <UserPlus className="size-4" />{inviting ? '…' : 'Invite'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  They must already have a Hack4Good account. They will receive an in-app notification and an email.
                </p>
              </form>
            )}
          </SectionCard>

          {/* Projects */}
          <SectionCard title={`Projects (${projects.length})`}>
            {projects.length === 0
              ? (
                <div className="grid gap-4">
                  <p className="text-sm text-muted-foreground">No projects yet.</p>
                  {isMember && (
                    <Button variant="outline" asChild>
                      <Link href="/projects/new">Create a project</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3">
                  {projects.map((p) => (
                    <Link key={p.id} href={`/projects/${p.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted">
                      <p className="text-sm font-medium">{p.title}</p>
                      <StatusPill tone={p.status === 'SUBMITTED' ? 'success' : 'warning'}>
                        {p.status.toLowerCase()}
                      </StatusPill>
                    </Link>
                  ))}
                </div>
              )
            }
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="grid gap-6 self-start">
          <SectionCard title="Team info">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(team.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span>{members.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Projects</span>
                <span>{projects.length}</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  )
}

export default function TeamDetailPage() {
  return <ProtectedRoute><TeamDetail /></ProtectedRoute>
}
