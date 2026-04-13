import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import {
  getPromoStats,
  getPromotionalCampaigns,
  createPromoCode,
  updatePromoCode,
  togglePromoStatus,
  getAlerts,
} from './courier-growth-management.controller';
import { promoCodeSchema, promoUpdateSchema } from './courier-growth-management.dto';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Courier Growth Management
 *   description: |
 *     Admin module for managing courier growth through promotions and alerts.
 *     Includes promo code creation, statistics, campaign management, and real-time alert feed.
 */

// ==================== PROMOTIONS STATS ====================

/**
 * @swagger
 * /api/admin/courier-growth-management/stats:
 *   get:
 *     summary: Get promotions overview statistics
 *     tags: [Admin Courier Growth Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns real-time calculated statistics for the Promotions dashboard.
 *       All values are computed from actual PromoCode records in the database.
 *     responses:
 *       200:
 *         description: Promotions statistics
 *         content:
 *           application/json:
 *             example:
 *               activeCampaigns: 5
 *               totalRedemptions: 1247
 *               revenueImpact: 29863.45
 *               avgDiscount: 23.95
 */
router.get('/courier-growth-management/stats', getPromoStats);

/**
 * @swagger
 * /api/admin/courier-growth-management/campaigns:
 *   get:
 *     summary: Get all promotional campaigns with full details
 *     tags: [Admin Courier Growth Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns the full list of promo codes shown in the "Promotional Campaigns" table.
 *       Includes code, type, value, target, usage, impact, redemptions, and status.
 *     responses:
 *       200:
 *         description: List of promotional campaigns
 *         content:
 *           application/json:
 *             example:
 *               [
 *                 {
 *                   "id": "promo-uuid-1",
 *                   "code": "FIRSTDEL20",
 *                   "type": "% OFF",
 *                   "value": 20,
 *                   "description": "20% off on first delivery for new users",
 *                   "target": "NEW USERS",
 *                   "usageLimit": 500,
 *                   "currentUsage": 312,
 *                   "startDate": "2026-04-01T00:00:00Z",
 *                   "endDate": "2026-04-30T23:59:59Z",
 *                   "status": "ACTIVE",
 *                   "revenueImpact": 1248,
 *                   "redemptions": 312
 *                 }
 *               ]
 */
router.get('/courier-growth-management/campaigns', getPromotionalCampaigns);

/**
 * @swagger
 * /api/admin/courier-growth-management/campaigns:
 *   post:
 *     summary: Create a new promo code
 *     tags: [Admin Courier Growth Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Creates a new promotional code for courier growth campaigns.
 *       The code is automatically converted to uppercase.
 *       Status defaults to "ACTIVE".
 *       This endpoint is used from the "Create Promo Code" modal in the Promotions tab.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PromoCode'
 *           example:
 *             code: "SUMMER20"
 *             type: "% OFF"
 *             value: 20
 *             description: "20% off on first delivery for new users"
 *             target: "NEW USERS"
 *             usageLimit: 500
 *             startDate: "2026-04-01T00:00:00Z"
 *             endDate: "2026-04-30T23:59:59Z"
 *     responses:
 *       201:
 *         description: Promo code created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Promo code created successfully"
 *               promo:
 *                 id: "promo-uuid-here"
 *                 code: "SUMMER20"
 *                 type: "% OFF"
 *                 value: 20
 *                 description: "20% off on first delivery for new users"
 *                 target: "NEW USERS"
 *                 usageLimit: 500
 *                 currentUsage: 0
 *                 startDate: "2026-04-01T00:00:00Z"
 *                 endDate: "2026-04-30T23:59:59Z"
 *                 status: "ACTIVE"
 *                 revenueImpact: 0
 *                 redemptions: 0
 *                 createdAt: "2026-04-13T00:00:00Z"
 *       400:
 *         description: Validation error or duplicate code
 *         content:
 *           application/json:
 *             example:
 *               message: "Code 'SUMMER20' already exists"
 */
router.post('/courier-growth-management/campaigns', validate(promoCodeSchema), createPromoCode);

/**
 * @swagger
 * /api/admin/courier-growth-management/campaigns/{id}:
 *   put:
 *     summary: Update an existing promo code
 *     tags: [Admin Courier Growth Management]
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
 *             $ref: '#/components/schemas/PromoUpdate'
 *           example:
 *             value: 25
 *             description: "Updated 25% off for first delivery"
 *             usageLimit: 600
 *             endDate: "2026-05-15T23:59:59Z"
 *             status: "ACTIVE"
 *     responses:
 *       200:
 *         description: Promo code updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Promo code updated successfully"
 *               promo:
 *                 id: "promo-uuid-here"
 *                 code: "SUMMER20"
 *                 type: "% OFF"
 *                 value: 25
 *                 description: "Updated 25% off for first delivery"
 *                 usageLimit: 600
 *                 status: "ACTIVE"
 */
router.put('/courier-growth-management/campaigns/:id', validate(promoUpdateSchema), updatePromoCode);

/**
 * @swagger
 * /api/admin/courier-growth-management/campaigns/{id}/toggle:
 *   patch:
 *     summary: Toggle promo code between ACTIVE and INACTIVE
 *     tags: [Admin Courier Growth Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Promo status toggled successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Promo status toggled successfully"
 *               promo:
 *                 id: "promo-uuid-here"
 *                 code: "SUMMER20"
 *                 status: "INACTIVE"
 */
router.patch('/courier-growth-management/campaigns/:id/toggle', togglePromoStatus);

// ==================== ALERTS ====================

/**
 * @swagger
 * /api/admin/courier-growth-management/alerts:
 *   get:
 *     summary: Get alerts feed for courier growth
 *     tags: [Admin Courier Growth Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns the real-time alert feed shown in the "Alerts" tab.
 *       Includes title, message, type (CRITICAL, WARNING, INFO), status, and timestamp.
 *       Data comes from the CourierAlert model.
 *     responses:
 *       200:
 *         description: List of alerts
 *         content:
 *           application/json:
 *             example:
 *               [
 *                 {
 *                   "id": "alert-001",
 *                   "title": "Delivery Severely Overdue",
 *                   "message": "DEL-CX-20260331-002 (Medical Supplies) is 48 minutes past expected delivery time.",
 *                   "type": "CRITICAL",
 *                   "status": "NEW",
 *                   "createdAt": "2026-04-12T15:02:00Z"
 *                 }
 *               ]
 */
router.get('/courier-growth-management/alerts', getAlerts);

export default router;