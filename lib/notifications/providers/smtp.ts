import nodemailer from 'nodemailer';

export function isSmtpConfigured(): boolean {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return Boolean(user && pass);
}

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER?.trim();
  // Strip any accidental spaces from Google 16-character app passwords
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '');

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
  });
}

export async function sendEmailWithSmtp(to: string, subject: string, html: string) {
  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, error: 'SMTP not configured. Set SMTP_USER and SMTP_PASS in .env' };
  }

  const user = process.env.SMTP_USER?.trim();
  const from = process.env.SMTP_FROM || `Vulpi Car Rentals <${user}>`;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`[SMTP Success] ✉️ Email sent to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[SMTP Email Error]', error?.message || error);
    return { success: false, error: error?.message || 'Failed to send email' };
  }
}
