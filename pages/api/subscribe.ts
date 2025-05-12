import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

// Path to subscriptions file
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'subscriptions.json')

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

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

    // Read existing subscriptions
    let subscriptions = []
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      try {
        const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8')
        subscriptions = JSON.parse(data)
      } catch (error) {
        console.error('Error reading subscriptions file:', error)
        // Continue with empty array if file is corrupted
      }
    }

    // Check if subscription already exists
    const existingIndex = subscriptions.findIndex(
      (sub) => sub.endpoint === subscription.endpoint
    )

    if (existingIndex !== -1) {
      // Update existing subscription
      subscriptions[existingIndex] = subscription
    } else {
      // Add new subscription
      subscriptions.push(subscription)
    }

    // Write updated subscriptions back to file
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2))

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error saving subscription:', error)
    return res.status(500).json({ error: 'Failed to save subscription' })
  }
}