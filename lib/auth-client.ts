'use client'

import * as React from 'react'

import { type GcSession } from './auth-types'

const sessionChanged = 'znainik:session-changed'

async function authRequest(action: string, body?: unknown) {
  const response = await fetch(`/api/auth/${action}`, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    ...(body
      ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      : {})
  })
  const result = (await response.json()) as {
    session?: GcSession | null
    error?: string
  }
  if (!response.ok)
    throw new Error(result.error || 'Входът временно е недостъпен.')
  return result.session ?? null
}

export async function signIn(email: string, password: string) {
  const session = await authRequest('login', { email, password })
  window.dispatchEvent(new CustomEvent(sessionChanged, { detail: session }))
}

export async function signUp(email: string, password: string, name: string) {
  const session = await authRequest('register', { email, password, name })
  window.dispatchEvent(new CustomEvent(sessionChanged, { detail: session }))
}

export async function signOut() {
  await authRequest('logout', {})
  window.dispatchEvent(new CustomEvent(sessionChanged, { detail: null }))
}

export function useAuthSession() {
  const [session, setSession] = React.useState<GcSession | null>(null)
  const [isPending, setPending] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    let revision = 0
    async function refresh() {
      const current = ++revision
      try {
        const next = await authRequest('session')
        if (active && current === revision) {
          setSession(next)
          setError(null)
        }
      } catch (err) {
        if (active && current === revision)
          setError(
            err instanceof Error ? err.message : 'Входът временно е недостъпен.'
          )
      } finally {
        if (active && current === revision) setPending(false)
      }
    }
    function changed(event: Event) {
      ++revision
      setSession((event as CustomEvent<GcSession | null>).detail)
      setError(null)
      setPending(false)
    }
    function visible() {
      if (document.visibilityState === 'visible') void refresh()
    }
    window.addEventListener(sessionChanged, changed)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', visible)
    void refresh()
    return () => {
      active = false
      window.removeEventListener(sessionChanged, changed)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [])

  return { session, isPending, error }
}
