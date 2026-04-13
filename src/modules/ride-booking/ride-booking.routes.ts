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
} from './ride-booking.controller';
import {
  rideEstimateSchema,
  requestRideSchema,
  driverAcceptSchema,
  rateTripSchema,
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
 *     summary: Rider requests a new ride
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a trip with status REQUESTED. Then emit 'ride:request-matching' via WebSocket.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickupLat, pickupLng, destinationLat, destinationLng]
 *             properties:
 *               pickupLat: { type: number }
 *               pickupLng: { type: number }
 *               destinationLat: { type: number }
 *               destinationLng: { type: number }
 *               rideType: { type: string, enum: ["REGULAR","STANDARD","PREMIUM"] }
 *               promoCode: { type: string, example: "FIRSTRIDE20" }
 *     responses:
 *       201:
 *         description: Ride requested successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Ride requested successfully"
 *               trip:
 *                 id: "trip-uuid"
 *                 status: "REQUESTED"
 *                 estimatedFare: 6200
 *                 rideType: "REGULAR"
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

export default router;