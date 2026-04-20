import { z } from 'zod';

export const analyticsFilterSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});