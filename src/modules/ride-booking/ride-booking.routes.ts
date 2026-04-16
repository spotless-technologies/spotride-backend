import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { riderAuth } from '../../middleware/rider';
import { driverAuth } from '../../middleware/driver';
import {
  getFareEstimate,
  requestRide,
  driverAcceptRide,
  startTrip,
  endTrip,
  initializePayment,
  rateTrip,
  getNearbyDrivers,
  sendMessage,
  getConversationMessages,
  getDriverRideRequests,
  createConversation,
  counterBidOnRide,
} from './ride-booking.controller';

import {
  rideEstimateSchema,
  requestRideSchema,
  driverAcceptSchema,
  rateTripSchema,
  nearbyDriversSchema,
  sendMessageSchema,
  driverRideRequestsSchema,
  counterBidSchema,
} from './ride-booking.dto';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Ride Booking
 *   description: |
 *     Complete ride hailing system.
 *     Flow: Estimate → Request Ride → Driver Offers → Accept → Start → End → Payment → Rating.
 *     Supports Cash & Card (Paystack) payments with automatic commission deduction for cash rides.
 */

// ==================== FARE ESTIMATE ====================
/**
 * @swagger
 * /api/rides/estimate:
 *   post:
 *     summary: Calculate ride fare estimate
 *     tags: [Ride Booking]
 *     description: Real Haversine distance calculation. Rates are configurable via .env.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickupLat, pickupLng, destinationLat, destinationLng]
 *             properties:
 *               pickupLat: { type: number, example: 6.5244 }
 *               pickupLng: { type: number, example: 3.3792 }
 *               destinationLat: { type: number, example: 6.6018 }
 *               destinationLng: { type: number, example: 3.3515 }
 *               rideType: { type: string, enum: ["REGULAR","STANDARD","PREMIUM"] }
 *     responses:
 *       200:
 *         description: Fare estimate returned
 *         content:
 *           application/json:
 *             example:
 *               distanceKm: 12.34
 *               durationMin: 25
 *               currency: "NGN"
 *               estimatedFare: 6200
 *               surgeMultiplier: 1.0
 */
router.post('/rides/estimate', validate(rideEstimateSchema), getFareEstimate);

// ==================== REQUEST RIDE ====================
/**
 * @swagger
 * /api/rides/request:
 *   post:
 *     summary: Rider requests a new ride (with user-adjusted estimatedFare)
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       First call `/rides/estimate` to get the default calculated price based on rideType and country.
 *       The user can then increase or reduce the price on the frontend.
 *       Send the **final `estimatedFare`** chosen by the user in this request.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickupLat, pickupLng, destinationLat, destinationLng, estimatedFare]
 *             properties:
 *               pickupLat:
 *                 type: number
 *                 example: 6.5244
 *               pickupLng:
 *                 type: number
 *                 example: 3.3792
 *               destinationLat:
 *                 type: number
 *                 example: 6.6018
 *               destinationLng:
 *                 type: number
 *                 example: 3.3515
 *               rideType:
 *                 type: string
 *                 enum: ["REGULAR", "STANDARD", "PREMIUM"]
 *                 example: "PREMIUM"
 *               estimatedFare:
 *                 type: number
 *                 example: 2500
 *                 description: Final price chosen by the user (can be higher or lower than default)
 *               promoCode:
 *                 type: string
 *                 example: "FIRSTRIDE20"
 *               country:
 *                 type: string
 *                 example: "NG"
 *     responses:
 *       201:
 *         description: Ride requested successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Ride requested successfully"
 *               trip:
 *                 id: "trip-uuid-here"
 *                 status: "REQUESTED"
 *                 estimatedFare: 2500
 *                 currency: "NGN"
 *                 country: "NG"
 *                 rideType: "PREMIUM"
 *       400:
 *         description: Validation error (missing fields or invalid values)
 *       401:
 *         description: Unauthorized - Rider token required
 */
router.post('/rides/request', riderAuth, validate(requestRideSchema), requestRide);

// ==================== DRIVER ACCEPT ====================
/**
 * @swagger
 * /api/drivers/accept:
 *   post:
 *     summary: Driver accepts a ride (with optional price offer)
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tripId]
 *             properties:
 *               tripId: { type: string, format: uuid }
 *               offeredPrice: { type: number, example: 6500 }
 *     responses:
 *       200:
 *         description: Ride accepted - notifies rider via WebSocket
 */
router.post('/drivers/accept', driverAuth, validate(driverAcceptSchema), driverAcceptRide);

// ==================== START & END TRIP ====================
router.post('/rides/start', driverAuth, startTrip);
router.post('/rides/end', driverAuth, endTrip);

// ==================== PAYMENT ====================
/**
 * @swagger
 * /api/rides/payment/initialize:
 *   post:
 *     summary: Initialize Paystack payment for CARD payments
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tripId, paymentMethod]
 *             properties:
 *               tripId: { type: string, format: uuid }
 *               paymentMethod: { type: string, enum: ["CASH", "CARD", "WALLET"] }
 *     responses:
 *       200:
 *         description: Payment initialized (for CARD) or confirmed (for CASH)
 */
