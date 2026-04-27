import { z } from 'zod';

export const rideEstimateSchema = z.object({
  pickupLat: z.number(),
  pickupLng: z.number(),
  destinationLat: z.number(),
  destinationLng: z.number(),
  categoryId: z.string().uuid("Valid category ID is required"),
  country: z.string().min(2).max(3).optional().default('NG'),
});

export const getRideOffersSchema = z.object({
  tripId: z.string().uuid("Valid trip ID is required"),
});

export const requestRideSchema = rideEstimateSchema.extend({
  promoCode: z.string().optional(),
  estimatedFare: z.number().positive(),
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
});

export const driverAcceptSchema = z.object({
  tripId: z.string().uuid(),
  offeredPrice: z.number().positive().optional(),
});

export const arrivedAtPickupSchema = z.object({
  tripId: z.string().uuid(),
});

export const startTripSchema = z.object({
  tripId: z.string().uuid(),
});

export const endTripSchema = z.object({
  tripId: z.string().uuid(),
  actualFare: z.number().positive().optional(),
});

export const rateDriverSchema = z.object({
  tripId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

export const cancelRideSchema = z.object({
  tripId: z.string().uuid(),
  reason: z.string().min(5, "Cancellation reason is required").optional(),
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

export const createConversationSchema = z.object({
  tripId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().optional(),
  voiceNoteUrl: z.string().url().optional(),
  type: z.enum(['TEXT', 'VOICE_NOTE', 'IMAGE', 'LOCATION']).default('TEXT'),
});

export const markMessageReadSchema = z.object({
  messageId: z.string().uuid(),
});

export const driverRideRequestsSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radiusKm: z.coerce.number().positive().max(50).optional().default(10),
});

export const counterBidSchema = z.object({
  offeredPrice: z.number().positive()
});

export const tripInfoSchema = z.object({
  tripId: z.string().uuid(),
});

export const vehicleCategoriesSchema = z.object({});

export const riderMyTripsSchema = z.object({
  tab: z.enum(['upcoming', 'past', 'scheduled']).default('upcoming'),
});

export const driverMyTripsSchema = z.object({
  tab: z.enum(['completed', 'scheduled']).default('completed'),
});

export const cancelScheduledRideSchema = z.object({
  scheduledRideId: z.string().uuid(),
  reason: z.string().min(5, "Reason is required").optional(),
});

export const editScheduledTripSchema = z.object({
  scheduledRideId: z.string().uuid(),
  scheduledTime: z.string().datetime("Invalid date/time format"),
});

export const driverArrivingPickupSchema = z.object({
  tripId: z.string().uuid(),
  driverLat: z.number(),
  driverLng: z.number(),
  etaMinutes: z.number().positive().optional(),
});

// ====================== CALL DTOs ======================
export const initiateCallSchema = z.object({
  conversationId: z.string().uuid(),
  receiverId: z.string().uuid(),
  callType: z.enum(['VOICE', 'VIDEO']).default('VOICE'),
});

export const updateCallStatusSchema = z.object({
  callId: z.string().uuid(),
  status: z.enum(['RINGING', 'CONNECTED', 'ENDED', 'MISSED', 'DECLINED']),
  signalingData: z.any().optional(),
  duration: z.number().positive().optional(),
});

export const getCallHistorySchema = z.object({
  conversationId: z.string().uuid(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});