import { Router } from 'express';
import { adminAuth } from '../middleware/admin';
import {
  getHubCityStats,
  getCities,
  createCity,
  updateCity,
  getHubs,
  createHub,
  updateHub,
  updateHubStatus,
} from './hub-and-city-management.controller';
import { validate } from '../middleware/validate';
import { citySchema, hubSchema, statusUpdateSchema } from './hub-and-city-management.dto';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Hub & City Management
 *   description: Hub and city management for ride-sharing operations
 */

// ==================== STATS ====================

/**
 * @swagger
 * /api/admin/hub-city/stats:
 *   get:
 *     summary: Get hub and city management statistics
 *     tags: [Admin Hub & City Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview statistics cards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCities: { type: integer }
 *                 activeZones: { type: integer }
 *                 totalHubs: { type: integer }
 *                 activeHubs: { type: integer }
 */
router.get('/hub-city/stats', getHubCityStats);

// ==================== CITIES ====================

/**
 * @swagger
 * /api/admin/hub-city/cities:
 *   get:
 *     summary: Get list of all cities with service zones
 *     tags: [Admin Hub & City Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of cities and their service zones
 */
router.get('/hub-city/cities', getCities);

/**
 * @swagger
 * /api/admin/hub-city/cities:
 *   post:
 *     summary: Add a new city
 *     tags: [Admin Hub & City Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, state, latitude, longitude]
 *             properties:
 *               name: { type: string, example: "Lagos" }
 *               state: { type: string, example: "Lagos State" }
 *               country: { type: string, example: "Nigeria" }
 *               latitude: { type: number, example: 6.5244 }
 *               longitude: { type: number, example: 3.3792 }
 *               serviceZones: { type: string, example: "Victoria Island, Ikoyi, Lekki, Surulere" }
 *     responses:
 *       201:
 *         description: City created successfully
 */
router.post('/hub-city/cities', validate(citySchema), createCity);

/**
 * @swagger
 * /api/admin/hub-city/cities/{id}:
 *   put:
 *     summary: Update an existing city
 *     tags: [Admin Hub & City Management]
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
 *               name: { type: string, example: "Lagos" }
 *               state: { type: string, example: "Lagos State" }
 *               latitude: { type: number, example: 6.5244 }
 *               longitude: { type: number, example: 3.3792 }
 *               serviceZones: { type: string, example: "Victoria Island, Ikoyi, Lekki" }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: City updated successfully
 */
router.put('/hub-city/cities/:id', validate(citySchema.partial()), updateCity);

// ==================== HUBS ====================

/**
 * @swagger
 * /api/admin/hub-city/hubs:
 *   get:
 *     summary: Get list of all hubs with assigned drivers
 *     tags: [Admin Hub & City Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of hubs and their details
 */
router.get('/hub-city/hubs', getHubs);

/**
 * @swagger
 * /api/admin/hub-city/hubs:
 *   post:
 *     summary: Add a new hub
 *     tags: [Admin Hub & City Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, cityId, latitude, longitude, capacity]
 *             properties:
 *               name: { type: string, example: "Victoria Island Hub" }
 *               address: { type: string, example: "123 Akin Adesola Street, Victoria Island, Lagos" }
 *               cityId: { type: string, format: uuid }
 *               latitude: { type: number, example: 6.4281 }
 *               longitude: { type: number, example: 3.4219 }
 *               capacity: { type: integer, example: 100 }
 *               operatingHours: { type: string, example: "24/7" }
 *               assignedDrivers: { type: integer, example: 85 }
 *     responses:
 *       201:
 *         description: Hub created successfully
 */
router.post('/hub-city/hubs', validate(hubSchema), createHub);

/**
 * @swagger
 * /api/admin/hub-city/hubs/{id}:
 *   put:
 *     summary: Update an existing hub
 *     tags: [Admin Hub & City Management]
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
 *               name: { type: string, example: "Victoria Island Hub" }
 *               address: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               capacity: { type: integer }
 *               operatingHours: { type: string }
 *               assignedDrivers: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Hub updated successfully
 */
router.put('/hub-city/hubs/:id', validate(hubSchema.partial()), updateHub);

/**
 * @swagger
 * /api/admin/hub-city/hubs/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a hub
 *     tags: [Admin Hub & City Management]
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
 *               status: { type: string, enum: [Active, Inactive] }
 *     responses:
 *       200:
 *         description: Hub status updated successfully
 */
router.patch('/hub-city/hubs/:id/status', validate(statusUpdateSchema), updateHubStatus);

export default router;