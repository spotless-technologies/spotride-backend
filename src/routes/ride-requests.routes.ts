import { Router } from 'express';
import { driverAuth } from '../middleware/driver';
import {
  acceptRide,
  declineRide,
  getActiveRide,
  markArrived,
  startTrip,
  completeTrip,
  cancelRide,
  getRideDetails,
} from '../controllers/ride-requests.controller';
import { z } from 'zod';

const router = Router();

router.use(driverAuth);

/**
 * @swagger
 * tags:
 *   name: Ride Requests
 *   description: Driver ride request actions
 */

/**
 * @swagger
 * /rides/{rideId}/accept:
 *   post:
 *     summary: Accept ride request
 *     tags: [Ride Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Ride accepted
 */
router.post('/rides/:rideId/accept', acceptRide);

/**
 * @swagger
 * /rides/{rideId}/decline:
 *   post:
 *     summary: Decline ride request
 *     tags: [Ride Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Ride declined
 */
router.post('/rides/:rideId/decline', declineRide);

/**
 * @swagger
 * /rides/active:
 *   get:
 *     summary: Get current active ride
 *     tags: [Ride Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active ride or null
 */
router.get('/rides/active', getActiveRide);

/**
 * @swagger
 * /rides/{rideId}/arrived:
 *   post:
 *     summary: Mark arrival at pickup
 *     tags: [Ride Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Arrival marked
 */
router.post('/rides/:rideId/arrived', markArrived);

/**
 * @swagger
 * /rides/{rideId}/start:
 *   post:
 *     summary: Start the trip
 *     tags: [Ride Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Trip started
 */
router.post('/rides/:rideId/start', startTrip);

/**
 * @swagger
 * /rides/{rideId}/complete:
 *   post:
 *     summary: Complete the trip
 *     tags: [Ride Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Trip completed
 */
router.post('/rides/:rideId/complete', completeTrip);

/**
 * @swagger
 * /rides/{rideId}/cancel:
 *   post:
 *     summary: Cancel accepted ride
 *     tags: [Ride Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Ride cancelled
 */
router.post('/rides/:rideId/cancel', cancelRide);

/**
 * @swagger
 * /rides/{rideId}:
 *   get:
 *     summary: Get ride details
 *     tags: [Ride Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Ride details
 */
router.get('/rides/:rideId', getRideDetails);

export default router;