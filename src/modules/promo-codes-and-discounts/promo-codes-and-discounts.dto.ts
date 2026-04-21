import { z } from 'zod';

export const createPromoSchema = z.object({
  promoName: z.string().min(3, "Promo name is required"),
  promoCode: z.string().min(3, "Promo code is required").toUpperCase(),
  discountType: z.enum(["FIXED_AMOUNT", "PERCENTAGE"]),
  discountValue: z.number().positive("Discount value must be positive"),
  usageLimit: z.number().int().min(0).optional().default(0),
  targetGroup: z.enum(["ALL_USERS", "NEW_USERS", "PREMIUM_MEMBERS", "FREQUENT_RIDERS"]),
  expiryDate: z.string().datetime("Invalid expiry date"),
});

export const updatePromoSchema = createPromoSchema.partial();

export const promoActionSchema = z.object({
  action: z.enum(["ENABLE", "DISABLE"]),
});

export const usageReportSchema = z.object({
  promoId: z.string().uuid(),
});