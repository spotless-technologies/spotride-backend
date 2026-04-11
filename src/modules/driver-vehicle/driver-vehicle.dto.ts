import { z } from 'zod';

export const updateVehicleSchema = z.object({
  vehicleModel: z.string().min(2).optional(),
  vehiclePlate: z.string().min(3).optional(),
  vehicleColor: z.string().optional(),
  vehicleYear: z.number().int().min(1900).max(2100).optional(),
  vehicleType: z.enum(['SEDAN', 'SUV', 'MINIVAN_XL', 'LUXURY', 'ELECTRIC_HYBRID']).optional(),
  vehicleFeatures: z.array(z.string()).optional(),
});