import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth.js';

// Extend Express Request type to include user and session
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        emailVerified: boolean;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        image?: string | null;
      };
      session?: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        ipAddress?: string | null;
        userAgent?: string | null;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== AUTH DEBUG ===');
    console.log('Cookie:', req.headers.cookie);
    console.log('Authorization:', req.headers.authorization);
    console.log('Origin:', req.headers.origin);
    console.log('=================');

    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized: No active session' });
    }

    req.user = session.user;
    req.session = session.session;

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid session' });
  }
};