import { Router } from 'express';
import { driverAuth } from '../../middleware/driver';
import { uploadSingle, uploadFields } from '../../utils/upload';
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  getRatingSummary,
} from './driver-profile.controller';
import { validate } from '../../middleware/validate';
import { updateProfileSchema } from './dto';

const router = Router();

router.use(driverAuth);

/**
 * @swagger
 * tags:
 *   name: Driver Profile
 *   description: Driver profile management, photo upload, documents, rating, and vehicle information
 */

// ==================== PROFILE ====================

/**
 * @swagger
 * /api/driver/profile:
 *   get:
 *     summary: Get authenticated driver's complete profile
 *     tags: [Driver Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complete driver profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string, format: uuid }
 *                 email: { type: string, nullable: true }
 *                 phone: { type: string, nullable: true }
 *                 firstName: { type: string }
 *                 lastName: { type: string }
 *                 fullName: { type: string }
 *                 profilePicture: { type: string, nullable: true }
 *                 rating: { type: number }
 *                 totalTrips: { type: integer }
 *                 totalEarnings: { type: number }
 *                 status: { type: string }
 *                 isOnline: { type: boolean }
 *                 vehicleModel: { type: string, nullable: true }
 *                 vehiclePlate: { type: string, nullable: true }
 *                 vehicleColor: { type: string, nullable: true }
 *                 vehicleType: { type: string, enum: [SEDAN, SUV, MINIVAN_XL, LUXURY, ELECTRIC_HYBRID], nullable: true }
 *                 bankName: { type: string, nullable: true }
 *                 accountNumber: { type: string, nullable: true }
 *                 accountName: { type: string, nullable: true }
 *                 documentsVerified: { type: boolean }
 *                 licenseNumber: { type: string, nullable: true }
 *                 licenseExpiry: { type: string, format: date-time, nullable: true }
 *                 insuranceExpiry: { type: string, format: date-time, nullable: true }
 *                 registrationExpiry: { type: string, format: date-time, nullable: true }
 *                 createdAt: { type: string, format: date-time }
 *                 updatedAt: { type: string, format: date-time }
 *       404:
 *         description: Driver profile not found
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/driver/profile:
 *   put:
 *     summary: Update driver profile information
 *     tags: [Driver Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string, minLength: 2, example: "John" }
 *               lastName: { type: string, minLength: 2, example: "Doe" }
 *               vehicleModel: { type: string, example: "Toyota Camry" }
 *               vehiclePlate: { type: string, example: "ABC-1234" }
 *               vehicleColor: { type: string, example: "Black" }
 *               vehicleType: { 
 *                 type: string, 
 *                 enum: [SEDAN, SUV, MINIVAN_XL, LUXURY, ELECTRIC_HYBRID],
 *                 example: "SUV"
 *               }
 *               bankName: { type: string, example: "First Bank" }
 *               accountNumber: { type: string, example: "1234567890" }
 *               accountName: { type: string, example: "John Doe" }
 *     responses:
 *       200:
 *         description: Profile updated successfully with complete driver data
 *       400:
 *         description: Validation error
 *       404:
 *         description: Driver not found
 */
router.put('/profile', validate(updateProfileSchema), updateProfile);

/**
 * @swagger
 * /api/driver/profile/photo:
 *   post:
 *     summary: Upload or replace driver's profile photo
 *     tags: [Driver Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile photo uploaded successfully with updated driver data
 *       400:
 *         description: No file uploaded or invalid file
 */
router.post('/profile/photo', uploadSingle.single('photo'), uploadProfilePhoto);

/**
 * @swagger
 * /api/driver/rating:
 *   get:
 *     summary: Get driver's current rating and review summary
 *     tags: [Driver Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rating summary with complete driver stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating: { type: number }
 *                 totalReviews: { type: integer }
 *                 totalTrips: { type: integer }
 *                 totalEarnings: { type: number }
 */
router.get('/rating', getRatingSummary);

export default router;