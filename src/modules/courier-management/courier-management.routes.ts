import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import {
  getSurcharges,
  updateSurcharge,
  getGeographicZones,
  createGeographicZone,
  updateGeographicZone,
  deleteGeographicZone,
  getCourierCategories,
  getAllCourierCategories,
  getCourierCategoryById,
  createCourierCategory,
  updateCourierCategory,
  deleteCourierCategory,
  getCategoryStats,
  getBasePricing,
  getBasePricingById,
  createBasePricing,
  updateBasePricing,
  deleteBasePricing,
  getDisputeStats,
  getDisputes,
  getDisputeById,
  updateDispute,
  processDisputeAction,
  getPayouts,
  getPayoutSummaryStats,
  updatePayoutStatus,
  bulkUpdatePayoutStatus,
  createSurcharge,
} from './courier-management.controller';
import { 
  surchargeSchema, 
  zoneSchema, 
  categorySchema, 
  disputeUpdateSchema, 
  payoutActionSchema,
  basePricingSchema,
  categoryUpdateSchema,
  disputeActionSchema,
  bulkPayoutActionSchema,
} from './courier-management.dto';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Courier Management
 *   description: Complete Courier Management System
 *   components:
 *     schemas:
 *       Surcharge:
 *         type: object
 *         required:
 *           - size
 *           - weightRange
 *         properties:
 *           id:
 *             type: string
 *             format: uuid
 *             example: "550e8400-e29b-41d4-a716-446655440000"
 *           size:
 *             type: string
 *             enum: [SMALL, MEDIUM, LARGE, EXTRA_LARGE]
 *             example: "MEDIUM"
 *           weightRange:
 *             type: string
 *             example: "5kg - 15kg"
 *           bikeExtra:
 *             type: number
 *             format: float
 *             example: 3.00
 *           carExtra:
 *             type: number
 *             format: float
 *             example: 2.00
 *           notes:
 *             type: string
 *             example: "Medium package surcharge applies"
 *       
 *       GeographicZone:
 *         type: object
 *         required:
 *           - name
 *           - type
 *           - ratePerKm
 *         properties:
 *           id:
 *             type: string
 *             format: uuid
 *           name:
 *             type: string
 *             example: "Lagos Island"
 *           type:
 *             type: string
 *             enum: [URBAN, SUBURBAN, RURAL, INTERCITY]
 *             example: "URBAN"
 *           multiplier:
 *             type: number
 *             format: float
 *             default: 1.0
 *             example: 1.2
 *           ratePerKm:
 *             type: number
 *             format: float
 *             example: 1.20
 *           isActive:
 *             type: boolean
 *             default: true
 *       
 *       CourierCategory:
 *         type: object
 *         required:
 *           - name
 *         properties:
 *           id:
 *             type: string
 *             format: uuid
 *           name:
 *             type: string
 *             example: "Medical Supplies"
 *           description:
 *             type: string
 *             example: "Pharmaceuticals and medical equipment"
 *           vehicleRestriction:
 *             type: string
 *             enum: [BIKE_ONLY, CAR_ONLY, BOTH]
 *             example: "CAR_ONLY"
 *           insuranceLevel:
 *             type: string
 *             enum: [NONE, BASIC, STANDARD, PREMIUM]
 *             example: "PREMIUM"
 *           pricingMultiplier:
 *             type: number
 *             format: float
 *             default: 1.0
 *             example: 1.8
 *           maxDeliveryWindow:
 *             type: integer
 *             example: 480
 *             description: "Maximum delivery window in minutes"
 *           requirements:
 *             type: array
 *             items:
 *               type: string
 *             example: ["Temperature Control", "Signature Required"]
 *           isActive:
 *             type: boolean
 *             default: true
 *       
 *       BasePricing:
 *         type: object
 *         required:
 *           - category
 *           - baseFare
 *           - ratePerKm
 *           - minFare
 *         properties:
 *           id:
 *             type: string
 *             format: uuid
 *           category:
 *             type: string
 *             enum: [BIKE_STANDARD, CAR_STANDARD, CAR_EXPRESS]
 *             example: "CAR_EXPRESS"
 *           baseFare:
 *             type: number
 *             format: float
 *             example: 8.00
 *           ratePerKm:
 *             type: number
 *             format: float
 *             example: 2.20
 *           minFare:
 *             type: number
 *             format: float
 *             example: 10.00
 *           peakMultiplier:
 *             type: number
 *             format: float
 *             default: 1.0
 *             example: 1.60
 *           notes:
 *             type: string
 *             example: "Express delivery for time-sensitive packages"
 *       
 *       CourierDispute:
 *         type: object
 *         properties:
 *           id:
 *             type: string
 *             format: uuid
 *           disputeCode:
 *             type: string
 *             example: "DSP-001"
 *           trackingNumber:
 *             type: string
 *             example: "TRK-20260328-182"
 *           status:
 *             type: string
 *             enum: [OPEN, INVESTIGATING, ESCALATED, RESOLVED, CLOSED]
 *           priority:
 *             type: string
 *             enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           type:
 *             type: string
 *             enum: [PACKAGE_DAMAGED, NOT_DELIVERED, OVERCHARGING, DRIVER_BEHAVIOR, WRONG_ITEM]
 *           description:
 *             type: string
 *           photos:
 *             type: array
 *             items:
 *               type: string
 *           gpsLog:
 *             type: boolean
 *           resolutionNotes:
 *             type: string
 *           refundAmount:
 *             type: number
 *             format: float
 *       
 *       CourierPayout:
 *         type: object
 *         properties:
 *           id:
 *             type: string
 *             format: uuid
 *           driverId:
 *             type: string
 *             format: uuid
 *           rideEarnings:
 *             type: number
 *             format: float
 *           deliveryEarnings:
 *             type: number
 *             format: float
 *           bonus:
 *             type: number
 *             format: float
 *           commission:
 *             type: number
 *             format: float
 *           pendingAmount:
 *             type: number
 *             format: float
 *           status:
 *             type: string
 *             enum: [PENDING, APPROVED, ON_HOLD, PAID]
 */

