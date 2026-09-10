'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppShell, PageHeader, SectionCard } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { projectsApi } from '@/lib/api/projects'
import { teamsApi } from '@/lib/api/teams'
import { hackathonsApi } from '@/lib/api/hackathons'
import { problemsApi } from '@/lib/api/problems'
import type { Team, Hackathon, Problem } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

function NewProjectForm() {
  const router = useRouter()
  const { user } = useAuth()

  const [teams, setTeams]         = useState<Team[]>([])
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [problems, setProblems]   = useState<Problem[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Form state
  const [teamId, setTeamId]             = useState('')
  const [problemId, setProblemId]       = useState('')
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [technologies, setTechnologies] = useState('')
  const [impact, setImpact]             = useState('')
  const [githubUrl, setGithubUrl]       = useState('')
  const [demoUrl, setDemoUrl]           = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      teamsApi.list().catch(() => [] as Team[]),
      hackathonsApi.list().catch(() => [] as Hackathon[]),
      problemsApi.list().catch(() => [] as Problem[]),
    ]).then(([t, h, p]) => {
      setTeams(t); setHackathons(h); setProblems(p)
      if (t.length === 1) setTeamId(t[0].id)
    }).finally(() => setLoadingData(false))
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!teamId)    { setError('Please select a team.');    return }
    if (!problemId) { setError('Please select a problem.'); return }
    if (!title.trim())       { setError('Title is required.');       return }
    if (!description.trim()) { setError('Description is required.'); return }

    setSubmitting(true)
    try {
      const project = await projectsApi.create({
        team_id:      teamId,
        problem_id:   problemId,
        title:        title.trim(),
        description:  description.trim(),
        technologies: technologies.split(',').map(s => s.trim()).filter(Boolean),
        impact:       impact.trim() || null,
        github_url:   githubUrl.trim() || null,
        demo_url:     demoUrl.trim() || null,
      })
      router.push(`/projects/${project.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project.')
      setSubmitting(false)
    }
  }

  if (loadingData) return (
    <AppShell title="New project">
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </AppShell>
  )

  return (
    <AppShell title="New project">
      <div className="mb-6">
        <Link href="/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to projects
        </Link>
      </div>
      <PageHeader
        eyebrow="Project submission"
        title="Submit your solution"
        description="Share the idea your team built and the impact you expect to create."
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          {/* Main form */}
          <div className="grid gap-6">
            {error && (
              <div role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <SectionCard title="Project details">
              <div className="grid gap-5">
                {/* Team */}
                <label className="grid gap-2 text-sm font-medium">
                  Team <span className="text-destructive">*</span>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    required
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select your team…</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {teams.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No teams yet.{' '}
                      <Link href="/teams" className="text-primary hover:underline">Create a team first.</Link>
                    </p>
                  )}
                </label>

                {/* Problem */}
                <label className="grid gap-2 text-sm font-medium">
                  Problem statement <span className="text-destructive">*</span>
                  <select
                    value={problemId}
                    onChange={(e) => setProblemId(e.target.value)}
                    required
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select a problem…</option>
                    {problems.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  {problems.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No problems available.{' '}
                      <Link href="/problems" className="text-primary hover:underline">View problems.</Link>
                    </p>
                  )}
                </label>

                {/* Title */}
                <label className="grid gap-2 text-sm font-medium">
                  Project title <span className="text-destructive">*</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your solution a clear name"
                    required
                    maxLength={300}
                    className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>

                {/* Description */}
                <label className="grid gap-2 text-sm font-medium">
                  Solution description <span className="text-destructive">*</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="How does your solution work? What problem does it solve?"
                    rows={5}
                    required
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>

                {/* Technologies */}
                <label className="grid gap-2 text-sm font-medium">
                  Technologies <span className="font-normal text-muted-foreground">(comma-separated)</span>
                  <input
                    type="text"
                    value={technologies}
                    onChange={(e) => setTechnologies(e.target.value)}
                    placeholder="React, Python, IoT, PostgreSQL"
                    className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>

                {/* Impact */}
                <label className="grid gap-2 text-sm font-medium">
                  Expected impact
                  <textarea
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    placeholder="How many people will benefit? What change will this create?"
                    rows={3}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>
            </SectionCard>

            <SectionCard title="Links">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  GitHub repository
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/…"
                    className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Live demo
                  <input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://your-demo.com"
                    className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>
            </SectionCard>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating project…' : 'Create project'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/projects">Cancel</Link>
              </Button>
            </div>
          </div>

          {/* Checklist sidebar */}
          <SectionCard title="Submission checklist">
            <div className="grid gap-3 text-sm text-muted-foreground">
              {[
                ['Team selected', !!teamId],
                ['Problem linked', !!problemId],
                ['Title added', !!title.trim()],
                ['Description written', !!description.trim()],
                ['Technologies listed', technologies.trim().length > 0],
                ['GitHub or demo link', !!(githubUrl.trim() || demoUrl.trim())],
              ].map(([label, done]) => (
                <div key={String(label)} className="flex items-center gap-2">
                  <span className={`size-4 rounded-full border-2 flex items-center justify-center text-xs ${done ? 'border-primary bg-primary/10 text-primary' : 'border-muted-foreground/30'}`}>
                    {done ? '✓' : ''}
                  </span>
                  <span className={done ? 'text-foreground' : ''}>{String(label)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Projects are created as <strong>DRAFT</strong>. Use the project page to submit for evaluation.
            </div>
          </SectionCard>
        </div>
      </form>
    </AppShell>
  )
}

export default function NewProjectPage() {
  return <ProtectedRoute roles={['PARTICIPANT', 'ADMIN']}><NewProjectForm /></ProtectedRoute>
}
