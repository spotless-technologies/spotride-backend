import { Router } from 'express';
import { adminAuth } from '../middleware/admin';
import {
  getOverviewStats,
  getRevenueReports,
  getBookingAnalytics,
  getPerformanceMetrics,
} from './support-and-analytics.controller';


const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Support & Analytics
 *   description: Support and analytics dashboard with revenue reports, booking analytics, performance metrics and financial breakdown
 */

/**
 * @swagger
 * /api/admin/support-analytics/stats:
 *   get:
 *     summary: Get overview statistics (Total Revenue, Bookings, Commission)
 *     tags: [Admin Support & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [daily, weekly, monthly], default: monthly }
 *     responses:
 *       200:
 *         description: Overview statistics with percentage change vs previous period
 */
router.get('/support-analytics/stats', getOverviewStats);

/**
 * @swagger
 * /api/admin/support-analytics/revenue:
 *   get:
 *     summary: Get revenue analysis reports
 *     tags: [Admin Support & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [daily, weekly, monthly] }
 *     responses:
 *       200:
 *         description: Revenue reports table with Total Revenue, Commission, Owner Payouts and Net Margin
 */
router.get('/support-analytics/revenue', getRevenueReports);

/**
 * @swagger
 * /api/admin/support-analytics/bookings:
 *   get:
 *     summary: Get booking performance analytics
 *     tags: [Admin Support & Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking analytics including total bookings, cancellations, success rate and average booking value
 */
router.get('/support-analytics/bookings', getBookingAnalytics);

/**
 * @swagger
 * /api/admin/support-analytics/performance:
 *   get:
 *     summary: Get performance metrics (Fleet Utilization and Dispute Resolution)
 *     tags: [Admin Support & Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics with period-based utilization and dispute resolution rates
 */
router.get('/support-analytics/performance', getPerformanceMetrics);

export default router;