import { Router } from 'express';
import { adminAuth } from '../middleware/admin';
import {
  getPricingStats,
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from './car-rental-pricing-and-categories.controller';
import { validate } from '../middleware/validate';
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
 *   description: Vehicle categories and pricing management for admin
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
 *     responses:
 *       200:
 *         description: Statistics including total categories, active categories, total vehicles, and monthly revenue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCategories: { type: integer }
 *                 activeCategories: { type: integer }
 *                 totalVehicles: { type: integer }
 *                 monthlyRevenue: { type: number }
 */
router.get('/car-rental/pricing-and-categories/stats', getPricingStats);

// ==================== CATEGORIES ====================

/**
 * @swagger
 * /api/admin/car-rental/pricing-and-categories/categories:
 *   get:
 *     summary: Get all vehicle categories with pagination and filters
 *     tags: [Admin Car Rental Pricing & Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of vehicle categories
 */
router.get('/car-rental/pricing-and-categories/categories', getCategories);

/**
 * @swagger
 * /api/admin/car-rental/pricing-and-categories/categories:
 *   post:
 *     summary: Create a new vehicle category
 *     tags: [Admin Car Rental Pricing & Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, dailyMinRate, dailyMaxRate]
 *             properties:
 *               name: { type: string, example: "Luxury SUV" }
 *               description: { type: string, example: "Premium vehicles with high-end features and comfort" }
 *               commissionRate: { type: number, example: 15 }
 *               status: { type: boolean, default: true }
 *               dailyMinRate: { type: number, example: 5000 }
 *               dailyMaxRate: { type: number, example: 12000 }
 *               weeklyMinRate: { type: number, example: 30000 }
 *               weeklyMaxRate: { type: number, example: 75000 }
 *               monthlyMinRate: { type: number, example: 120000 }
 *               monthlyMaxRate: { type: number, example: 280000 }
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/car-rental/pricing-and-categories/categories', validate(createCategorySchema), createCategory);

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
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/car-rental/pricing-and-categories/categories/:id', getCategoryById);

/**
 * @swagger
 * /api/admin/car-rental/pricing-and-categories/categories/{id}:
 *   put:
 *     summary: Update an existing category
 *     tags: [Admin Car Rental Pricing & Categories]
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
 *               name: { type: string, example: "Updated Luxury SUV" }
 *               description: { type: string }
 *               commissionRate: { type: number }
 *               status: { type: boolean }
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/car-rental/pricing-and-categories/categories/:id', validate(updateCategorySchema), updateCategory);

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