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
    // ✅ Coba ambil session token dari cookie ATAU Authorization header
    // Ini fix untuk kasus Vercel proxy yang kadang strip cookie
    const cookieHeader = req.headers.cookie || '';
    const bearerToken = req.headers.authorization?.replace('Bearer ', '');

    // Kalau ada Bearer token tapi tidak ada cookie session, inject ke headers
    // supaya Better Auth bisa baca via Authorization header sebagai fallback
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers[key] = value;
      else if (Array.isArray(value)) headers[key] = value.join(', ');
    }

    // Inject Authorization header dari cookie token kalau belum ada
    if (!bearerToken && cookieHeader) {
      // Extract session token dari cookie
      const match = cookieHeader.match(/[Ss]ecure-better-auth\.session_token=([^;]+)/);
      if (match) {
        const rawToken = decodeURIComponent(match[1]);
        // Token format: "tokenValue.signature" — ambil bagian sebelum titik pertama
        const tokenOnly = rawToken.split('.')[0];
        headers['authorization'] = `Bearer ${tokenOnly}`;
      }
    }

    const session = await auth.api.getSession({
      headers: headers as any,
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