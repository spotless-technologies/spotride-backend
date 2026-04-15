import { z } from 'zod';

export const citySchema = z.object({
  name: z.string().min(2, "City name is required"),
  state: z.string().min(2),
  country: z.string().default("Nigeria"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  serviceZones: z.string().optional(),
  pricingLevel: z.enum(['BUDGET', 'STANDARD', 'PREMIUM']).default('STANDARD'),
});

export const hubSchema = z.object({
  name: z.string().min(3, "Hub name is required"),
  address: z.string().min(5),
  cityId: z.string().uuid("Valid city is required"),
  latitude: z.number(),
  longitude: z.number(),
  operatingHours: z.string().default("24/7"),
  capacity: z.number().int().positive().default(50),
  zonesCovered: z.array(z.string()).optional().default([]),
  pricingTier: z.enum(['BUDGET', 'STANDARD', 'PREMIUM']).default('STANDARD'),
  baseAdjustment: z.number().default(0),
  distanceMultiplier: z.number().positive().default(1.0),
});

export const configureHubSchema = z.object({
  zonesCovered: z.array(z.string()),
  pricingTier: z.enum(['BUDGET', 'STANDARD', 'PREMIUM']),
  baseAdjustment: z.number(),
  distanceMultiplier: z.number().positive(),
});

export const configureZonePricingSchema = z.object({
  zoneName: z.string(),
  pricingLevel: z.enum(['BUDGET', 'STANDARD', 'PREMIUM']),
  adjustmentAmount: z.number(),
});