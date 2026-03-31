import { z } from 'zod';

export const cancelBookingSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const returnBookingSchema = z.object({
  returnNotes: z.string().optional(),
});

export const adjustBookingSchema = z.object({
  newReturnDate: z.string().datetime('Invalid date format'),
  adjustedAmount: z.number().positive('Amount must be positive'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});