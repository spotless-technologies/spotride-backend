import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

// In-memory attempt tracker: userId -> { count, lockedUntil }
const attempts = new Map<string, { count: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export const otpRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const userId: string = req.body.userId || req.body.identifier;

  if (!userId) return next();

  const now = Date.now();
  const record = attempts.get(userId);

  if (record) {
    if (record.lockedUntil > now) {
      const remaining = Math.ceil((record.lockedUntil - now) / 60000);
      return res.status(429).json({
        message: `Too many attempts. Try again in ${remaining} minute(s).`,
      });
    }

    // Lock expired — reset
    if (record.lockedUntil <= now) {
      attempts.delete(userId);
    }
  }

  next();
};

export const recordOtpFailure = (userId: string) => {
  const now = Date.now();
  const record = attempts.get(userId) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCK_DURATION_MS;
    record.count = 0;
  }

  attempts.set(userId, record);
};

export const clearOtpAttempts = (userId: string) => {
  attempts.delete(userId);
};