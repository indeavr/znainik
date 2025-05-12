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
    const { title, body } = req.body

    // Validate request
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' })
    }

    // Check if subscriptions file exists
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
      return res.status(200).json({ 
        success: true, 
        count: 0, 
        message: 'No subscribers yet' 
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
        count: 0, 
        message: 'No valid subscribers found' 
      })
    }

    if (!subscriptions.length) {
      return res.status(200).json({ 
        success: true, 
        count: 0, 
        message: 'No subscribers yet' 
      })
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      url: '/', // Add explicit URL to open
      timestamp: Date.now()
    });
    console.log('Sending notification payload:', notificationPayload);
    
    // Send notifications and track results
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const result = await webpush.sendNotification(subscription, notificationPayload);
          console.log('Notification sent successfully to:', subscription.endpoint);
          return result;
        } catch (error) {
          console.error('Error sending to subscription:', subscription.endpoint, error);
          throw error;
        }
      })
    );

    // Count successful notifications
    const successCount = results.filter(r => r.status === 'fulfilled').length
    
    // Filter out expired or invalid subscriptions
    const validSubscriptions = subscriptions.filter((_, index) => 
      results[index].status === 'fulfilled'
    )

    // Update subscriptions file if some were invalid
    if (validSubscriptions.length !== subscriptions.length) {
      fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(validSubscriptions))
    }

    // Return success response
    return res.status(200).json({ 
      success: true, 
      count: successCount,
      total: subscriptions.length,
      failed: subscriptions.length - successCount
    })
  } catch (error) {
    console.error('Error sending notifications:', error)
    return res.status(500).json({ error: 'Failed to send notifications' })
  }
}