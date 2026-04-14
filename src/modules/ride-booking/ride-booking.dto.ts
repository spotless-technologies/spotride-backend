import { z } from 'zod';

export const rideEstimateSchema = z.object({
  pickupLat: z.number(),
  pickupLng: z.number(),
  destinationLat: z.number(),
  destinationLng: z.number(),
  rideType: z.enum(['REGULAR', 'STANDARD', 'PREMIUM']).optional().default('REGULAR'),
});

export const requestRideSchema = rideEstimateSchema.extend({
  promoCode: z.string().optional(),
});

export const driverAcceptSchema = z.object({
  tripId: z.string().uuid(),
  offeredPrice: z.number().positive().optional(),
});

export const startTripSchema = z.object({
  tripId: z.string().uuid(),
});

export const endTripSchema = z.object({
  tripId: z.string().uuid(),
  actualFare: z.number().positive().optional(),
});

export const confirmPaymentSchema = z.object({
  tripId: z.string().uuid(),
  paymentMethod: z.enum(['CASH', 'CARD', 'WALLET']),
});

export const rateTripSchema = z.object({
  tripId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

export const nearbyDriversSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().max(50).optional().default(5),
});