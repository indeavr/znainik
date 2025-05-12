import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const token = authHeader.substring(7)
    
    // Verify token
    jwt.verify(token, JWT_SECRET)
    
    return res.status(200).json({ valid: true })
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}