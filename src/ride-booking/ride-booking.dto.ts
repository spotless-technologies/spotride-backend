import { z } from 'zod';

export const rideEstimateSchema = z.object({
  pickupLat: z.number(),
  pickupLng: z.number(),
  destinationLat: z.number(),
  destinationLng: z.number(),
  rideType: z.enum(['ECONOMY', 'COMFORT', 'LUXURY']).optional().default('ECONOMY'),
});

export const requestRideSchema = rideEstimateSchema;

export const driverAcceptSchema = z.object({
  tripId: z.string().uuid(),
});

export const startTripSchema = z.object({
  tripId: z.string().uuid(),
});

export const endTripSchema = z.object({
  tripId: z.string().uuid(),
  actualFare: z.number().positive().optional(),
});