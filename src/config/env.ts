import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string(), 
  REFRESH_EXPIRES_IN: z.string(),
  EMAIL_HOST: z.string(),
  EMAIL_USER: z.string().email(),
  EMAIL_PASS: z.string(),
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  RESEND_API_KEY: z.string().min(10),
  AWS_ACCESS_KEY_ID:     z.string().min(16),
  AWS_SECRET_ACCESS_KEY: z.string().min(30),
  AWS_REGION:            z.string().min(4),           
  AWS_S3_BUCKET_NAME:    z.string().min(3),
});

const env = envSchema.parse(process.env);
export default env;