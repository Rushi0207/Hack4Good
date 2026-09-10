'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bell, ChevronDown, LayoutDashboard, ListChecks, LogOut, Menu, Settings, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth, getInitials } from '@/context/auth-context'
import { useRouter } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/hackathons', label: 'Hackathons', icon: ListChecks },
  { href: '/problems', label: 'Problems', icon: ListChecks },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/projects', label: 'Projects', icon: LayoutDashboard },
  { href: '/leaderboard', label: 'Leaderboard', icon: ListChecks },
]

export function AppShell({ children, title = 'Dashboard' }: { children: React.ReactNode; title?: string }) {
  const [open, setOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const displayName = profile?.full_name ?? 'Account'
  const initials = getInitials(profile?.full_name)
  const role = profile?.role
    ? profile.role.charAt(0) + profile.role.slice(1).toLowerCase()
    : 'Member'

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return <div className="min-h-screen bg-background text-foreground">
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card p-5 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between"><Link href="/" className="text-xl font-semibold tracking-tight"><span className="text-primary">Hack</span>4Good</Link><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></Button></div>
      <div className="mt-10 flex items-center gap-3 rounded-lg bg-muted/60 p-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{initials}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{displayName}</p><p className="truncate text-xs text-muted-foreground">{role}</p></div></div>
      <nav className="mt-8 flex flex-col gap-1">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"><Icon className="size-4" />{label}</Link>)}</nav>
      <div className="mt-auto flex flex-col gap-1 pt-10"><Link href="/notifications" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"><Bell className="size-4" />Notifications</Link><Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"><Settings className="size-4" />Settings</Link><button onClick={handleSignOut} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><LogOut className="size-4" />Sign out</button></div>
    </aside>
    {open && <button className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur lg:px-8"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></Button><div><p className="text-xs text-muted-foreground">Hack4Good workspace</p><h1 className="font-semibold">{title}</h1></div></div><div className="flex items-center gap-2"><ThemeToggle /><Button variant="ghost" size="icon" asChild aria-label="Notifications"><Link href="/notifications"><Bell /></Link></Button><Button variant="ghost" className="hidden gap-2 sm:flex" asChild><Link href="/profile"><span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials}</span>{displayName}<ChevronDown /></Link></Button></div></header><main className="mx-auto max-w-7xl p-5 lg:p-8">{children}</main></div>
  </div>
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div>{eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}<h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>{description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}</div>{action}</div>
}

export function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-sm text-muted-foreground">{detail}</p></div> }

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) { return <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center"><p className="font-semibold">{title}</p><p className="mt-2 text-sm text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div> }

export function FilterBar({ placeholder = 'Search...', value, onChange }: { placeholder?: string; value?: string; onChange?: (v: string) => void }) { return <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row"><input aria-label={placeholder} placeholder={placeholder} value={value ?? ''} onChange={e => onChange?.(e.target.value)} className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring" /><select className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>All categories</option><option>Climate</option><option>Education</option><option>Health</option></select><select className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>Newest first</option><option>Most popular</option></select></div> }

export function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) { return <section className="rounded-xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-5"><h3 className="font-semibold">{title}</h3>{action}</div><div className="p-5">{children}</div></section> }

export function MockTable({ headers, rows }: { headers: string[]; rows: string[][] }) { return <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b border-border text-muted-foreground">{headers.map(h => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-b border-border last:border-0">{row.map((cell, j) => <td key={j} className="px-3 py-4">{cell}</td>)}</tr>)}</tbody></table></div> }

export function StatusPill({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'success' | 'warning' }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : tone === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-primary/10 text-primary'}`}>{children}</span> }

export function FormShell({ title, children }: { title: string; children: React.ReactNode }) { return <SectionCard title={title}><div className="grid gap-5">{children}</div></SectionCard> }

export function Field({ label, placeholder, type = 'text' }: { label: string; placeholder?: string; type?: string }) { return <label className="grid gap-2 text-sm font-medium">{label}<input type={type} placeholder={placeholder} className="h-10 rounded-md border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label> }

export function RoleTabs() { return <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm"><button className="flex-1 rounded-md bg-background px-3 py-2 font-medium shadow-sm">Participant</button><button className="flex-1 rounded-md px-3 py-2 text-muted-foreground">Organizer</button><button className="flex-1 rounded-md px-3 py-2 text-muted-foreground">Judge</button></div> }

export function ProgressBar({ value }: { value: number }) { return <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} /></div> }

export function ToggleList({ items }: { items: string[] }) { return <div className="grid gap-3">{items.map(item => <label key={item} className="flex items-center justify-between rounded-lg border border-border p-4 text-sm"><span>{item}</span><input type="checkbox" defaultChecked className="size-4 accent-primary" /></label>)}</div> }

export function AccentButton({ href, children }: { href: string; children: React.ReactNode }) { return <Button asChild><Link href={href}>{children}</Link></Button> }

export function ProfileSummary() { const { profile, user } = useAuth(); const initials = getInitials(profile?.full_name); return <div className="flex items-center gap-4"><span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">{initials}</span><div><p className="font-semibold">{profile?.full_name ?? '—'}</p><p className="text-sm text-muted-foreground">{user?.email ?? '—'}</p></div></div> }

export function MobileOnlyMenu() { return null }

export function ChevronIcon() { return <ChevronDown className="size-4" /> }
