import { Router } from 'express';
import { adminAuth } from '../middleware/admin';
import {
  getCarListingsStats,
  getCarListings,
  getCarDetails,
  approveCar,
  rejectCar,
} from '../controllers/car-rental-listings.controller';
import { validate } from '../middleware/validate';
import { rejectCarSchema } from '../schemas/car-rental.schema';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Car Rental Management
 *   description: Car listings and verification for admin
 */

// ==================== CAR LISTINGS & VERIFICATION ====================

/**
 * @swagger
 * /api/admin/car-rental/listings/stats:
 *   get:
 *     summary: Get car listings statistics (Pending Review, Approved, Under Review, Rejected)
 *     tags: [Admin Car Rental Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats cards for car listings
 */
router.get('/car-rental/listings/stats', getCarListingsStats);

/**
 * @swagger
 * /api/admin/car-rental/listings:
 *   get:
 *     summary: Get paginated car listings with filters
 *     tags: [Admin Car Rental Management]
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
 *         schema: { type: string, enum: [pending, under_review, approved, rejected, all] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of car listings
 */
router.get('/car-rental/listings', getCarListings);

/**
 * @swagger
 * /api/admin/car-rental/listings/{id}:
 *   get:
 *     summary: Get detailed view of a car listing (Vehicle Details, Documents, Verification)
 *     tags: [Admin Car Rental Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Full car details with tabs data
 *       404:
 *         description: Car not found
 */
router.get('/car-rental/listings/:id', getCarDetails);

/**
 * @swagger
 * /api/admin/car-rental/listings/{id}/approve:
 *   post:
 *     summary: Approve a car listing
 *     tags: [Admin Car Rental Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Car approved successfully
 */
router.post('/car-rental/listings/:id/approve', approveCar);

/**
 * @swagger
 * /api/admin/car-rental/listings/{id}/reject:
 *   post:
 *     summary: Reject a car listing with reason
 *     tags: [Admin Car Rental Management]
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
 *             required: [reason]
 *             properties:
 *               reason: { type: string, minLength: 5 }
 *     responses:
 *       200:
 *         description: Car rejected
 */
router.post('/car-rental/listings/:id/reject', validate(rejectCarSchema), rejectCar);

export default router;