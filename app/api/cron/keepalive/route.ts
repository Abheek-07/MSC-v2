import { NextResponse } from 'next/server';
import { safeEqual } from '@/lib/security';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const cronSecret = process.env.CRON_SECRET || 'super_secret_cron_bearer_key_32chars';

    if (!safeEqual(token, cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized cron caller' }, { status: 401 });
    }

    const supabase = getAdminClient();
    let dbStatus = 'ok';

    try {
      // Lightweight select to keep database active
      await supabase.from('events').select('id').limit(1);
    } catch {
      dbStatus = 'simulated';
    }

    return NextResponse.json({
      success: true,
      job: 'keepalive',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