// ==================== BASE PRICING ====================

/**
 * @swagger
 * /api/admin/courier-management/base-pricing:
 *   get:
 *     summary: Get all base pricing configurations
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns all courier base pricing configurations including:
 *       - Bike Standard pricing (Base Fare: $3.50, Per Km: $1.20)
 *       - Car Standard pricing (Base Fare: $5.50, Per Km: $1.80)
 *       - Car Express pricing (Base Fare: $8.00, Per Km: $2.20)
 *     responses:
 *       200:
 *         description: List of base pricing configurations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BasePricing'
 *             example:
 *               - id: "bike-standard-uuid"
 *                 category: "BIKE_STANDARD"
 *                 baseFare: 3.50
 *                 ratePerKm: 1.20
 *                 minFare: 4.00
 *                 peakMultiplier: 1.40
 *                 notes: "Standard bike delivery for small packages"
 *               - id: "car-standard-uuid"
 *                 category: "CAR_STANDARD"
 *                 baseFare: 5.50
 *                 ratePerKm: 1.80
 *                 minFare: 7.00
 *                 peakMultiplier: 1.40
 *                 notes: "Standard car delivery"
 *               - id: "car-express-uuid"
 *                 category: "CAR_EXPRESS"
 *                 baseFare: 8.00
 *                 ratePerKm: 2.20
 *                 minFare: 10.00
 *                 peakMultiplier: 1.60
 *                 notes: "Express delivery for time-sensitive packages"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/courier-management/base-pricing', getBasePricing);

/**
 * @swagger
 * /api/admin/courier-management/base-pricing/{id}:
 *   get:
 *     summary: Get a specific base pricing configuration by ID
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the base pricing configuration
 *     responses:
 *       200:
 *         description: Base pricing configuration found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasePricing'
 *       404:
 *         description: Base pricing not found
 *       401:
 *         description: Unauthorized
 */
router.get('/courier-management/base-pricing/:id', getBasePricingById);

/**
 * @swagger
 * /api/admin/courier-management/base-pricing:
 *   post:
 *     summary: Create a new base pricing configuration
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BasePricing'
 *           example:
 *             category: "BIKE_STANDARD"
 *             baseFare: 3.50
 *             ratePerKm: 1.20
 *             minFare: 4.00
 *             peakMultiplier: 1.40
 *             notes: "Standard bike delivery"
 *     responses:
 *       201:
 *         description: Base pricing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasePricing'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Category already exists
 */
router.post('/courier-management/base-pricing', validate(basePricingSchema), createBasePricing);

