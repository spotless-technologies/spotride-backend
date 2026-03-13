// import nodemailer from 'nodemailer';
// import env from '../config/env';

// const transporter = nodemailer.createTransport({
//   host: env.EMAIL_HOST,
//   port: 587,
//   secure: false,
//   auth: {
//     user: env.EMAIL_USER,
//     pass: env.EMAIL_PASS,
//   },
// });

// export const sendEmailOTP = async (to: string, otp: string) => {
//   await transporter.sendMail({
//     from: `"Your App" <${env.EMAIL_USER}>`,
//     to,
//     subject: "Your Verification Code",
//     html: `<h2>Your OTP is: <b>${otp}</b></h2><p>Valid for 10 minutes.</p>`,
//   });
// };

// src/utils/email.ts
import { Resend } from 'resend';
import env from '../config/env'; 

const resend = new Resend(env.RESEND_API_KEY);

export const sendEmailOTP = async (to: string, otp: string) => {
  const { data, error } = await resend.emails.send({
    from: 'SpotRide <onboarding@resend.dev>', // Change to your verified domain later
    to: [to],
    subject: 'Your Verification Code - SpotRide',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Your OTP Code</h2>
        <p>Use this code to verify your account:</p>
        <h1 style="letter-spacing: 10px; font-size: 32px; text-align: center;">${otp}</h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">
          SpotRide – Secure rides, anytime.
        </p>
      </div>
    `,
    // Optional: text fallback
    text: `Your OTP is ${otp}. Valid for 10 minutes.`,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log('Email sent via Resend:', data?.id);
  return data;
};