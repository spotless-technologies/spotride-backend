import twilio from 'twilio';
import env from '../config/env';

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export const sendSMSOTP = async (to: string, otp: string) => {
  await client.messages.create({
    body: `Your verification code is ${otp}. Valid for 10 minutes.`,
    from: env.TWILIO_PHONE_NUMBER,
    to,
  });
};