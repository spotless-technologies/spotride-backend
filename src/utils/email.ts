import nodemailer from 'nodemailer';
import env from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export const sendEmailOTP = async (to: string, otp: string) => {
  await transporter.sendMail({
    from: `"Your App" <${env.EMAIL_USER}>`,
    to,
    subject: "Your Verification Code",
    html: `<h2>Your OTP is: <b>${otp}</b></h2><p>Valid for 10 minutes.</p>`,
  });
};