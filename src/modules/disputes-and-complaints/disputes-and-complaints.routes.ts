import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import {
  getDisputesStats,
  getDisputes,
  getDisputeById,
  resolveDispute,
} from './disputes-and-complaints.controller';
import { validate } from '../../middleware/validate';
import { resolveDisputeSchema } from './disputes-and-complaints.dto';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Rental Disputes & Complaints
 *   description: Rental dispute management for admin
 */

// ==================== STATS ====================

/**
 * @swagger
 * /api/admin/car-rental/disputes/stats:
 *   get:
 *     summary: Get rental disputes statistics
 *     tags: [Admin Rental Disputes & Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dispute statistics cards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDisputes: { type: integer }
 *                 open: { type: integer }
 *                 underReview: { type: integer }
 *                 highPriority: { type: integer }
 */
router.get('/car-rental/disputes/stats', getDisputesStats);

/**
 * @swagger
 * /api/admin/car-rental/disputes:
 *   get:
 *     summary: Get paginated rental disputes
 *     tags: [Admin Rental Disputes & Complaints]
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
 *         schema: { type: string, enum: [Open, Under Review, Resolved, Escalated, all] }
 *       - in: query
 *         name: severity
 *         schema: { type: string, enum: [Low, Medium, High, all] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of disputes
 */
router.get('/car-rental/disputes', getDisputes);

/**
 * @swagger
 * /api/admin/car-rental/disputes/{id}:
 *   get:
 *     summary: Get full dispute details (Overview + Evidence)
 *     tags: [Admin Rental Disputes & Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Complete dispute details with renter, owner, and evidence
 */
router.get('/car-rental/disputes/:id', getDisputeById);

/**
 * @swagger
 * /api/admin/car-rental/disputes/{id}/resolve:
 *   post:
 *     summary: Resolve a dispute (Refund, Fine, or Compensate)
 *     tags: [Admin Rental Disputes & Complaints]
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
 *             required: [resolutionAction, resolutionNotes]
 *             properties:
 *               resolutionAction: { type: string, enum: [Refund Renter, Fine Renter, Compensate Owner] }
 *               resolutionNotes: { type: string, minLength: 10 }
 *               refundAmount: { type: number }
 *               fineAmount: { type: number }
 *               compensationAmount: { type: number }
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
 */
router.post('/car-rental/disputes/:id/resolve', validate(resolveDisputeSchema), resolveDispute);

export default router;