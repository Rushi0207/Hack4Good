'use client'

import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

const modes = ['light', 'dark', 'system'] as const
type Theme = (typeof modes)[number]

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = window.localStorage.getItem('hack4good-theme') as Theme | null
    const initial = stored && modes.includes(stored) ? stored : 'system'
    setTheme(initial)
    applyTheme(initial)
  }, [])

  function applyTheme(nextTheme: Theme) {
    const isDark = nextTheme === 'dark' || (nextTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.classList.toggle('light', !isDark)
  }

  function cycleTheme() {
    const nextTheme = modes[(modes.indexOf(theme) + 1) % modes.length]
    setTheme(nextTheme)
    window.localStorage.setItem('hack4good-theme', nextTheme)
    applyTheme(nextTheme)
  }

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label={`Theme: ${theme}. Click to change`} className="size-9 text-muted-foreground hover:text-foreground">
      <Icon data-icon="inline-start" />
    </Button>
  )
}

export function ThemeScript() {
  return (
    <script dangerouslySetInnerHTML={{ __html: `(() => { const t = localStorage.getItem('hack4good-theme'); const d = t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches) || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.classList.toggle('dark', d); document.documentElement.classList.toggle('light', !d); })()` }} />
  )
}
