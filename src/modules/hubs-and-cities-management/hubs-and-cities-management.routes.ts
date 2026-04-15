import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import * as controller from './hubs-and-cities-management.controller';
import * as dto from './hubs-and-cities-management.dto';
import { z } from 'zod';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Hubs & Cities Management
 *   description: |
 *     - **Cities**: Manage service zones and baseline pricing levels.
 *     - **Hubs**: Handle driver assignment, specific zone coverage, and light pricing adjustment on top of city baseline.
 */

// ==================== STATISTICS ====================
/**
 * @swagger
 * /api/admin/hubs-and-cities/stats:
 *   get:
 *     summary: Get overall hubs and cities statistics
 *     tags: [Admin Hubs & Cities Management]
 *     security:
 *       - bearerAuth: []
 *     description: Returns key metrics shown on the Hub & City Management dashboard (Total Cities, Active Zones, Total Hubs, Active Hubs).
 *     responses:
 *       200:
 *         description: Statistics cards
 *         content:
 *           application/json:
 *             example:
 *               totalCities: 3
 *               activeZones: 3
 *               totalHubs: 51
 *               activeHubs: 21
 */
router.get('/hubs-and-cities/stats', controller.getHubCityStats);

// ==================== CITIES ====================
/**
 * @swagger
 * /api/admin/hubs-and-cities/cities:
 *   get:
 *     summary: Get all cities with their hubs and service zones
 *     tags: [Admin Hubs & Cities Management]
 *     security:
 *       - bearerAuth: []
 *     description: Returns list of all cities including associated hubs and service zones (used in the main Cities & Service Zones tab).
 *     responses:
 *       200:
 *         description: List of cities
 *         content:
 *           application/json:
 *             example:
 *               [
 *                 {
 *                   "id": "city-uuid",
 *                   "name": "Lagos",
 *                   "state": "Lagos State",
 *                   "country": "Nigeria",
 *                   "latitude": 6.5244,
 *                   "longitude": 3.3792,
 *                   "serviceZones": ["Victoria Island", "Ikoyi", "Lekki"],
 *                   "pricingLevel": "STANDARD",
 *                   "hubs": [...]
 *                 }
 *               ]
 */
router.get('/hubs-and-cities/cities', controller.getCities);

/**
 * @swagger
 * /api/admin/hubs-and-cities/cities:
 *   post:
 *     summary: Add a new city
 *     tags: [Admin Hubs & Cities Management]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a new city with service zones and baseline pricing level (matches "Add New City" modal).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/City'
 *           example:
 *             name: "Lagos"
 *             state: "Lagos State"
 *             country: "Nigeria"
 *             latitude: 6.5244
 *             longitude: 3.3792
 *             serviceZones: "Victoria Island, Ikoyi, Lekki, Surulere"
 *             pricingLevel: "STANDARD"
 *     responses:
 *       201:
 *         description: City created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "City created successfully"
 *               city:
 *                 id: "city-uuid"
 *                 name: "Lagos"
 *                 state: "Lagos State"
 *                 country: "Nigeria"
 *                 latitude: 6.5244
 *                 longitude: 3.3792
 *                 serviceZones: ["Victoria Island", "Ikoyi", "Lekki", "Surulere"]
 *                 pricingLevel: "STANDARD"
 *       400:
 *         description: Validation error (missing required fields)
 */
router.post('/hubs-and-cities/cities', validate(dto.citySchema), controller.createCity);

/**
 * @swagger
 * /api/admin/hubs-and-cities/cities/{id}:
 *   put:
 *     summary: Edit an existing city
 *     tags: [Admin Hubs & Cities Management]
 *     security:
 *       - bearerAuth: []
 *     description: Updates city details including service zones and pricing level (matches "Edit City" modal).
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
 *             $ref: '#/components/schemas/City'
 *           example:
 *             name: "Lagos"
 *             state: "Lagos State"
 *             latitude: 6.5244
 *             longitude: 3.3792
 *             serviceZones: "Victoria Island, Ikoyi, Lekki"
 *             pricingLevel: "STANDARD"
 *     responses:
 *       200:
 *         description: City updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "City updated successfully"
 *               city: { ...updated city object... }
 *       404:
 *         description: City not found
 */
