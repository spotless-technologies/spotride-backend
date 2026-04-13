import { z } from 'zod';

export const promoCodeSchema = z.object({
  code: z.string().min(3).max(20).transform(val => val.toUpperCase()),
  type: z.enum(['% OFF', 'FREE DELIVERY', 'FIXED $', 'CORPORATE']),
  value: z.number().positive(),
  description: z.string().optional(),
  target: z.enum(['NEW USERS', 'ALL', 'REFERRAL', 'CORPORATE']).optional(),
  usageLimit: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const promoUpdateSchema = z.object({
  code: z.string().min(3).max(20).transform(val => val.toUpperCase()).optional(),
  value: z.number().positive().optional(),
  description: z.string().optional(),
  usageLimit: z.number().int().positive().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});