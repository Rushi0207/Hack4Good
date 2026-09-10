'use client'

import { useEffect, useState } from 'react'
import { AppShell, EmptyState, FilterBar, PageHeader, StatusPill } from '@/components/app-shell'
import { hackathonsApi } from '@/lib/api/hackathons'
import type { Hackathon, LeaderboardEntry } from '@/lib/api/types'

export default function LeaderboardPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [selected, setSelected] = useState<string>('')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Load hackathon list first
  useEffect(() => {
    hackathonsApi.list().then((h) => {
      setHackathons(h)
      if (h.length > 0) setSelected(h[0].id)
    }).catch(() => setLoading(false))
  }, [])

  // Load leaderboard whenever the selected hackathon changes
  useEffect(() => {
    if (!selected) return
    setLoading(true)
    hackathonsApi
      .leaderboard(selected)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [selected])

  const filtered = entries.filter((e) =>
    e.team_name.toLowerCase().includes(search.toLowerCase()) ||
    e.project_title.toLowerCase().includes(search.toLowerCase()),
  )

  const rankLabel = (rank: number) =>
    rank === 1 ? '🥇 1st' : rank === 2 ? '🥈 2nd' : rank === 3 ? '🥉 3rd' : `${rank}th`

  return (
    <AppShell title="Leaderboard">
      <PageHeader
        eyebrow="Celebrate progress"
        title="Leaderboard"
        description="See the teams turning bold ideas into meaningful impact."
      />

      {hackathons.length > 1 && (
        <div className="mb-4">
          <select
            aria-label="Select hackathon"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {hackathons.map((h) => (
              <option key={h.id} value={h.id}>{h.title}</option>
            ))}
          </select>
        </div>
      )}

      <FilterBar
        placeholder="Search teams or projects..."
        value={search}
        onChange={setSearch}
      />

      {loading && <p className="mt-6 text-center text-sm text-muted-foreground">Loading leaderboard…</p>}

      {!loading && filtered.length === 0 && (
        <EmptyState title="No results" description="No scores have been published for this hackathon yet." />
      )}

      {!loading && filtered.length > 0 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  {['Rank', 'Team', 'Project', 'Score'].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.team_id} className="border-b border-border last:border-0">
                    <td className="px-4 py-4 font-semibold">{rankLabel(e.rank)}</td>
                    <td className="px-4 py-4">{e.team_name}</td>
                    <td className="px-4 py-4 text-muted-foreground">{e.project_title}</td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-primary">{e.total_score}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {filtered.slice(0, 3).map((e) => (
              <div key={e.team_id} className="rounded-xl border border-border bg-card p-5 text-center">
                <p className="text-sm text-muted-foreground">{rankLabel(e.rank)}</p>
                <p className="mt-3 text-xl font-semibold">{e.team_name}</p>
                <p className="mt-2 text-3xl font-semibold text-primary">{e.total_score}</p>
                <div className="mt-2 flex justify-center">
                  <StatusPill tone={e.rank === 1 ? 'success' : 'default'}>
                    {e.rank === 1 ? 'Winner' : e.rank === 2 ? 'Runner-up' : 'Top 3'}
                  </StatusPill>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AppShell>
  )
}