/**
 * @swagger
 * /api/admin/courier-management/base-pricing/{id}:
 *   put:
 *     summary: Update an existing base pricing configuration
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BasePricing'
 *           example:
 *             category: "CAR_EXPRESS"
 *             baseFare: 9.00
 *             ratePerKm: 2.50
 *             minFare: 12.00
 *             peakMultiplier: 1.80
 *             notes: "Updated express pricing"
 *     responses:
 *       200:
 *         description: Base pricing updated successfully
 *       404:
 *         description: Base pricing not found
 */
router.put('/courier-management/base-pricing/:id', validate(basePricingSchema), updateBasePricing);

/**
 * @swagger
 * /api/admin/courier-management/base-pricing/{id}:
 *   delete:
 *     summary: Delete a base pricing configuration
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Base pricing deleted successfully
 *       404:
 *         description: Base pricing not found
 */
router.delete('/courier-management/base-pricing/:id', deleteBasePricing);

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
 *       Returns the complete Package Size Surcharges table:
 *       - Small (Up to 5kg): No surcharge
 *       - Medium (5kg - 15kg): +$3.00 for bike, +$2.00 for car
 *       - Large (15kg - 30kg): Bike restricted, +$6.00 for car
 *       - Extra Large (30kg+): Bike restricted, +$12.00 for car
 *     responses:
 *       200:
 *         description: List of package size surcharges
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Surcharge'
 *             example:
 *               - id: "surcharge-1"
 *                 size: "SMALL"
 *                 weightRange: "Up to 5kg"
 *                 bikeExtra: 0
 *                 carExtra: 0
 *                 notes: "Standard small parcel, no surcharge"
 *               - id: "surcharge-2"
 *                 size: "MEDIUM"
 *                 weightRange: "5kg - 15kg"
 *                 bikeExtra: 3.00
 *                 carExtra: 2.00
 *                 notes: "Medium package surcharge applies"
 *               - id: "surcharge-3"
 *                 size: "LARGE"
 *                 weightRange: "15kg - 30kg"
 *                 bikeExtra: null
 *                 carExtra: 6.00
 *                 notes: "Bike restricted; car only surcharge"
 *               - id: "surcharge-4"
 *                 size: "EXTRA_LARGE"
 *                 weightRange: "30kg+"
 *                 bikeExtra: null
 *                 carExtra: 12.00
 *                 notes: "Car only - XL surcharge"
 */
router.get('/courier-management/surcharges', getSurcharges);

/**
 * @swagger
 * /api/admin/courier-management/surcharges:
 *   post:
 *     summary: Create a new package size surcharge
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Surcharge'
 *           examples:
 *             small:
 *               summary: "Small Package"
 *               value:
 *                 size: "SMALL"
 *                 weightRange: "Up to 5kg"
 *                 bikeExtra: 0
 *                 carExtra: 0
 *                 notes: "Standard small parcel, no surcharge"
 *             medium:
 *               summary: "Medium Package"
 *               value:
 *                 size: "MEDIUM"
 *                 weightRange: "5kg - 15kg"
 *                 bikeExtra: 3.00
 *                 carExtra: 2.00
 *                 notes: "Medium package surcharge applies"
 *             large:
 *               summary: "Large Package"
 *               value:
 *                 size: "LARGE"
 *                 weightRange: "15kg - 30kg"
 *                 bikeExtra: null
 *                 carExtra: 6.00
 *                 notes: "Bike restricted; car only surcharge"
 *             extraLarge:
 *               summary: "Extra Large Package"
 *               value:
 *                 size: "EXTRA_LARGE"
 *                 weightRange: "30kg+"
 *                 bikeExtra: null
 *                 carExtra: 12.00
 *                 notes: "Car only - XL surcharge"
 *     responses:
 *       201:
 *         description: Surcharge created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Surcharge created successfully"
 *               data:
 *                 id: "surcharge-uuid-new"
 *                 size: "MEDIUM"
 *                 weightRange: "5kg - 15kg"
 *                 bikeExtra: 3.00
 *                 carExtra: 2.00
 *                 notes: "Medium package surcharge applies"
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Surcharge for this size already exists
 */
