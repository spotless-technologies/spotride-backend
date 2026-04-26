import { z } from 'zod';

export const withdrawRequestSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
});

export type WithdrawRequestDto = z.infer<typeof withdrawRequestSchema>;

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type DateRangeDto = z.infer<typeof dateRangeSchema>;