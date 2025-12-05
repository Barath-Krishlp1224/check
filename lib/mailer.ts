// lib/mailer.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,       // e.g. "smtp.gmail.com" or your company SMTP
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,                     // true for port 465, false for 587
  auth: {
    user: process.env.MAIL_USER,     // full email id
    pass: process.env.MAIL_PASS,     // app password / SMTP password
  },
});

export async function sendResetMail(to: string, resetUrl: string) {
  const from = process.env.MAIL_FROM || process.env.MAIL_USER;

  const info = await transporter.sendMail({
    from,
    to,
    subject: "Reset your Lemonpay password",
    html: `
      <p>Hi,</p>
      <p>You requested a password reset for your Lemonpay account.</p>
      <p>Click the link below to reset your password (valid for 30 minutes):</p>
      <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  console.log("Reset mail sent:", info.messageId);
}
