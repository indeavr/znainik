import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import webpush from 'web-push'

// Set VAPID details for web push
webpush.setVapidDetails(
  `mailto:${process.env.CONTACT_EMAIL || 'example@example.com'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

// Path to subscriptions file
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'subscriptions.json')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { title, body } = req.body

    // Validate request
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' })
    }

    // Check if subscriptions file exists
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
      return res.status(200).json({ success: true, count: 0, message: 'No subscribers yet' })
    }

    // Read subscriptions
    const subscriptionsRaw = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8')
    const subscriptions = JSON.parse(subscriptionsRaw)

    if (!subscriptions.length) {
      return res.status(200).json({ success: true, count: 0, message: 'No subscribers yet' })
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      timestamp: Date.now()
    })

    // Send notifications and track invalid subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(subscription => 
        webpush.sendNotification(subscription, notificationPayload)
      )
    )

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
      count: validSubscriptions.length,
      failed: subscriptions.length - validSubscriptions.length
    })
  } catch (error) {
    console.error('Error sending notifications:', error)
    return res.status(500).json({ error: 'Failed to send notifications' })
  }
}