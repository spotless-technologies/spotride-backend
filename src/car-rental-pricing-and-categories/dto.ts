import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required').max(100),
  description: z.string().max(500).optional(),
  commissionRate: z.number().min(0).max(100).default(15),
  status: z.boolean().default(true),

  dailyMinRate: z.number().positive("Daily minimum rate is required"),
  dailyMaxRate: z.number().positive("Daily maximum rate is required"),
  weeklyMinRate: z.number().positive().optional(),
  weeklyMaxRate: z.number().positive().optional(),
  monthlyMinRate: z.number().positive().optional(),
  monthlyMaxRate: z.number().positive().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().max(500).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  status: z.boolean().optional(),

  dailyMinRate: z.number().positive().optional(),
  dailyMaxRate: z.number().positive().optional(),
  weeklyMinRate: z.number().positive().optional(),
  weeklyMaxRate: z.number().positive().optional(),
  monthlyMinRate: z.number().positive().optional(),
  monthlyMaxRate: z.number().positive().optional(),
});