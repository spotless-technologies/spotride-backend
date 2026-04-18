import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import {
  getPricingStats,
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from './car-rental-pricing-and-categories.controller';
import { validate } from '../../middleware/validate';
import {
  createCategorySchema,
  updateCategorySchema,
} from './dto';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Car Rental Pricing & Categories
 *   description: |
 *     Complete Vehicle Categories & Pricing management.
 */

// ==================== STATS ====================

/**
 * @swagger
 * /api/admin/car-rental/pricing-and-categories/stats:
 *   get:
 *     summary: Get pricing & categories statistics
 *     tags: [Admin Car Rental Pricing & Categories]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns overview statistics shown at the top of the Categories & Pricing page:
 *       Total Categories, Active Categories, Inactive Categories, and Monthly Revenue.
 *     responses:
 *       200:
 *         description: Statistics for the dashboard cards
 *         content:
 *           application/json:
 *             example:
 *               totalCategories: 3
 *               activeCategories: 3
 *               inactiveCategories: 0
 *               monthlyRevenue: 20000000
 */
router.get('/car-rental/pricing-and-categories/stats', getPricingStats);

// ==================== CATEGORIES LIST ====================

/**
 * @swagger
 * /api/admin/car-rental/pricing-and-categories/categories:
 *   get:
 *     summary: Get all vehicle categories with pagination and filters
 *     tags: [Admin Car Rental Pricing & Categories]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns the list of categories shown in the main Categories & Pricing page.
 *       Each category includes Base Fare, Per KM Rate, Waiting Charge, Surge Multiplier, Capacity, and Features (as tags).
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: ["active", "inactive"] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by category name or description
 *     responses:
 *       200:
 *         description: Paginated list of vehicle categories
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 - id: "cat-uuid"
 *                   name: "Regular"
 *                   description: "Affordable rides for everyday trips"
 *                   baseFare: 800
 *                   ratePerKm: 120
 *                   waitingCharge: 20
 *                   surgeMultiplier: 1.0
 *                   capacity: 4
 *                   features: ["Economy", "AC", "Music"]
 *                   commissionRate: 20
 *                   status: "Active"
 *               meta:
 *                 page: 1
 *                 limit: 20
 *                 total: 3
 *                 pages: 1
 */
router.get('/car-rental/pricing-and-categories/categories', getCategories);

// ==================== CREATE CATEGORY ====================

/**
 * @swagger
 * /api/admin/car-rental/pricing-and-categories/categories:
 *   post:
 *     summary: Create a new vehicle category
 *     tags: [Admin Car Rental Pricing & Categories]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Creates a new category exactly as shown in the "Add New Category" modal.
 *       Supports Base Fare, Per KM Rate, Waiting Charge, Surge Multiplier, Capacity, and Features as tags.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, baseFare, ratePerKm, waitingCharge]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Premium"
 *                 description: Category name (e.g. Regular, Standard, Premium)
 *               description:
 *                 type: string
 *                 example: "Premium rides with luxury vehicles"
 *               baseFare:
 *                 type: number
 *                 example: 800
 *               ratePerKm:
 *                 type: number
 *                 example: 120
 *               waitingCharge:
 *                 type: number
 *                 example: 20
 *               surgeMultiplier:
 *                 type: number
 *                 example: 1.5
 *                 description: Surge multiplier (1.0 = normal, 1.5 = 50% surge)
 *               capacity:
 *                 type: integer
 *                 example: 4
 *               features:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["Economy", "AC", "Music"]
 *                 description: Features shown as tags
 *               commissionRate:
 *                 type: number
 *                 example: 20
 *               status:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Category created successfully"
 *               category:
 *                 id: "cat-uuid"
 *                 name: "Premium"
 *                 baseFare: 800
 *                 ratePerKm: 120
 *                 waitingCharge: 20
 *                 surgeMultiplier: 1.5
 *                 capacity: 4
 *                 features: ["Economy", "AC", "Music"]
 */
router.post('/car-rental/pricing-and-categories/categories', validate(createCategorySchema), createCategory);

// ==================== GET SINGLE CATEGORY ====================

/**
 * @swagger
 * /api/admin/car-rental/pricing-and-categories/categories/{id}:
 *   get:
 *     summary: Get a specific category by ID
 *     tags: [Admin Car Rental Pricing & Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Full category details for editing
 *         content:
 *           application/json:
 *             example:
 *               id: "cat-uuid"
 *               name: "Regular"
 *               description: "Affordable rides for everyday trips"
 *               baseFare: 800
 *               ratePerKm: 120
 *               waitingCharge: 20
 *               surgeMultiplier: 1.0
 *               capacity: 4
 *               features: ["Economy", "AC", "Music"]
 *               commissionRate: 20
 *               status: true
 *       404:
 *         description: Category not found
 */
router.get('/car-rental/pricing-and-categories/categories/:id', getCategoryById);

// ==================== UPDATE CATEGORY ====================

/**
 * @swagger
 * /api/admin/car-rental/pricing-and-categories/categories/{id}:
 *   put:
 *     summary: Update an existing category
 *     tags: [Admin Car Rental Pricing & Categories]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Updates a category exactly as shown in the "Edit Category" modal.
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
 *               name: { type: string, example: "Updated Regular" }
 *               description: { type: string }
 *               baseFare: { type: number, example: 800 }
 *               ratePerKm: { type: number, example: 120 }
 *               waitingCharge: { type: number, example: 20 }
 *               surgeMultiplier: { type: number, example: 1.0 }
 *               capacity: { type: integer, example: 4 }
 *               features: { type: array, items: { type: string }, example: ["Economy", "AC"] }
 *               commissionRate: { type: number, example: 20 }
 *               status: { type: boolean }
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/car-rental/pricing-and-categories/categories/:id', validate(updateCategorySchema), updateCategory);

// ==================== DELETE CATEGORY ====================

/**
 * @swagger
 * /api/admin/car-rental/pricing-and-categories/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Admin Car Rental Pricing & Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
router.delete('/car-rental/pricing-and-categories/categories/:id', deleteCategory);

export default router;