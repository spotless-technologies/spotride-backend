import { Router } from 'express';
import { driverAuth } from '../middleware/driver';
import {
  getSettings,
  updateSettings,
  updateBankAccount,
  switchMode,
  getCurrentMode,
} from '../controllers/driver-settings.controller';
import { validate } from '../middleware/validate';
import {
  updateSettingsSchema,
  bankAccountSchema,
  switchModeSchema,
} from '../schemas/driver.schema';

const router = Router();

router.use(driverAuth);

/**
 * @swagger
 * tags:
 *   name: Driver Settings
 *   description: Driver app settings, bank details and mode switching
 */

/**
 * @swagger
 * /driver/settings:
 *   get:
 *     summary: Fetch driver app settings and preferences
 *     tags: [Driver Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 language: { type: string }
 *                 pushNotifications: { type: boolean }
 *                 navigationPreference: { type: string }
 */
router.get('/settings', getSettings);

/**
 * @swagger
 * /driver/settings:
 *   put:
 *     summary: Update driver settings
 *     tags: [Driver Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language: { type: string }
 *               pushNotifications: { type: boolean }
 *               navigationPreference: { type: string }
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put('/settings', validate(updateSettingsSchema), updateSettings);

/**
 * @swagger
 * /driver/settings/bank-account:
 *   put:
 *     summary: Add or update payout bank account details
 *     tags: [Driver Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bankName, accountNumber, accountName]
 *             properties:
 *               bankName: { type: string }
 *               accountNumber: { type: string }
 *               accountName: { type: string }
 *     responses:
 *       200:
 *         description: Bank details updated
 */
router.put('/settings/bank-account', validate(bankAccountSchema), updateBankAccount);

/**
 * @swagger
 * /user/switch-mode:
 *   post:
 *     summary: Switch between Driver mode and Rider mode
 *     tags: [Driver Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mode]
 *             properties:
 *               mode: { type: string, enum: [driver, rider] }
 *     responses:
 *       200:
 *         description: Mode switched
 */
router.post('/user/switch-mode', validate(switchModeSchema), switchMode);

/**
 * @swagger
 * /user/mode:
 *   get:
 *     summary: Get current active mode of the user
 *     tags: [Driver Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current role/mode
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mode: { type: string, enum: [rider, driver, car_owner, admin] }
 */
router.get('/user/mode', getCurrentMode);

export default router;