import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import env from '../config/env';

export interface ChatRequest extends Request {
  user?: { userId: string; role: string };
  driver?: { userId: string; driverId: string; role: string };
}

export const chatAuth = async (req: ChatRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    
    console.log("=== CHAT AUTH DEBUG ===");
    console.log("Decoded userId from token:", decoded.userId);

    const blacklisted = await prisma.blacklistedToken.findFirst({
      where: { token: token }
    });
    
    if (blacklisted) {
      return res.status(401).json({ message: 'Token has been revoked. Please login again.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    console.log("User from database:", user);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Allow RIDER or DRIVER 
    if (user.role === 'RIDER') {
      req.user = { userId: user.id, role: user.role };
      console.log("Set req.user:", req.user);
      return next();
    }
    
    if (user.role === 'DRIVER') {
      const driver = await prisma.driver.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      
      if (!driver) {
        return res.status(403).json({ message: 'Driver profile not found' });
      }
      
      req.driver = { userId: user.id, driverId: driver.id, role: user.role };
      console.log("Set req.driver:", req.driver);
      return next();
    }
    
    // Only RIDER and DRIVER can chat
    return res.status(403).json({ message: 'Only riders and drivers can access chat features' });
    
  } catch (err) {
    console.error("Chat auth error:", err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};