import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

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
    const subscription = req.body

    // Validate subscription object
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' })
    }

    // Check if subscriptions file exists
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
      return res.status(200).json({ success: true })
    }

    // Read existing subscriptions
    let subscriptions = []
    try {
      const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8')
      subscriptions = JSON.parse(data)
    } catch (error) {
      console.error('Error reading subscriptions file:', error)
      return res.status(200).json({ success: true })
    }

    // Filter out the subscription to remove
    const filteredSubscriptions = subscriptions.filter(
      (sub) => sub.endpoint !== subscription.endpoint
    )

    // Write updated subscriptions back to file
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(filteredSubscriptions, null, 2))

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error removing subscription:', error)
    return res.status(500).json({ error: 'Failed to remove subscription' })
  }
}