router.post('/courier-management/surcharges', validate(surchargeSchema), createSurcharge);

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
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Surcharge'
 *           example:
 *             size: "MEDIUM"
 *             weightRange: "5kg - 15kg"
 *             bikeExtra: 3.50
 *             carExtra: 2.50
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
 *                 bikeExtra: 3.50
 *                 carExtra: 2.50
 *                 notes: "Updated medium package surcharge"
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Surcharge not found
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
 *       Returns all geographic pricing zones with their multipliers and rate per km.
 *       Includes cities like Lagos Island, Nairobi CBD, Accra Central, etc.
 *     responses:
 *       200:
 *         description: List of geographic zones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GeographicZone'
 *             example:
 *               - id: "zone-lagos"
 *                 name: "Lagos Island"
 *                 type: "URBAN"
 *                 multiplier: 1.0
 *                 ratePerKm: 1.20
 *                 isActive: true
 *               - id: "zone-nairobi"
 *                 name: "Nairobi CBD"
 *                 type: "URBAN"
 *                 multiplier: 1.0
 *                 ratePerKm: 1.20
 *                 isActive: true
 *               - id: "zone-intercity"
 *                 name: "Inter-City West Africa"
 *                 type: "INTERCITY"
 *                 multiplier: 1.2
 *                 ratePerKm: 1.44
 *                 isActive: true
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
 *             $ref: '#/components/schemas/GeographicZone'
 *           example:
 *             name: "Kampala Central"
 *             type: "URBAN"
 *             multiplier: 1.0
 *             ratePerKm: 1.20
 *     responses:
 *       201:
 *         description: Geographic zone created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Geographic zone created successfully"
 *               zone:
 *                 id: "zone-new-uuid"
 *                 name: "Kampala Central"
 *                 type: "URBAN"
 *                 multiplier: 1.0
 *                 ratePerKm: 1.20
 *                 isActive: true
 *       400:
 *         description: Invalid input data or zone name already exists
 */
router.post('/courier-management/zones', validate(zoneSchema), createGeographicZone);

/**
 * @swagger
 * /api/admin/courier-management/zones/{id}:
 *   put:
 *     summary: Update an existing geographic pricing zone
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeographicZone'
 *           example:
 *             name: "Kampala Downtown"
 *             type: "URBAN"
 *             multiplier: 1.1
 *             ratePerKm: 1.32
 *     responses:
 *       200:
 *         description: Geographic zone updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Geographic zone updated successfully"
 *               zone:
 *                 id: "zone-existing-uuid"
 *                 name: "Kampala Downtown"
 *                 type: "URBAN"
 *                 multiplier: 1.1
 *                 ratePerKm: 1.32
 *                 isActive: true
 *       404:
 *         description: Geographic zone not found
 */
router.put('/courier-management/zones/:id', validate(zoneSchema), updateGeographicZone);

/**
 * @swagger
 * /api/admin/courier-management/zones/{id}:
 *   delete:
 *     summary: Delete a geographic pricing zone
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Geographic zone deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Geographic zone deleted successfully"
 *       404:
 *         description: Geographic zone not found
 *       409:
 *         description: Cannot delete zone as it is referenced by active deliveries
 */
router.delete('/courier-management/zones/:id', deleteGeographicZone);

// ==================== CATEGORIES ====================

/**
 * @swagger
 * /api/admin/courier-management/categories:
 *   get:
 *     summary: Get all active courier categories
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns all active courier categories including:
 *       - Documents (Vehicle: Bike & Car, Insurance: Basic, Multiplier: x1.0)
 *       - Food & Beverages (Vehicle: Bike & Car, Insurance: None, Multiplier: x1.0)
 *       - Groceries (Vehicle: Bike & Car, Insurance: None, Multiplier: x1.0)
 *       - Electronics (Vehicle: Car Only, Insurance: Premium, Multiplier: x1.0)
 *       - Fragile Items (Vehicle: Car Only, Insurance: Premium, Multiplier: x1.5)
 *       - Medical Supplies (Vehicle: Car Only, Insurance: Premium, Multiplier: x1.8)
 *       - Retail Goods (Vehicle: Bike & Car, Insurance: Basic, Multiplier: x1.1)
 *       - Custom/Other (Vehicle: Bike & Car, Insurance: Standard, Multiplier: x1.2)
 *     responses:
 *       200:
 *         description: List of active courier categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CourierCategory'
 *             example:
 *               - id: "cat-documents"
 *                 name: "Documents"
 *                 description: "Legal documents, contracts, official paperwork"
 *                 vehicleRestriction: "BOTH"
 *                 insuranceLevel: "BASIC"
 *                 pricingMultiplier: 1.0
 *                 maxDeliveryWindow: 480
 *                 requirements: ["Signature Required", "Photo Documentation"]
 *                 isActive: true
 *               - id: "cat-medical"
 *                 name: "Medical Supplies"
 *                 description: "Pharmaceuticals, medical equipment, lab samples"
 *                 vehicleRestriction: "CAR_ONLY"
 *                 insuranceLevel: "PREMIUM"
 *                 pricingMultiplier: 1.8
 *                 maxDeliveryWindow: 480
 *                 requirements: ["Temperature Control", "Signature Required", "Insurance Required"]
 *                 isActive: true
 */
