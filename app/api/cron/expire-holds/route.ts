import { NextRequest, NextResponse } from 'next/server';
import { expireStaleHolds } from '@/lib/availability/query';

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  // Verify secret if set
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
  }

  try {
    const expiredCount = await expireStaleHolds();
    return NextResponse.json({
      success: true,
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[cron/expire-holds error]', error);
    return NextResponse.json({ error: 'Failed to expire stale holds', message: error?.message }, { status: 500 });
  }
}
