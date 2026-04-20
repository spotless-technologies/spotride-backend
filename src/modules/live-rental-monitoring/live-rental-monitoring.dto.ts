import { z } from 'zod';

export const liveRentalFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  status: z.enum(['active', 'overdue', 'ending_soon', 'all']).optional(),
  search: z.string().optional(),
});