'use client'

import { AppShell, PageHeader, SectionCard, ToggleList } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'

function SettingsContent() {
  return (
    <AppShell title="Settings">
      <PageHeader
        title="Settings"
        description="Manage your preferences and account experience."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Appearance">
          <ToggleList items={['Use system theme', 'Compact dashboard layout']} />
        </SectionCard>
        <SectionCard title="Notifications">
          <ToggleList
            items={[
              'Team invitations',
              'Hackathon registration updates',
              'Project comments',
              'Evaluation results',
            ]}
          />
        </SectionCard>
        <SectionCard title="Security">
          <ToggleList items={['Email sign-in alerts', 'Two-factor authentication']} />
        </SectionCard>
      </div>
    </AppShell>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}
