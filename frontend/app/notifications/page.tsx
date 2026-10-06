'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, PageHeader, SectionCard, StatusPill } from '@/components/app-shell'
import { notificationsApi } from '@/lib/api/notifications'
import { invitationsApi } from '@/lib/api/teams'
import type { Notification } from '@/lib/api/types'
import { isUnread } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

interface PendingInvitation {
  id: string
  team_id: string
  team_name: string
  status: string
  created_at: string
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [invitations, setInvitations]     = useState<PendingInvitation[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [responding, setResponding]       = useState<Record<string, boolean>>({})
  const [responseMsg, setResponseMsg]     = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) return
    Promise.all([
      notificationsApi.list().catch(() => [] as Notification[]),
      invitationsApi.listMine().catch(() => [] as PendingInvitation[]),
    ]).then(([n, i]) => {
      setNotifications(n)
      setInvitations(i)
    }).catch((err) => setError(err.message ?? 'Failed to load notifications.'))
      .finally(() => setLoading(false))
  }, [user])

  async function handleMarkAllRead() {
    await notificationsApi.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })))
  }

  async function handleMarkRead(id: string) {
    await notificationsApi.markRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    )
  }

  async function handleDelete(id: string) {
    await notificationsApi.delete(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  async function handleInvitationResponse(invId: string, accept: boolean) {
    setResponding((prev) => ({ ...prev, [invId]: true }))
    try {
      if (accept) {
        await invitationsApi.accept(invId)
        setResponseMsg((prev) => ({ ...prev, [invId]: '✓ You joined the team!' }))
      } else {
        await invitationsApi.reject(invId)
        setResponseMsg((prev) => ({ ...prev, [invId]: 'Invitation declined.' }))
      }
      // Remove from pending list after a short delay so the message is visible
      setTimeout(() => {
        setInvitations((prev) => prev.filter((i) => i.id !== invId))
        setResponseMsg((prev) => { const n = { ...prev }; delete n[invId]; return n })
      }, 1500)
    } catch (err: unknown) {
      setResponseMsg((prev) => ({
        ...prev,
        [invId]: err instanceof Error ? err.message : 'Failed to respond.',
      }))
      setResponding((prev) => ({ ...prev, [invId]: false }))
    }
  }

  const hasUnread = notifications.some(isUnread)

  return (
    <AppShell title="Notifications">
      <PageHeader
        title="Notifications"
        description="Stay up to date with your teams, hackathons, and projects."
        action={hasUnread ? (
          <Button variant="outline" onClick={handleMarkAllRead}>Mark all as read</Button>
        ) : undefined}
      />

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* ── Pending team invitations ── */}
      {!loading && invitations.length > 0 && (
        <div className="mb-6">
          <SectionCard title={`Team invitations (${invitations.length})`}>
            <div className="grid gap-4">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      You've been invited to join{' '}
                      <Link href={`/teams/${inv.team_id}`} className="text-primary hover:underline">
                        {inv.team_name}
                      </Link>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                    {responseMsg[inv.id] && (
                      <p className={`mt-1 text-sm ${responseMsg[inv.id].startsWith('✓') ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                        {responseMsg[inv.id]}
                      </p>
                    )}
                  </div>
                  {!responseMsg[inv.id] && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        disabled={responding[inv.id]}
                        onClick={() => handleInvitationResponse(inv.id, true)}
                      >
                        {responding[inv.id] ? '…' : 'Accept'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={responding[inv.id]}
                        onClick={() => handleInvitationResponse(inv.id, false)}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                  {responseMsg[inv.id] && (
                    <StatusPill tone={responseMsg[inv.id].startsWith('✓') ? 'success' : 'default'}>
                      {responseMsg[inv.id].startsWith('✓') ? 'Accepted' : 'Declined'}
                    </StatusPill>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── General notifications ── */}
      {!loading && !error && notifications.length === 0 && invitations.length === 0 && (
        <EmptyState title="All caught up" description="You have no notifications right now." />
      )}

      {!loading && !error && notifications.length > 0 && (
        <SectionCard title="Activity">
          <div className="grid gap-1">
            {notifications.map((n) => {
              const unread = isUnread(n)
              return (
                <div
                  key={n.id}
                  className={`flex items-start justify-between gap-4 rounded-lg p-4 ${unread ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex gap-3">
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${unread ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                    <div>
                      <p className="text-sm font-medium">{n.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {unread && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>
                        Mark read
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(n.id)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}
    </AppShell>
  )
}
