import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
    roleUpdatedAt?: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token) as { userId: number; role: string; roleUpdatedAt?: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user's permissions need refreshing
export const checkPermissionFreshness = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role === 'ADMIN') {
      return next(); // Admin bypass
    }

    // Fetch current role's updatedAt from database
    const role = await prisma.role.findUnique({
      where: { name: req.user.role },
      select: { updatedAt: true }
    });

    if (!role) {
      res.status(403).json({ message: 'Invalid role' });
      return;
    }

    // Compare token's roleUpdatedAt with database
    const tokenTimestamp = req.user.roleUpdatedAt ? new Date(req.user.roleUpdatedAt).getTime() : 0;
    const dbTimestamp = role.updatedAt.getTime();

    // If database is newer, permissions have changed
    if (dbTimestamp > tokenTimestamp) {
      res.status(401).json({
        message: 'Permissions updated. Please refresh your session.',
        needsRefresh: true,
        roleUpdatedAt: role.updatedAt.toISOString()
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Permission freshness check error:', error);
    next(); // Don't block on error
  }
};
