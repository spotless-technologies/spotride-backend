import { Router } from 'express';
import { adminAuth } from '../middleware/admin';
import {
  getRentalBookingsStats,
  getRentalBookings,
  getRentalBookingDetails,
  cancelBooking,
  markAsReturned,
  adjustBooking,
} from './car-rental-bookings.controller';
import { validate } from '../middleware/validate';
import {
  cancelBookingSchema,
  returnBookingSchema,
  adjustBookingSchema,
} from './dto';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Car Rental Bookings
 *   description: Rental bookings management for admin
 */

// ==================== STATS ====================

/**
 * @swagger
 * /api/admin/car-rental/bookings/stats:
 *   get:
 *     summary: Get rental bookings statistics (Total, Active, Completed, Upcoming, Cancelled)
 *     tags: [Admin Car Rental Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking statistics cards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalBookings: { type: integer }
 *                 active: { type: integer }
 *                 completed: { type: integer }
 *                 upcoming: { type: integer }
 *                 cancelled: { type: integer }
 */
router.get('/car-rental/bookings/stats', getRentalBookingsStats);

// ==================== LISTINGS ====================

/**
 * @swagger
 * /api/admin/car-rental/bookings:
 *   get:
 *     summary: Get paginated rental bookings with filters
 *     tags: [Admin Car Rental Bookings]
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
 *         schema: { type: string, enum: [active, completed, upcoming, cancelled, all] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of rental bookings
 */
router.get('/car-rental/bookings', getRentalBookings);

/**
 * @swagger
 * /api/admin/car-rental/bookings/{id}:
 *   get:
 *     summary: Get full booking details
 *     tags: [Admin Car Rental Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Complete booking details
 *       404:
 *         description: Booking not found
 */
router.get('/car-rental/bookings/:id', getRentalBookingDetails);

// ==================== ACTIONS ====================

/**
 * @swagger
 * /api/admin/car-rental/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking with reason
 *     tags: [Admin Car Rental Bookings]
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
 *               reason:
 *                 type: string
 *                 minLength: 5
 *                 example: "Customer requested cancellation"
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 */
router.post('/car-rental/bookings/:id/cancel', validate(cancelBookingSchema), cancelBooking);

/**
 * @swagger
 * /api/admin/car-rental/bookings/{id}/return:
 *   post:
 *     summary: Mark booking as returned
 *     tags: [Admin Car Rental Bookings]
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
 *               returnNotes:
 *                 type: string
 *                 example: "Car returned in good condition with minor scratches"
 *     responses:
 *       200:
 *         description: Booking marked as returned
 */
router.post('/car-rental/bookings/:id/return', validate(returnBookingSchema), markAsReturned);

/**
 * @swagger
 * /api/admin/car-rental/bookings/{id}/adjust:
 *   post:
 *     summary: Adjust booking (return date, amount, reason)
 *     tags: [Admin Car Rental Bookings]
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
 *             required: [newReturnDate, adjustedAmount, reason]
 *             properties:
 *               newReturnDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-04-15T10:00:00Z"
 *               adjustedAmount:
 *                 type: number
 *                 example: 8500
 *               reason:
 *                 type: string
 *                 minLength: 5
 *                 example: "Customer requested extension due to delay"
 *     responses:
 *       200:
 *         description: Booking adjustment applied successfully
 */
router.post('/car-rental/bookings/:id/adjust', validate(adjustBookingSchema), adjustBooking);

export default router;