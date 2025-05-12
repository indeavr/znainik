import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Return the VAPID public key from environment variables
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (!publicKey) {
    return res.status(500).json({ error: 'VAPID public key not configured' })
  }

  return res.status(200).json({ publicKey })
}