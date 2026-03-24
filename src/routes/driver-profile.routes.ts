import { Router } from 'express';
import { driverAuth } from '../middleware/driver';
import { uploadSingle, uploadFields } from '../utils/upload';
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  getRatingSummary,
  uploadDocuments,
  getDocuments,
} from '../controllers/driver-profile.controller';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../schemas/driver.schema';

const router = Router();

router.use(driverAuth);

/**
 * @swagger
 * tags:
 *   name: Driver Profile
 *   description: Driver profile management, photo upload, documents, and rating
 */

/**
 * @swagger
 * /driver/profile:
 *   get:
 *     summary: Get authenticated driver's profile
 *     tags: [Driver Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string, format: uuid }
 *                 fullName: { type: string }
 *                 photo: { type: string, nullable: true }
 *                 rating: { type: number }
 *                 vehicleModel: { type: string, nullable: true }
 *                 isOnline: { type: boolean }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a driver or admin
 *       404:
 *         description: Driver profile not found
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /driver/profile:
 *   put:
 *     summary: Update driver's profile information
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
 *               firstName: { type: string, minLength: 2 }
 *               lastName: { type: string, minLength: 2 }
 *               vehicleModel: { type: string }
 *               vehiclePlate: { type: string }
 *               vehicleColor: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 */
router.put('/profile', validate(updateProfileSchema), updateProfile);

/**
 * @swagger
 * /driver/profile/photo:
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
 *         description: Photo uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file
 */
router.post('/profile/photo', uploadSingle.single('photo'), uploadProfilePhoto);

/**
 * @swagger
 * /driver/rating:
 *   get:
 *     summary: Get driver's current rating summary
 *     tags: [Driver Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rating and total reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating: { type: number }
 *                 totalReviews: { type: integer }
 */
router.get('/rating', getRatingSummary);

/**
 * @swagger
 * /driver/documents:
 *   post:
 *     summary: Upload KYC documents (license, vehicle registration, insurance)
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
 *               license: { type: string, format: binary }
 *               vehicleReg: { type: string, format: binary }
 *               insurance: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *       400:
 *         description: No valid documents uploaded
 */
router.post(
  '/documents',
  uploadFields.fields([
    { name: 'license', maxCount: 1 },
    { name: 'vehicleReg', maxCount: 1 },
    { name: 'insurance', maxCount: 1 },
  ]),
  uploadDocuments
);

/**
 * @swagger
 * /driver/documents:
 *   get:
 *     summary: Get list and verification status of uploaded documents
 *     tags: [Driver Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document URLs and verification status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 licenseUrl: { type: string, nullable: true }
 *                 vehicleRegUrl: { type: string, nullable: true }
 *                 insuranceUrl: { type: string, nullable: true }
 *                 documentsVerified: { type: boolean }
 */
router.get('/documents', getDocuments);

export default router;