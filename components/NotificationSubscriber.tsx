import { useState, useEffect } from 'react';
import styles from '@/styles/NotificationSubscriber.module.css';

export default function NotificationSubscriber() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      return;
    }

    // Check if mobile device
    const userAgent = navigator.userAgent;
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    setIsMobile(mobileCheck);
    
    // Check if iOS
    const iosCheck = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    setIsIOS(iosCheck);

    // Check subscription status
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError('Failed to check notification status');
    }
  };

  const subscribe = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;

      // Get public key
      const response = await fetch('/api/vapid-public-key');
      const { publicKey } = await response.json();

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Send subscription to server
      const subscribeResponse = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });

      if (!subscribeResponse.ok) {
        throw new Error('Failed to save subscription');
      }

      setIsSubscribed(true);
    } catch (err) {
      console.error('Error subscribing to notifications:', err);
      setError(`Failed to subscribe: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    try {
      setIsLoading(true);
      setError('');

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Send unsubscribe request to server
        await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription)
        });

        // Unsubscribe on client
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error('Error unsubscribing from notifications:', err);
      setError('Failed to unsubscribe');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert base64 to Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (!isSupported) {
    return (
      <div className={styles.container}>
        <p className={styles.unsupported}>
          Push notifications are not supported in your browser.
        </p>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className={styles.container}>
        <p className={styles.unsupported}>
          Push notifications are not supported on iOS devices. Please use a desktop browser.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && <p className={styles.error}>{error}</p>}
      
      {isMobile && !isIOS && (
        <p className={styles.mobileNote}>
          For best experience on Android, please add this site to your home screen first.
        </p>
      )}
      
      <button
        className={`${styles.button} ${isSubscribed ? styles.unsubscribeButton : styles.subscribeButton}`}
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : isSubscribed ? 'Unsubscribe from Notifications' : 'Subscribe to Notifications'}
      </button>
      
      {isSubscribed && (
        <p className={styles.subscribedMessage}>
          You're subscribed to notifications!
        </p>
      )}
    </div>
  );
}