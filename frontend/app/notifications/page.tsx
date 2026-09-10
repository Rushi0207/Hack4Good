'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, PageHeader, SectionCard } from '@/components/app-shell'
import { notificationsApi } from '@/lib/api/notifications'
import type { Notification } from '@/lib/api/types'
import { isUnread } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    notificationsApi.list()
      .then(setNotifications)
      .catch((err) => setError(err.message ?? 'Failed to load notifications.'))
      .finally(() => setLoading(false))
  }, [user])

  async function handleMarkAllRead() {
    await notificationsApi.markAllRead()
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: new Date().toISOString() })),
    )
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

      {loading && <p className="text-sm text-muted-foreground">Loading notifications…</p>}
      {error && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {!loading && !error && notifications.length === 0 && (
        <EmptyState title="All caught up" description="You have no notifications right now." />
      )}

      {!loading && !error && notifications.length > 0 && (
        <SectionCard title="Recent updates">
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
