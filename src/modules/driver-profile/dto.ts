import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  vehicleModel: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleColor: z.string().optional(),
  vehicleType: z.enum(['SEDAN', 'SUV', 'MINIVAN_XL', 'LUXURY', 'ELECTRIC_HYBRID']).optional(),
});