import { Router } from 'express';
import { driverAuth } from '../middleware/driver';
import {
  getAllTrips,
  getTodayTrips,
  getTripDetails,
} from '../controllers/driver-trips.controller';

const router = Router();

router.use(driverAuth);

/**
 * @swagger
 * tags:
 *   name: Driver Trips
 *   description: Driver trip history and details
 */

/**
 * @swagger
 * /driver/trips:
 *   get:
 *     summary: Paginated list of all trips for the authenticated driver
 *     tags: [Driver Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (starting from 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of trips per page
 *     responses:
 *       200:
 *         description: Paginated list of trips
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a driver or admin
 */
router.get('/trips', getAllTrips);

/**
 * @swagger
 * /driver/trips/today:
 *   get:
 *     summary: Get trips completed today
 *     tags: [Driver Trips]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of today's trips
 */
router.get('/trips/today', getTodayTrips);

/**
 * @swagger
 * /driver/trips/{tripId}:
 *   get:
 *     summary: Get details of a specific trip
 *     tags: [Driver Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Trip details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a driver or admin
 *       404:
 *         description: Trip not found
 */
router.get('/trips/:tripId', getTripDetails);

export default router;