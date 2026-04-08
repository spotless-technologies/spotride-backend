import { Router } from 'express';
import { adminAuth } from '../middleware/admin';
import {
  getCourierStats,
  getCourierDrivers,
  getActiveDeliveries,
  getDeliveryHistory,
} from './courier-management-operations.controller';


const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Courier Management
 *   description: Courier operations, drivers, active deliveries and history
 */

// ==================== OVERVIEW STATS ====================

/**
 * @swagger
 * /api/admin/courier-management/stats:
 *   get:
 *     summary: Get courier management overview statistics
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview statistics cards
 *         content:
 *           application/json:
 *             example:
 *               activeDrivers: 68
 *               inProgress: 94
 *               todaysCompleted: 312
 *               dailyRevenue: 4850
 */
router.get('/courier-management/stats', getCourierStats);

/**
 * @swagger
 * /api/admin/courier-management/drivers:
 *   get:
 *     summary: Get courier drivers list with filters
 *     tags: [Admin Courier Management]
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
 *         schema: { type: string, enum: [Online, Offline, On Delivery, Suspended, all] }
 *       - in: query
 *         name: vehicleType
 *         schema: { type: string, enum: [Bike, Car, all] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of courier drivers
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 - id: "drv-001"
 *                   driver:
 *                     user:
 *                       firstName: "Marcus"
 *                       lastName: "Johnson"
 *                   vehicleType: "Bike"
 *                   status: "Online"
 *                   rating: 4.9
 *                   totalDeliveries: 2340
 *                   successRate: 97.8
 *               meta:
 *                 page: 1
 *                 limit: 20
 *                 total: 7
 *                 pages: 1
 */
router.get('/courier-management/drivers', getCourierDrivers);

/**
 * @swagger
 * /api/admin/courier-management/active-deliveries:
 *   get:
 *     summary: Get currently active deliveries with map data and live feed
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active deliveries for map and live feed
 *         content:
 *           application/json:
 *             example:
 *               - id: "CX-20260331-001"
 *                 trackingNumber: "CX-20260331-001"
 *                 courier:
 *                   driver:
 *                     user:
 *                       firstName: "Marcus"
 *                       lastName: "Johnson"
 *                 status: "In Transit"
 *                 category: "Food & Beverages"
 *                 pickupLocation: { "address": "45 Main St, Downtown" }
 *                 dropoffLocation: { "address": "88 Oak Ave, Midtown" }
 *                 fare: 12.50
 */
router.get('/courier-management/active-deliveries', getActiveDeliveries);

/**
 * @swagger
 * /api/admin/courier-management/delivery-history:
 *   get:
 *     summary: Get delivery history with filters
 *     tags: [Admin Courier Management]
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
 *         schema: { type: string, enum: [In Transit, Delivered, Failed, Cancelled, all] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated delivery history
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 - trackingNumber: "CX-20260330-212"
 *                   date: "2026-03-30T18:45:00Z"
 *                   driver:
 *                     user:
 *                       firstName: "Marcus"
 *                       lastName: "Johnson"
 *                   vehicleType: "Bike"
 *                   category: "Food & Beverages"
 *                   route: "Pizza Palace → Tom Bradley"
 *                   duration: "22 min"
 *                   fare: 12.50
 *                   status: "Delivered"
 *               meta:
 *                 page: 1
 *                 limit: 20
 *                 total: 7
 *                 pages: 1
 */
router.get('/courier-management/delivery-history', getDeliveryHistory);

export default router;