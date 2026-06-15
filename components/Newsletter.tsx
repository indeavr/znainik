import * as React from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

/**
 * Email capture for the newsletter. Posts to /api/subscribe which persists the
 * address. Gracefully shows inline status without leaving the page.
 */
export function Newsletter() {
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<Status>('idle')
  const [message, setMessage] = React.useState('')

  const onSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (status === 'loading') return

      setStatus('loading')
      setMessage('')

      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email })
        })
        const data = (await res.json()) as { error?: string }

        if (res.ok) {
          setStatus('success')
          setMessage('Благодарим! Вече си част от Знайник.')
          setEmail('')
        } else {
          setStatus('error')
          setMessage(data.error || 'Нещо се обърка. Опитай отново.')
        }
      } catch {
        setStatus('error')
        setMessage('Нещо се обърка. Опитай отново.')
      }
    },
    [email, status]
  )

  return (
    <section className='zn-container'>
      <div className='zn-newsletter'>
        <h2 className='zn-newsletter-title'>Получавай нови Есенции</h2>
        <p className='zn-newsletter-sub'>
          Абонирай се и получавай новите статии и прозрения директно в пощата
          си. Без спам — само знание.
        </p>

        <form className='zn-newsletter-form' onSubmit={onSubmit}>
          <input
            className='zn-input'
            type='email'
            required
            placeholder='твоят@имейл.bg'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label='Имейл адрес'
          />
          <button
            className='zn-btn'
            type='submit'
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Изпращане…' : 'Абонирай се'}
          </button>
        </form>

        <div
          className='zn-newsletter-note'
          style={{
            color:
              status === 'error' ? 'var(--brand-2)' : 'var(--fg-color-3)'
          }}
          role='status'
        >
          {message}
        </div>
      </div>
    </section>
  )
}
