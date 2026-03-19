import { z } from 'zod';

export const emailSignupSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  role: z.enum(['RIDER', 'DRIVER', 'CAR_OWNER']),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const phoneSignupSchema = z.object({
  phone: z.string().min(10),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  role: z.enum(['RIDER', 'DRIVER', 'CAR_OWNER']),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const verifyOtpSchema = z.object({
  userId: z.string().uuid(),
  otp: z.string().length(6),
});

export const loginSchema = z.object({
  identifier: z.string(), // email or phone
  password: z.string(),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string(),
});

export const resetPasswordSchema = z.object({
  identifier: z.string(),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
});