router.get('/courier-management/categories', getCourierCategories);

/**
 * @swagger
 * /api/admin/courier-management/categories/all:
 *   get:
 *     summary: Get ALL courier categories (including inactive)
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     description: Returns all courier categories regardless of active status
 *     responses:
 *       200:
 *         description: List of all courier categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CourierCategory'
 */
router.get('/courier-management/categories/all', getAllCourierCategories);

/**
 * @swagger
 * /api/admin/courier-management/categories/stats:
 *   get:
 *     summary: Get category statistics with delivery counts
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns each category with:
 *       - Total deliveries all time
 *       - Deliveries this month
 *       - Active status
 *       - Configuration details
 *     responses:
 *       200:
 *         description: Category statistics
 *         content:
 *           application/json:
 *             example:
 *               - id: "cat-documents"
 *                 name: "Documents"
 *                 totalDeliveries: 1240
 *                 monthlyDeliveries: 340
 *                 vehicleRestriction: "BOTH"
 *                 insuranceLevel: "BASIC"
 *                 pricingMultiplier: 1.0
 *                 isActive: true
 *               - id: "cat-medical"
 *                 name: "Medical Supplies"
 *                 totalDeliveries: 480
 *                 monthlyDeliveries: 120
 *                 vehicleRestriction: "CAR_ONLY"
 *                 insuranceLevel: "PREMIUM"
 *                 pricingMultiplier: 1.8
 *                 isActive: true
 */
router.get('/courier-management/categories/stats', getCategoryStats);

/**
 * @swagger
 * /api/admin/courier-management/categories/{id}:
 *   get:
 *     summary: Get a specific courier category by ID
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourierCategory'
 *       404:
 *         description: Category not found
 */
router.get('/courier-management/categories/:id', getCourierCategoryById);

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
 *             $ref: '#/components/schemas/CourierCategory'
 *           example:
 *             name: "Medical Supplies"
 *             description: "Pharmaceuticals and medical equipment"
 *             vehicleRestriction: "CAR_ONLY"
 *             insuranceLevel: "PREMIUM"
 *             pricingMultiplier: 1.8
 *             maxDeliveryWindow: 480
 *             requirements: ["Temperature Control", "Signature Required", "Insurance Required"]
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Category created successfully"
 *               category:
 *                 id: "cat-new-uuid"
 *                 name: "Medical Supplies"
 *                 description: "Pharmaceuticals and medical equipment"
 *                 vehicleRestriction: "CAR_ONLY"
 *                 insuranceLevel: "PREMIUM"
 *                 pricingMultiplier: 1.8
 *                 maxDeliveryWindow: 480
 *                 requirements: ["Temperature Control", "Signature Required", "Insurance Required"]
 *                 isActive: true
 *       400:
 *         description: Invalid input or category name already exists
 */
router.post('/courier-management/categories', validate(categorySchema), createCourierCategory);

/**
 * @swagger
 * /api/admin/courier-management/categories/{id}:
 *   put:
 *     summary: Update an existing courier category
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourierCategory'
 *           example:
 *             name: "Medical Supplies"
 *             description: "Pharmaceuticals, medical equipment, lab samples - Updated"
 *             vehicleRestriction: "CAR_ONLY"
 *             insuranceLevel: "PREMIUM"
 *             pricingMultiplier: 2.0
 *             maxDeliveryWindow: 360
 *             requirements: ["Temperature Control", "Signature Required", "Photo Documentation"]
 *             isActive: true
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Category updated successfully"
 *               category:
 *                 id: "cat-existing-uuid"
 *                 name: "Medical Supplies"
 *                 description: "Pharmaceuticals, medical equipment, lab samples - Updated"
 *                 vehicleRestriction: "CAR_ONLY"
 *                 insuranceLevel: "PREMIUM"
 *                 pricingMultiplier: 2.0
 *                 maxDeliveryWindow: 360
 *                 requirements: ["Temperature Control", "Signature Required", "Photo Documentation"]
 *                 isActive: true
 *       404:
 *         description: Category not found
 */
