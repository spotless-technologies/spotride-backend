import { Request, Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { generateOTP } from '../utils/otp';
import { sendEmailOTP } from '../utils/email';
import { sendSMSOTP } from '../utils/sms';
import { generateTokens, verifyRefreshToken } from '../services/token.service';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import env from '../config/env';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const findUserByIdentifier = (identifier: string) =>
  prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
  });

// ====================== EMAIL SIGNUP ======================
export const registerEmail = async (req: Request, res: Response) => {
  const { email, firstName, lastName, role, password, confirmPassword } = req.body;

  if (role === 'ADMIN') {
    return res.status(403).json({ message: "Cannot register as ADMIN" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.verified) return res.status(409).json({ message: "Email already registered" });

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { firstName, lastName, password: hashed, verified: false, role },
    create: { email, firstName, lastName, password: hashed, provider: 'local', verified: false, role: role || 'RIDER' },
  });

  const otp = generateOTP();
  await prisma.verificationCode.create({
    data: { userId: user.id, code: otp, type: 'signup', expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });

  try {
    await sendEmailOTP(email, otp);
    res.status(201).json({ message: "Verification code sent to email", userId: user.id });
  } catch (error) {
    console.error('Email failed, but continuing:', error);
    return res.status(500).json({ message: 'User created but failed to send OTP email. Please try again.' });
  }
};

// ====================== PHONE SIGNUP ======================
export const registerPhone = async (req: Request, res: Response) => {
  const { phone, firstName, lastName, role, password, confirmPassword } = req.body;

  if (role === 'ADMIN') {
    return res.status(403).json({ message: "Cannot register as ADMIN" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing?.verified) return res.status(409).json({ message: "Phone already registered" });

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { phone },
    update: { firstName, lastName, password: hashed, verified: false, role },
    create: { phone, firstName, lastName, password: hashed, provider: 'local', verified: false, role: role || 'RIDER' },
  });

  const otp = generateOTP();
  await prisma.verificationCode.create({
    data: { userId: user.id, code: otp, type: 'signup', expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });

  await sendSMSOTP(phone, otp);
  res.status(201).json({ message: "Verification code sent to phone", userId: user.id });
};

// ====================== VERIFY OTP ======================
export const verifyOtp = async (req: Request, res: Response) => {
  const { userId, otp } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Validate OTP
      const code = await tx.verificationCode.findFirst({
        where: {
          userId,
          code: otp,
          type: 'signup',
          expiresAt: { gt: new Date() },
        },
      });

      if (!code) {
        throw new Error('Invalid or expired OTP');
      }

      // Verify user
      const user = await tx.user.update({
        where: { id: userId },
        data: { verified: true },
      });

      // Delete used OTP
      await tx.verificationCode.delete({
        where: { id: code.id },
      });

      if (user.role === 'DRIVER') {
        await tx.driver.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
          },
        });
      }

      if (user.role === 'RIDER') {
        await tx.rider.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
          },
        });
      }

      if (user.role === 'CAR_OWNER') {
        await tx.carOwner.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
          },
        });
      }

      return user;
    });

    // Generate tokens AFTER transaction
    const { accessToken, refreshToken } = await generateTokens(result.id);

    // Set cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Response
    return res.json({
      accessToken,
      message: 'Account verified successfully',
    });

  } catch (error: any) {
    if (error.message === 'Invalid or expired OTP') {
      return res.status(400).json({ message: error.message });
    }

    console.error('verifyOtp error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// ====================== GOOGLE SIGNUP / LOGIN ======================
export const googleAuth = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) return res.status(400).json({ message: "Invalid Google token" });

  // SAFE FALLBACKS
  const firstName =
    payload.given_name ||
    payload.name?.split(' ')[0] ||
    'User';

  const lastName =
    payload.family_name ||
    payload.name?.split(' ').slice(1).join(' ') ||
    'User';

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { provider: 'google', providerId: payload.sub },
        { email: payload.email },
      ],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: payload.email!,
        firstName,
        lastName,
        provider: 'google',
        providerId: payload.sub,
        verified: true,
      },
    });
  } else if (!user.verified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { verified: true },
    });
  }

  const { accessToken, refreshToken } = await generateTokens(user.id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });

  res.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
};

// ====================== FACEBOOK SIGNUP / LOGIN ======================
export const facebookAuth = async (req: Request, res: Response) => {
  const { accessToken } = req.body;

  const { data } = await axios.get(
    `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
  );

  const nameParts = data.name?.split(' ') || [];
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts.slice(1).join(' ') || 'User';

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { provider: 'facebook', providerId: data.id },
        { email: data.email },
      ],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: data.email,
        firstName,
        lastName,
        provider: 'facebook',
        providerId: data.id,
        verified: true,
      },
    });
  }

  const { accessToken: jwtAccess, refreshToken } = await generateTokens(user.id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });

  res.json({ accessToken: jwtAccess });
};

// ====================== LOGIN ======================
export const login = async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  const user = await findUserByIdentifier(identifier);
  if (!user || !user.verified || !user.password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const { accessToken, refreshToken } = await generateTokens(user.id);

  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
  res.json({ accessToken });
};

// ====================== REFRESH TOKEN ======================
export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

  try {
    const userId = await verifyRefreshToken(refreshToken); // also deletes old
    const { accessToken, refreshToken: newRefresh } = await generateTokens(userId);

    res.cookie('refreshToken', newRefresh, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

// ====================== FORGOT PASSWORD ======================
export const forgotPassword = async (req: Request, res: Response) => {
  const { identifier } = req.body;
  const user = await findUserByIdentifier(identifier);
  if (!user) return res.status(200).json({ message: "If account exists, OTP sent" });

  const otp = generateOTP();
  await prisma.verificationCode.create({
    data: { userId: user.id, code: otp, type: 'reset-password', expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });

  if (user.email) await sendEmailOTP(user.email, otp);
  else if (user.phone) await sendSMSOTP(user.phone, otp);

  res.json({ message: "OTP sent" });
};

// ====================== RESET PASSWORD ======================
export const resetPassword = async (req: Request, res: Response) => {
  const { identifier, otp, newPassword } = req.body;

  const user = await findUserByIdentifier(identifier);
  if (!user) return res.status(400).json({ message: "User not found" });

  const code = await prisma.verificationCode.findFirst({
    where: { userId: user.id, code: otp, type: 'reset-password', expiresAt: { gt: new Date() } },
  });

  if (!code) return res.status(400).json({ message: "Invalid OTP" });

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed, verified: true } });
  await prisma.verificationCode.delete({ where: { id: code.id } });

  // Revoke all refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  res.json({ message: "Password reset successfully" });
};