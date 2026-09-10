/**
 * Base API client.
 *
 * Attaches the Supabase access_token as a Bearer header on every request.
 * This works cross-origin (frontend :3001 → backend :3000) and same-origin.
 * Cookies alone are unreliable cross-origin even with credentials:'include',
 * so the backend reads the Authorization header via getAuthenticatedActor().
 */

import { createClient } from '@/lib/supabase/client'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      /* ignore */
    }
    const message =
      (body as { error?: string } | null)?.error ??
      `Request failed: ${res.status} ${res.statusText}`
    throw new ApiError(res.status, message, body)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export const api = {
  get<T>(path: string) {
    return request<T>(path)
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },
  delete<T = void>(path: string) {
    return request<T>(path, { method: 'DELETE' })
  },
}
