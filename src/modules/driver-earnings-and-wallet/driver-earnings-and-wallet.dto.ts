import { z } from 'zod';

export const walletAdjustmentSchema = z.object({
  amount: z.number().min(1, "Amount must be at least 1"),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  type: z.enum(['CREDIT', 'DEBIT']).default('CREDIT'),
});

export const payoutSettingsSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY']),
  processingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  minimumThreshold: z.number().min(0).default(500),
  autoPayoutEnabled: z.boolean().default(true),
  eligibleDriverTypes: z.array(z.string()).default(['approved']),
});