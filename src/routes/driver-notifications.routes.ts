import { Router } from 'express';
import { driverAuth } from '../middleware/driver';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  registerFcmToken,
} from '../controllers/driver-notifications.controller';
import { validate } from '../middleware/validate';
import { markReadSchema, fcmTokenSchema } from '../schemas/driver.schema';

const router = Router();

router.use(driverAuth);

/**
 * @swagger
 * tags:
 *   name: Driver Notifications
 *   description: Driver notifications and push tokens
 */

/**
 * @swagger
 * /driver/notifications:
 *   get:
 *     summary: Get paginated list of driver's notifications
 *     tags: [Driver Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated notifications
 */
router.get('/notifications', getNotifications);

/**
 * @swagger
 * /driver/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Driver Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/notifications/:id/read', validate(markReadSchema), markNotificationRead);

/**
 * @swagger
 * /driver/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Driver Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/notifications/read-all', markAllNotificationsRead);

/**
 * @swagger
 * /driver/notifications/fcm-token:
 *   post:
 *     summary: Register or update FCM push token
 *     tags: [Driver Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: FCM token registered
 */
router.post('/notifications/fcm-token', validate(fcmTokenSchema), registerFcmToken);

export default router;