// utils/mail.ts
import nodemailer from "nodemailer";
import { welcomeEmailHtml } from "./emailTemplates";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || "No Reply <no-reply@example.com>";

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  // You can choose to throw here; kept lenient so devs can opt for SendGrid
  // throw new Error("Please configure SMTP_HOST, SMTP_USER and SMTP_PASS in .env.local");
}

export async function sendWelcomeEmail(to: string, params: { name?: string; empId?: string; joiningDate?: string; team?: string }) {
  // Use Nodemailer SMTP
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const subject = `Welcome to Company Name${params.team ? ` — ${params.team}` : ""}`;
  const html = welcomeEmailHtml(params);

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });

  return info;
}

/* // Optional SendGrid alternative:
import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
export async function sendWelcomeEmailSG(to, params) {
  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject: `Welcome to Company Name`,
    html: welcomeEmailHtml(params),
  };
  return sgMail.send(msg);
}
*/
