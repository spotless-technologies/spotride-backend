import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import {
  getLiveRentalStats,
  getActiveRentals,
  getLiveMapData,
} from './live-rental-monitoring.controller';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Live Rental Monitoring
 *   description: Real-time rental monitoring with map and active bookings
 */

// ==================== STATS ====================

/**
 * @swagger
 * /api/admin/car-rental/live-monitoring/stats:
 *   get:
 *     summary: Get live rental monitoring statistics
 *     tags: [Admin Live Rental Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Live stats cards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activeRentals: { type: integer }
 *                 endingSoon: { type: integer }
 *                 liveRevenue: { type: number }
 *                 overdueReturns: { type: integer }
 */
router.get('/car-rental/live-monitoring/stats', getLiveRentalStats);

/**
 * @swagger
 * /api/admin/car-rental/live-monitoring/active-rentals:
 *   get:
 *     summary: Get list of currently active rentals
 *     tags: [Admin Live Rental Monitoring]
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
 *         schema: { type: string, enum: [active, overdue, ending_soon, all] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated active rentals
 */
router.get('/car-rental/live-monitoring/active-rentals', getActiveRentals);

/**
 * @swagger
 * /api/admin/car-rental/live-monitoring/map:
 *   get:
 *     summary: Get live map data for active rentals with real GPS locations
 *     tags: [Admin Live Rental Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Live rental locations for map
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   bookingId: { type: string }
 *                   vehicle: { type: string }
 *                   renter: { type: string }
 *                   status: { type: string }
 *                   location: { 
 *                     type: object, 
 *                     nullable: true,
 *                     properties: { lat: {type:number}, lng: {type:number} } 
 *                   }
 *                   overdueBy: { type: string, nullable: true }
 */
router.get('/car-rental/live-monitoring/map', getLiveMapData);

export default router;