router.put('/courier-management/categories/:id', validate(categoryUpdateSchema), updateCourierCategory);

/**
 * @swagger
 * /api/admin/courier-management/categories/{id}:
 *   delete:
 *     summary: Delete a courier category (soft delete recommended)
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Category deleted successfully"
 *       404:
 *         description: Category not found
 *       409:
 *         description: Cannot delete category with existing deliveries
 */
router.delete('/courier-management/categories/:id', deleteCourierCategory);

// ==================== DISPUTES ====================

/**
 * @swagger
 * /api/admin/courier-management/disputes/stats:
 *   get:
 *     summary: Get dispute statistics dashboard data
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns KPI cards for the disputes dashboard including:
 *       - Total Disputes: 23
 *       - Open Disputes: 312
 *       - Investigating: 7
 *       - Avg Resolution Days: 1.8
 *       - Total Refunds: $842
 *     responses:
 *       200:
 *         description: Dispute statistics
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
 *     summary: Get all courier disputes with filtering options
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by dispute code, tracking number, or description
 *         example: "DSP-001"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, INVESTIGATING, ESCALATED, RESOLVED, CLOSED]
 *         description: Filter by dispute status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by priority level
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by driver ID
 *     responses:
 *       200:
 *         description: List of disputes with driver details
 *         content:
 *           application/json:
 *             example:
 *               - id: "dispute-uuid-1"
 *                 disputeCode: "DSP-001"
 *                 trackingNumber: "CX-20260328-182"
 *                 status: "INVESTIGATING"
 *                 priority: "CRITICAL"
 *                 type: "PACKAGE_DAMAGED"
 *                 description: "Artwork arrived with a cracked frame and torn packaging."
 *                 photos: ["photo-url-1.jpg"]
 *                 gpsLog: true
 *                 driver:
 *                   user:
 *                     firstName: "Tyler"
 *                     lastName: "Brooks"
 *                   vehiclePlate: "ABC-123"
 *                 refundAmount: 280
 *                 createdAt: "2026-03-29T09:14:00Z"
 */
router.get('/courier-management/disputes', getDisputes);

/**
 * @swagger
 * /api/admin/courier-management/disputes/{id}:
 *   get:
 *     summary: Get detailed dispute information by ID
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detailed dispute information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 disputeCode:
 *                   type: string
 *                 trackingNumber:
 *                   type: string
 *                 status:
 *                   type: string
 *                 priority:
 *                   type: string
 *                 type:
 *                   type: string
 *                 description:
 *                   type: string
 *                 photos:
 *                   type: array
 *                 gpsLog:
 *                   type: boolean
 *                 resolutionNotes:
 *                   type: string
 *                 refundAmount:
 *                   type: number
 *                 driver:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                     vehiclePlate:
 *                       type: string
 *                     vehicleModel:
 *                       type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Dispute not found
 */
router.get('/courier-management/disputes/:id', getDisputeById);

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
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, INVESTIGATING, ESCALATED, RESOLVED, CLOSED]
 *               resolutionNotes:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *           example:
 *             status: "RESOLVED"
 *             resolutionNotes: "Issue resolved after investigation and partial refund issued"
 *             refundAmount: 45.50
 *     responses:
 *       200:
 *         description: Dispute updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Dispute updated successfully"
 *               dispute:
 *                 id: "dispute-uuid"
 *                 status: "RESOLVED"
 *                 resolutionNotes: "Issue resolved after investigation and partial refund issued"
 *                 refundAmount: 45.50
 *                 resolvedAt: "2026-04-01T10:30:00Z"
 */
router.patch('/courier-management/disputes/:id', validate(disputeUpdateSchema), updateDispute);

/**
 * @swagger
 * /api/admin/courier-management/disputes/{id}/action:
 *   post:
 *     summary: Process a specific action on a dispute
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [PROCESS_REFUND, APPLY_PENALTY, CONTACT_DRIVER, NOTIFY_CUSTOMER, INSURANCE_CLAIM, ESCALATE_CASE]
 *               amount:
 *                 type: number
 *               notes:
 *                 type: string
 *           examples:
 *             refund:
 *               summary: "Process Refund"
 *               value:
 *                 action: "PROCESS_REFUND"
 *                 amount: 280
 *                 notes: "Full refund approved for damaged artwork"
 *             penalty:
 *               summary: "Apply Penalty"
 *               value:
 *                 action: "APPLY_PENALTY"
 *                 amount: 50
 *                 notes: "Penalty for unprofessional behavior"
 *             escalate:
 *               summary: "Escalate Case"
 *               value:
 *                 action: "ESCALATE_CASE"
 *                 notes: "Case escalated to senior management for review"
 *     responses:
 *       200:
 *         description: Action processed successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Action PROCESS_REFUND processed successfully"
 *               dispute:
 *                 id: "dispute-uuid"
 *                 refundAmount: 280
 *                 resolutionNotes: "Full refund approved for damaged artwork"
 */
