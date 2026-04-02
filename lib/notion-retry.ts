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
  const retries = options?.retries ?? 8
  let delay = options?.baseDelayMs ?? 2500
  const maxDelay = options?.maxDelayMs ?? 90_000
  let lastErr: unknown

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isNotionRateLimitedError(err) || attempt === retries - 1) {
        throw err
      }
      const jitter = Math.random() * 1000
      const waitMs = delay + jitter
      await new Promise<void>((resolve) => {
        setTimeout(resolve, waitMs)
      })
      delay = Math.min(Math.floor(delay * 1.65), maxDelay)
    }
  }

  throw lastErr
}
