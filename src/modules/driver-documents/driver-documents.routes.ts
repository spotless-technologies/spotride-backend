import { Router } from 'express';
import { driverAuth } from '../../middleware/driver';
import { uploadFields } from '../../utils/upload';
import {
  uploadDocuments,
  getDocuments,
} from './driver-documents.controller';

const router = Router();

router.use(driverAuth);

/**
 * @swagger
 * tags:
 *   name: Driver Documents
 *   description: Upload and manage driver's KYC and vehicle documents (License, Government ID, Vehicle Registration, Insurance, Inspection, Background Check)
 */

/**
 * @swagger
 * /api/driver/documents:
 *   post:
 *     summary: Upload multiple driver and vehicle documents
 *     tags: [Driver Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               license:
 *                 type: array
 *                 items: { type: string, format: binary }
 *                 description: Driver's license (multiple allowed)
 *               governmentId:
 *                 type: array
 *                 items: { type: string, format: binary }
 *                 description: Government ID / NIN (multiple allowed)
 *               vehicleDocuments:
 *                 type: array
 *                 items: { type: string, format: binary }
 *                 description: Vehicle related documents (multiple allowed)
 *               vehicleReg:
 *                 type: string
 *                 format: binary
 *               insurance:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Documents uploaded successfully"
 *               uploaded: ["licenseUrls", "vehicleRegUrl"]
 */
router.post(
  '/documents',
  uploadFields.fields([
    { name: 'license', maxCount: 5 },
    { name: 'governmentId', maxCount: 5 },
    { name: 'vehicleDocuments', maxCount: 10 },
    { name: 'vehicleReg', maxCount: 1 },
    { name: 'insurance', maxCount: 1 },
  ]),
  uploadDocuments
);

/**
 * @swagger
 * /api/driver/documents:
 *   get:
 *     summary: Get all uploaded documents with status and expiry dates
 *     tags: [Driver Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of documents and verification status
 *         content:
 *           application/json:
 *             example:
 *               documents:
 *                 license:
 *                   urls: ["https://s3.../license1.jpg"]
 *                   expiry: "2025-05-20"
 *                   verified: true
 *                 governmentId:
 *                   urls: ["https://s3.../nin.jpg"]
 *                 vehicleReg:
 *                   url: "https://s3.../reg.pdf"
 *                   expiry: "2025-12-31"
 *                 insurance:
 *                   url: "https://s3.../insurance.pdf"
 *                   expiry: "2026-01-15"
 *               overallStatus: "approved"
 *               documentsVerified: true
 */
router.get('/documents', getDocuments);

export default router;