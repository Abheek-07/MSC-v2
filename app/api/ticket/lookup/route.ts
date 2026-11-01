import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { enforcePayloadSize } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rawBody = await enforcePayloadSize(req, 8 * 1024);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const rawQuery = body.query ?? body.email;
    if (typeof rawQuery !== 'string') {
      return NextResponse.json({ error: 'Enter your registered email or college registration number.' }, { status: 400 });
    }

    const cleaned = rawQuery.trim().toLowerCase();
    // Exact identifiers only. Reject PostgREST filter syntax and partial-name searches.
    if (cleaned.length < 5 || cleaned.length > 254 || !/^[a-z0-9@._ -]+$/.test(cleaned)) {
      return NextResponse.json({ error: 'Enter a valid full email address or registration number.' }, { status: 400 });
    }

    const clientIp = getClientIP(req.headers);
    const rateLimit = await checkRateLimit(`ticket_lookup_${clientIp}`, 'api');
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many search requests. Please wait a moment.' }, { status: 429 });
    }

    const filter = cleaned.includes('@')
      ? `lead_email.eq.${cleaned}`
      : [
          `form_data->>registration_number.eq.${cleaned}`,
          `form_data->>reg_num.eq.${cleaned}`,
          `form_data->>ticket_id.eq.${cleaned}`,
        ].join(',');

    const { data, error } = await getAdminClient()
      .from('registrations')
      .select(`
        id,
        hash_payload,
        status,
        events (title, date_start, location)
      `)
      .or(filter)
      .eq('status', 'confirmed')
      .limit(20);

    if (error) {
      console.error('[Ticket lookup DB error]:', error.message);
      return NextResponse.json({ error: 'Ticket lookup is temporarily unavailable.' }, { status: 503 });
    }

    // Return only the fields needed to open a ticket. Do not expose lead email,
    // form data, team roster, or other participant details from this endpoint.
    const tickets = (data || [])
      .filter((row: any) => typeof row.hash_payload === 'string' && row.hash_payload.length > 0)
      .map((row: any) => ({
        hash_payload: row.hash_payload,
        event_title: row.events?.title || 'MSC Event',
        date_start: row.events?.date_start || null,
        location: row.events?.location || 'SRM University AP',
        status: row.status,
      }));

    return NextResponse.json({ success: true, tickets }, {
      headers: { 'Cache-Control': 'no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (err) {
    console.error('[Ticket lookup error]:', err);
    return NextResponse.json({ error: 'Failed to look up tickets.' }, { status: 500 });
  }
}
