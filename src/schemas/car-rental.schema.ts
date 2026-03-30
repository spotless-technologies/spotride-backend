import { z } from 'zod';

export const rejectCarSchema = z.object({
  reason: z.string().min(5),
});