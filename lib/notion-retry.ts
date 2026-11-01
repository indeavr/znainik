/** Detect rate-limit responses from notion-client / ofetch. */
export function isNotionRateLimitedError(err: unknown): boolean {
  if (err == null || typeof err !== 'object') {
    return false
  }
  const e = err as Record<string, unknown>
  const msg = String(e.message ?? e.statusMessage ?? e.statusText ?? '')
  if (msg.includes('429') || msg.toLowerCase().includes('too many requests')) {
    return true
  }
  if (e.status === 429 || e.statusCode === 429) {
    return true
  }
  return false
}

/** ofetch retains the response headers on FetchError.response. */
export function notionRetryAfterMs(err: unknown): number | undefined {
  const response = (err as { response?: { headers?: Headers } } | null)
    ?.response
  const value = response?.headers?.get?.('retry-after')
  if (!value?.trim()) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return seconds >= 0 ? seconds * 1000 : undefined
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined
}

/**
 * Retry a Notion API call when Notion returns 429 (common during sitemap / build bursts).
 */
export async function withNotionRetry<T>(
  fn: () => Promise<T>,
  options?: {
    retries?: number
    baseDelayMs?: number
    maxDelayMs?: number
  }
): Promise<T> {
  const building = process.env.NEXT_PHASE === 'phase-production-build'
  const retries = options?.retries ?? (building ? 4 : 3)
  let delay = options?.baseDelayMs ?? (building ? 10_000 : 1000)
  const maxDelay = options?.maxDelayMs ?? (building ? 30_000 : 5000)
  let lastErr: unknown

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isNotionRateLimitedError(err) || attempt === retries - 1) {
        throw err
      }
      const retryAfter = notionRetryAfterMs(err)
      // Fail instead of retrying earlier than an excessive upstream cooldown.
      if (retryAfter != null && retryAfter > 60_000) throw err
      const jitter = Math.random() * 1000
      const waitMs = Math.min(60_000, Math.max(retryAfter ?? 0, delay + jitter))
      await new Promise<void>((resolve) => {
        setTimeout(resolve, waitMs)
      })
      delay = Math.min(Math.floor(delay * 1.65), maxDelay)
    }
  }

  throw lastErr
}
