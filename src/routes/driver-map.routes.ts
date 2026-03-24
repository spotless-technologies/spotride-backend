import { Router } from 'express';
import { driverAuth } from '../middleware/driver';
import {
  getHeatmap,
  getHeatmapByTime,
  getSurgeZones,
} from '../controllers/driver-map.controller';

const router = Router();

router.use(driverAuth);

/**
 * @swagger
 * tags:
 *   name: Driver Map
 *   description: Heatmap, surge zones and map-related endpoints for drivers
 */

/**
 * @swagger
 * /map/heatmap:
 *   get:
 *     summary: Get current demand heatmap data points
 *     tags: [Driver Map]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of heatmap points (lat, lng, intensity)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   lat: { type: number }
 *                   lng: { type: number }
 *                   intensity: { type: number }
 */
router.get('/heatmap', getHeatmap);

/**
 * @swagger
 * /map/heatmap:
 *   get:
 *     summary: Get heatmap filtered by time window (e.g. peak hours)
 *     tags: [Driver Map]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: time
 *         schema: { type: string, enum: [peak, morning, evening, all] }
 *         description: Time filter (peak, morning, evening, all)
 *     responses:
 *       200:
 *         description: Filtered heatmap points
 */
router.get('/heatmap', getHeatmapByTime); // same endpoint, query param differentiates

/**
 * @swagger
 * /map/surge-zones:
 *   get:
 *     summary: Get current surge pricing zones and multipliers
 *     tags: [Driver Map]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of surge zones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   zoneName: { type: string }
 *                   multiplier: { type: number }
 *                   boundaries: { type: array, items: { type: object } } // optional geojson or coords
 */
router.get('/surge-zones', getSurgeZones);

export default router;