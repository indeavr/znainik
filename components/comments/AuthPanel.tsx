import * as React from 'react'

import { signIn, signUp } from '@/lib/auth-client'

type AuthMode = 'sign-in' | 'sign-up'

export function AuthPanel({
  onSuccess,
  onCancel
}: {
  onSuccess?: () => void
  onCancel?: () => void
}) {
  const [mode, setMode] = React.useState<AuthMode>('sign-in')
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'sign-up') {
        await signUp(
          email,
          password,
          name.trim() || email.split('@')[0] || 'Читател'
        )
      } else {
        await signIn(email, password)
      }
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Възникна грешка. Опитайте отново.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='zn-comments-auth'>
      <div className='zn-comments-panel-head'>
        <p className='zn-comments-auth-lead'>
          Влез със своя профил в Guardian Circle, за да оставиш коментар.
        </p>
        {onCancel && (
          <button
            type='button'
            className='zn-comments-cancel'
            onClick={onCancel}
          >
            Отказ
          </button>
        )}
      </div>

      <div className='zn-comments-auth-tabs' role='tablist'>
        <button
          type='button'
          role='tab'
          aria-selected={mode === 'sign-in'}
          className={mode === 'sign-in' ? 'is-active' : undefined}
          onClick={() => setMode('sign-in')}
        >
          Вход
        </button>
        <button
          type='button'
          role='tab'
          aria-selected={mode === 'sign-up'}
          className={mode === 'sign-up' ? 'is-active' : undefined}
          onClick={() => setMode('sign-up')}
        >
          Регистрация
        </button>
      </div>

      <form className='zn-comments-auth-form' onSubmit={onSubmit}>
        {mode === 'sign-up' && (
          <label className='zn-comments-field'>
            <span>Име</span>
            <input
              type='text'
              autoComplete='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Как да ви виждаме'
            />
          </label>
        )}

        <label className='zn-comments-field'>
          <span>Имейл</span>
          <input
            type='email'
            autoComplete='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='you@example.com'
          />
        </label>

        <label className='zn-comments-field'>
          <span>Парола</span>
          <input
            type='password'
            autoComplete={
              mode === 'sign-up' ? 'new-password' : 'current-password'
            }
            required
            minLength={mode === 'sign-up' ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              mode === 'sign-up' ? 'минимум 8 символа' : 'Твоята парола'
            }
          />
        </label>

        {mode === 'sign-in' ? (
          <a className='zn-comments-cancel' href='/api/auth/recovery'>
            Забравена парола?
          </a>
        ) : (
          <p className='zn-comments-auth-lead'>
            Създаваш общ профил за Guardian Circle, Азайра и HWA.
          </p>
        )}
        {error && (
          <p className='zn-comments-error' role='alert'>
            {error}
          </p>
        )}

        <button type='submit' className='zn-comments-submit' disabled={loading}>
          {loading
            ? 'Момент...'
            : mode === 'sign-up'
              ? 'Създай профил'
              : 'Влез'}
        </button>
      </form>
    </div>
  )
}
