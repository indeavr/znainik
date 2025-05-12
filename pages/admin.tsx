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
  const [notificationPermission, setNotificationPermission] = useState('')
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

  const checkNotificationPermission = () => {
    if (!('Notification' in window)) {
      return 'Notifications not supported'
    }
    return Notification.permission
  }

  const testLocalNotification = () => {
    if (!('Notification' in window)) {
      setError('Notifications are not supported in this browser')
      return
    }
    
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification('Test Notification', {
          body: 'This is a test notification from the browser',
          icon: '/favicon.ico'
        })
        
        notification.onclick = () => {
          console.log('Notification clicked')
          notification.close()
        }
        
        setSendResult({
          success: true,
          message: 'Browser notification created successfully. Check your system notifications.'
        })
      } catch (error) {
        console.error('Error creating notification:', error)
        setError(`Error creating notification: ${error.message}`)
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission)
        if (permission === 'granted') {
          testLocalNotification()
        } else {
          setError('Notification permission denied')
        }
      })
    } else {
      setError('Notification permission denied. Please enable notifications in your browser settings.')
    }
  }

  const updateServiceWorker = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()
          setSendResult({
            success: true,
            message: 'Service worker updated successfully'
          })
        } else {
          const newRegistration = await navigator.serviceWorker.register('/service-worker.js')
          setSendResult({
            success: true,
            message: 'Service worker registered successfully'
          })
        }
      } else {
        setError('Service workers not supported in this browser')
      }
    } catch (error) {
      console.error('Error updating service worker:', error)
      setError(`Error updating service worker: ${error.message}`)
    }
  }

  const getBrowserInfo = () => {
    if (typeof window === 'undefined') return 'Server rendering';
    
    const userAgent = navigator.userAgent;
    let browserName = "Unknown";
    
    if (userAgent.match(/chrome|chromium|crios/i)) {
      browserName = "Chrome";
    } else if (userAgent.match(/firefox|fxios/i)) {
      browserName = "Firefox";
    } else if (userAgent.match(/safari/i)) {
      browserName = "Safari";
    } else if (userAgent.match(/opr\//i)) {
      browserName = "Opera";
    } else if (userAgent.match(/edg/i)) {
      browserName = "Edge";
    }
    
    return browserName;
  };

  const sendDirectNotification = async () => {
    try {
      setIsSending(true);
      setError('');
      
      // This will send a notification directly from the server
      // without going through the service worker
      const response = await fetch('/api/admin/direct-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSendResult({
          success: true,
          message: 'Direct notification test completed. Check console for details.'
        });
      } else {
        setError(result.error || 'Failed to send direct notification');
      }
    } catch (error) {
      console.error('Error sending direct notification:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

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

    // Check notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
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
                  {sendResult.message || `Notification sent successfully to ${sendResult.count} subscribers!`}
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

            <div className={styles.testNotificationContainer}>
              <h3>Troubleshooting</h3>
              
              <div className={styles.permissionInfo}>
                <p>Current notification permission: <strong>{notificationPermission}</strong></p>
                {notificationPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={() => {
                      Notification.requestPermission().then(permission => {
                        setNotificationPermission(permission)
                      })
                    }}
                    className={styles.secondaryButton}
                  >
                    Request Permission
                  </button>
                )}
              </div>
              
              <div className={styles.buttonGroup}>
                <button 
                  type="button"
                  onClick={testLocalNotification}
                  className={styles.secondaryButton}
                >
                  Test Browser Notification
                </button>
                
                <button
                  type="button"
                  onClick={updateServiceWorker}
                  className={styles.secondaryButton}
                >
                  Update Service Worker
                </button>
                
                <button
                  type="button"
                  onClick={sendDirectNotification}
                  className={styles.secondaryButton}
                >
                  Test Direct Notification
                </button>
              </div>
              
              <div className={styles.browserInfo}>
                <p>Browser detected: <strong>{getBrowserInfo()}</strong></p>
                <p>Common issues by browser:</p>
                <ul>
                  <li><strong>Chrome:</strong> Check chrome://settings/content/notifications</li>
                  <li><strong>Safari:</strong> Check System Preferences &gt; Notifications &gt; Safari</li>
                  <li><strong>Firefox:</strong> Check about:preferences#privacy &gt; Permissions &gt; Notifications</li>
                </ul>
                <p>Try these steps:</p>
                <ol>
                  <li>Restart your browser</li>
                  <li>Check if notifications are blocked in system settings</li>
                  <li>Try in a private/incognito window</li>
                  <li>Try a different browser</li>
                </ol>
              </div>
              
              <p className={styles.helperText}>
                These tools help diagnose notification issues. If notifications don't appear, try updating the service worker and checking your browser settings.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
