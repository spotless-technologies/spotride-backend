import { z } from 'zod';

export const surchargeSchema = z.object({
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE']),
  weightRange: z.string().min(3),
  bikeExtra: z.number().nonnegative().optional(),
  carExtra: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export const zoneSchema = z.object({
  name: z.string().min(3),
  type: z.enum(['URBAN', 'SUBURBAN', 'RURAL', 'INTERCITY']),
  multiplier: z.number().positive().default(1.0),
  ratePerKm: z.number().positive(),
});

export const categorySchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  vehicleRestriction: z.enum(['BIKE_ONLY', 'CAR_ONLY', 'BOTH']).optional(),
  insuranceLevel: z.enum(['NONE', 'BASIC', 'STANDARD', 'PREMIUM']).optional(),
  pricingMultiplier: z.number().positive().default(1.0),
  maxDeliveryWindow: z.number().int().positive().optional(),
  requirements: z.array(z.string()).optional(),
});

export const disputeUpdateSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'ESCALATED', 'RESOLVED', 'CLOSED']).optional(),
  resolutionNotes: z.string().optional(),
  refundAmount: z.number().positive().optional(),
});

export const payoutActionSchema = z.object({
  status: z.enum(['APPROVED', 'ON_HOLD']).optional(),
});