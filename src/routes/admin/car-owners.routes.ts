import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import {
  listCarOwners,
  getCarOwnerDetails,
  approveCarOwner,
  rejectCarOwner,
} from '../../controllers/admin/car-owners.controller';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: CarOwners
 *   description: Admin car owner management
 */

/**
 * @swagger
 * /car-owners:
 *   get:
 *     summary: List car owners with pagination & filters
 *     tags: [CarOwners]
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
router.get('/', listCarOwners);

/**
 * @swagger
 * /car-owners/{id}:
 *   get:
 *     summary: Get car owner details
 *     tags: [CarOwners]
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
router.get('/:id', getCarOwnerDetails);

/**
 * @swagger
 * /car-owners/{id}/approve:
 *   post:
 *     summary: Approve car owner
 *     tags: [CarOwners]
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
router.post('/:id/approve', approveCarOwner);

/**
 * @swagger
 * /car-owners/{id}/reject:
 *   post:
 *     summary: Reject car owner
 *     tags: [CarOwners]
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
router.post('/:id/reject', rejectCarOwner);

export default router;