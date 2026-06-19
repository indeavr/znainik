import * as React from 'react'

import { authClient } from '@/lib/auth-client'

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
        const result = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split('@')[0] || 'Читател'
        })
        if (result.error) {
          setError(result.error.message ?? 'Регистрацията не успя')
          return
        }
      } else {
        const result = await authClient.signIn.email({ email, password })
        if (result.error) {
          setError(result.error.message ?? 'Грешен имейл или парола')
          return
        }
      }
      onSuccess?.()
    } catch {
      setError('Възникна грешка. Опитайте отново.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='zn-comments-auth'>
      <div className='zn-comments-panel-head'>
        <p className='zn-comments-auth-lead'>
          Влезте, за да се присъедините към разговора.
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='минимум 8 символа'
          />
        </label>

        {error && <p className='zn-comments-error'>{error}</p>}

        <button
          type='submit'
          className='zn-comments-submit'
          disabled={loading}
        >
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