router.post('/rides/payment/initialize', riderAuth, initializePayment);

// ==================== RATE TRIP ====================
/**
 * @swagger
 * /api/rides/rate:
 *   post:
 *     summary: Rider rates the driver after trip completion
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tripId, rating]
 *             properties:
 *               tripId: { type: string, format: uuid }
 *               rating: { type: number, minimum: 1, maximum: 5, example: 4.5 }
 *               feedback: { type: string, example: "Great driver, very professional" }
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 */
router.post('/rides/rate', riderAuth, validate(rateTripSchema), rateTrip);

/**
 * @swagger
 * /api/rides/nearby-drivers:
 *   get:
 *     summary: Get available drivers near the rider (real-time)
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns online, approved drivers within the specified radius (default 5km).
 *       Uses the driver's latest `currentLocation` updated via WebSocket `location-update`.
 *       Results are sorted by distance (closest first).
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *         example: 6.5244
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 *         example: 3.3792
 *       - in: query
 *         name: radiusKm
 *         schema: { type: number, default: 5, maximum: 50 }
 *         example: 5
 *     responses:
 *       200:
 *         description: List of nearby available drivers
 *         content:
 *           application/json:
 *             example:
 *               count: 3
 *               radiusKm: 5
 *               drivers:
 *                 - driverId: "driver-uuid"
 *                   fullName: "Emeka Okafor"
 *                   photo: "https://..."
 *                   rating: 4.8
 *                   vehicleType: "SEDAN"
 *                   vehicleModel: "Toyota Camry"
 *                   vehicleColor: "Black"
 *                   distanceKm: 1.23
 *                   etaMinutes: 4
 *                   lastUpdated: "2026-04-13T15:42:00Z"
 */
router.get(
  '/rides/nearby-drivers', 
  riderAuth, 
  validate(nearbyDriversSchema, 'query'), 
  getNearbyDrivers
);

// ==================== CONVERSATION & MESSAGING ====================
/**
 * @swagger
 * /api/rides/conversations:
 *   post:
 *     summary: Create conversation between rider and driver for a trip
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tripId]
 *             properties:
 *               tripId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Conversation created
 */
router.post('/rides/conversations', riderAuth, createConversation);

/**
 * @swagger
 * /api/rides/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send message or voice note in conversation
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conversationId: { type: string, format: uuid }
 *               content: { type: string }
 *               voiceNoteUrl: { type: string }
 *               type: { type: string, enum: ["TEXT", "VOICE_NOTE"] }
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post('/rides/conversations/:conversationId/messages', riderAuth, validate(sendMessageSchema), sendMessage);

/**
 * @swagger
 * /api/rides/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get all messages in a conversation
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/rides/conversations/:conversationId/messages', riderAuth, getConversationMessages);

// ==================== DRIVER RIDE REQUESTS ====================
/**
 * @swagger
 * /api/drivers/ride-requests:
 *   get:
 *     summary: Driver sees nearby ride requests (with counter-bid option)
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Drivers see ride requests within their vicinity.
 *       They can view details and counter-bid the estimatedFare before accepting.
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: radiusKm
 *         schema: { type: number, default: 10 }
 *     responses:
 *       200:
 *         description: List of nearby ride requests
 *         content:
 *           application/json:
 *             example:
 *               count: 2
 *               requests:
 *                 - tripId: "trip-uuid"
 *                   riderName: "John Doe"
 *                   estimatedFare: 6200
 *                   distanceKm: 2.34
 *                   rideType: "PREMIUM"
 */
router.get('/drivers/ride-requests', driverAuth, validate(driverRideRequestsSchema, 'query'), getDriverRideRequests);

/**
 * @swagger
 * /api/drivers/ride-requests/{tripId}/counter-bid:
 *   post:
 *     summary: Driver submits a counter-bid on a ride request
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       After viewing nearby ride requests via `/drivers/ride-requests`, 
 *       the driver can submit a counter-offer (higher or lower than the rider's estimatedFare).
 *       This changes the trip status to "DRIVER_COUNTER_BID" and notifies the rider via WebSocket.
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offeredPrice]
 *             properties:
 *               offeredPrice:
 *                 type: number
 *                 example: 2800
 *                 description: Driver's proposed fare (can be higher or lower than original estimate)
 *     responses:
 *       200:
 *         description: Counter-bid submitted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Counter-bid submitted successfully. Rider will be notified."
 *               trip:
 *                 id: "trip-uuid"
 *                 status: "DRIVER_COUNTER_BID"
 *                 actualFare: 2800
 *                 rideType: "PREMIUM"
 *       400:
 *         description: Invalid bid or ride no longer available
 *       403:
 *         description: Driver access required
 */
router.post(
  '/drivers/ride-requests/:tripId/counter-bid', 
  driverAuth, 
  validate(counterBidSchema), 
  counterBidOnRide
);

export default router;