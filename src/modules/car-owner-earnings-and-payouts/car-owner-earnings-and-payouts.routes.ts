import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import * as controller from './car-owner-earnings-and-payouts.controller';
import * as dto from './car-owner-earnings-and-payouts.dto';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Car Owner Earnings & Payouts
 *   description: Complete management of car owner earnings, payout requests, manual adjustments, history and monthly summaries for admin users
 */

// ==================== STATS ====================
/**
 * @swagger
 * /api/admin/car-owner-earnings/stats:
 *   get:
 *     summary: Get overall car owner earnings statistics
 *     tags: [Admin Car Owner Earnings & Payouts]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns all dashboard stats cards shown in the screenshots:
 *       - Total Earnings
 *       - Pending Payouts
 *       - Active Owners
 *       - Total Cars
 *       - Next Payout Run (dynamic, calculated based on current date)
 *     responses:
 *       200:
 *         description: Earnings statistics
 *         content:
 *           application/json:
 *             example:
 *               totalEarnings: 63660
 *               pendingPayouts: 7910
 *               activeOwners: 4
 *               totalCars: 16
 *               nextPayoutRun: "2026-04-20T23:59:00.000Z"
 */
router.get('/car-owner-earnings/stats', controller.getCarOwnerEarningsStats);

// ==================== CAR OWNERS LIST ====================
/**
 * @swagger
 * /api/admin/car-owner-earnings/owners:
 *   get:
 *     summary: Get list of all car owners with earnings and payout status
 *     tags: [Admin Car Owner Earnings & Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: ["approved", "pending", "suspended", "ALL"] }
 *     responses:
 *       200:
 *         description: List of car owners with total earnings, cars count, pending payout, last payout, status and actions
 */
router.get('/car-owner-earnings/owners', controller.getCarOwnerList);

// ==================== PAYOUT REQUESTS ====================
/**
 * @swagger
 * /api/admin/car-owner-earnings/payout-requests:
 *   get:
 *     summary: Get payout requests with status filter
 *     tags: [Admin Car Owner Earnings & Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: ["PENDING", "APPROVED", "DECLINED", "PAID", "ALL"], default: "PENDING" }
 *     responses:
 *       200:
 *         description: Payout requests list with Approve / Decline actions (matches Payout Requests tab)
 */
router.get('/car-owner-earnings/payout-requests', controller.getPayoutRequests);

/**
 * @swagger
 * /api/admin/car-owner-earnings/payout-requests/{requestId}/action:
 *   post:
 *     summary: Approve or Decline a specific payout request
 *     tags: [Admin Car Owner Earnings & Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: ["APPROVE", "DECLINE"] }
 *               adminNotes: { type: string, example: "Approved after verification of documents" }
 *     responses:
 *       200:
 *         description: Payout request processed successfully
 */
router.post('/car-owner-earnings/payout-requests/:requestId/action', validate(dto.payoutActionSchema), controller.approveOrDeclinePayout);

// ==================== MANUAL ADJUSTMENT ====================
/**
 * @swagger
 * /api/admin/car-owner-earnings/manual-adjustment:
 *   post:
 *     summary: Manually add or deduct funds from a car owner's earnings
 *     tags: [Admin Car Owner Earnings & Payouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [carOwnerId, amount, type, reason]
 *             properties:
 *               carOwnerId: { type: string, format: uuid }
 *               amount: { type: number, example: 5000 }
 *               type: { type: string, enum: ["ADD", "DEDUCT"] }
 *               reason: { type: string, example: "Bonus for excellent performance this month" }
 *     responses:
 *       200:
 *         description: Manual adjustment applied successfully
 */
router.post('/car-owner-earnings/manual-adjustment', validate(dto.manualAdjustmentSchema), controller.manualAdjustment);

// ==================== EARNINGS HISTORY ====================
/**
 * @swagger
 * /api/admin/car-owner-earnings/{carOwnerId}/history:
 *   get:
 *     summary: Get detailed earnings history for a specific car owner
 *     tags: [Admin Car Owner Earnings & Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carOwnerId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Earnings history with Gross Earnings, Platform Fees, and Net Earnings breakdown (matches Earnings History tab)
 */
router.get('/car-owner-earnings/:carOwnerId/history', controller.getEarningsHistory);

// ==================== MONTHLY SUMMARY ====================
/**
 * @swagger
 * /api/admin/car-owner-earnings/{carOwnerId}/monthly-summary:
 *   get:
 *     summary: Get monthly performance summary for a car owner
 *     tags: [Admin Car Owner Earnings & Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carOwnerId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Monthly performance bars and key metrics (Average Monthly Earnings, Utilization Rate, Customer Rating, etc.)
 */
router.get('/car-owner-earnings/:carOwnerId/monthly-summary', controller.getMonthlySummary);

export default router;