import { BookingNotificationPayload, HoldExpiringNotificationPayload, StatusUpdatedNotificationPayload } from './types';
import { sendNewBookingEmailToOwner as sendWithResend, sendHoldExpiringEmailToOwner as sendHoldWithResend } from './providers/resend';
import { isSmtpConfigured, sendEmailWithSmtp } from './providers/smtp';
import {
  isTelegramConfigured,
  sendNewBookingTelegramAlert,
  sendHoldExpiringTelegramAlert,
  sendStatusUpdateTelegramAlert,
} from './providers/telegram';
import { formatPHP, formatDateRangePH } from '@/lib/formatters';

export class NotificationService {
  async notifyNewBooking(payload: BookingNotificationPayload): Promise<void> {
    const dates = formatDateRangePH(payload.startDate, payload.endDate);
    const total = formatPHP(payload.estimatedTotal);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    console.log(`\n==================================================`);
    console.log(`[Vulpi Notification] 📨 NEW BOOKING REQUEST FOR OWNER`);
    console.log(`Car: ${payload.carYear} ${payload.carMake} ${payload.carModel}`);
    console.log(`Renter: ${payload.renterName} (${payload.renterPhone})`);
    console.log(`Dates: ${dates} | Total: ${total}`);
    console.log(`Hold Active: 24 Hours (until ${payload.holdExpiresAt})`);
    console.log(`Link: ${appUrl}/owner/requests/${payload.bookingId}`);
    console.log(`==================================================\n`);

    // 1. Send Instant Telegram Push Alert if bot is configured
    if (isTelegramConfigured()) {
      await sendNewBookingTelegramAlert(payload);
    }

    // 2. Try Free SMTP (e.g. Gmail App Password) if configured
    if (isSmtpConfigured()) {
      const subject = `New Rental Request: ${payload.carMake} ${payload.carModel} (${dates})`;
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #F0DFC8; border-radius: 16px; background: #FFFBF5; color: #3B2216;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #E8772E; margin: 0;">🦊 Vulpi — New Car Rental Request</h2>
            <p style="color: #735340; font-size: 13px; margin-top: 4px;">Smart Rentals. Smooth Journeys. • Cagayan de Oro</p>
          </div>
          <p>Hello <strong>${payload.ownerName}</strong>,</p>
          <p>You received a new booking request for your <strong>${payload.carYear} ${payload.carMake} ${payload.carModel}</strong>.</p>
          <div style="background: #FFF; border: 1px solid #F0DFC8; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 6px 0;"><strong>Renter Name:</strong> ${payload.renterName}</p>
            <p style="margin: 6px 0;"><strong>Phone Number:</strong> <a href="tel:${payload.renterPhone}" style="color: #1AA3A3; font-weight: bold;">${payload.renterPhone}</a></p>
            ${payload.renterEmail ? `<p style="margin: 6px 0;"><strong>Renter Email:</strong> ${payload.renterEmail}</p>` : ''}
            <p style="margin: 6px 0;"><strong>Rental Dates:</strong> ${dates}</p>
            <p style="margin: 6px 0;"><strong>Destination:</strong> ${payload.destination === 'within_cdo' ? 'Within CDO City' : 'Outside CDO (Bukidnon / Iligan / Highlands)'}</p>
            <p style="margin: 6px 0;"><strong>Estimated Total:</strong> <span style="color: #E8772E; font-weight: bold; font-size: 16px;">${total}</span></p>
          </div>
          <div style="background: #FFF4E6; border-left: 4px solid #F5B82E; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px;">
              ⏳ <strong>24-Hour Hold Active:</strong> These dates are locked on your calendar until you accept or decline. Please reach out to the renter promptly.
            </p>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${appUrl}/owner/requests/${payload.bookingId}" style="background: #E8772E; color: white; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: bold; display: inline-block;">View & Confirm Request</a>
          </div>
        </div>
      `;
      await sendEmailWithSmtp(payload.ownerEmail, subject, html);

      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && adminEmail.toLowerCase() !== payload.ownerEmail.toLowerCase()) {
        await sendEmailWithSmtp(adminEmail, `[Platform Copy] ${subject}`, html);
      }
      return;
    }

    // 3. Otherwise try Resend (Free tier) or mock fallback
    await sendWithResend(payload);
  }

  async notifyHoldExpiring(payload: HoldExpiringNotificationPayload): Promise<void> {
    console.log(`[Vulpi Notification] ⏳ 24h Hold Expiring in ${payload.hoursRemaining}h for ${payload.carMake} ${payload.carModel}`);
    if (isTelegramConfigured()) {
      await sendHoldExpiringTelegramAlert(payload);
    }
    await sendHoldWithResend(payload);
  }

  async notifyStatusUpdate(payload: StatusUpdatedNotificationPayload): Promise<void> {
    console.log(`[Vulpi Notification] Status updated to "${payload.status}" for booking ${payload.bookingId}`);
    
    // 1. Telegram Push Notification
    if (isTelegramConfigured()) {
      await sendStatusUpdateTelegramAlert(payload);
    }

    // 2. Email notification to renter (if email was provided and SMTP is configured)
    if (payload.renterEmail && isSmtpConfigured() && (payload.status === 'confirmed' || payload.status === 'declined')) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const isConfirmed = payload.status === 'confirmed';
      const subject = isConfirmed
        ? `Booking Confirmed! 🚗 ${payload.carMake} ${payload.carModel} with ${payload.ownerName}`
        : `Update on your rental request for ${payload.carMake} ${payload.carModel}`;

      const html = isConfirmed
        ? `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #F0DFC8; border-radius: 16px; background: #FFFBF5; color: #3B2216;">
            <h2 style="color: #1AA3A3; margin-top: 0;">🎉 Your Booking is Confirmed!</h2>
            <p>Hello <strong>${payload.renterName}</strong>, your car rental reservation for <strong>${payload.carMake} ${payload.carModel}</strong> has been officially confirmed by ${payload.ownerName}.</p>
            <div style="background: #FFF; border: 1px solid #F0DFC8; border-radius: 12px; padding: 16px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Host / Owner:</strong> ${payload.ownerName}</p>
              <p style="margin: 4px 0;"><strong>Owner Phone:</strong> <a href="tel:${payload.ownerPhone}" style="color: #E8772E; font-weight: bold;">${payload.ownerPhone}</a></p>
              <p style="margin: 4px 0;"><strong>Pickup Location:</strong> ${payload.pickupLocation}</p>
              ${payload.ownerNote ? `<p style="margin: 4px 0;"><strong>Owner Note:</strong> ${payload.ownerNote}</p>` : ''}
            </div>
            <p><a href="${appUrl}/api/agreements/${payload.bookingId}" style="background: #E8772E; color: white; padding: 12px 24px; border-radius: 20px; text-decoration: none; font-weight: bold; display: inline-block;">Download Rental Agreement (PDF)</a></p>
          </div>
        `
        : `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #F0DFC8; border-radius: 16px; background: #FFFBF5; color: #3B2216;">
            <h2 style="color: #3B2216; margin-top: 0;">Update on your rental request</h2>
            <p>Hello ${payload.renterName}, unfortunately ${payload.ownerName} was unable to accept your booking for the ${payload.carMake} ${payload.carModel} on the requested dates.</p>
            ${payload.ownerNote ? `<p><strong>Reason:</strong> ${payload.ownerNote}</p>` : ''}
            <p>You can browse other available cars in Cagayan de Oro on our marketplace:</p>
            <p><a href="${appUrl}/cars" style="background: #1AA3A3; color: white; padding: 12px 24px; border-radius: 20px; text-decoration: none; font-weight: bold; display: inline-block;">Find Other Cars</a></p>
          </div>
        `;

      await sendEmailWithSmtp(payload.renterEmail, subject, html);
    }
  }
}

export const notificationService = new NotificationService();
