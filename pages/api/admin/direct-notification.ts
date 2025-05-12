import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import webpush from 'web-push'
import jwt from 'jsonwebtoken'

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production'

// Set VAPID details for web push
webpush.setVapidDetails(
  `mailto:${process.env.CONTACT_EMAIL || 'example@example.com'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

// Path to subscriptions file
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'subscriptions.json')

// Middleware to verify authentication
const verifyAuth = (req: NextApiRequest): boolean => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false
    }
    
    const token = authHeader.substring(7)
    jwt.verify(token, JWT_SECRET)
    
    return true
  } catch (error) {
    return false
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify authentication
  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Check if subscriptions file exists
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
      return res.status(200).json({ 
        success: true, 
        message: 'No subscribers found'
      })
    }

    // Read subscriptions
    const subscriptionsRaw = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8')
    let subscriptions = []
    
    try {
      subscriptions = JSON.parse(subscriptionsRaw)
    } catch (e) {
      console.error('Error parsing subscriptions file:', e)
      return res.status(200).json({ 
        success: true, 
        message: 'No valid subscribers found'
      })
    }

    if (!subscriptions.length) {
      return res.status(200).json({ 
        success: true, 
        message: 'No subscribers yet'
      })
    }

    // Use a very simple payload
    const notificationPayload = JSON.stringify({
      title: 'Direct Test Notification',
      body: 'This is a direct test notification from Знайник'
    })

    console.log('Sending direct test notification to', subscriptions.length, 'subscribers');
    
    // Send to first subscription only for testing
    const firstSubscription = subscriptions[0];
    console.log('Target subscription:', firstSubscription.endpoint);
    
    try {
      const pushResult = await webpush.sendNotification(firstSubscription, notificationPayload);
      console.log('Push result:', pushResult.statusCode);
      
      return res.status(200).json({ 
        success: true, 
        message: `Direct notification sent with status ${pushResult.statusCode}`
      });
    } catch (error) {
      console.error('Push error:', error);
      return res.status(500).json({ 
        error: `Push error: ${error.message || 'Unknown error'}`
      });
    }
  } catch (error) {
    console.error('Error sending direct notification:', error)
    return res.status(500).json({ error: 'Failed to send direct notification' })
  }
}