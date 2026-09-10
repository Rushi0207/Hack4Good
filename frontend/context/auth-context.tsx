'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/api/types'
import { profileApi } from '@/lib/api/profile'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()

  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  })

  const loadProfile = useCallback(async () => {
    try {
      const profile = await profileApi.me()

      // If the provisioning trigger set the fallback name "New user",
      // patch it with the real name from auth.users metadata on first load.
      if (profile.full_name === 'New user') {
        const { data } = await supabase.auth.getUser()
        const metaName: string | undefined =
          data.user?.user_metadata?.full_name ?? data.user?.user_metadata?.name
        if (metaName && metaName.trim()) {
          try {
            const patched = await profileApi.update({ full_name: metaName.trim() })
            setState((s) => ({ ...s, profile: patched }))
            return
          } catch {
            // patch failed — just show what we have
          }
        }
      }

      setState((s) => ({ ...s, profile }))
    } catch {
      setState((s) => ({ ...s, profile: null }))
    }
  }, [supabase])

  useEffect(() => {
    // Initialise from existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => ({
        ...s,
        session,
        user: session?.user ?? null,
        loading: false,
      }))
      if (session) loadProfile()
    })

    // Listen for auth changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({
        ...s,
        session,
        user: session?.user ?? null,
        loading: false,
      }))
      if (session) {
        loadProfile()
      } else {
        setState((s) => ({ ...s, profile: null }))
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error?.message ?? null }
    },
    [supabase],
  )

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        // Key must be "full_name" — matches the provisioning trigger:
        // coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'New user')
        options: { data: { full_name: name } },
      })
      return { error: error?.message ?? null }
    },
    [supabase],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    await loadProfile()
  }, [loadProfile])

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** Returns initials from a display name, e.g. "Alex Johnson" → "AJ" */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}