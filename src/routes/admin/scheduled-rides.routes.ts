import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import {
  listScheduledRides,
  getScheduledRideDetails,
  updateScheduledRideStatus,
  assignDriverToRide,
} from '../../controllers/admin/scheduled-rides.controller';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: ScheduledRides
 *   description: Admin scheduled ride management
 */

/**
 * @swagger
 * /scheduled-rides:
 *   get:
 *     summary: List scheduled rides with filters
 *     tags: [ScheduledRides]
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
 *         description: Paginated scheduled rides
 */
router.get('/', listScheduledRides);

/**
 * @swagger
 * /scheduled-rides/{id}:
 *   get:
 *     summary: Get scheduled ride details
 *     tags: [ScheduledRides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Scheduled ride details
 */
router.get('/:id', getScheduledRideDetails);

/**
 * @swagger
 * /scheduled-rides/{id}/status:
 *   patch:
 *     summary: Update scheduled ride status
 *     tags: [ScheduledRides]
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
 *             required: [status]
 *             properties:
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', updateScheduledRideStatus);

/**
 * @swagger
 * /scheduled-rides/{id}/assign-driver:
 *   post:
 *     summary: Assign driver to scheduled ride
 *     tags: [ScheduledRides]
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
 *             required: [driverId]
 *             properties:
 *               driverId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Driver assigned
 */
router.post('/:id/assign-driver', assignDriverToRide);

export default router;