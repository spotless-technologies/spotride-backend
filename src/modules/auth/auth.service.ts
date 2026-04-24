import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';
import { generateOTP } from '../../utils/otp';
import { sendEmailOTP } from '../../utils/email';
import { sendSMSOTP } from '../../utils/sms';
import { generateTokens, verifyRefreshToken } from '../../services/token.service';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import env from '../../config/env';
import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const findUserByIdentifier = (identifier: string) =>
  prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
  });

  // Helper to safely convert string role to Prisma enum
const toUserRole = (role: string): UserRole => {
  const upperRole = role.toUpperCase();
  if (['RIDER', 'DRIVER', 'CAR_OWNER', 'ADMIN'].includes(upperRole)) {
    return upperRole as UserRole;
  }
  return 'RIDER';
};

// ====================== EMAIL SIGNUP ======================
export const registerEmail = async (data: {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  password: string;
}) => {
  if (data.role === 'ADMIN') {
    throw new Error("Cannot register as ADMIN through public API");
  }

  // Check for existing email or phone
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: data.email },
        { phone: data.phone },
      ],
    },
  });

  if (existing?.verified) {
    throw new Error("Email already registered and verified");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const roleEnum = toUserRole(data.role);

  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      password: hashedPassword,
      verified: false,
      role: roleEnum,
    },
    create: {
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      password: hashedPassword,
      provider: 'local',
      verified: false,
      role: roleEnum,
    },
  });

  const otp = generateOTP();
  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      code: otp,
      type: 'signup',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  try {
    await sendEmailOTP(data.email, otp);
  } catch (error) {
    console.error('Failed to send email OTP:', error);
    // Don't fail registration — user can request OTP again
  }

  return { userId: user.id, message: "Verification code sent to email" };
};

// ====================== PHONE SIGNUP ======================
export const registerPhone = async (data: {
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  password: string;
}) => {
  if (data.role === 'ADMIN') {
    throw new Error("Cannot register as ADMIN through public API");
  }

  const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existing?.verified) {
    throw new Error("Phone number already registered and verified");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const roleEnum = toUserRole(data.role);

  const user = await prisma.user.upsert({
    where: { phone: data.phone },
    update: {
      firstName: data.firstName,
      lastName: data.lastName,
      password: hashedPassword,
      verified: false,
      role: roleEnum,
    },
    create: {
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      password: hashedPassword,
      provider: 'local',
      verified: false,
      role: roleEnum,
    },
  });

  const otp = generateOTP();
  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      code: otp,
      type: 'signup',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  try {
    await sendSMSOTP(data.phone, otp);
  } catch (error) {
    console.error('Failed to send SMS OTP:', error);
  }

  return { userId: user.id, message: "Verification code sent to phone" };
};

// ====================== VERIFY OTP ======================
export const verifyOtp = async (userId: string, otp: string) => {
  return prisma.$transaction(async (tx) => {
    const codeRecord = await tx.verificationCode.findFirst({
      where: {
        userId,
        code: otp,
        type: 'signup',
        expiresAt: { gt: new Date() },
      },
    });

    if (!codeRecord) {
      throw new Error("Invalid or expired OTP");
    }

    const user = await tx.user.update({
      where: { id: userId },
      data: { verified: true },
    });

    // Delete used OTP
    await tx.verificationCode.delete({ where: { id: codeRecord.id } });

    // Create role-specific profile (Driver / Rider / Car Owner)
    if (user.role === 'DRIVER') {
      await tx.driver.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
    } else if (user.role === 'RIDER') {
      await tx.rider.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
    } else if (user.role === 'CAR_OWNER') {
      await tx.carOwner.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
    }

    return user;
  });
};

// ====================== GOOGLE AUTH ======================
export const googleAuth = async (idToken: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) throw new Error("Invalid Google token");

  const firstName = payload.given_name || payload.name?.split(' ')[0] || "User";
  const lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || "User";

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
        email: payload.email,
        firstName,
        lastName,
        provider: 'google',
        providerId: payload.sub,
        verified: true,
        role: 'RIDER',
      },
    });
  } else if (!user.verified) {
    await prisma.user.update({ where: { id: user.id }, data: { verified: true } });
  }

  return user;
};

// ====================== FACEBOOK AUTH ======================
export const facebookAuth = async (accessToken: string) => {
  const { data } = await axios.get(
    `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
  );

  if (!data.email) throw new Error("Email permission required from Facebook");

  const nameParts = data.name?.split(' ') || [];
  const firstName = nameParts[0] || "User";
  const lastName = nameParts.slice(1).join(' ') || "User";

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
        role: 'RIDER',
      },
    });
  }

  return user;
};

// ====================== LOGIN ======================
export const login = async (identifier: string, password: string) => {
  const user = await findUserByIdentifier(identifier);

  if (!user || !user.verified || !user.password) {
    throw new Error("Invalid email/phone or password");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Invalid email/phone or password");
  }

  return user;
};

// ====================== REFRESH TOKEN ======================
export const refreshToken = async (refreshToken: string) => {
  if (!refreshToken) throw new Error("No refresh token provided");

  const userId = await verifyRefreshToken(refreshToken);
  return generateTokens(userId);
};

// ====================== FORGOT PASSWORD ======================
export const forgotPassword = async (identifier: string) => {
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    // Silent success for security (don't reveal if user exists)
    return { message: "If an account exists with this email/phone, an OTP has been sent" };
  }

  const otp = generateOTP();
  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      code: otp,
      type: 'reset-password',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  if (user.email) await sendEmailOTP(user.email, otp);
  else if (user.phone) await sendSMSOTP(user.phone, otp);

  return { message: "OTP sent successfully" };
};

// ====================== RESET PASSWORD ======================
export const resetPassword = async (identifier: string, otp: string, newPassword: string) => {
  const user = await findUserByIdentifier(identifier);
  if (!user) throw new Error("User not found");

  const code = await prisma.verificationCode.findFirst({
    where: {
      userId: user.id,
      code: otp,
      type: 'reset-password',
      expiresAt: { gt: new Date() },
    },
  });

  if (!code) throw new Error("Invalid or expired OTP");

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, verified: true },
    });

    await tx.verificationCode.delete({ where: { id: code.id } });

    // Invalidate all refresh tokens
    await tx.refreshToken.deleteMany({ where: { userId: user.id } });
  });

  return { message: "Password reset successfully" };
};

export const logout = async (userId: string, token: string) => {
  // Get token expiry from the token itself
  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);
  
  // Blacklist the token
  await prisma.blacklistedToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
  
  // Delete refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId } });
  
  return { message: "Logged out successfully" };
};

// ====================== GENERATE TOKENS FOR NEWLY VERIFIED USER ======================
export const generateTokensForUser = async (userId: string) => {
  return generateTokens(userId);  
};