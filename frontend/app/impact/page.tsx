'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, PageHeader, SectionCard, StatCard, StatusPill } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { hackathonsApi } from '@/lib/api/hackathons'
import { projectsApi } from '@/lib/api/projects'
import type { Hackathon, ImpactRecord, Project } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

const IMPACT_TONE: Record<string, 'success' | 'warning' | 'default'> = {
  ACHIEVED: 'success', IN_PROGRESS: 'warning', PLANNED: 'default',
}

function ImpactContent() {
  const { user } = useAuth()
  const [projects, setProjects]           = useState<Project[]>([])
  const [hackathons, setHackathons]       = useState<Hackathon[]>([])
  const [impactByProject, setImpactByProject] = useState<Record<string, ImpactRecord[]>>({})
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)

  // Add impact state
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [addDescription, setAddDescription]       = useState('')
  const [addPeople, setAddPeople]                 = useState('')
  const [addStatus, setAddStatus]                 = useState<'PLANNED' | 'IN_PROGRESS' | 'ACHIEVED'>('PLANNED')
  const [adding, setAdding]                       = useState(false)
  const [addError, setAddError]                   = useState<string | null>(null)
  const [addSuccess, setAddSuccess]               = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      projectsApi.list().catch(() => [] as Project[]),
      hackathonsApi.list().catch(() => [] as Hackathon[]),
    ]).then(async ([projs, hacks]) => {
      setProjects(projs); setHackathons(hacks)
      // Load impact for each project
      const entries = await Promise.all(
        projs.map(async (p) => {
          const records = await projectsApi.listImpact(p.id).catch(() => [] as ImpactRecord[])
          return [p.id, records] as [string, ImpactRecord[]]
        }),
      )
      setImpactByProject(Object.fromEntries(entries))
    }).catch((err) => setError(err.message ?? 'Failed to load impact data.'))
      .finally(() => setLoading(false))
  }, [user])

  // Aggregate stats
  const allRecords   = Object.values(impactByProject).flat()
  const totalPeople  = allRecords.reduce((s, r) => s + r.people_benefited, 0)
  const achieved     = allRecords.filter((r) => r.status === 'ACHIEVED')
  const inProgress   = allRecords.filter((r) => r.status === 'IN_PROGRESS')
  const projectsWithImpact = Object.values(impactByProject).filter((r) => r.length > 0).length

  async function handleAddImpact(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null); setAddSuccess(false)
    if (!selectedProjectId) { setAddError('Select a project.'); return }
    if (!addDescription.trim()) { setAddError('Description is required.'); return }
    const people = parseInt(addPeople, 10)
    if (isNaN(people) || people < 0) { setAddError('Enter a valid number of people benefited.'); return }

    setAdding(true)
    try {
      const record = await projectsApi.addImpact(selectedProjectId, {
        description: addDescription.trim(),
        people_benefited: people,
        status: addStatus,
      })
      setImpactByProject((prev) => ({
        ...prev,
        [selectedProjectId]: [...(prev[selectedProjectId] ?? []), record],
      }))
      setAddDescription(''); setAddPeople(''); setAddSuccess(true)
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add impact record.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <AppShell title="Impact tracking">
      <PageHeader
        eyebrow="Measure what matters"
        title="Impact tracking"
        description="Track how solutions are making a difference in communities."
      />

      {error && <div className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="People benefited"   value={loading ? '…' : totalPeople.toLocaleString()} detail="Across all projects" />
        <StatCard label="Achieved"           value={loading ? '…' : String(achieved.length)}      detail="Impact records" />
        <StatCard label="In progress"        value={loading ? '…' : String(inProgress.length)}    detail="Ongoing efforts" />
        <StatCard label="Projects reporting" value={loading ? '…' : String(projectsWithImpact)}   detail="With impact records" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        {/* Impact records list */}
        <SectionCard title="All impact records">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : allRecords.length === 0
            ? <EmptyState title="No impact records yet" description="Add your first impact metric below." />
            : (
              <div className="grid gap-4">
                {projects.map((p) => {
                  const records = impactByProject[p.id] ?? []
                  if (records.length === 0) return null
                  return (
                    <div key={p.id}>
                      <div className="mb-2 flex items-center justify-between">
                        <Link href={`/projects/${p.id}`} className="text-sm font-semibold hover:text-primary">
                          {p.title}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {records.reduce((s, r) => s + r.people_benefited, 0).toLocaleString()} people
                        </span>
                      </div>
                      <div className="grid gap-2">
                        {records.map((r) => (
                          <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                            <div>
                              <p className="text-sm">{r.description}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {r.people_benefited.toLocaleString()} people benefited
                              </p>
                            </div>
                            <StatusPill tone={IMPACT_TONE[r.status] ?? 'default'}>
                              {r.status.replace('_', ' ')}
                            </StatusPill>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </SectionCard>

        {/* Add impact form */}
        <SectionCard title="Add impact metric">
          <form onSubmit={handleAddImpact} className="grid gap-4">
            {addError && (
              <div role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{addError}</div>
            )}
            {addSuccess && (
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Impact record added.
              </div>
            )}

            <label className="grid gap-2 text-sm font-medium">
              Project
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Description
              <textarea
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                placeholder="Describe the impact this solution created…"
                rows={3}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              People benefited
              <input
                type="number"
                min={0}
                value={addPeople}
                onChange={(e) => setAddPeople(e.target.value)}
                placeholder="500"
                className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Status
              <select
                value={addStatus}
                onChange={(e) => setAddStatus(e.target.value as typeof addStatus)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="ACHIEVED">Achieved</option>
              </select>
            </label>

            <Button type="submit" disabled={adding}>
              {adding ? 'Saving…' : 'Save metric'}
            </Button>
          </form>
        </SectionCard>
      </div>
    </AppShell>
  )
}

export default function ImpactPage() {
  return <ProtectedRoute><ImpactContent /></ProtectedRoute>
}
