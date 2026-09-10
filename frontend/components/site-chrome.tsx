'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Bell, ChevronDown, Leaf, Menu, Search, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth, getInitials } from '@/context/auth-context'

const links = ['Hackathons', 'Problems', 'About', 'Contact']

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  const initials = getInitials(profile?.full_name ?? user?.email)
  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Account'

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Hack4Good home">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Hack4Good</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link}
              href={`/${link.toLowerCase()}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link}
            </Link>
          ))}
        </nav>

        {/* Desktop right side */}
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search data-icon="inline-start" />
          </Button>
          <ThemeToggle />

          {/* Not loading + not logged in → show login/signup */}
          {!loading && !user && (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">
                  Sign up <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </>
          )}

          {/* Logged in → show user avatar + dropdown */}
          {!loading && user && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-muted"
                aria-expanded={dropdownOpen}
                aria-label="User menu"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </span>
                {displayName}
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>

              {dropdownOpen && (
                <>
                  <button
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                    aria-label="Close menu"
                    tabIndex={-1}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm hover:bg-muted"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm hover:bg-muted"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/notifications"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted"
                    >
                      <Bell className="size-4" /> Notifications
                    </Link>
                    <div className="border-t border-border" />
                    <button
                      onClick={() => { setDropdownOpen(false); handleSignOut() }}
                      className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-muted"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile right side */}
        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X data-icon="inline-start" /> : <Menu data-icon="inline-start" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border bg-background px-5 py-5 lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-5" aria-label="Mobile navigation">
            {links.map((link) => (
              <Link
                key={link}
                href={`/${link.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className="text-base font-medium"
              >
                {link}
              </Link>
            ))}

            <div className="flex flex-col gap-2 border-t pt-5">
              {!loading && !user && (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register" onClick={() => setMenuOpen(false)}>Sign up</Link>
                  </Button>
                </>
              )}
              {!loading && user && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="text-base font-medium text-primary"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); handleSignOut() }}
                    className="text-left text-base font-medium text-destructive"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="size-4" />
            </span>
            <span className="font-semibold">Hack4Good</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">Ideas for a Better Tomorrow</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
          {['Privacy', 'Terms', 'Contact', 'Community guidelines'].map((item) => (
            <Link key={item} href="#" className="hover:text-foreground">{item}</Link>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">© 2026 Hack4Good</p>
      </div>
    </footer>
  )
}
