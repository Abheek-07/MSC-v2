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
    let expiredCount = 0;

    try {
      const { data } = await supabase.rpc('expire_payment_reservations');
      if (typeof data === 'number') expiredCount = data;
    } catch (err) {
      console.warn('[Cron expire-reservations]: Database offline/mock:', err);
    }

    return NextResponse.json({
      success: true,
      job: 'expire-reservations',
      released_reservations: expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
