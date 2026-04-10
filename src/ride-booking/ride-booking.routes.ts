import { Router } from 'express';
import { validate } from '../middleware/validate';
import { riderAuth } from '../middleware/rider';
import { driverAuth } from '../middleware/driver';
import {
  getFareEstimate,
  requestRide,
  driverAcceptRide,
  startTrip,
  endTrip,
} from './ride-booking.controller';
import {
  rideEstimateSchema,
  requestRideSchema,
  driverAcceptSchema,
  startTripSchema,
  endTripSchema,
} from './ride-booking.dto';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Ride Booking
 *   description: Complete ride hailing flow. Rider → Estimate → Request → Matching (WebSocket) → Driver Accept → Start → End.
 */

/**
 * @swagger
 * /api/rides/estimate:
 *   post:
 *     summary: Calculate fare estimate before booking
 *     tags: [Ride Booking]
 *     description: Uses real Haversine distance. All rates come from .env (easy to adjust per country).
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
 *               rideType: { type: string, enum: ["ECONOMY", "COMFORT", "LUXURY"], example: "ECONOMY" }
 *     responses:
 *       200:
 *         description: Fare estimate
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

/**
 * @swagger
 * /api/rides/request:
 *   post:
 *     summary: Rider requests a new ride
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Creates trip with status "REQUESTED". 
 *       After success, immediately emit 'ride:request-matching' with trip.id via WebSocket.
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
 *               rideType: { type: string, enum: ["ECONOMY","COMFORT","LUXURY"] }
 *     responses:
 *       201:
 *         description: Ride requested
 *         content:
 *           application/json:
 *             example:
 *               message: "Ride requested successfully"
 *               trip:
 *                 id: "uuid-here"
 *                 status: "REQUESTED"
 *                 estimatedFare: 6200
 *                 rideType: "ECONOMY"
 */
router.post('/rides/request', riderAuth, validate(requestRideSchema), requestRide);

/**
 * @swagger
 * /api/drivers/accept:
 *   post:
 *     summary: Driver accepts a ride request
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: Changes status from SEARCHING_DRIVER to DRIVER_ASSIGNED. WebSocket notifies rider.
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
 *       200:
 *         description: Ride accepted
 */
router.post('/drivers/accept', driverAuth, validate(driverAcceptSchema), driverAcceptRide);

/**
 * @swagger
 * /api/rides/start:
 *   post:
 *     summary: Driver starts the trip (passenger boarded)
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
 *       200:
 *         description: Trip started (status = IN_PROGRESS)
 */
router.post('/rides/start', driverAuth, validate(startTripSchema), startTrip);

/**
 * @swagger
 * /api/rides/end:
 *   post:
 *     summary: End the trip
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
 *               actualFare: { type: number, example: 6500 }
 *     responses:
 *       200:
 *         description: Trip completed
 */
router.post('/rides/end', driverAuth, validate(endTripSchema), endTrip);

export default router;