import { z } from 'zod';

export const citySchema = z.object({
  name: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2).default('Nigeria'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  serviceZones: z.string().optional(), 
});

export const hubSchema = z.object({
  name: z.string().min(2, 'Hub name is required'),
  address: z.string().min(5, 'Address is required'),
  cityId: z.string().uuid('Valid cityId is required'),
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  operatingHours: z.string().min(1, 'Operating hours is required'),
  assignedDrivers: z.number().int().min(0).default(0),
});

export const statusUpdateSchema = z.object({
  status: z.enum(['Active', 'Inactive']),
});