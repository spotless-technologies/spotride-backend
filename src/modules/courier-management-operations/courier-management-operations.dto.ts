import { z } from 'zod';

export const courierFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  status: z.enum(['Online', 'Offline', 'On Delivery', 'Suspended', 'all']).optional(),
  vehicleType: z.enum(['Bike', 'Car', 'all']).optional(),
  search: z.string().optional(),
});

export const deliveryFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  status: z.enum(['In Transit', 'Delivered', 'Failed', 'Cancelled', 'all']).optional(),
  search: z.string().optional(),
});