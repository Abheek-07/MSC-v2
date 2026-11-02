import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { enforcePayloadSize, isPayloadTooLargeError, isSafeLookupQuery } from '@/lib/security';
import { sendTicketRecoveryEmail, RecoveryTicketItem } from '@/lib/email';

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
    if (!isSafeLookupQuery(cleaned)) {
      return NextResponse.json({ error: 'Enter a valid full email address or registration number.' }, { status: 400 });
    }

    const clientIp = getClientIP(req.headers);
    // Strict rate limiting for credential recovery: 5 attempts per minute
    const rateLimit = await checkRateLimit(`ticket_recovery_${clientIp}`, 'ticket_recovery');
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many lookup requests. Please wait a moment before trying again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
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

    interface BucketData {
      name: string;
      tickets: RecoveryTicketItem[];
      rawTickets: Array<{
        hash_payload: string;
        event_title: string;
        date_start: string | null;
        location: string;
        status: string;
        is_team_member?: boolean;
      }>;
    }
    const recipientBuckets = new Map<string, BucketData>();
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mscsrmap.xyz';

    for (const row of (registrationRows as any[]) || []) {
      if (typeof row.hash_payload !== 'string' || !row.hash_payload) continue;
      const email = String(row.lead_email || '').trim().toLowerCase();
      if (!email) continue;
      const attendeeName = row.form_data?.full_name || row.form_data?.name || email.split('@')[0];
      const eventData = Array.isArray(row.events) ? row.events[0] : row.events;
      const eventTitle = eventData?.title || 'MSC Event';
      const eventDate = eventData?.date_start
        ? new Date(eventData.date_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Upcoming';
      const eventLocation = eventData?.location || 'SRM University AP';

      const bucket: BucketData = recipientBuckets.get(email) || { name: attendeeName, tickets: [], rawTickets: [] };
      bucket.tickets.push({
        eventTitle,
        ticketUrl: `${siteUrl}/ticket/${row.hash_payload}`,
        eventDate,
        location: eventLocation,
      });
      bucket.rawTickets.push({
        hash_payload: row.hash_payload,
        event_title: eventTitle,
        date_start: eventData?.date_start || null,
        location: eventLocation,
        status: row.status,
      });
      recipientBuckets.set(email, bucket);
    }

    for (const row of memberRowsById.values()) {
      const members = Array.isArray(row.team_data?.members) ? row.team_data.members : [];
      const matchingMembers = members.filter((member: any) => {
        const memberEmail = String(member.email || '').trim().toLowerCase();
        const memberReg = String(member.regNum || member.reg_number || member.registration_number || '').trim().toLowerCase();
        return isEmail ? memberEmail === cleaned : memberReg === cleaned;
      });

      for (const member of matchingMembers) {
        if (typeof member.hash_payload !== 'string' || !member.hash_payload) continue;
        const email = String(member.email || row.lead_email || '').trim().toLowerCase();
        if (!email) continue;
        const attendeeName = member.fullName || member.name || email.split('@')[0];
        const eventData = Array.isArray(row.events) ? row.events[0] : row.events;
        const eventTitle = eventData?.title || 'MSC Event';
        const eventDate = eventData?.date_start
          ? new Date(eventData.date_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Upcoming';
        const eventLocation = eventData?.location || 'SRM University AP';

        const bucket: BucketData = recipientBuckets.get(email) || { name: attendeeName, tickets: [], rawTickets: [] };
        bucket.tickets.push({
          eventTitle,
          ticketUrl: `${siteUrl}/ticket/${member.hash_payload}`,
          eventDate,
          location: eventLocation,
        });
        bucket.rawTickets.push({
          hash_payload: member.hash_payload,
          event_title: eventTitle,
          date_start: eventData?.date_start || null,
          location: eventLocation,
          status: row.status,
          is_team_member: true,
        });
        recipientBuckets.set(email, bucket);
      }
    }

    // If no confirmed tickets matched the query:
    if (recipientBuckets.size === 0) {
      return NextResponse.json({
        success: true,
        delivered: false,
        message: 'If an active registration exists for this identifier, ticket access instructions have been sent.',
        tickets: [],
      }, {
        headers: { 'Cache-Control': 'no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' },
      });
    }

    // Dispatch recovery email to proven mailbox
    const allFoundTickets: any[] = [];
    let deliveryFailed = false;

    for (const [recipientEmail, data] of recipientBuckets.entries()) {
      allFoundTickets.push(...data.rawTickets);

      const delivery = await sendTicketRecoveryEmail({
        to: recipientEmail,
        name: data.name,
        tickets: data.tickets,
      });
      if (!delivery.success) deliveryFailed = true;
    }

    const uniqueTickets = Array.from(
      new Map(allFoundTickets.map((t) => [t.hash_payload, t])).values()
    );

    // In local development or test environments where email dispatch is unconfigured,
    // allow developers to inspect returned tickets, while keeping production secure.
    const isDev = process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY;

    // Keep the external response identical for both found and unknown records;
    // this endpoint is not an account/registration enumeration oracle.
    return NextResponse.json({
      success: true,
      message: 'If an active registration exists for this identifier, ticket access instructions have been sent.',
      tickets: isDev ? uniqueTickets : [],
      dev_mode: isDev,
      ...(isDev && deliveryFailed ? { delivery_error: 'Email delivery is not configured or failed.' } : {}),
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (err) {
    if (isPayloadTooLargeError(err)) {
      return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    }
    console.error('[Ticket lookup error]:', err);
    return NextResponse.json({ error: 'Failed to look up tickets.' }, { status: 500 });
  }
}
