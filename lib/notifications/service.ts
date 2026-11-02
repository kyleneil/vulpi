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
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #F0DFC8; border-radius: 12px; background: #FFFBF5; color: #3B2216;">
          <h2 style="color: #E8772E;">New Car Rental Request</h2>
          <p>Hello ${payload.ownerName}, you have a new request for your <strong>${payload.carYear} ${payload.carMake} ${payload.carModel}</strong>.</p>
          <p><strong>Renter:</strong> ${payload.renterName} (${payload.renterPhone})</p>
          <p><strong>Dates:</strong> ${dates}</p>
          <p><strong>Total:</strong> ${total}</p>
          <p><a href="${appUrl}/owner/requests/${payload.bookingId}" style="background: #E8772E; color: white; padding: 12px 24px; border-radius: 20px; text-decoration: none; font-weight: bold;">View & Confirm Request</a></p>
        </div>
      `;
      await sendEmailWithSmtp(payload.ownerEmail, subject, html);
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
    if (isTelegramConfigured()) {
      await sendStatusUpdateTelegramAlert(payload);
    }
  }
}

export const notificationService = new NotificationService();
