import { z } from 'zod';

export const payoutActionSchema = z.object({
  action: z.enum(['APPROVE', 'DECLINE']),
  adminNotes: z.string().optional(),
});

export const manualAdjustmentSchema = z.object({
  carOwnerId: z.string().uuid(),
  amount: z.number(),
  type: z.enum(['ADD', 'DEDUCT']),
  reason: z.string().min(5),
});

export const payoutRequestFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'DECLINED', 'PAID', 'ALL']).optional().default('ALL'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});