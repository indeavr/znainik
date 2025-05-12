import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import styles from '@/styles/Admin.module.css'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationBody, setNotificationBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (response.ok) {
        setIsAuthenticated(true)
        setError('')
        // Store auth token instead of a boolean
        localStorage.setItem('adminToken', data.token)
      } else {
        setError(data.error || 'Invalid password')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Authentication failed')
    }
  }

  const handleSendNotification = async (e) => {
    e.preventDefault()

    if (!notificationTitle || !notificationBody) {
      setError('Title and body are required')
      return
    }

    setIsSending(true)
    setSendResult(null)
    setError('')

    try {
      const token = localStorage.getItem('adminToken')

      const response = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: notificationTitle,
          body: notificationBody
        })
      })

      const result = await response.json()

      if (response.ok) {
        setSendResult(result)
        setNotificationTitle('')
        setNotificationBody('')
      } else {
        if (response.status === 401) {
          // Token expired or invalid
          setIsAuthenticated(false)
          localStorage.removeItem('adminToken')
          setError('Session expired. Please login again.')
        } else {
          setError(result.error || 'Failed to send notification')
        }
      }
    } catch (err) {
      console.error('Error sending notification:', err)
      setError('Failed to send notification')
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    // Check if user is authenticated with token
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken')

      if (!token) {
        setIsAuthenticated(false)
        return
      }

      try {
        const response = await fetch('/api/admin/verify', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          // Token invalid or expired
          localStorage.removeItem('adminToken')
          setIsAuthenticated(false)
        }
      } catch (err) {
        console.error('Auth verification error:', err)
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <div className={styles.container}>
      <Head>
        <title>Admin | Знайник</title>
        <meta name='description' content='Admin panel for Знайник' />
        <meta name='robots' content='noindex, nofollow' />
      </Head>

      <header className={styles.header}>
        <h1>Знайник Admin</h1>
        {isAuthenticated && (
          <button
            className={styles.backButton}
            onClick={() => router.push('/')}
          >
            Back to Site
          </button>
        )}
      </header>

      <main className={styles.main}>
        {!isAuthenticated ? (
          <div className={styles.loginContainer}>
            <h2>Login</h2>
            {error && <p className={styles.error}>{error}</p>}
            <form onSubmit={handleLogin} className={styles.loginForm}>
              <div className={styles.formGroup}>
                <label htmlFor='password'>Admin Password</label>
                <input
                  type='password'
                  id='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type='submit' className={styles.button}>
                Login
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.adminPanel}>
            <section className={styles.notificationSection}>
              <h2>Send Push Notification</h2>
              <p className={styles.sectionDescription}>
                Use this form to send a push notification to all subscribers
                when you publish a new article.
              </p>

              {error && <p className={styles.error}>{error}</p>}
              {sendResult && sendResult.success && (
                <p className={styles.success}>
                  Notification sent successfully to {sendResult.count}{' '}
                  subscribers!
                  {sendResult.failed > 0 &&
                    ` (${sendResult.failed} failed deliveries were removed from the subscription list)`}
                </p>
              )}

              <form
                onSubmit={handleSendNotification}
                className={styles.notificationForm}
              >
                <div className={styles.formGroup}>
                  <label htmlFor='title'>Notification Title</label>
                  <input
                    type='text'
                    id='title'
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    placeholder='New Article Published!'
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor='body'>Notification Body</label>
                  <textarea
                    id='body'
                    value={notificationBody}
                    onChange={(e) => setNotificationBody(e.target.value)}
                    placeholder='Check out our latest article on...'
                    rows={4}
                    required
                  />
                </div>

                <button
                  type='submit'
                  className={styles.button}
                  disabled={isSending}
                >
                  {isSending ? 'Sending...' : 'Send Notification'}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
