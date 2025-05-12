import { useState, useEffect } from 'react'
import styles from '@/styles/NotificationSubscriber.module.css'

export default function NotificationSubscriber() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if push notifications are supported
    const checkSupport = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSupported(false)
        return
      }

      setIsSupported(true)

      // Register service worker
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js')
        
        // Check if already subscribed
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (err) {
        console.error('Service worker registration failed:', err)
        setError('Failed to initialize notifications')
      }
    }

    checkSupport()
  }, [])

  const subscribe = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        )
      })

      // Send subscription to server
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription }),
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setIsSubscribed(true)
    } catch (err) {
      console.error('Subscription error:', err)
      setError('Failed to subscribe to notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready
      
      // Get current subscription
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        // Unsubscribe
        await subscription.unsubscribe()
        setIsSubscribed(false)
      }
    } catch (err) {
      console.error('Unsubscribe error:', err)
      setError('Failed to unsubscribe')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to convert base64 to Uint8Array
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }

  if (!isSupported) {
    return null // Don't show anything if notifications aren't supported
  }

  return (
    <div className={styles.container}>
      {error && <p className={styles.error}>{error}</p>}
      
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        className={`${styles.button} ${isSubscribed ? styles.unsubscribeButton : styles.subscribeButton}`}
      >
        {isLoading ? 'Processing...' : isSubscribed ? 'Unsubscribe from Updates' : 'Subscribe to Updates'}
      </button>
    </div>
  )
}