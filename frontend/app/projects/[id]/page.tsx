'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, SectionCard, StatusPill } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { projectsApi } from '@/lib/api/projects'
import type { Evaluation, ImpactRecord, Project } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

const STATUS_TONE: Record<string, 'success' | 'warning' | 'default'> = {
  SUBMITTED: 'success', DRAFT: 'warning',
}

function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { profile } = useAuth()

  const [project, setProject]       = useState<Project | null>(null)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [impact, setImpact]         = useState<ImpactRecord[]>([])
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      projectsApi.get(id),
      projectsApi.listEvaluations(id).catch(() => [] as Evaluation[]),
      projectsApi.listImpact(id).catch(() => [] as ImpactRecord[]),
    ]).then(([p, e, i]) => { setProject(p); setEvaluations(e); setImpact(i) })
      .catch((err) => setError(err.message ?? 'Failed to load project.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit() {
    if (!project) return
    setSubmitting(true)
    try {
      const updated = await projectsApi.submit(project.id)
      setProject(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <AppShell title="Project">
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </AppShell>
  )

  if (error || !project) return (
    <AppShell title="Project">
      <EmptyState title="Project not found" description={error ?? 'This project does not exist.'}
        action={<Button onClick={() => router.push('/projects')}>Back to projects</Button>} />
    </AppShell>
  )

  const canSubmit = project.status === 'DRAFT' &&
    (profile?.role === 'PARTICIPANT' || profile?.role === 'ADMIN')

  const avgScore = evaluations.length
    ? Math.round(evaluations.reduce((s, e) => s + (e.total_score ?? 0), 0) / evaluations.length)
    : null

  return (
    <AppShell title={project.title}>
      <div className="mb-6">
        <Link href="/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to projects
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{project.title}</h1>
            <StatusPill tone={STATUS_TONE[project.status] ?? 'default'}>
              {project.status.toLowerCase()}
            </StatusPill>
          </div>
          {project.technologies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {project.technologies.map((t) => (
                <span key={t} className="rounded-md bg-muted px-2.5 py-1 text-xs">{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {project.github_url && (
            <Button variant="outline" asChild>
              <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </Button>
          )}
          {project.demo_url && (
            <Button variant="outline" asChild>
              <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" /> Demo
              </a>
            </Button>
          )}
          {canSubmit && (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit project'}
            </Button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <div className="grid gap-6">
          {/* Description */}
          <SectionCard title="Solution">
            <p className="text-sm leading-7 text-muted-foreground whitespace-pre-line">{project.description}</p>
          </SectionCard>

          {/* Impact */}
          {project.impact && (
            <SectionCard title="Expected impact">
              <p className="text-sm leading-7 text-muted-foreground whitespace-pre-line">{project.impact}</p>
            </SectionCard>
          )}

          {/* Evaluations */}
          <SectionCard title={`Evaluations (${evaluations.length})`}>
            {evaluations.length === 0
              ? <p className="text-sm text-muted-foreground">No evaluations yet.</p>
              : (
                <div className="grid gap-4">
                  {evaluations.map((e) => (
                    <div key={e.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Score</p>
                        {e.total_score != null && (
                          <span className="text-2xl font-semibold text-primary">{e.total_score}</span>
                        )}
                      </div>
                      {e.feedback && (
                        <p className="mt-3 text-sm text-muted-foreground">{e.feedback}</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )
            }
          </SectionCard>

          {/* Impact records */}
          {impact.length > 0 && (
            <SectionCard title="Impact records">
              <div className="grid gap-4">
                {impact.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{r.description}</p>
                      <StatusPill tone={r.status === 'ACHIEVED' ? 'success' : r.status === 'IN_PROGRESS' ? 'warning' : 'default'}>
                        {r.status.replace('_', ' ')}
                      </StatusPill>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      People benefited: <span className="font-medium text-foreground">{r.people_benefited.toLocaleString()}</span>
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="grid gap-6 self-start">
          <SectionCard title="Project info">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusPill tone={STATUS_TONE[project.status] ?? 'default'}>{project.status.toLowerCase()}</StatusPill>
              </div>
              {avgScore !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg score</span>
                  <span className="font-semibold text-primary">{avgScore}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Evaluations</span>
                <span>{evaluations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Team">
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/teams/${project.team_id}`}>View team</Link>
            </Button>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  )
}

export default function ProjectDetailPage() {
  return <ProtectedRoute><ProjectDetail /></ProtectedRoute>
}
