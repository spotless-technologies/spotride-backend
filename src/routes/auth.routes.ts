import { Router } from 'express';
import { validate } from '../middleware/validate';
import {
  registerEmail,
  registerPhone,
  verifyOtp,
  googleAuth,
  facebookAuth,
  login,
  refresh,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import {
  emailSignupSchema,
  phoneSignupSchema,
  verifyOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';

const router = Router();

/** * @swagger
 * /api/auth/register/email:
 * post:
 * summary: Register with email + name + password
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [email, name, password]
 * properties:
 * email: { type: string, format: email }
 * name: { type: string }
 * password: { type: string, minLength: 8 }
 * responses:
 * 201:
 * description: Verification code sent
 * 409:
 * description: Email already registered
 */
router.post('/register/email', validate(emailSignupSchema), registerEmail);

/** 
 * @swagger
 * /api/auth/register/phone:
 *   post:
 *     summary: Register with phone + password
 */
router.post('/register/phone', validate(phoneSignupSchema), registerPhone);

/** 
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP (finalizes registration)
 */
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);

/** 
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Google OAuth (signup + login)
 */
router.post('/google', googleAuth);

/** 
 * @swagger
 * /api/auth/facebook:
 *   post:
 *     summary: Facebook OAuth (signup + login)
 */
router.post('/facebook', facebookAuth);

/** 
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email or phone + password
 */
router.post('/login', validate(loginSchema), login);

/** 
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token (cookie)
 */
router.post('/refresh', refresh);

/** 
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Forgot password - send OTP
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

/** 
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 */
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;