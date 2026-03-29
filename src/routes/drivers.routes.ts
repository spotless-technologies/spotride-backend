import { Router } from 'express';
import { adminAuth } from '../middleware/admin';
import { approveDriver, getDriverDetails, listDrivers, rejectDriver, suspendDriver } from '../controllers/drivers.controller';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Drivers
 *   description: Admin driver management
 */

/**
 * @swagger
 * /api/admin/drivers:
 *   get:
 *     summary: List all drivers with pagination & filters
 *     tags: [Admin Drivers]
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
 *         schema: { type: string, enum: [pending, approved, rejected, suspended] }
 *     responses:
 *       200:
 *         description: Paginated drivers list
 */
router.get('/drivers', listDrivers);

/**
 * @swagger
 * /api/admin/drivers/{id}:
 *   get:
 *     summary: Get driver details
 *     tags: [Admin Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Driver details
 */
router.get('/drivers/:id', getDriverDetails);

/**
 * @swagger
 * /api/admin/drivers/{id}/approve:
 *   post:
 *     summary: Approve driver application
 *     tags: [Admin Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Driver approved
 */
router.post('/drivers/:id/approve', approveDriver);

/**
 * @swagger
 * /api/admin/drivers/{id}/reject:
 *   post:
 *     summary: Reject driver application
 *     tags: [Admin Drivers]
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
 *         description: Driver rejected
 */
router.post('/drivers/:id/reject', rejectDriver);

/**
 * @swagger
 * /api/admin/drivers/{id}/suspend:
 *   post:
 *     summary: Suspend driver
 *     tags: [Admin Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Driver suspended
 */
router.post('/drivers/:id/suspend', suspendDriver);

export default router;