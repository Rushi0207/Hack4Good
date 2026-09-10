'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppShell, PageHeader, ProfileSummary, SectionCard } from '@/components/app-shell'
import { profileApi } from '@/lib/api/profile'
import type { UpdateProfileInput } from '@/lib/api/types'
import { useAuth } from '@/context/auth-context'

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth()

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill form when profile loads
  useEffect(() => {
    if (!profile && !user) return
    // Use profile data if available, otherwise fall back to auth metadata
    const metaName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ''
    setFullName(profile?.full_name && profile.full_name !== 'New user' ? profile.full_name : metaName)
    setBio(profile?.bio ?? '')
    setLocation(profile?.location ?? '')
    setSkills((profile?.skills ?? []).join(', '))
  }, [profile, user])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const input: UpdateProfileInput = {
      full_name: fullName.trim() || undefined,
      bio: bio.trim() || null,
      location: location.trim() || null,
      skills: skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }

    try {
      await profileApi.update(input)
      await refreshProfile()
      setSaved(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell title="Profile">
      <PageHeader
        title="Your profile"
        description="Keep your profile current so the right collaborators can find you."
      />

      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        {/* Left — summary card */}
        <SectionCard title="Profile summary">
          <ProfileSummary />
          {profile?.bio && (
            <p className="mt-5 text-sm leading-6 text-muted-foreground">{profile.bio}</p>
          )}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="rounded-md bg-muted px-2.5 py-1 text-xs">{s}</span>
              ))}
            </div>
          )}
          {profile && (
            <div className="mt-5 grid gap-1 text-sm text-muted-foreground">
              <p>Role: <span className="font-medium text-foreground">{profile.role}</span></p>
              {profile.location && <p>📍 {profile.location}</p>}
            </div>
          )}
        </SectionCard>

        {/* Right — edit form */}
        <SectionCard title="Profile information">
          <form onSubmit={handleSave} className="grid gap-5">
            {error && (
              <div role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {saved && (
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Profile saved successfully.
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Full name
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Email
                <input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  aria-label="Email address (cannot be changed here)"
                  className="h-10 rounded-md border border-input bg-muted px-3 font-normal text-muted-foreground"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Location
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                  className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Skills{' '}
                <span className="font-normal text-muted-foreground">(comma-separated)</span>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, Node.js, Python"
                  className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Bio
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell the community about yourself…"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <Button type="submit" disabled={saving} className="w-fit">
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </SectionCard>
      </div>
    </AppShell>
  )
}
