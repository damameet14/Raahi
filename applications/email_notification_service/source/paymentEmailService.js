import nodemailer from 'nodemailer';
import {
  createPaymentFailedEmailTemplate,
  createPaymentPendingEmailTemplate,
  createPaymentSuccessEmailTemplate,
} from './paymentEmailTemplates.js';

let reusableTransporter;

function isEmailEnabled() {
  return String(process.env.EMAIL_ENABLED || 'false').toLowerCase() === 'true';
}

function createReusableTransporter() {
  if (!isEmailEnabled()) {
    return null;
  }
  if (reusableTransporter) {
    return reusableTransporter;
  }
  reusableTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  return reusableTransporter;
}

function createSenderAddress() {
  const fromName = .
  v.EMAIL_FROM_NAME || 'Carpooling Platform';
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER;
  return `"${fromName.replaceAll('"', '')}" <${fromAddress}>`;
}

async function sendPaymentEmail(paymentData, template) {
  if (!isEmailEnabled()) {
    return { sent: false, skipped: true, reason: 'EMAIL_ENABLED is false' };
  }
  if (!paymentData.employeeEmail) {
    return { sent: false, skipped: true, reason: 'Employee email is missing' };
  }
  const transporter = createReusableTransporter();
  await transporter.sendMail({
    from: createSenderAddress(),
    to: paymentData.employeeEmail,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  return { sent: true, skipped: false };
}

export async function sendPaymentPendingEmail(paymentData) {
  return sendPaymentEmail(paymentData, createPaymentPendingEmailTemplate(paymentData));
}

export async function sendPaymentSuccessEmail(paymentData) {
  return sendPaymentEmail(paymentData, createPaymentSuccessEmailTemplate(paymentData));
}

export async function sendPaymentFailedEmail(paymentData) {
  return sendPaymentEmail(
    paymentData,
    createPaymentFailedEmailTemplate(paymentData, process.env.PAYMENT_SUPPORT_EMAIL),
  );
}

export async function verifyEmailTransporterIfEnabled() {
  if (!isEmailEnabled()) {
    return { verified: false, skipped: true };
  }
  await createReusableTransporter().verify();
  return { verified: true, skipped: false };
}

