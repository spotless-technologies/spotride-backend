import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import {
  getSurcharges,
  updateSurcharge,
  getGeographicZones,
  createGeographicZone,
  getCourierCategories,
  createCourierCategory,
  getDisputeStats,
  getDisputes,
  updateDispute,
  getPayouts,
  updatePayoutStatus,
} from './courier-management.controller';
import { 
  surchargeSchema, 
  zoneSchema, 
  categorySchema, 
  disputeUpdateSchema, 
  payoutActionSchema 
} from './courier-management.dto';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Courier Management
 *   description: |
 *     Admin Courier Management which
 *     handles Surcharges, Geographic Zones, Categories, Disputes, and Payouts.
 */

// ==================== SURCHARGES ====================

/**
 * @swagger
 * /api/admin/courier-management/surcharges:
 *   get:
 *     summary: Get all package size surcharges
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns the complete Package Size Surcharges table as shown in the Surcharges tab.
 *       Includes Size, Weight Range, Bike Extra fee, Car Extra fee, and Notes.
 *     responses:
 *       200:
 *         description: List of surcharges
 *         content:
 *           application/json:
 *             example:
 *               [
 *                 {
 *                   "id": "surcharge-uuid-1",
 *                   "size": "SMALL",
 *                   "weightRange": "Up to 5kg",
 *                   "bikeExtra": 0,
 *                   "carExtra": 0,
 *                   "notes": "Standard small parcel, no surcharge"
 *                 },
 *                 {
 *                   "id": "surcharge-uuid-2",
 *                   "size": "MEDIUM",
 *                   "weightRange": "5kg - 15kg",
 *                   "bikeExtra": 3.0,
 *                   "carExtra": 2.0,
 *                   "notes": "Medium package surcharge applies"
 *                 }
 *               ]
 */
router.get('/courier-management/surcharges', getSurcharges);

/**
 * @swagger
 * /api/admin/courier-management/surcharges/{id}:
 *   put:
 *     summary: Update a package size surcharge
 *     tags: [Admin Courier Management]
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
 *             $ref: '#/components/schemas/Surcharge'
 *           example:
 *             size: "MEDIUM"
 *             weightRange: "5kg - 15kg"
 *             bikeExtra: 3.5
 *             carExtra: 2.5
 *             notes: "Updated medium package surcharge"
 *     responses:
 *       200:
 *         description: Surcharge updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Surcharge updated successfully"
 *               data:
 *                 id: "surcharge-uuid-2"
 *                 size: "MEDIUM"
 *                 weightRange: "5kg - 15kg"
 *                 bikeExtra: 3.5
 *                 carExtra: 2.5
 *                 notes: "Updated medium package surcharge"
 */
router.put('/courier-management/surcharges/:id', validate(surchargeSchema), updateSurcharge);

// ==================== GEOGRAPHIC ZONES ====================

/**
 * @swagger
 * /api/admin/courier-management/zones:
 *   get:
 *     summary: Get all geographic pricing zones
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns all geographic pricing zones with multipliers and rate per km as shown in the Geographic Zones tab.
 *     responses:
 *       200:
 *         description: List of geographic zones
 *         content:
 *           application/json:
 *             example:
 *               [
 *                 {
 *                   "id": "zone-uuid-1",
 *                   "name": "Lagos Island",
 *                   "type": "URBAN",
 *                   "multiplier": 1.0,
 *                   "ratePerKm": 1.2,
 *                   "isActive": true
 *                 }
 *               ]
 */
router.get('/courier-management/zones', getGeographicZones);

/**
 * @swagger
 * /api/admin/courier-management/zones:
 *   post:
 *     summary: Create a new geographic pricing zone
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Zone'
 *           example:
 *             name: "Nairobi CBD"
 *             type: "URBAN"
 *             multiplier: 1.0
 *             ratePerKm: 1.2
 *     responses:
 *       201:
 *         description: Zone created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Geographic zone created successfully"
 *               zone:
 *                 id: "zone-uuid-new"
 *                 name: "Nairobi CBD"
 *                 type: "URBAN"
 *                 multiplier: 1.0
 *                 ratePerKm: 1.2
 *                 isActive: true
 */
