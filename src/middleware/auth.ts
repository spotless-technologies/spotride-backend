import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import env from '../config/env';

export interface AuthRequest extends Request {
  user: { userId: string; role: string };
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    
    // Check if token is blacklisted
    const blacklisted = await prisma.blacklistedToken.findFirst({
      where: { token: token }
    });
    
    if (blacklisted) {
      res.status(401).json({ message: 'Token has been revoked. Please login again.' });
      return;
    }
    
    (req as AuthRequest).user = { userId: decoded.userId, role: '' };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};