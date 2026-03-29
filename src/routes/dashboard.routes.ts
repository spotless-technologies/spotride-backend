import { Router } from 'express';
import { adminAuth } from '../middleware/admin';
import { getDashboardStats, getDriverRiderGrowth, getRecentActivity, getRevenueTrends } from '../controllers/dashboard.controller';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Dashboard
 *   description: Admin dashboard statistics and charts
 */

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard overview statistics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activeDrivers: { type: integer }
 *                 activeRiders: { type: integer }
 *                 liveRides: { type: integer }
 *                 completedToday: { type: integer }
 *                 pendingDriverApprovals: { type: integer }
 *                 pendingCarApprovals: { type: integer }
 *                 dailyRevenue: { type: number }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * @swagger
 * /api/admin/dashboard/recent-activity:
 *   get:
 *     summary: Get recent activity log
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent actions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name: { type: string }
 *                   action: { type: string }
 *                   time: { type: string, format: date-time }
 */
router.get('/dashboard/recent-activity', getRecentActivity);

/**
 * @swagger
 * /api/admin/dashboard/revenue-trends:
 *   get:
 *     summary: Revenue trends over time
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue data for chart
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date: { type: string }
 *                   revenue: { type: number }
 */
router.get('/dashboard/revenue-trends', getRevenueTrends);

/**
 * @swagger
 * /api/admin/dashboard/driver-rider-growth:
 *   get:
 *     summary: Driver & rider growth over time
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Growth data for chart
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date: { type: string }
 *                   drivers: { type: integer }
 *                   riders: { type: integer }
 */
router.get('/dashboard/driver-rider-growth', getDriverRiderGrowth);

export default router;