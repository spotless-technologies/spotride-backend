import { Router } from 'express';
import { adminAuth } from '../middleware/admin';
import {
  getLiveTrackingStats,
  getLiveTrackingMap,
  getActiveTrips,
  getTripHistory,
  getTripDetails,
} from '../controllers/trip-management.controller';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Trip Management
 *   description: Live tracking and trip history for admin
 */

// ==================== LIVE TRACKING ====================

/**
 * @swagger
 * /api/admin/trip-management/live-tracking/stats:
 *   get:
 *     summary: Get live tracking overview statistics
 *     tags: [Admin Trip Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Live tracking stats (Active Trips, En Route, In Progress, Alerts)
 */
router.get('/trip-management/live-tracking/stats', getLiveTrackingStats);

/**
 * @swagger
 * /api/admin/trip-management/live-tracking/map:
 *   get:
 *     summary: Get live trip map data points
 *     tags: [Admin Trip Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of live trip locations with status
 */
router.get('/trip-management/live-tracking/map', getLiveTrackingMap);

/**
 * @swagger
 * /api/admin/trip-management/live-tracking/active-trips:
 *   get:
 *     summary: Get list of currently active trips
 *     tags: [Admin Trip Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active trips list
 */
router.get('/trip-management/live-tracking/active-trips', getActiveTrips);

// ==================== TRIP HISTORY ====================

/**
 * @swagger
 * /api/admin/trip-management/trip-history:
 *   get:
 *     summary: Get paginated trip history with filters
 *     tags: [Admin Trip Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [completed, ongoing, cancelled, all] }
 *       - in: query
 *         name: date
 *         schema: { type: string, example: "today" }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated trip history
 */
router.get('/trip-management/trip-history', getTripHistory);

/**
 * @swagger
 * /api/admin/trip-management/trip-history/{id}:
 *   get:
 *     summary: Get full details of a specific trip
 *     tags: [Admin Trip Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Trip details (Overview, Route & Timeline, Participants)
 *       404:
 *         description: Trip not found
 */
router.get('/trip-management/trip-history/:id', getTripDetails);

export default router;