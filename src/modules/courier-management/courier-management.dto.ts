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

export const basePricingSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.string().min(3), // e.g., "BIKE_STANDARD", "CAR_STANDARD", "CAR_EXPRESS"
  baseFare: z.number().positive(),
  ratePerKm: z.number().positive(),
  minFare: z.number().positive(),
  peakMultiplier: z.number().positive().default(1.0),
  notes: z.string().optional(),
});

export const categoryUpdateSchema = categorySchema.extend({
  isActive: z.boolean().optional(),
});

export const disputeFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['OPEN', 'INVESTIGATING', 'ESCALATED', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  driverId: z.string().uuid().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export const disputeActionSchema = z.object({
  action: z.enum(['PROCESS_REFUND', 'APPLY_PENALTY', 'CONTACT_DRIVER', 'NOTIFY_CUSTOMER', 'INSURANCE_CLAIM', 'ESCALATE_CASE']),
  amount: z.number().optional(),
  notes: z.string().optional(),
});

export const payoutFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'ON_HOLD', 'PAID']).optional(),
  driverId: z.string().uuid().optional(),
  search: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

export const bulkPayoutActionSchema = z.object({
  payoutIds: z.array(z.string().uuid()),
  status: z.enum(['APPROVED', 'ON_HOLD']),
});