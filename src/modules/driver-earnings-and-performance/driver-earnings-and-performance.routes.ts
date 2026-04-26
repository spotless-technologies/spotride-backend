import { Router } from 'express';
import { driverAuth } from '../../middleware/driver';
import {
  getTodayPerformance,
  getPerformanceSummary,
  getEarningsHistory,
  getEarningsBreakdown,
  getWallet,
  requestWithdraw,
} from './driver-earnings-and-performance.controller';

const router = Router();

router.use(driverAuth);

/**
 * @swagger
 * tags:
 *   name: Driver Earnings & Performance
 *   description: Driver earnings tracking, performance metrics, and wallet management
 */

/**
 * @swagger
 * /api/driver/performance/today:
 *   get:
 *     summary: Get today's performance metrics
 *     tags: [Driver Earnings & Performance]
 *     security:
 *       - bearerAuth: []
 *     description: Returns today's trip count and earnings for the authenticated driver
 *     responses:
 *       200:
 *         description: Today's performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tripsToday:
 *                       type: integer
 *                       example: 5
 *                     earningsToday:
 *                       type: number
 *                       example: 25000
 */
router.get('/performance/today', getTodayPerformance);

/**
 * @swagger
 * /api/driver/performance/summary:
 *   get:
 *     summary: Get performance summary with comparison to yesterday
 *     tags: [Driver Earnings & Performance]
 *     security:
 *       - bearerAuth: []
 *     description: Returns today's earnings and trips with percentage change from yesterday
 *     responses:
 *       200:
 *         description: Performance summary with comparison
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     todayEarnings:
 *                       type: number
 *                       example: 25000
 *                     todayTrips:
 *                       type: integer
 *                       example: 5
 *                     deltaPercentage:
 *                       type: string
 *                       example: "15.5"
 */
router.get('/performance/summary', getPerformanceSummary);

/**
 * @swagger
 * /api/driver/earnings:
 *   get:
 *     summary: Get earnings history
 *     tags: [Driver Earnings & Performance]
 *     security:
 *       - bearerAuth: []
 *     description: Returns daily earnings history with revenue and fare breakdown
 *     responses:
 *       200:
 *         description: Earnings history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       revenue:
 *                         type: number
 *                       fare:
 *                         type: number
 *                       trips:
 *                         type: integer
 */
router.get('/earnings', getEarningsHistory);

/**
 * @swagger
 * /api/driver/earnings/breakdown:
 *   get:
 *     summary: Get per-trip earnings breakdown
 *     tags: [Driver Earnings & Performance]
 *     security:
 *       - bearerAuth: []
 *     description: Returns detailed breakdown of earnings per trip
 *     responses:
 *       200:
 *         description: Per-trip earnings breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tripId:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       revenue:
 *                         type: number
 *                       fare:
 *                         type: number
 *                       rating:
 *                         type: number
 *                       status:
 *                         type: string
 */
router.get('/earnings/breakdown', getEarningsBreakdown);

/**
 * @swagger
 * /api/driver/earnings/wallet:
 *   get:
 *     summary: Get wallet balance and earnings summary
 *     tags: [Driver Earnings & Performance]
 *     security:
 *       - bearerAuth: []
 *     description: Returns current wallet balance, total earnings, and pending payouts
 *     responses:
 *       200:
 *         description: Wallet information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       example: 185000
 *                     totalEarnings:
 *                       type: number
 *                       example: 925000
 *                     pendingPayouts:
 *                       type: number
 *                       example: 150000
 */
router.get('/earnings/wallet', getWallet);

/**
 * @swagger
 * /api/driver/earnings/withdraw:
 *   post:
 *     summary: Request withdrawal from wallet
 *     tags: [Driver Earnings & Performance]
 *     security:
 *       - bearerAuth: []
 *     description: Submit a withdrawal request to transfer funds from wallet to bank account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 example: 50000
 *                 description: Amount to withdraw in Naira
 *     responses:
 *       200:
 *         description: Withdrawal request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Withdrawal request submitted successfully"
 *                     withdrawalId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     status:
 *                       type: string
 *                       example: "PENDING"
 *                     reference:
 *                       type: string
 */
router.post('/earnings/withdraw', requestWithdraw);

export default router;