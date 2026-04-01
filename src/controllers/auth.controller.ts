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
import { recordOtpFailure, clearOtpAttempts } from '../middleware/otpRateLimit';
import jwt from 'jsonwebtoken';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
const findUserByIdentifier = (identifier: string) =>
  prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
  });

// ====================== EMAIL SIGNUP ======================
export const registerEmail = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, role, password, confirmPassword } = req.body;
    if (role === 'ADMIN') return res.status(403).json({ message: 'Cannot register as ADMIN' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.verified) return res.status(409).json({ message: 'Email already registered' });

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

    await sendEmailOTP(email, otp);
    res.status(201).json({ message: 'Verification code sent to email', userId: user.id });
  } catch (error) {
    console.error('registerEmail error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

// ====================== PHONE SIGNUP ======================
export const registerPhone = async (req: Request, res: Response) => {
  try {
    const { phone, firstName, lastName, role, password, confirmPassword } = req.body;
    if (role === 'ADMIN') return res.status(403).json({ message: 'Cannot register as ADMIN' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing?.verified) return res.status(409).json({ message: 'Phone already registered' });

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
    res.status(201).json({ message: 'Verification code sent to phone', userId: user.id });
  } catch (error) {
    console.error('registerPhone error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

// ====================== VERIFY OTP ======================
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;

    const code = await prisma.verificationCode.findFirst({
      where: { userId, code: otp, type: 'signup', expiresAt: { gt: new Date() } },
    });

    if (!code) {
      recordOtpFailure(userId); // FIX: track failed attempts
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    clearOtpAttempts(userId); // FIX: clear on success

    await prisma.user.update({ where: { id: userId }, data: { verified: true } });
    await prisma.verificationCode.delete({ where: { id: code.id } });

    const { accessToken, refreshToken } = await generateTokens(userId);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, message: 'Account verified successfully' });
  } catch (error) {
    console.error('verifyOtp error:', error);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

// ====================== GOOGLE AUTH ======================
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ message: 'Invalid Google token' });

    const firstName = payload.given_name || payload.name?.split(' ')[0] || 'User';
    const lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || 'User';

    let user = await prisma.user.findFirst({
      where: { OR: [{ provider: 'google', providerId: payload.sub }, { email: payload.email }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email: payload.email!, firstName, lastName, provider: 'google', providerId: payload.sub, verified: true },
      });
    } else if (!user.verified) {
      await prisma.user.update({ where: { id: user.id }, data: { verified: true } });
    }

    const { accessToken, refreshToken } = await generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.json({ accessToken, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
  } catch (error) {
    console.error('googleAuth error:', error);
    res.status(500).json({ message: 'Google authentication failed.' });
  }
};

// ====================== FACEBOOK AUTH ======================
export const facebookAuth = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    const { data } = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
    );

    const nameParts = data.name?.split(' ') || [];
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    let user = await prisma.user.findFirst({
      where: { OR: [{ provider: 'facebook', providerId: data.id }, { email: data.email }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email: data.email, firstName, lastName, provider: 'facebook', providerId: data.id, verified: true },
      });
    } else if (!user.verified) {
      // FIX: was missing — verify pre-existing unverified accounts on Facebook login
      await prisma.user.update({
        where: { id: user.id },
        data: { verified: true, provider: 'facebook', providerId: data.id },
      });
    }

    const { accessToken: jwtAccess, refreshToken } = await generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.json({ accessToken: jwtAccess });
  } catch (error) {
    console.error('facebookAuth error:', error);
    res.status(500).json({ message: 'Facebook authentication failed.' });
  }
};

// ====================== LOGIN ======================
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    const user = await findUserByIdentifier(identifier);
    if (!user || !user.verified || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const { accessToken, refreshToken } = await generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.json({ accessToken });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

// ====================== ADMIN LOGIN ======================
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    const user = await findUserByIdentifier(identifier);
    if (!user || !user.verified || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const { accessToken, refreshToken } = await generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    // Return detailed user object to hydrate Redux on the frontend
    res.json({ accessToken, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch (error) {
    console.error('adminLogin error:', error);
    res.status(500).json({ message: 'Admin login failed. Please try again.' });
  }
};

// ====================== LOGOUT (NEW) ======================
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const decoded = jwt.decode(token) as { jti?: string } | null;
      if (decoded?.jti) {
        await prisma.refreshToken.deleteMany({ where: { jti: decoded.jti } }).catch(() => {});
      }
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('logout error:', error);
    res.status(500).json({ message: 'Logout failed.' });
  }
};

// ====================== REFRESH TOKEN ======================
export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  try {
    const userId = await verifyRefreshToken(token);
    const { accessToken, refreshToken: newRefresh } = await generateTokens(userId);

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// ====================== FORGOT PASSWORD ======================
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    const user = await findUserByIdentifier(identifier);
    if (!user) return res.status(200).json({ message: 'If account exists, OTP sent' });

    const otp = generateOTP();
    await prisma.verificationCode.create({
      data: { userId: user.id, code: otp, type: 'reset-password', expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    if (user.email) await sendEmailOTP(user.email, otp);
    else if (user.phone) await sendSMSOTP(user.phone, otp);

    res.json({ message: 'OTP sent' });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

// ====================== RESET PASSWORD ======================
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    const user = await findUserByIdentifier(identifier);
    if (!user) return res.status(400).json({ message: 'User not found' });

    const code = await prisma.verificationCode.findFirst({
      where: { userId: user.id, code: otp, type: 'reset-password', expiresAt: { gt: new Date() } },
    });

    if (!code) {
      recordOtpFailure(user.id); // FIX: track failed reset attempts
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    clearOtpAttempts(user.id);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed, verified: true } });
    await prisma.verificationCode.delete({ where: { id: code.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: 'Password reset failed. Please try again.' });
  }
};