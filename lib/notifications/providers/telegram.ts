import { BookingNotificationPayload, HoldExpiringNotificationPayload, StatusUpdatedNotificationPayload } from '../types';
import { formatPHP, formatDateRangePH } from '@/lib/formatters';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

export function isTelegramConfigured(): boolean {
  return Boolean(botToken && chatId);
}

export async function sendTelegramNotification(message: string): Promise<{ success: boolean; error?: any }> {
  if (!isTelegramConfigured()) {
    return { success: false, error: 'Telegram bot not configured' };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('[Telegram Notification Error]', data);
      return { success: false, error: data.description };
    }

    return { success: true };
  } catch (error) {
    console.error('[Telegram Network Error]', error);
    return { success: false, error };
  }
}

export async function sendNewBookingTelegramAlert(payload: BookingNotificationPayload) {
  const dates = formatDateRangePH(payload.startDate, payload.endDate);
  const total = formatPHP(payload.estimatedTotal);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const dest = payload.destination === 'within_cdo' ? 'Within CDO City' : 'Outside CDO (Bukidnon / Iligan / Highlands)';

  const text = `
🦊 <b>VULPI — NEW RENTAL REQUEST!</b>

🚗 <b>Vehicle:</b> ${payload.carYear} ${payload.carMake} ${payload.carModel}
👤 <b>Renter:</b> ${payload.renterName}
📞 <b>Phone:</b> <code>${payload.renterPhone}</code>
${payload.renterEmail ? `📧 <b>Email:</b> ${payload.renterEmail}\n` : ''}📅 <b>Dates:</b> ${dates}
📍 <b>Destination:</b> ${dest}
💰 <b>Estimated Total:</b> <b>${total}</b>
👤 <b>Host / Owner:</b> ${payload.ownerName}

⏳ <b>24-Hour Hold Active:</b>
Review renter details and confirm:
👉 <a href="${appUrl}/owner/requests/${payload.bookingId}">Open Booking Request</a>
`.trim();

  return await sendTelegramNotification(text);
}

export async function sendHoldExpiringTelegramAlert(payload: HoldExpiringNotificationPayload) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const text = `
⏳ <b>VULPI — 24H HOLD EXPIRING SOON!</b>

🚗 <b>Vehicle:</b> ${payload.carMake} ${payload.carModel}
👤 <b>Renter:</b> ${payload.renterName}
⏰ <b>Time Left:</b> ~${payload.hoursRemaining} hour(s) remaining before dates are released to other renters.

👉 <a href="${appUrl}/owner/requests/${payload.bookingId}">Review Request Now</a>
`.trim();

  return await sendTelegramNotification(text);
}

export async function sendStatusUpdateTelegramAlert(payload: StatusUpdatedNotificationPayload) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const icon = payload.status === 'confirmed' ? '✅' : '❌';

  const text = `
${icon} <b>VULPI — BOOKING ${payload.status.toUpperCase()}</b>

🚗 <b>Vehicle:</b> ${payload.carMake} ${payload.carModel}
👤 <b>Renter:</b> ${payload.renterName} (<code>${payload.renterPhone}</code>)
📍 <b>Pickup:</b> ${payload.pickupLocation}
${payload.ownerNote ? `📝 <b>Note:</b> ${payload.ownerNote}\n` : ''}
👉 <a href="${appUrl}/owner/requests/${payload.bookingId}">View Booking</a>
`.trim();

  return await sendTelegramNotification(text);
}
