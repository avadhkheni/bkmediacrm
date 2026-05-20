import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        roleData: {
          include: {
            permissions: true
          }
        }
      }
    });
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid credentials or inactive account' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Get role's updatedAt timestamp for permission cache validation
    const roleUpdatedAt = user.roleData?.updatedAt || new Date();
    
    const accessToken = generateAccessToken(user.id, user.role, roleUpdatedAt);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    // Verify token exists in DB and is valid
    const dbToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken, expiresAt: { gt: new Date() } },
      include: { 
        user: {
          include: { roleData: true }
        }
      },
    });

    if (!dbToken) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    try {
      verifyRefreshToken(refreshToken);
    } catch (e) {
      // If JWT verification fails, delete the token from DB
      await prisma.refreshToken.deleteMany({ where: { id: dbToken.id } });
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const roleUpdatedAt = dbToken.user.roleData?.updatedAt || new Date();
    const accessToken = generateAccessToken(dbToken.user.id, dbToken.user.role, roleUpdatedAt);
    const newRefreshToken = generateRefreshToken(dbToken.user.id);

    // Replace old refresh token with new one
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { id: dbToken.id } }),
      prisma.refreshToken.create({
        data: {
          userId: dbToken.user.id,
          token: newRefreshToken,
          expiresAt,
        },
      }),
    ]);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        roleData: {
          include: { permissions: true }
        }
      }
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
