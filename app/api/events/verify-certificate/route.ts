import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { enforcePayloadSize, isValidUUID } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const raw = await enforcePayloadSize(req, 8192);
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw); } catch {
      return NextResponse.json({ success: false, verified: false, error: 'Invalid request body.' }, { status: 400 });
    }
    const eventKey = typeof body.eventId === 'string' ? body.eventId.trim() : typeof body.slug === 'string' ? body.slug.trim() : '';
    const value = body.query ?? body.email ?? body.name;
    const query = typeof value === 'string' ? value.trim().toLowerCase() : '';
    const limited = await checkRateLimit('cert_verify_' + getClientIP(req.headers), 'api');
    if (!limited.success) return NextResponse.json({ success: false, verified: false, error: 'Too many attempts. Try again later.' }, { status: 429 });
    if (!eventKey || eventKey.length > 100 || !/^[a-zA-Z0-9-]+$/.test(eventKey)) return NextResponse.json({ success: false, verified: false, error: 'A valid event identifier is required.' }, { status: 400 });
    if (query.length < 5 || query.length > 254 || !/^[a-z0-9@._ -]+$/.test(query)) return NextResponse.json({ success: false, verified: false, error: 'Enter the exact registered email, registration number, or ticket ID.' }, { status: 400 });

    const db = getAdminClient();
    const base = db.from('events').select('id,title,date_start,form_requirements,certificate_html').limit(1);
    const { data: event, error: eventError } = isValidUUID(eventKey) ? await base.eq('id', eventKey).maybeSingle() : await base.eq('slug', eventKey).maybeSingle();
    if (eventError) throw eventError;
    if (!event) return NextResponse.json({ success: false, verified: false, error: 'Event not found.' }, { status: 404 });
    if (!event.form_requirements?.provide_certificates) return NextResponse.json({ success: false, verified: false, error: 'Certificates are not issued for this event.' }, { status: 400 });

    const fields = query.includes('@')
      ? [['lead_email', query]]
      : [['form_data->>registration_number', query], ['form_data->>reg_num', query], ['form_data->>ticket_id', query], ['hash_payload', query]];
    let reg: any = null;
    for (const [field, val] of fields) {
      const result = await db.from('registrations').select('id,hash_payload,lead_email,form_data,team_data,checked_in,status')
        .eq('event_id', event.id).eq(field, val).eq('status', 'confirmed').limit(1).maybeSingle();
      if (result.error) throw result.error;
      if (result.data) { reg = result.data; break; }
    }
    if (!reg) return NextResponse.json({ success: false, verified: false, error: 'No matching confirmed registration was found. Enter an exact identifier.' }, { status: 404 });
    if (!reg.checked_in) return NextResponse.json({ success: false, verified: false, error: 'Attendance has not been recorded for this registration.' }, { status: 403 });

    const emailParts = String(reg.lead_email).split('@');
    const maskedEmail = emailParts.length === 2 ? emailParts[0].slice(0, 1) + '***@' + emailParts[1] : '';
    const name = reg.form_data?.full_name || reg.form_data?.name || emailParts[0];
    const eventDate = event.date_start ? new Date(event.date_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
    return NextResponse.json({
      success: true, verified: true,
      participant: {
        name: String(name).toUpperCase(), email: maskedEmail,
        registration_number: reg.form_data?.registration_number || reg.form_data?.reg_num || 'N/A',
        college: reg.form_data?.college || reg.form_data?.college_name || 'SRM University-AP',
        ticket_id: reg.form_data?.ticket_id || reg.hash_payload?.slice(0, 8) || reg.id.slice(0, 8),
        role: reg.form_data?.role || (reg.team_data?.team_name ? 'Team Member' : 'Solo Participant'),
        team_name: reg.team_data?.team_name || 'Individual', checked_in: true, status: reg.status,
        event_title: event.title, event_date: eventDate,
        issued_date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      },
      certificate_html: event.certificate_html || null
    });
  } catch (error) {
    console.error('[Verify Certificate Error]:', error);
    return NextResponse.json({ success: false, verified: false, error: 'Certificate verification is temporarily unavailable.' }, { status: 503 });
  }
}
