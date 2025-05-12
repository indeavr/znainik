import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

// JWT secret should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { password } = req.body

    // Validate password against environment variable (server-side only)
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { authorized: true },
      JWT_SECRET,
      { expiresIn: '24h' } // Token expires in 24 hours
    )

    return res.status(200).json({ token })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Authentication failed' })
  }
}