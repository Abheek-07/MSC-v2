import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { isValidUUID } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIP(req.headers);
    const limit = await checkRateLimit(`promotion_preview_${clientIp}`, 'register');
    if (!limit.success) return NextResponse.json({ error: 'Too many promotion checks. Please wait and retry.' }, { status: 429 });

    const body = await req.json();
    if (!isValidUUID(body.event_id)) return NextResponse.json({ error: 'Invalid event identifier.' }, { status: 400 });
    const code = typeof body.coupon_code === 'string' ? body.coupon_code.trim().toUpperCase() : '';
    if (code && !/^[A-Z0-9_-]{3,32}$/.test(code)) {
      return NextResponse.json({ error: 'Coupon codes must contain 3–32 letters, numbers, hyphens, or underscores.' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: event, error: eventError } = await supabase
      .from('events').select('id, form_requirements').eq('id', body.event_id).maybeSingle();
    if (eventError) throw eventError;
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    const baseAmount = Number(event.form_requirements?.registration_fee);
    if (!Number.isSafeInteger(baseAmount) || baseAmount <= 0) {
      return NextResponse.json({ error: 'This event does not have a valid paid ticket price.' }, { status: 409 });
    }

    const email = typeof body.lead_email === 'string' ? body.lead_email.trim().toLowerCase() : '';
    const { data, error } = await supabase.rpc('preview_event_promotion', {
      p_event_id: body.event_id,
      p_registration_id: null,
      p_coupon_code: code,
      p_base_amount: baseAmount,
      p_lead_email: email || null,
    });
    if (error) throw error;
    if (!data?.success) return NextResponse.json({ error: data?.error || 'Offer is not available.' }, { status: 400 });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Promotion validation error]:', error);
    return NextResponse.json({ error: 'Unable to validate this offer right now.' }, { status: 500 });
  }
}
