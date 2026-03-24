import { Router } from 'express';
import { driverAuth } from '../middleware/driver';
import {
  toggleOnlineStatus,
  getStatus,
  updateLocation,
} from '../controllers/driver-status.controller';

const router = Router();

router.use(driverAuth);

/**
 * @swagger
 * tags:
 *   name: Driver Status
 *   description: Driver online/offline and location
 */

/**
 * @swagger
 * /driver/status:
 *   patch:
 *     summary: Toggle online/offline status
 *     tags: [Driver Status]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isOnline]
 *             properties:
 *               isOnline: { type: boolean }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/status', toggleOnlineStatus);

/**
 * @swagger
 * /driver/status:
 *   get:
 *     summary: Get current status
 *     tags: [Driver Status]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current status
 */
router.get('/status', getStatus);

/**
 * @swagger
 * /driver/location:
 *   patch:
 *     summary: Update current GPS location
 *     tags: [Driver Status]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng]
 *             properties:
 *               lat: { type: number }
 *               lng: { type: number }
 *     responses:
 *       200:
 *         description: Location updated
 */
router.patch('/location', updateLocation);

export default router;