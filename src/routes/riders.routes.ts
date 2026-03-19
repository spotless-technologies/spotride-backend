import { Router } from 'express';
import { adminAuth } from '../middleware/admin';
import { getRiderDetails, listRiders, suspendRider } from '../controllers/riders.controller';


const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Riders
 *   description: Admin rider management
 */

/**
 * @swagger
 * /riders:
 *   get:
 *     summary: List riders with pagination & filters
 *     tags: [Riders]
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
 *     responses:
 *       200:
 *         description: Paginated riders list
 */
router.get('/', listRiders);

/**
 * @swagger
 * /riders/{id}:
 *   get:
 *     summary: Get rider details
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Rider details
 */
router.get('/:id', getRiderDetails);

/**
 * @swagger
 * /riders/{id}/suspend:
 *   post:
 *     summary: Suspend rider account
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Rider suspended
 */
router.post('/:id/suspend', suspendRider);

export default router;