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
    if (cleaned.length < 5 || cleaned.length > 254 || !/^[a-z0-9@._ -]+$/.test(cleaned)) {
      return NextResponse.json({ error: 'Enter a valid full email address or registration number.' }, { status: 400 });
    }

    const clientIp = getClientIP(req.headers);
    const rateLimit = await checkRateLimit(`ticket_lookup_${clientIp}`, 'api');
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many search requests. Please wait a moment.' }, { status: 429 });
    }

    const supabase = getAdminClient();
    const isEmail = cleaned.includes('@');
    const filter = isEmail
      ? `lead_email.eq.${cleaned}`
      : [
          `form_data->>registration_number.eq.${cleaned}`,
          `form_data->>reg_num.eq.${cleaned}`,
          `form_data->>ticket_id.eq.${cleaned}`,
        ].join(',');

    const { data: registrationRows, error } = await supabase
      .from('registrations')
      .select('id, hash_payload, lead_email, form_data, team_data, status, events(title, date_start, location)')
      .or(filter)
      .eq('status', 'confirmed')
      .limit(20);

    if (error) {
      console.error('[Ticket lookup DB error]:', error.message);
      return NextResponse.json({ error: 'Ticket lookup is temporarily unavailable.' }, { status: 503 });
    }

    // Team members have independent QR tokens embedded in their parent registration.
    // Query only JSON rows containing the exact supplied identifier, then verify it
    // again in application code before returning a token.
    const memberRowsById = new Map<string, any>();
    const memberQueries = isEmail
      ? [{ members: [{ email: cleaned }] }]
      : [
          { members: [{ regNum: cleaned }] },
          { members: [{ reg_number: cleaned }] },
          { members: [{ registration_number: cleaned }] },
        ];

    for (const memberQuery of memberQueries) {
      const { data: rows, error: memberError } = await supabase
        .from('registrations')
        .select('id, lead_email, team_data, status, events(title, date_start, location)')
        .contains('team_data', memberQuery)
        .eq('status', 'confirmed')
        .limit(20);

      if (memberError) {
        console.error('[Team ticket lookup DB error]:', memberError.message);
        return NextResponse.json({ error: 'Ticket lookup is temporarily unavailable.' }, { status: 503 });
      }
      for (const row of rows || []) memberRowsById.set(row.id, row);
    }

    const tickets = (registrationRows || [])
      .filter((row: any) => typeof row.hash_payload === 'string' && row.hash_payload.length > 0)
      .map((row: any) => ({
        hash_payload: row.hash_payload,
        event_title: row.events?.title || 'MSC Event',
        date_start: row.events?.date_start || null,
        location: row.events?.location || 'SRM University AP',
        status: row.status,
      }));

    for (const row of memberRowsById.values()) {
      const members = Array.isArray(row.team_data?.members) ? row.team_data.members : [];
      const matchingMembers = members.filter((member: any) => {
        const memberEmail = String(member.email || '').trim().toLowerCase();
        const memberReg = String(member.regNum || member.reg_number || member.registration_number || '').trim().toLowerCase();
        return isEmail ? memberEmail === cleaned : memberReg === cleaned;
      });

      for (const member of matchingMembers) {
        if (typeof member.hash_payload !== 'string' || !member.hash_payload) continue;
        tickets.push({
          hash_payload: member.hash_payload,
          event_title: row.events?.title || 'MSC Event',
          date_start: row.events?.date_start || null,
          location: row.events?.location || 'SRM University AP',
          status: row.status,
        });
      }
    }

    const uniqueTickets = Array.from(
      new Map(tickets.map((ticket) => [ticket.hash_payload, ticket])).values()
    );

    return NextResponse.json({ success: true, tickets: uniqueTickets }, {
      headers: { 'Cache-Control': 'no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (err) {
    console.error('[Ticket lookup error]:', err);
    return NextResponse.json({ error: 'Failed to look up tickets.' }, { status: 500 });
  }
}
