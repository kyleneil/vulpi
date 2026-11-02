import { NextResponse } from 'next/server';
import { expireStaleHolds } from '@/lib/availability/query';

export async function GET() {
  try {
    const expiredCount = await expireStaleHolds();
    return NextResponse.json({
      success: true,
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cron/expire-holds error]', error);
    return NextResponse.json({ error: 'Failed to expire stale holds' }, { status: 500 });
  }
}
