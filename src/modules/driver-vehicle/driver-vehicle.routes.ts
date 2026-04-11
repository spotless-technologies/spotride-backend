import { Router } from 'express';
import { driverAuth } from '../../middleware/driver';
import { uploadFields } from '../../utils/upload';
import {
  getVehicle,
  updateVehicle,
  uploadVehiclePhotos,
} from './driver-vehicle.controller';
import { validate } from '../../middleware/validate';
import { updateVehicleSchema } from './driver-vehicle.dto';

const router = Router();

router.use(driverAuth);

/**
 * @swagger
 * tags:
 *   name: Driver Vehicle
 *   description: Manage driver's vehicle information, features, and photos
 */

/**
 * @swagger
 * /driver/vehicle:
 *   get:
 *     summary: Get driver's current vehicle details
 *     tags: [Driver Vehicle]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle information
 */
router.get('/vehicle', getVehicle);

/**
 * @swagger
 * /driver/vehicle:
 *   put:
 *     summary: Update vehicle information
 *     tags: [Driver Vehicle]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleModel: { type: string, example: "2020 Toyota Camry" }
 *               vehiclePlate: { type: string, example: "ABC-1234" }
 *               vehicleColor: { type: string, example: "Black" }
 *               vehicleYear: { type: integer, example: 2020 }
 *               vehicleType: { 
 *                 type: string, 
 *                 enum: ["SEDAN", "SUV", "MINIVAN_XL", "LUXURY", "ELECTRIC_HYBRID"] 
 *               }
 *               vehicleFeatures: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 */
router.put('/vehicle', validate(updateVehicleSchema), updateVehicle);

/**
 * @swagger
 * /driver/vehicle/photos:
 *   post:
 *     summary: Upload multiple vehicle photos (front, back, interior, etc.)
 *     tags: [Driver Vehicle]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Vehicle photos uploaded successfully"
 *               count: 2
 *               totalPhotos: 5
 *               photos: ["https://s3.../photo1.jpg", "https://s3.../photo2.jpg"]
 *       400:
 *         description: No photos uploaded
 */
router.post(
  '/vehicle/photos',
  uploadFields.fields([{ name: 'photos', maxCount: 10 }]),
  uploadVehiclePhotos
);

export default router;