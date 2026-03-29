import { Router } from 'express';
import { adminAuth } from '../middleware/admin';
import {
  listCarOwners,
  getCarOwnerDetails,
  approveCarOwner,
  rejectCarOwner,
} from '../controllers/car-owners.controller';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin CarOwners
 *   description: Admin car owner management
 */

/**
 * @swagger
 * /api/admin/car-owners:
 *   get:
 *     summary: List car owners with pagination & filters
 *     tags: [Admin CarOwners]
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
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected] }
 *     responses:
 *       200:
 *         description: Paginated car owners list
 */
router.get('/car-owners', listCarOwners);

/**
 * @swagger
 * /api/admin/car-owners/{id}:
 *   get:
 *     summary: Get car owner details
 *     tags: [Admin CarOwners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Car owner details
 */
router.get('/car-owners/:id', getCarOwnerDetails);

/**
 * @swagger
 * /api/admin/car-owners/{id}/approve:
 *   post:
 *     summary: Approve car owner
 *     tags: [Admin CarOwners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Car owner approved
 */
router.post('/car-owners/:id/approve', approveCarOwner);

/**
 * @swagger
 * /api/admin/car-owners/{id}/reject:
 *   post:
 *     summary: Reject car owner
 *     tags: [Admin CarOwners]
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
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Car owner rejected
 */
router.post('/car-owners/:id/reject', rejectCarOwner);

export default router;