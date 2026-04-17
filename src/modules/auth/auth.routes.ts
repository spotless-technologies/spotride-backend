import { Router } from 'express';
import { validate } from '../../middleware/validate';
import * as controller from './auth.controller';
import * as dto from './auth.dto';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints (email, phone, social, OTP, password reset)
 */

/**
 * @swagger
 * /api/auth/register/email:
 *   post:
 *     summary: Register with email + phone + firstName + lastName + role + password
 *     tags: [Auth]
 *     description: |
 *       Register a new user using email. **Phone number is now mandatory**.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phone
 *               - firstName
 *               - lastName
 *               - role
 *               - password
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               phone:
 *                 type: string
 *                 example: "+2348012345678"
 *                 description: Phone number is required when registering with email
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               role:
 *                 type: string
 *                 enum: [RIDER, DRIVER, CAR_OWNER]
 *                 example: RIDER
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Passw0rd123
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: Passw0rd123
 *     responses:
 *       201:
 *         description: Verification code sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                 note:
 *                   type: string
 *       400:
 *         description: Validation error (e.g. passwords don't match, invalid phone)
 *       403:
 *         description: Attempt to register as ADMIN
 *       409:
 *         description: Email or phone already registered
 */
router.post('/register/email', validate(dto.emailSignupSchema), controller.registerEmail);

/**
 * @swagger
 * /api/auth/register/phone:
 *   post:
 *     summary: Register with phone number + firstName + lastName + role + password
 *     tags: [Auth]
 *     description: |
 *       Register a new user using phone number.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - firstName
 *               - lastName
 *               - role
 *               - password
 *               - confirmPassword
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+2348012345678"
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               role:
 *                 type: string
 *                 enum: [RIDER, DRIVER, CAR_OWNER]
 *                 example: DRIVER
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Passw0rd123
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: Passw0rd123
 *     responses:
 *       201:
 *         description: Verification code sent to phone
 *       400:
 *         description: Validation error
 *       403:
 *         description: Attempt to register as ADMIN
 *       409:
 *         description: Phone already registered
 */
router.post('/register/phone', validate(dto.phoneSignupSchema), controller.registerPhone);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP (final step of registration)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - otp
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               otp:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *                 example: "483920"
 *     responses:
 *       200:
 *         description: Account verified successfully, tokens issued
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-otp', validate(dto.verifyOtpSchema), controller.verifyOtp);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Google sign-in / sign-up
 *     tags: [Auth]
 *     description: |
 *       Authenticate user using Google OAuth.
 *       firstName and lastName are automatically extracted from Google profile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 example: eyJhbGciOiJSUzI1NiIsImtpZCI6Im...
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *       400:
 *         description: Invalid Google token
 */
router.post('/google', controller.googleAuth);

/**
 * @swagger
 * /api/auth/facebook:
 *   post:
 *     summary: Facebook sign-in / sign-up
 *     tags: [Auth]
 *     description: |
 *       Authenticate user using Facebook OAuth.
 *       Name is split into firstName and lastName automatically.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *             properties:
 *               accessToken:
 *                 type: string
 *                 example: EAA...
 *     responses:
 *       200:
 *         description: Authentication successful
 *       400:
 *         description: Invalid Facebook token
 */
router.post('/facebook', controller.facebookAuth);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email or phone + password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: Passw0rd123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials or account not verified
 */
router.post('/login', validate(dto.loginSchema), controller.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using httpOnly refresh token cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: No refresh token or invalid/expired refresh token
 */
router.post('/refresh', controller.refresh);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent (or silent success if user doesn't exist)
 */
router.post('/forgot-password', validate(dto.forgotPasswordSchema), controller.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - otp
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *                 example: "927481"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: NewPass456!
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: NewPass456!
 *     responses:
 *       200:
 *         description: Password successfully reset
 *       400:
 *         description: Invalid OTP / validation error
 */
router.post('/reset-password', validate(dto.resetPasswordSchema), controller.resetPassword);

export default router;