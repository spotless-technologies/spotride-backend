import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required').max(100),
  description: z.string().max(500).optional(),
  
  baseFare: z.number().positive("Base fare is required"),
  ratePerKm: z.number().positive("Per KM rate is required"),
  waitingCharge: z.number().positive("Waiting charge is required"),
  
  surgeMultiplier: z.number().min(1).max(3).default(1.0),   // e.g. 1.0, 1.2, 1.5
  capacity: z.number().int().positive().default(4),
  
  features: z.array(z.string()).default([]),   // Tags like "Economy", "AC", "Music"
  
  commissionRate: z.number().min(0).max(100).default(20),
  status: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  
  baseFare: z.number().positive().optional(),
  ratePerKm: z.number().positive().optional(),
  waitingCharge: z.number().positive().optional(),
  
  surgeMultiplier: z.number().min(1).max(3).optional(),
  capacity: z.number().int().positive().optional(),
  
  features: z.array(z.string()).optional(),
  
  commissionRate: z.number().min(0).max(100).optional(),
  status: z.boolean().optional(),
});