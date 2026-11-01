import { NextResponse } from 'next/server';
import { safeEqual } from '@/lib/security';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || cronSecret.length < 32) {
      console.error('[Cron keepalive] CRON_SECRET is missing or too short.');
      return NextResponse.json({ error: 'Cron job is not configured.' }, { status: 503 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!safeEqual(token, cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized cron caller.' }, { status: 401 });
    }

    const { error } = await getAdminClient().from('events').select('id').limit(1);
    if (error) {
      console.error('[Cron keepalive] Database check failed:', error.message);
      return NextResponse.json({ error: 'Database health check failed.' }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      job: 'keepalive',
      database: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron keepalive error]:', err);
    return NextResponse.json({ error: 'Cron job failed.' }, { status: 500 });
  }
}
