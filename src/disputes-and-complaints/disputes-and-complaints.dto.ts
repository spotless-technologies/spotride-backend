import { z } from 'zod';

export const disputeFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  status: z.enum(['Open', 'Under Review', 'Resolved', 'Escalated', 'all']).optional(),
  severity: z.enum(['Low', 'Medium', 'High', 'all']).optional(),
  search: z.string().optional(),
});

export const resolveDisputeSchema = z.object({
  resolutionAction: z.enum(['Refund Renter', 'Fine Renter', 'Compensate Owner']),
  resolutionNotes: z.string().min(10),
  refundAmount: z.number().positive().optional(),
  fineAmount: z.number().positive().optional(),
  compensationAmount: z.number().positive().optional(),
});