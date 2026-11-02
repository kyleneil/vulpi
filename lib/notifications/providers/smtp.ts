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

export async function sendOwnerCredentialsEmail(params: {
  ownerName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}) {
  const subject = `Welcome to Vulpi — Your Car Owner Account Credentials`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #F0DFC8; border-radius: 20px; background: #FFFBF5; color: #3B2216;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #E8772E; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">🦊 Vulpi</h1>
        <p style="color: #735340; font-size: 13px; margin-top: 4px; font-weight: 600;">Smart Rentals. Smooth Journeys. • Cagayan de Oro</p>
      </div>

      <div style="background: #FFFFFF; border: 1px solid #F0DFC8; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(59, 34, 22, 0.04);">
        <h2 style="font-size: 18px; color: #3B2216; margin-top: 0;">Welcome, ${params.ownerName}!</h2>
        <p style="color: #735340; font-size: 14px; line-height: 1.6;">
          Your partner car owner account on the Vulpi Car Rental Marketplace has been created. You can now log in to list your vehicles, manage availability, and accept booking requests from verified renters.
        </p>

        <div style="background: #FFF4E6; border: 1px dashed #E8772E; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #E8772E; text-transform: uppercase; letter-spacing: 0.5px;">Your Sign-In Credentials</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> <span style="font-family: monospace; color: #3B2216;">${params.email}</span></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #FFF; padding: 2px 8px; border-radius: 6px; border: 1px solid #F0DFC8; font-weight: bold; color: #E8772E;">${params.temporaryPassword}</span></p>
        </div>

        <div style="text-align: center; margin: 28px 0 16px 0;">
          <a href="${params.loginUrl}" style="background: #E8772E; color: #FFFFFF; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
            Sign In to Vulpi Partner Portal
          </a>
        </div>
      </div>

      <div style="background: #FFFFFF; border: 1px solid #F0DFC8; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <h3 style="font-size: 14px; color: #3B2216; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">
          🔒 How to Change Your Password (Recommended)
        </h3>
        <ol style="color: #735340; font-size: 13px; line-height: 1.7; padding-left: 20px; margin: 0;">
          <li>Click the button above or visit <a href="${params.loginUrl}" style="color: #1AA3A3; font-weight: 600;">${params.loginUrl}</a>.</li>
          <li>Log in using your email and temporary password.</li>
          <li>Navigate to <strong>Settings</strong> in the navigation menu (or visit <code>/owner/settings</code>).</li>
          <li>Under <strong>Change Password</strong>, enter your preferred new password.</li>
          <li>Click <strong>Update Password</strong> to save.</li>
        </ol>
      </div>

      <p style="font-size: 12px; color: #A1826F; text-align: center; margin: 0;">
        If you have questions or need assistance, reply directly to this email or message us on WhatsApp / Viber.
      </p>
    </div>
  `;

  return sendEmailWithSmtp(params.email, subject, html);
}

export async function sendOwnerPasswordResetEmail(params: {
  ownerName: string;
  email: string;
  newPassword: string;
  loginUrl: string;
}) {
  const subject = `Vulpi — Your Car Owner Account Password Has Been Reset`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #F0DFC8; border-radius: 20px; background: #FFFBF5; color: #3B2216;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #E8772E; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">🦊 Vulpi</h1>
        <p style="color: #735340; font-size: 13px; margin-top: 4px; font-weight: 600;">Smart Rentals. Smooth Journeys. • Cagayan de Oro</p>
      </div>

      <div style="background: #FFFFFF; border: 1px solid #F0DFC8; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <h2 style="font-size: 18px; color: #3B2216; margin-top: 0;">Password Reset Notification</h2>
        <p style="color: #735340; font-size: 14px; line-height: 1.6;">
          Hello <strong>${params.ownerName}</strong>, your password for your Vulpi car owner account has been updated by platform administration.
        </p>

        <div style="background: #FFF4E6; border: 1px dashed #E8772E; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #E8772E; text-transform: uppercase; letter-spacing: 0.5px;">Your New Login Credentials</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> <span style="font-family: monospace; color: #3B2216;">${params.email}</span></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>New Temporary Password:</strong> <span style="font-family: monospace; background: #FFF; padding: 2px 8px; border-radius: 6px; border: 1px solid #F0DFC8; font-weight: bold; color: #E8772E;">${params.newPassword}</span></p>
        </div>

        <div style="text-align: center; margin: 28px 0 16px 0;">
          <a href="${params.loginUrl}" style="background: #E8772E; color: #FFFFFF; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
            Log In Now
          </a>
        </div>
      </div>

      <div style="background: #FFFFFF; border: 1px solid #F0DFC8; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <h3 style="font-size: 14px; color: #3B2216; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">
          🔒 Steps to Change This Password:
        </h3>
        <ol style="color: #735340; font-size: 13px; line-height: 1.7; padding-left: 20px; margin: 0;">
          <li>Log in at <a href="${params.loginUrl}" style="color: #1AA3A3; font-weight: 600;">${params.loginUrl}</a>.</li>
          <li>Go to <strong>Settings</strong> (<code>/owner/settings</code>).</li>
          <li>Enter your new password under <strong>Change Password</strong> and submit.</li>
        </ol>
      </div>
    </div>
  `;

  return sendEmailWithSmtp(params.email, subject, html);
}