router.post('/courier-management/zones', validate(zoneSchema), createGeographicZone);

// ==================== CATEGORIES ====================

/**
 * @swagger
 * /api/admin/courier-management/categories:
 *   get:
 *     summary: Get all active courier categories
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active courier categories
 *         content:
 *           application/json:
 *             example:
 *               [
 *                 {
 *                   "id": "cat-uuid-1",
 *                   "name": "Documents",
 *                   "description": "Legal documents, contracts, official paperwork",
 *                   "vehicleRestriction": "BIKE_ONLY",
 *                   "insuranceLevel": "BASIC",
 *                   "pricingMultiplier": 1.0
 *                 }
 *               ]
 */
router.get('/courier-management/categories', getCourierCategories);

/**
 * @swagger
 * /api/admin/courier-management/categories:
 *   post:
 *     summary: Create a new courier category
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *           example:
 *             name: "Medical Supplies"
 *             description: "Pharmaceuticals and medical equipment"
 *             vehicleRestriction: "CAR_ONLY"
 *             insuranceLevel: "PREMIUM"
 *             pricingMultiplier: 1.8
 *             maxDeliveryWindow: 480
 *             requirements: ["Temperature Control", "Signature Required"]
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Category created successfully"
 *               category:
 *                 id: "cat-uuid-new"
 *                 name: "Medical Supplies"
 *                 description: "Pharmaceuticals and medical equipment"
 *                 vehicleRestriction: "CAR_ONLY"
 *                 insuranceLevel: "PREMIUM"
 *                 pricingMultiplier: 1.8
 */
router.post('/courier-management/categories', validate(categorySchema), createCourierCategory);

// ==================== DISPUTES ====================

/**
 * @swagger
 * /api/admin/courier-management/disputes/stats:
 *   get:
 *     summary: Get disputes statistics
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dispute statistics cards
 *         content:
 *           application/json:
 *             example:
 *               totalDisputes: 23
 *               open: 312
 *               investigating: 7
 *               avgResolutionDays: 1.8
 *               totalRefunds: 842
 */
router.get('/courier-management/disputes/stats', getDisputeStats);

/**
 * @swagger
 * /api/admin/courier-management/disputes:
 *   get:
 *     summary: Get all courier disputes
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full list of disputes with driver details
 */
router.get('/courier-management/disputes', getDisputes);

/**
 * @swagger
 * /api/admin/courier-management/disputes/{id}:
 *   patch:
 *     summary: Update dispute status or resolution
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisputeUpdate'
 *           example:
 *             status: "RESOLVED"
 *             resolutionNotes: "Issue resolved after investigation and refund issued"
 *             refundAmount: 45.5
 *     responses:
 *       200:
 *         description: Dispute updated successfully
 */
router.patch('/courier-management/disputes/:id', validate(disputeUpdateSchema), updateDispute);

// ==================== PAYOUTS ====================

/**
 * @swagger
 * /api/admin/courier-management/payouts:
 *   get:
 *     summary: Get driver earnings and pending payouts
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payouts with driver information
 *         content:
 *           application/json:
 *             example:
 *               [
 *                 {
 *                   "id": "payout-uuid",
 *                   "driver": { "user": { "firstName": "Marcus", "lastName": "Johnson" } },
 *                   "rideEarnings": 420.5,
 *                   "deliveryEarnings": 880.2,
 *                   "bonus": 45,
 *                   "commission": -170.5,
 *                   "pendingAmount": 680.2,
 *                   "status": "PENDING"
 *                 }
 *               ]
 */
router.get('/courier-management/payouts', getPayouts);

/**
 * @swagger
 * /api/admin/courier-management/payouts/{id}:
 *   patch:
 *     summary: Update payout status (Approve or On Hold)
 *     tags: [Admin Courier Management]
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
 *             $ref: '#/components/schemas/PayoutAction'
 *           example:
 *             status: "APPROVED"
 *     responses:
 *       200:
 *         description: Payout status updated successfully
 */
router.patch('/courier-management/payouts/:id', validate(payoutActionSchema), updatePayoutStatus);

export default router;