import * as React from 'react'

import { authClient } from '@/lib/auth-client'
import { type Comment , COMMENT_MAX_LENGTH } from '@/lib/comments'
import { normalizeEngagementPageId } from '@/lib/engagement'

import { AuthPanel } from './AuthPanel'
import { CommentList } from './CommentList'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin', ...init })
  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`)
  }
  return data
}

export function CommentSection({ pageId }: { pageId: string }) {
  const normalizedId = React.useMemo(
    () => normalizeEngagementPageId(pageId),
    [pageId]
  )
  const { data: session, isPending } = authClient.useSession()

  const [comments, setComments] = React.useState<Comment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [unavailable, setUnavailable] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const loadComments = React.useCallback(async () => {
    if (!normalizedId) return
    setLoading(true)
    try {
      const data = await fetchJson<{ comments: Comment[] }>(
        `/api/comments?pageId=${encodeURIComponent(normalizedId)}`
      )
      setComments(data.comments ?? [])
      setUnavailable(false)
    } catch {
      setUnavailable(true)
      setComments([])
    } finally {
      setLoading(false)
    }
  }, [normalizedId])

  React.useEffect(() => {
    void loadComments()
  }, [loadComments])

  async function onSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || submitting) return

    setSubmitting(true)
    setFormError(null)
    try {
      const data = await fetchJson<{ comment: Comment }>('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: normalizedId, body: draft })
      })
      setComments((prev) => [...prev, data.comment])
      setDraft('')
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Неуспешно изпращане'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: string) {
    try {
      await fetchJson(`/api/comments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      })
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch {
      /* ignore */
    }
  }

  async function onSignOut() {
    await authClient.signOut()
  }

  const user = session?.user
  const remaining = COMMENT_MAX_LENGTH - draft.length

  return (
    <section className='zn-comments zn-article-extras' id='comments'>
      <header className='zn-comments-head'>
        <div>
          <span className='zn-comments-eyebrow'>✦ Общност</span>
          <h2 className='zn-comments-title'>Коментари</h2>
        </div>
        {comments.length > 0 && (
          <span className='zn-comments-count'>{comments.length}</span>
        )}
      </header>

      {unavailable ? (
        <p className='zn-comments-unavailable'>
          Коментарите изискват Vercel Postgres и Neon Auth. Свържете базата,
          активирайте Auth в Neon Console и задайте{' '}
          <code>NEON_AUTH_BASE_URL</code>.
        </p>
      ) : (
        <>
          {isPending ? (
            <p className='zn-comments-loading'>Зареждане...</p>
          ) : user ? (
            <div className='zn-comments-compose-wrap'>
              <div className='zn-comments-user'>
                <span>
                  Здравей, <strong>{user.name || user.email}</strong>
                </span>
                <button
                  type='button'
                  className='zn-comments-signout'
                  onClick={onSignOut}
                >
                  Изход
                </button>
              </div>
              <form className='zn-comments-compose' onSubmit={onSubmitComment}>
                <label className='zn-comments-field zn-comments-field-grow'>
                  <span className='sr-only'>Вашият коментар</span>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder='Споделете мисъл, въпрос или благодарност...'
                    rows={4}
                    maxLength={COMMENT_MAX_LENGTH}
                    required
                  />
                </label>
                <div className='zn-comments-compose-actions'>
                  <span className='zn-comments-remaining'>{remaining}</span>
                  {formError && (
                    <span className='zn-comments-error'>{formError}</span>
                  )}
                  <button
                    type='submit'
                    className='zn-comments-submit'
                    disabled={submitting || !draft.trim()}
                  >
                    {submitting ? 'Изпращане...' : 'Публикувай'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <AuthPanel onSuccess={loadComments} />
          )}

          {loading ? (
            <p className='zn-comments-loading'>Зареждане на коментари...</p>
          ) : (
            <CommentList
              comments={comments}
              currentUserId={user?.id}
              onDelete={onDelete}
            />
          )}
        </>
      )}
    </section>
  )
}
