import { z } from 'zod';

export const transactionFilterSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  city: z.string().optional(),
  type: z.string().optional(), // Trip Payment, Commission, Payout, Refund, Bonus
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(5).max(100).default(20),
});

export const revenueReportFilterSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
});