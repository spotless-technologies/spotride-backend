import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import * as controller from './promo-codes-and-discounts.controller';
import * as dto from './promo-codes-and-discounts.dto';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Promo Codes & Discounts
 *   description: |
 *     Full management of promo codes and discounts.
 */

// ==================== STATS ====================
/**
 * @swagger
 * /api/admin/promo-codes/stats:
 *   get:
 *     summary: Get promo codes overview statistics
 *     tags: [Admin Promo Codes & Discounts]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns Total Promos, Active Promos, Total Uses, and Total Savings (real calculated values).
 *     responses:
 *       200:
 *         description: Promo statistics cards
 *         content:
 *           application/json:
 *             example:
 *               totalPromos: 5
 *               activePromos: 3
 *               totalUses: 877
 *               totalSavings: 428300
 */
router.get('/promo-codes/stats', controller.getPromoStats);

// ==================== PROMO LIST ====================
/**
 * @swagger
 * /api/admin/promo-codes:
 *   get:
 *     summary: Get list of all promo codes with filters
 *     tags: [Admin Promo Codes & Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: ["ACTIVE", "INACTIVE", "ALL"], default: "ALL" }
 *     responses:
 *       200:
 *         description: List of promo codes with details, usage, target group, expiry, and status
 */
router.get('/promo-codes', controller.getPromoList);

// ==================== CREATE PROMO ====================
/**
 * @swagger
 * /api/admin/promo-codes:
 *   post:
 *     summary: Create a new promo code
 *     tags: [Admin Promo Codes & Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [promoName, promoCode, discountType, discountValue, targetGroup, expiryDate]
 *             properties:
 *               promoName: { type: string, example: "Welcome Bonus" }
 *               promoCode: { type: string, example: "WELCOME2024" }
 *               discountType: { type: string, enum: ["FIXED_AMOUNT", "PERCENTAGE"] }
 *               discountValue: { type: number, example: 500 }
 *               usageLimit: { type: number, example: 1000 }
 *               targetGroup: { type: string, enum: ["ALL_USERS", "NEW_USERS", "PREMIUM_MEMBERS", "FREQUENT_RIDERS"] }
 *               expiryDate: { type: string, format: date-time, example: "2026-12-31T23:59:59Z" }
 *     responses:
 *       201:
 *         description: Promo code created successfully
 */
router.post('/promo-codes', validate(dto.createPromoSchema), controller.createPromo);

// ==================== UPDATE PROMO ====================
/**
 * @swagger
 * /api/admin/promo-codes/{id}:
 *   put:
 *     summary: Update an existing promo code
 *     tags: [Admin Promo Codes & Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               promoName: { type: string }
 *               promoCode: { type: string }
 *               discountType: { type: string, enum: ["FIXED_AMOUNT", "PERCENTAGE"] }
 *               discountValue: { type: number }
 *               usageLimit: { type: number }
 *               targetGroup: { type: string, enum: ["ALL_USERS", "NEW_USERS", "PREMIUM_MEMBERS", "FREQUENT_RIDERS"] }
 *               expiryDate: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Promo updated successfully
 */
router.put('/promo-codes/:id', validate(dto.updatePromoSchema), controller.updatePromo);

// ==================== TOGGLE STATUS ====================
/**
 * @swagger
 * /api/admin/promo-codes/{id}/toggle:
 *   patch:
 *     summary: Enable or Disable a promo code
 *     tags: [Admin Promo Codes & Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               action: { type: string, enum: ["ENABLE", "DISABLE"] }
 *     responses:
 *       200:
 *         description: Promo status toggled successfully
 */
router.patch('/promo-codes/:id/toggle', validate(dto.promoActionSchema), controller.togglePromoStatus);

// ==================== USAGE REPORT ====================
/**
 * @swagger
 * /api/admin/promo-codes/{promoId}/usage-report:
 *   get:
 *     summary: Get detailed usage report for a promo code
 *     tags: [Admin Promo Codes & Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promoId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detailed usage report including recent redemptions with real trip data
 *         content:
 *           application/json:
 *             example:
 *               promoName: "Welcome Bonus"
 *               totalUses: 387
 *               totalSavings: 193500
 *               usageRate: 39
 *               recentUsage:
 *                 - userName: "John Doe"
 *                   dateTime: "2026-04-25T14:30:00Z"
 *                   tripAmount: 1200
 *                   savedAmount: 240
 */
router.get('/promo-codes/:promoId/usage-report', controller.getUsageReport);

export default router;