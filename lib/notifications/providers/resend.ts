import { Resend } from 'resend';
import { BookingNotificationPayload, HoldExpiringNotificationPayload, StatusUpdatedNotificationPayload } from '../types';
import { formatPHP, formatDateRangePH } from '@/lib/formatters';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL || 'Vulpi Car Rentals <onboarding@resend.dev>';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendEmailWithResend(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[Notification Mock Email] To: ${to} | Subject: ${subject}`);
    return { success: true, mocked: true };
  }

  try {
    const data = await resend.emails.send({
      from: resendFrom,
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('[Resend Error]', error);
    return { success: false, error };
  }
}

export async function sendNewBookingEmailToOwner(payload: BookingNotificationPayload) {
  const dates = formatDateRangePH(payload.startDate, payload.endDate);
  const total = formatPHP(payload.estimatedTotal);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFBF5; border: 1px solid #F0DFC8; border-radius: 16px; overflow: hidden; color: #3B2216;">
      <div style="background: #E8772E; padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">New Car Rental Request!</h1>
        <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">Vulpi — Cagayan de Oro Car Rental</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px;">Hello <strong>${payload.ownerName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.5;">You received a new booking request for your <strong>${payload.carYear} ${payload.carMake} ${payload.carModel}</strong>.</p>
        
        <div style="background: #FFF4E6; border: 1px solid #F0DFC8; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #E8772E; font-size: 16px;">Rental Details</h3>
          <p style="margin: 6px 0;"><strong>Renter:</strong> ${payload.renterName}</p>
          <p style="margin: 6px 0;"><strong>Phone:</strong> <a href="tel:${payload.renterPhone}" style="color: #1AA3A3; font-weight: bold;">${payload.renterPhone}</a></p>
          ${payload.renterEmail ? `<p style="margin: 6px 0;"><strong>Email:</strong> ${payload.renterEmail}</p>` : ''}
          <p style="margin: 6px 0;"><strong>Dates:</strong> ${dates}</p>
          <p style="margin: 6px 0;"><strong>Destination:</strong> ${payload.destination === 'within_cdo' ? 'Within CDO' : 'Outside CDO'}</p>
          <p style="margin: 6px 0;"><strong>Estimated Total:</strong> <span style="font-size: 18px; color: #E8772E; font-weight: bold;">${total}</span></p>
        </div>

        <div style="background: #FFF; border-left: 4px solid #F5B82E; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #3B2216;">
            ⏳ <strong>24-Hour Hold Active:</strong> These dates are held for 24 hours until ${new Date(payload.holdExpiresAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}. Please call or message the renter to confirm.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/owner/requests/${payload.bookingId}" style="background: #E8772E; color: white; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Open Booking & Confirm
          </a>
        </div>
      </div>
      <div style="background: #FAF0E4; padding: 16px; text-align: center; font-size: 12px; color: #735340;">
        Vulpi — Smart Rentals. Smooth Journeys. Cagayan de Oro City
      </div>
    </div>
  `;

  return sendEmailWithResend(
    payload.ownerEmail,
    `New Rental Request: ${payload.carMake} ${payload.carModel} (${dates})`,
    html
  );
}

export async function sendHoldExpiringEmailToOwner(payload: HoldExpiringNotificationPayload) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #F0DFC8; border-radius: 12px; background: #FFFBF5; color: #3B2216;">
      <h2 style="color: #E8772E;">⏳ Reminder: Booking Hold Expiring Soon</h2>
      <p>Hello ${payload.ownerName},</p>
      <p>The booking hold for <strong>${payload.renterName}</strong> on your <strong>${payload.carMake} ${payload.carModel}</strong> expires in approximately <strong>${payload.hoursRemaining} hours</strong>.</p>
      <p>If not confirmed or declined, the hold will automatically expire and release the dates for other renters.</p>
      <p><a href="${appUrl}/owner/requests/${payload.bookingId}" style="background: #1AA3A3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Booking Request</a></p>
    </div>
  `;

  return sendEmailWithResend(
    payload.ownerEmail,
    `Reminder: 24h Hold Expiring for ${payload.carMake} ${payload.carModel}`,
    html
  );
}
