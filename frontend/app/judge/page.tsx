'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, PageHeader, SectionCard, StatCard, StatusPill } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { judgesApi, projectsApi } from '@/lib/api/projects'
import type { Evaluation, Project } from '@/lib/api/types'

function JudgeContent() {
  const [projects, setProjects] = useState<Project[]>([])
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    judgesApi.myProjects()
      .then(async (projs) => {
        setProjects(projs)
        const entries = await Promise.all(
          projs.map(async (p) => {
            const evals = await projectsApi.listEvaluations(p.id).catch(() => [] as Evaluation[])
            return [p.id, evals] as [string, Evaluation[]]
          }),
        )
        setEvaluations(Object.fromEntries(entries))
      })
      .catch((err) => setError(err.message ?? 'Failed to load assigned projects.'))
      .finally(() => setLoading(false))
  }, [])

  const pending   = projects.filter((p) => !(evaluations[p.id]?.length))
  const completed = projects.filter((p) =>  (evaluations[p.id]?.length))

  return (
    <AppShell title="Judge dashboard">
      <PageHeader eyebrow="Review submissions" title="Judge dashboard"
        description="Evaluate projects fairly and help surface the strongest ideas." />

      {error && <div className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Assigned"   value={loading ? '…' : String(projects.length)} detail="Total" />
        <StatCard label="Pending"    value={loading ? '…' : String(pending.length)}  detail="Awaiting review" />
        <StatCard label="Completed"  value={loading ? '…' : String(completed.length)} detail="Thank you!" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Pending evaluations">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : pending.length === 0 ? <EmptyState title="All done" description="All projects evaluated." />
            : (
              <div className="grid gap-4">
                {pending.map((p) => (
                  <div key={p.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {p.technologies.slice(0, 3).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill tone="warning">Pending</StatusPill>
                      {p.demo_url && <Button variant="ghost" size="sm" asChild><a href={p.demo_url} target="_blank" rel="noopener noreferrer">Demo</a></Button>}
                      <Button size="sm" asChild><Link href={`/projects/${p.id}`}>Evaluate</Link></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </SectionCard>

        <SectionCard title="Completed evaluations">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : completed.length === 0 ? <EmptyState title="None yet" description="Completed evaluations appear here." />
            : (
              <div className="grid gap-4">
                {completed.map((p) => {
                  const latest = evaluations[p.id]?.at(-1)
                  return (
                    <div key={p.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{p.title}</p>
                        {latest?.total_score != null && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Score: <span className="font-semibold text-primary">{latest.total_score}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill tone="success">Evaluated</StatusPill>
                        <Button variant="outline" size="sm" asChild><Link href={`/projects/${p.id}`}>View</Link></Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </SectionCard>
      </div>
    </AppShell>
  )
}

export default function JudgePage() {
  return <ProtectedRoute roles={['JUDGE', 'ADMIN']}><JudgeContent /></ProtectedRoute>
}
