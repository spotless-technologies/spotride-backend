import { Router } from 'express';
import { driverAuth } from '../middleware/driver';
import {
  getTodayPerformance,
  getPerformanceSummary,
  getEarningsHistory,
  getEarningsBreakdown,
  getWallet,
  requestWithdraw,
} from '../controllers/driver-earnings.controller';

const router = Router();

router.use(driverAuth);

/**
 * @swagger
 * tags:
 *   name: Driver Earnings
 *   description: Driver earnings and performance
 */

/**
 * @swagger
 * /driver/performance/today:
 *   get:
 *     summary: Today's performance (earnings, trips, hours)
 *     tags: [Driver Earnings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's stats
 */
router.get('/performance/today', getTodayPerformance);

/**
 * @swagger
 * /driver/performance/summary:
 *   get:
 *     summary: Performance summary with delta vs yesterday
 *     tags: [Driver Earnings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary with comparison
 */
router.get('/performance/summary', getPerformanceSummary);

/**
 * @swagger
 * /driver/earnings:
 *   get:
 *     summary: Earnings history (daily/weekly/monthly)
 *     tags: [Driver Earnings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings history
 */
router.get('/earnings', getEarningsHistory);

/**
 * @swagger
 * /driver/earnings/breakdown:
 *   get:
 *     summary: Earnings per trip breakdown
 *     tags: [Driver Earnings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Per-trip earnings
 */
router.get('/earnings/breakdown', getEarningsBreakdown);

/**
 * @swagger
 * /driver/earnings/wallet:
 *   get:
 *     summary: Wallet balance and payout history
 *     tags: [Driver Earnings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet info
 */
router.get('/earnings/wallet', getWallet);

/**
 * @swagger
 * /driver/earnings/withdraw:
 *   post:
 *     summary: Request payout
 *     tags: [Driver Earnings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number }
 *     responses:
 *       200:
 *         description: Withdrawal requested
 */
router.post('/earnings/withdraw', requestWithdraw);

export default router;