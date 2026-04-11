import { Router } from 'express';
import { driverAuth } from '../../middleware/driver';
import { uploadSingle, uploadFields } from '../../utils/upload';
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  getRatingSummary,
  // uploadDocuments,
  // getDocuments,
} from './driver-profile.controller';
import { validate } from '../../middleware/validate';
import { updateProfileSchema } from '../../schemas/driver.schema';

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
 *                 vehicleType: { type: string, enum: [SEDAN, SUV, MINIVAN_XL, LUXURY, ELECTRIC_HYBRID] }
 *                 isOnline: { type: boolean }
 *       404:
 *         description: Driver profile not found
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /driver/profile:
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
 *         description: Profile photo uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file
 */
router.post('/profile/photo', uploadSingle.single('photo'), uploadProfilePhoto);

/**
 * @swagger
 * /driver/rating:
 *   get:
 *     summary: Get driver's current rating and review summary
 *     tags: [Driver Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rating summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating: { type: number }
 *                 totalReviews: { type: integer }
 */
router.get('/rating', getRatingSummary);

// ==================== DOCUMENTS ====================

// /**
//  * @swagger
//  * /driver/documents:
//  *   post:
//  *     summary: Upload KYC and vehicle documents (supports multiple files)
//  *     tags: [Driver Profile]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               license:
//  *                 type: array
//  *                 items: { type: string, format: binary }
//  *               governmentId:
//  *                 type: array
//  *                 items: { type: string, format: binary }
//  *               vehicleDocuments:
//  *                 type: array
//  *                 items: { type: string, format: binary }
//  *               vehicleReg: { type: string, format: binary }
//  *               insurance: { type: string, format: binary }
//  *     responses:
//  *       200:
//  *         description: Documents uploaded successfully
//  *       400:
//  *         description: No valid documents uploaded
//  */
// router.post(
//   '/documents',
//   uploadFields.fields([
//     { name: 'license', maxCount: 5 },
//     { name: 'governmentId', maxCount: 5 },
//     { name: 'vehicleDocuments', maxCount: 10 },
//     { name: 'vehicleReg', maxCount: 1 },
//     { name: 'insurance', maxCount: 1 },
//   ]),
//   uploadDocuments
// );

// /**
//  * @swagger
//  * /driver/documents:
//  *   get:
//  *     summary: Get all uploaded documents and verification status
//  *     tags: [Driver Profile]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: List of document URLs and status
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 licenseUrls: { type: array, items: { type: string } }
//  *                 governmentIdUrls: { type: array, items: { type: string } }
//  *                 vehicleDocumentUrls: { type: array, items: { type: string } }
//  *                 licenseUrl: { type: string, nullable: true }
//  *                 vehicleRegUrl: { type: string, nullable: true }
//  *                 insuranceUrl: { type: string, nullable: true }
//  *                 documentsVerified: { type: boolean }
//  */
// router.get('/documents', getDocuments);

export default router;