router.post('/courier-management/disputes/:id/action', validate(disputeActionSchema), processDisputeAction);

// ==================== PAYOUTS ====================

/**
 * @swagger
 * /api/admin/courier-management/payouts:
 *   get:
 *     summary: Get driver earnings and pending payouts with pagination
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, ON_HOLD, PAID]
 *         description: Filter by payout status
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific driver
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by driver name
 *     responses:
 *       200:
 *         description: List of payouts with driver information and summary
 *         content:
 *           application/json:
 *             example:
 *               payouts:
 *                 - id: "payout-uuid-1"
 *                   driver:
 *                     user:
 *                       firstName: "Marcus"
 *                       lastName: "Johnson"
 *                     vehiclePlate: "ABC-123"
 *                   rideEarnings: 420.50
 *                   deliveryEarnings: 680.20
 *                   bonus: 45.00
 *                   commission: 170.05
 *                   pendingAmount: 680.20
 *                   status: "PENDING"
 *                 - id: "payout-uuid-2"
 *                   driver:
 *                     user:
 *                       firstName: "Sarah"
 *                       lastName: "Chen"
 *                     vehiclePlate: "XYZ-789"
 *                   rideEarnings: 920.80
 *                   deliveryEarnings: 0
 *                   bonus: 80.00
 *                   commission: 230.20
 *                   pendingAmount: 920.80
 *                   status: "APPROVED"
 *               summary:
 *                 pendingPayouts: 5478.80
 *                 paidThisMonth: 32400.50
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 7
 *                 totalPages: 1
 */
router.get('/courier-management/payouts', getPayouts);

/**
 * @swagger
 * /api/admin/courier-management/payouts/stats:
 *   get:
 *     summary: Get payout summary statistics for dashboard cards
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns KPI cards for the payouts dashboard:
 *       - Pending Payouts: $5,478.80
 *       - Paid This Month: $32,400.50
 *       - Total Paid All Time: $124,567.89
 *     responses:
 *       200:
 *         description: Payout summary statistics
 *         content:
 *           application/json:
 *             example:
 *               pendingPayouts: 5478.80
 *               paidThisMonth: 32400.50
 *               totalPaid: 124567.89
 */
router.get('/courier-management/payouts/stats', getPayoutSummaryStats);

/**
 * @swagger
 * /api/admin/courier-management/payouts/{id}:
 *   patch:
 *     summary: Update individual payout status
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, ON_HOLD]
 *           example:
 *             status: "APPROVED"
 *     responses:
 *       200:
 *         description: Payout status updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Payout status updated to APPROVED"
 *               payout:
 *                 id: "payout-uuid"
 *                 status: "APPROVED"
 *                 approvedAt: "2026-04-01T10:30:00Z"
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Payout not found
 */
router.patch('/courier-management/payouts/:id', validate(payoutActionSchema), updatePayoutStatus);

/**
 * @swagger
 * /api/admin/courier-management/payouts/bulk:
 *   post:
 *     summary: Bulk update payout status for multiple payouts
 *     tags: [Admin Courier Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payoutIds
 *               - status
 *             properties:
 *               payoutIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *               status:
 *                 type: string
 *                 enum: [APPROVED, ON_HOLD]
 *           example:
 *             payoutIds:
 *               - "payout-uuid-1"
 *               - "payout-uuid-2"
 *               - "payout-uuid-3"
 *             status: "APPROVED"
 *     responses:
 *       200:
 *         description: Bulk update completed
 *         content:
 *           application/json:
 *             example:
 *               message: "3 payouts updated to APPROVED"
 *               count: 3
 *       400:
 *         description: Invalid request - empty array or invalid status
 *       404:
 *         description: Some payouts not found
 */
router.post('/courier-management/payouts/bulk', validate(bulkPayoutActionSchema), bulkUpdatePayoutStatus);

export default router;