import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { v4 as uuidv4 } from 'uuid';
import env from '../config/env';

export const generateTokens = async (userId: string) => {
  const jti = uuidv4();

  const accessToken = jwt.sign(
    { userId }, 
    env.JWT_SECRET, 
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );

  const refreshToken = jwt.sign(
    { userId, jti }, 
    env.REFRESH_SECRET, 
    { expiresIn: env.REFRESH_EXPIRES_IN as any }
  );

  const decoded = jwt.decode(refreshToken) as { exp: number };

  await prisma.refreshToken.create({
    data: {
      jti,
      userId,
      expiresAt: new Date(decoded.exp * 1000),
    },
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = async (refreshToken: string) => {
  const payload = jwt.verify(refreshToken, env.REFRESH_SECRET) as { userId: string; jti: string };
  
  const stored = await prisma.refreshToken.findUnique({
    where: { jti: payload.jti },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }

  // Rotation: delete old, will create new on success
  await prisma.refreshToken.delete({ where: { jti: payload.jti } });

  return payload.userId;
};