router.put('/hubs-and-cities/cities/:id', validate(dto.citySchema.partial()), controller.updateCity);

// ==================== HUBS ====================
/**
 * @swagger
 * /api/admin/hubs-and-cities/hubs:
 *   get:
 *     summary: Get all hubs with city details
 *     tags: [Admin Hubs & Cities Management]
 *     security:
 *       - bearerAuth: []
 *     description: Returns list of all hubs including city information and driver assignment stats (used in Hubs & Driver Assignment tab).
 *     responses:
 *       200:
 *         description: List of hubs
 *         content:
 *           application/json:
 *             example:
 *               [
 *                 {
 *                   "id": "hub-uuid",
 *                   "name": "Victoria Island Hub",
 *                   "address": "123 Akin Adesola Street, Victoria Island, Lagos",
 *                   "city": { "name": "Lagos" },
 *                   "zonesCovered": ["Victoria Island", "Ikoyi"],
 *                   "pricingTier": "PREMIUM",
 *                   "baseAdjustment": 200,
 *                   "distanceMultiplier": 1.2,
 *                   "isActive": true
 *                 }
 *               ]
 */
router.get('/hubs-and-cities/hubs', controller.getHubs);

/**
 * @swagger
 * /api/admin/hubs-and-cities/hubs:
 *   post:
 *     summary: Add a new hub
 *     tags: [Admin Hubs & Cities Management]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a new hub with zone coverage and pricing adjustment (matches "Add New Hub" modal).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hub'
 *           example:
 *             name: "Victoria Island Hub"
 *             address: "123 Akin Adesola Street, Victoria Island, Lagos"
 *             cityId: "city-uuid"
 *             latitude: 6.4281
 *             longitude: 3.4219
 *             operatingHours: "24/7"
 *             capacity: 100
 *             zonesCovered: ["Victoria Island", "Ikoyi"]
 *             pricingTier: "PREMIUM"
 *             baseAdjustment: 200
 *             distanceMultiplier: 1.2
 *     responses:
 *       201:
 *         description: Hub created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Hub created successfully"
 *               hub:
 *                 id: "hub-uuid"
 *                 name: "Victoria Island Hub"
 *                 address: "123 Akin Adesola Street, Victoria Island, Lagos"
 *                 cityId: "city-uuid"
 *                 zonesCovered: ["Victoria Island", "Ikoyi"]
 *                 pricingTier: "PREMIUM"
 *                 baseAdjustment: 200
 *                 distanceMultiplier: 1.2
 *                 isActive: true
 */
router.post('/hubs-and-cities/hubs', validate(dto.hubSchema), controller.createHub);

/**
 * @swagger
 * /api/admin/hubs-and-cities/hubs/{id}/configure:
 *   patch:
 *     summary: Configure an existing hub (zone coverage + pricing adjustment)
 *     tags: [Admin Hubs & Cities Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Updates hub configuration including selected service zones and pricing adjustment.
 *       This matches the "Configure Hub" modal with Zone Coverage checkboxes and Pricing Adjustment section.
 *       The system applies these adjustments on top of the city's baseline pricing.
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
 *             $ref: '#/components/schemas/ConfigureHub'
 *           example:
 *             zonesCovered: ["Victoria Island", "Ikoyi", "Lekki"]
 *             pricingTier: "PREMIUM"
 *             baseAdjustment: 200
 *             distanceMultiplier: 1.2
 *     responses:
 *       200:
 *         description: Hub configured successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Hub configured successfully"
 *               hub:
 *                 id: "hub-uuid"
 *                 zonesCovered: ["Victoria Island", "Ikoyi", "Lekki"]
 *                 pricingTier: "PREMIUM"
 *                 baseAdjustment: 200
 *                 distanceMultiplier: 1.2
 */
router.patch('/hubs-and-cities/hubs/:id/configure', validate(dto.configureHubSchema), controller.configureHub);

export default router;