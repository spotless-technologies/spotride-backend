import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import env from '../config/env';

export interface DriverRequest extends Request {
  driver?: { userId: string; driverId: string };
}

export const driverAuth = async (req: DriverRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== 'DRIVER' && user.role !== 'ADMIN')) {
      return res.status(403).json({ message: 'Driver or Admin access required' });
    }

    const driver = await prisma.driver.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!driver && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Driver profile not found' });
    }

    req.driver = { userId: user.id, driverId: driver?.id || '' };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};