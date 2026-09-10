'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppShell, EmptyState, PageHeader, SectionCard, StatusPill } from '@/components/app-shell'
import { projectsApi } from '@/lib/api/projects'
import type { Project } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

const statusTone = (s: string): 'success' | 'warning' | 'default' =>
  s === 'SUBMITTED' ? 'success' : s === 'DRAFT' ? 'warning' : 'default'

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    projectsApi.list()
      .then(setProjects)
      .catch((err) => setError(err.message ?? 'Failed to load projects.'))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <AppShell title="Projects">
      <PageHeader
        eyebrow="Build for impact"
        title="My projects"
        description="Track your submissions, feedback, and next steps."
        action={<Button asChild><Link href="/projects/new">New project</Link></Button>}
      />

      {loading && <p className="text-sm text-muted-foreground">Loading projects…</p>}
      {error && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {!loading && !error && projects.length === 0 && (
        <EmptyState title="No projects yet" description="Start a new project to submit to a hackathon."
          action={<Button asChild><Link href="/projects/new">New project</Link></Button>} />
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {projects.map((p) => (
            <SectionCard key={p.id} title={p.title}
              action={<StatusPill tone={statusTone(p.status)}>{p.status.toLowerCase()}</StatusPill>}
            >
              <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
              {p.technologies.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.technologies.map((t) => (
                    <span key={t} className="rounded-md bg-muted px-2 py-1 text-xs">{t}</span>
                  ))}
                </div>
              )}
              <div className="mt-5 flex gap-3">
                <Button variant="outline" asChild><Link href={`/projects/${p.id}`}>View project</Link></Button>
                {p.demo_url && (
                  <Button variant="ghost" asChild>
                    <a href={p.demo_url} target="_blank" rel="noopener noreferrer">Demo</a>
                  </Button>
                )}
                {p.github_url && (
                  <Button variant="ghost" asChild>
                    <a href={p.github_url} target="_blank" rel="noopener noreferrer">GitHub</a>
                  </Button>
                )}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </AppShell>
  )
}
