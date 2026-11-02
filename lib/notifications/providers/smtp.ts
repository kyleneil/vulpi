import nodemailer from 'nodemailer';
import { BookingNotificationPayload, HoldExpiringNotificationPayload } from '../types';
import { formatPHP, formatDateRangePH } from '@/lib/formatters';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || `Vulpi Car Rentals <${smtpUser || 'no-reply@vulpi.ph'}>`;

export function isSmtpConfigured(): boolean {
  return Boolean(smtpHost && smtpUser && smtpPass);
}

const transporter = isSmtpConfigured()
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

export async function sendEmailWithSmtp(to: string, subject: string, html: string) {
  if (!transporter) {
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[SMTP Email Error]', error);
    return { success: false, error };
  }
}
