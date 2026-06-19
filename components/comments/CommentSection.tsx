import * as React from 'react'

import { authClient } from '@/lib/auth-client'
import { type Comment, COMMENT_MAX_LENGTH } from '@/lib/comments'
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

function userInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function CommentSection({ pageId }: { pageId: string }) {
  const normalizedId = React.useMemo(
    () => normalizeEngagementPageId(pageId),
    [pageId]
  )
  const { data: session, isPending } = authClient.useSession()

  const [comments, setComments] = React.useState<Comment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [composeOpen, setComposeOpen] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)

  const loadComments = React.useCallback(async () => {
    if (!normalizedId) return
    setLoading(true)
    try {
      const data = await fetchJson<{ comments: Comment[] }>(
        `/api/comments?pageId=${encodeURIComponent(normalizedId)}`
      )
      setComments(data.comments ?? [])
    } catch (err: unknown) {
      console.error('[znainik/comments] failed to load comments', err)
      setComments([])
    } finally {
      setLoading(false)
    }
  }, [normalizedId])

  React.useEffect(() => {
    void loadComments()
  }, [loadComments])

  React.useEffect(() => {
    if (composeOpen && session?.user && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [composeOpen, session?.user])

  React.useEffect(() => {
    if (!composeOpen) return

    function onPointerDown(e: PointerEvent) {
      const panel = panelRef.current
      if (panel && !panel.contains(e.target as Node)) {
        setComposeOpen(false)
        setFormError(null)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [composeOpen])

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
      setComposeOpen(false)
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
    setComposeOpen(false)
    setDraft('')
  }

  function openCompose() {
    setFormError(null)
    setComposeOpen(true)
  }

  function closeCompose() {
    setComposeOpen(false)
    setFormError(null)
  }

  function onAuthSuccess() {
    void loadComments()
    setComposeOpen(true)
  }

  const user = session?.user
  const displayName = user?.name || user?.email?.split('@')[0] || 'Читател'
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

      {!isPending && (
        <div className='zn-comments-compose-area' ref={panelRef}>
          <button
            type='button'
            className={`zn-comments-trigger${composeOpen ? ' is-open' : ''}`}
            onClick={openCompose}
            aria-expanded={composeOpen}
            aria-controls='zn-comments-panel'
          >
            {user ? (
              <>
                <span className='zn-comments-trigger-avatar' aria-hidden='true'>
                  {user.image ? (
                    <img src={user.image} alt='' />
                  ) : (
                    userInitials(displayName)
                  )}
                </span>
                <span className='zn-comments-trigger-text'>
                  Споделете мисъл, въпрос или благодарност...
                </span>
              </>
            ) : (
              <span className='zn-comments-trigger-text'>
                Оставете коментар...
              </span>
            )}
          </button>

          {composeOpen && (
            <div className='zn-comments-panel' id='zn-comments-panel'>
              {user ? (
                <form
                  className='zn-comments-compose'
                  onSubmit={onSubmitComment}
                >
                  <div className='zn-comments-panel-head'>
                    <span className='zn-comments-panel-user'>
                      Като <strong>{displayName}</strong>
                    </span>
                    <button
                      type='button'
                      className='zn-comments-signout'
                      onClick={onSignOut}
                    >
                      Изход
                    </button>
                  </div>

                  <label className='zn-comments-field zn-comments-field-grow'>
                    <span className='sr-only'>Вашият коментар</span>
                    <textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder='Вашият коментар...'
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
                      type='button'
                      className='zn-comments-cancel'
                      onClick={closeCompose}
                    >
                      Отказ
                    </button>
                    <button
                      type='submit'
                      className='zn-comments-submit'
                      disabled={submitting || !draft.trim()}
                    >
                      {submitting ? 'Изпращане...' : 'Публикувай'}
                    </button>
                  </div>
                </form>
              ) : (
                <AuthPanel onSuccess={onAuthSuccess} onCancel={closeCompose} />
              )}
            </div>
          )}
        </div>
      )}

      {isPending || loading ? (
        <p className='zn-comments-loading'>Зареждане на коментари...</p>
      ) : (
        <CommentList
          comments={comments}
          currentUserId={user?.id}
          onDelete={onDelete}
        />
      )}
    </section>
  )
}
