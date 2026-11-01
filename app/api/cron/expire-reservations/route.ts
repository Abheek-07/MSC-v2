import { NextResponse } from 'next/server';
import { safeEqual } from '@/lib/security';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || cronSecret.length < 32) {
      console.error('[Cron expire-reservations] CRON_SECRET is missing or too short.');
      return NextResponse.json({ error: 'Cron job is not configured.' }, { status: 503 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!safeEqual(token, cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized cron caller.' }, { status: 401 });
    }

    const { data, error } = await getAdminClient().rpc('expire_payment_reservations');
    if (error) {
      console.error('[Cron expire-reservations RPC failed]:', error.message);
      return NextResponse.json({ error: 'Reservation cleanup failed.' }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      job: 'expire-reservations',
      released_reservations: typeof data === 'number' ? data : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron expire-reservations error]:', err);
    return NextResponse.json({ error: 'Cron job failed.' }, { status: 500 });
  }
}
