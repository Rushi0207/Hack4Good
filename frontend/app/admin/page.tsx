'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AppShell, PageHeader, SectionCard, StatCard, StatusPill } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { adminApi } from '@/lib/api/admin'
import type { AdminDashboard, Hackathon, Profile, Project, UserRole } from '@/lib/api/types'
import { Button } from '@/components/ui/button'

const ROLES: UserRole[] = ['PARTICIPANT', 'ORGANIZER', 'JUDGE', 'ADMIN']

const ROLE_TONE: Record<UserRole, 'success' | 'warning' | 'default'> = {
  ADMIN: 'warning',
  JUDGE: 'success',
  ORGANIZER: 'success',
  PARTICIPANT: 'default',
}

function RoleEditor({
  user,
  onUpdated,
}: {
  user: Profile
  onUpdated: (updated: Profile) => void
}) {
  const [editing, setEditing] = useState(false)
  const [role, setRole] = useState<UserRole>(user.role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const updated = await adminApi.updateUser(user.id, { role })
      onUpdated(updated as unknown as Profile)
      setEditing(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update role.')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <StatusPill tone={ROLE_TONE[user.role]}>{user.role}</StatusPill>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          change
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? '…' : 'Save'}
        </Button>
        <button
          onClick={() => { setEditing(false); setRole(user.role) }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function AdminContent() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [users, setUsers]         = useState<Profile[]>([])
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [projects, setProjects]   = useState<Project[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      adminApi.dashboard(),
      adminApi.listUsers(),
      adminApi.listHackathons(),
      adminApi.listProjects(),
    ])
      .then(([dash, u, h, pr]) => {
        setDashboard(dash)
        setUsers(u as unknown as Profile[])
        setHackathons(h)
        setProjects(pr)
      })
      .catch((err) => setError(err.message ?? 'Failed to load admin data.'))
      .finally(() => setLoading(false))
  }, [])

  function handleUserUpdated(updated: Profile) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
  }

  return (
    <AppShell title="Admin overview">
      <PageHeader
        eyebrow="Platform management"
        title="Admin dashboard"
        description="Monitor the Hack4Good community and manage user roles."
      />

      {error && (
        <div className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Users"      value={loading ? '…' : String(dashboard?.total_users ?? 0)}      detail="Registered" />
        <StatCard label="Hackathons" value={loading ? '…' : String(dashboard?.total_hackathons ?? 0)} detail="All time" />
        <StatCard label="Problems"   value={loading ? '…' : String(dashboard?.total_problems ?? 0)}   detail="Submitted" />
        <StatCard label="Teams"      value={loading ? '…' : String(dashboard?.total_teams ?? 0)}      detail="Active" />
        <StatCard label="Projects"   value={loading ? '…' : String(dashboard?.total_projects ?? 0)}   detail="Across hackathons" />
      </div>

      {/* Users table with inline role editor */}
      <div className="mt-6">
        <SectionCard title="Users — manage roles">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    {['Name', 'Role', 'Joined', ''].map((h, i) => (
                      <th key={i} className="px-3 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-3">
                        <p className="font-medium">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-3 py-3">
                        <RoleEditor user={u} onUpdated={handleUserUpdated} />
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3">
                        {/* Delete button — only shown for non-admin users */}
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete ${u.full_name}? This cannot be undone.`)) return
                              try {
                                await adminApi.deleteUser(u.id)
                                setUsers((prev) => prev.filter((x) => x.id !== u.id))
                              } catch { /* ignore */ }
                            }}
                            className="text-xs text-destructive hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        {/* Management links */}
        <SectionCard title="Platform overview">
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ['Hackathons', dashboard?.total_hackathons, '/hackathons'],
              ['Problems',   dashboard?.total_problems,   '/problems'],
              ['Teams',      dashboard?.total_teams,      '/teams'],
              ['Projects',   dashboard?.total_projects,   '/projects'],
            ] as [string, number | undefined, string][]).map(([label, count, href]) => (
              <Link key={label} href={href}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:bg-muted">
                <span>{label}</span>
                <StatusPill>{loading ? '…' : String(count ?? 0)}</StatusPill>
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Recent hackathons */}
        <SectionCard title="Recent hackathons">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : hackathons.length === 0 ? <p className="text-sm text-muted-foreground">No hackathons yet.</p>
            : hackathons.slice(0, 5).map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <Link href={`/hackathons/${h.id}`} className="text-sm font-medium hover:text-primary">{h.title}</Link>
                <StatusPill tone={h.status === 'PUBLISHED' || h.status === 'ONGOING' ? 'success' : 'default'}>
                  {h.status}
                </StatusPill>
              </div>
            ))}
        </SectionCard>
      </div>
    </AppShell>
  )
}

export default function AdminPage() {
  return <ProtectedRoute roles={['ADMIN']}><AdminContent /></ProtectedRoute>
}
