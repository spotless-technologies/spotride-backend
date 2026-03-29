import { Router } from 'express';
import { adminAuth } from '../middleware/admin';
import { getRiderDetails, listRiders, suspendRider } from '../controllers/riders.controller';


const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Riders
 *   description: Admin rider management
 */

/**
 * @swagger
 * /api/admin/riders:
 *   get:
 *     summary: List riders with pagination & filters
 *     tags: [Admin Riders]
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
router.get('/riders', listRiders);

/**
 * @swagger
 * /api/admin/riders/{id}:
 *   get:
 *     summary: Get rider details
 *     tags: [Admin Riders]
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
router.get('/riders/:id', getRiderDetails);

/**
 * @swagger
 * /api/admin/riders/{id}/suspend:
 *   post:
 *     summary: Suspend rider account
 *     tags: [Admin Riders]
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
router.post('/riders/:id/suspend', suspendRider);

export default router;