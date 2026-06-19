const VISITOR_STORAGE_KEY = 'zn:visitor'
const VISITOR_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i

export function isValidVisitorId(id: string | undefined | null): id is string {
  return Boolean(id && VISITOR_RE.test(id))
}

/** Stable anonymous id — one per browser, used for idempotent likes/views. */
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return ''

  const existing = localStorage.getItem(VISITOR_STORAGE_KEY)
  if (isValidVisitorId(existing)) return existing

  const id = crypto.randomUUID()
  localStorage.setItem(VISITOR_STORAGE_KEY, id)
  return id
}

export function parseVisitorId(raw: unknown): string | null {
  const id = typeof raw === 'string' ? raw.trim() : ''
  return isValidVisitorId(id) ? id : null
}
