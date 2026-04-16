import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import * as controller from './driver-earnings-and-wallet.controller';
import * as dto from './driver-earnings-and-wallet.dto';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Driver Earnings & Wallet
 *   description: |
 *     Complete admin module for managing driver earnings, wallets, manual adjustments,
 *     payout history, and payout configuration. All calculations are based on real trip data.
 */

// ==================== DASHBOARD ====================
/**
 * @swagger
 * /api/admin/driver-earnings/stats:
 *   get:
 *     summary: Get Driver Earnings & Wallet Dashboard Statistics
 *     tags: [Admin Driver Earnings & Wallet]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns the four main cards shown on the Driver Earnings & Wallet page:
 *       Total Driver Earnings, Total Wallet Balance, Pending Payouts, and Active Drivers.
 *       All values are calculated from actual trips and wallet records.
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             example:
 *               totalDriverEarnings: 9210000
 *               totalWalletBalance: 578000
 *               pendingPayouts: 150000
 *               activeDrivers: 3
 *               totalDrivers: 12
 */
router.get('/driver-earnings/stats', controller.getDashboardStats);

// ==================== DRIVER WALLETS ====================
/**
 * @swagger
 * /api/admin/driver-earnings/wallets:
 *   get:
 *     summary: Get list of all driver wallets with real earnings
 *     tags: [Admin Driver Earnings & Wallet]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns the main table shown in the screenshot with driver name, status,
 *       wallet balance, weekly earnings, monthly earnings, and rating.
 *       Weekly = last 7 days, Monthly = last 30 days from completed trips.
 *     responses:
 *       200:
 *         description: List of driver wallets
 *         content:
 *           application/json:
 *             example:
 *               [
 *                 {
 *                   "driverId": "uuid",
 *                   "driverName": "James Wilson",
 *                   "status": "ACTIVE",
 *                   "walletBalance": 185000,
 *                   "weeklyEarnings": 125000,
 *                   "monthlyEarnings": 485000,
 *                   "rating": 4.8
 *                 }
 *               ]
 */
router.get('/driver-earnings/wallets', controller.getDriverWallets);

/**
 * @swagger
 * /api/admin/driver-earnings/wallets/{driverId}:
 *   get:
 *     summary: Get full driver detail (Overview + Earnings Details + Recent Trips)
 *     tags: [Admin Driver Earnings & Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     description: |
 *       Returns all data needed for the driver detail modal including Overview tab,
 *       Earnings Details (weekly/monthly), and Recent Trips tab.
 *     responses:
 *       200:
 *         description: Complete driver detail
 */
router.get('/driver-earnings/wallets/:driverId', controller.getDriverDetail);

// ==================== MANUAL ADJUSTMENT ====================
/**
 * @swagger
 * /api/admin/driver-earnings/wallets/{driverId}/adjust:
 *   post:
 *     summary: Manually adjust a driver's wallet balance (Credit or Debit)
 *     tags: [Admin Driver Earnings & Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The unique ID of the driver whose wallet you want to adjust
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, reason]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 50000
 *                 description: Positive amount to credit or debit
 *               reason:
 *                 type: string
 *                 example: "Bonus for excellent performance this week FROM HABEEB"
 *                 description: Clear reason for the adjustment (logged in transaction)
 *               type:
 *                 type: string
 *                 enum: ["CREDIT", "DEBIT"]
 *                 default: "CREDIT"
 *                 description: CREDIT adds to wallet, DEBIT subtracts (cannot go below 0)
 *     responses:
 *       200:
 *         description: Wallet adjusted successfully with transaction record
 *         content:
 *           application/json:
 *             example:
 *               message: "Wallet adjusted successfully"
 *               newBalance: 190000
 *               transactionId: "ADJ-174XXXXXX"
 *       400:
 *         description: Bad request (invalid driver, insufficient balance, etc.)
 *         content:
 *           application/json:
 *             example:
 *               message: "Insufficient wallet balance for debit"
 */
router.post('/driver-earnings/wallets/:driverId/adjust', validate(dto.walletAdjustmentSchema), controller.adjustWallet);

// ==================== PAYOUT HISTORY & SETTINGS ====================
/**
 * @swagger
 * /api/admin/driver-earnings/payout-runs:
 *   get:
 *     summary: Get recent payout run history
 *     tags: [Admin Driver Earnings & Wallet]
 *     security:
 *       - bearerAuth: []
 *     description: Returns the "Recent Payout Runs" table shown in the screenshot.
 *     responses:
 *       200:
 *         description: List of recent payout runs
 *         content:
 *           application/json:
 *             example:
 *               [
 *                 {
 *                   "date": "2026-04-10",
 *                   "driversPaid": 14,
 *                   "totalDisbursed": 850000,
 *                   "status": "SUCCESSFUL"
 *                 }
 *               ]
 */
router.get('/driver-earnings/payout-runs', controller.getRecentPayoutRuns);

/**
 * @swagger
 * /api/admin/driver-earnings/payout-settings:
 *   get:
 *     summary: Get current payout configuration
 *     tags: [Admin Driver Earnings & Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current payout settings
 */
router.get('/driver-earnings/payout-settings', controller.getPayoutSettings);

/**
 * @swagger
 * /api/admin/driver-earnings/payout-settings:
 *   patch:
 *     summary: Update payout configuration (frequency, threshold, auto-payout, etc.)
 *     tags: [Admin Driver Earnings & Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               frequency: { type: string, enum: ["DAILY","WEEKLY","BI_WEEKLY","MONTHLY"] }
 *               processingTime: { type: string, example: "23:59" }
 *               minimumThreshold: { type: number, example: 500 }
 *               autoPayoutEnabled: { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: Payout settings updated successfully
 */
router.patch('/driver-earnings/payout-settings', validate(dto.payoutSettingsSchema), controller.updatePayoutSettings);

export default router;