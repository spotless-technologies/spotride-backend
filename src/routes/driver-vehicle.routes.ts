import { Router } from 'express';
import { driverAuth } from '../middleware/driver';

import {
  getVehicle,
  updateVehicle,
  listRentalCars,
  bookRental,
  getMyRentals,
} from '../controllers/driver-vehicle.controller';
import { validate } from '../middleware/validate';
import {
  updateVehicleSchema,
  bookRentalSchema,
} from '../schemas/driver.schema';

const router = Router();

router.use(driverAuth);

/**
 * @swagger
 * tags:
 *   name: Driver Vehicle & Rental
 *   description: Driver vehicle details and car rental management
 */

/**
 * @swagger
 * /driver/vehicle:
 *   get:
 *     summary: Get driver's registered vehicle details
 *     tags: [Driver Vehicle & Rental]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vehicleModel: { type: string }
 *                 vehiclePlate: { type: string }
 *                 vehicleColor: { type: string }
 *                 vehicleYear: { type: integer }
 */
router.get('/vehicle', getVehicle);

/**
 * @swagger
 * /driver/vehicle:
 *   put:
 *     summary: Update driver's vehicle information
 *     tags: [Driver Vehicle & Rental]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleModel: { type: string }
 *               vehiclePlate: { type: string }
 *               vehicleColor: { type: string }
 *               vehicleYear: { type: integer }
 *     responses:
 *       200:
 *         description: Vehicle updated
 */
router.put('/vehicle', validate(updateVehicleSchema), updateVehicle);

/**
 * @swagger
 * /car-rental/listings:
 *   get:
 *     summary: Browse available cars for rental
 *     tags: [Driver Vehicle & Rental]
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
 *         name: type
 *         schema: { type: string, example: "sedan" }
 *     responses:
 *       200:
 *         description: Paginated list of available rental cars
 */
router.get('/car-rental/listings', listRentalCars);

/**
 * @swagger
 * /car-rental/book:
 *   post:
 *     summary: Book a rental car
 *     tags: [Driver Vehicle & Rental]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [carId, startDate, endDate]
 *             properties:
 *               carId: { type: string, format: uuid }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Rental booking created
 */
router.post('/car-rental/book', validate(bookRentalSchema), bookRental);

/**
 * @swagger
 * /car-rental/my-rentals:
 *   get:
 *     summary: Get driver's active and past rentals
 *     tags: [Driver Vehicle & Rental]
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
 *         description: Paginated list of rentals
 */
router.get('/car-rental/my-rentals', getMyRentals);

export default router;