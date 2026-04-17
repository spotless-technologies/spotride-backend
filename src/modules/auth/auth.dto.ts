import { z } from 'zod';

export const emailSignupSchema = z.object({
  email: z.string().email("Invalid email format"),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\+?[0-9\s\-\(\)]+$/, "Invalid phone number format")
    .transform((val) => val.replace(/\s+/g, '')),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  role: z.enum(['RIDER', 'DRIVER', 'CAR_OWNER'], { message: "Invalid role" }),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const phoneSignupSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  role: z.enum(['RIDER', 'DRIVER', 'CAR_OWNER']),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const verifyOtpSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
});

export const resetPasswordSchema = z.object({
  identifier: z.string(),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(10, "Google ID token is required"),
});

export const facebookAuthSchema = z.object({
  accessToken: z.string().min(10, "Facebook access token is required"),
});