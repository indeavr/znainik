import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

// Path to subscriptions file
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'subscriptions.json')
const DATA_DIR = path.join(process.cwd(), 'data')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { subscription } = req.body

    // Validate request
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Valid subscription object is required' })
    }

    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }

    // Initialize subscriptions file if it doesn't exist
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
      fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify([]))
    }

    // Read existing subscriptions
    const subscriptionsRaw = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8')
    let subscriptions = []
    
    try {
      subscriptions = JSON.parse(subscriptionsRaw)
    } catch (e) {
      // If file is corrupted, start with empty array
      subscriptions = []
    }

    // Check if subscription already exists
    const existingIndex = subscriptions.findIndex(
      sub => sub.endpoint === subscription.endpoint
    )

    // Update or add subscription
    if (existingIndex >= 0) {
      subscriptions[existingIndex] = subscription
    } else {
      subscriptions.push(subscription)
    }

    // Save updated subscriptions
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions))

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error saving subscription:', error)
    return res.status(500).json({ error: 'Failed to save subscription' })
  }
}