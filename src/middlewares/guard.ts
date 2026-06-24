import { Request, Response } from 'hyper-express'
import { verifyAccessToken } from '../utils/jwt'

export function AuthGuard(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token' })

  try {
    const payload = verifyAccessToken(token)
      ;(req as any).user = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
