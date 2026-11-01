import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { isValidUUID } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    if (!isValidUUID(token)) return NextResponse.json({ valid: false, status: 'invalid' }, { status: 404 });
    const ip = getClientIP(req.headers);
    const limit = await checkRateLimit(`ticket_verify_${ip}`, 'api');
    if (!limit.success) return NextResponse.json({ error: 'Too many verification requests.' }, { status: 429 });

    const db = getAdminClient();
    const { data: revoked, error: revokeError } = await db.from('ticket_token_revocations')
      .select('id').eq('token', token).maybeSingle();
    if (revokeError) throw revokeError;
    if (revoked) return NextResponse.json({ valid: false, status: 'revoked' }, { headers: { 'Cache-Control': 'no-store' } });

    const { data: root, error: rootError } = await db.from('registrations')
      .select('id,status,hash_payload,form_data,lead_email,team_data,events(title)')
      .eq('hash_payload', token).maybeSingle();
    if (rootError) throw rootError;
    if (root) {
      return NextResponse.json({
        valid: root.status === 'confirmed',
        status: root.status === 'confirmed' ? 'valid' : 'invalid',
        attendee: root.form_data?.full_name || root.form_data?.name || root.lead_email,
        event: root.events?.title || 'MSC Event',
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const { data: members, error: memberError } = await db.from('registrations')
      .select('id,status,lead_email,team_data,events(title)')
      .contains('team_data', { members: [{ hash_payload: token }] }).limit(2);
    if (memberError) throw memberError;
    const matches = (members || []).flatMap((row: any) => (row.team_data?.members || [])
      .filter((member: any) => member.hash_payload === token)
      .map((member: any) => ({ row, member })));
    if (matches.length !== 1) return NextResponse.json({ valid: false, status: 'invalid' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    const { row, member } = matches[0];
    const valid = row.status === 'confirmed';
    return NextResponse.json({
      valid,
      status: valid ? 'valid' : 'invalid',
      attendee: member.fullName || member.name || 'Team member',
      event: row.events?.title || 'MSC Event',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Ticket verification]', error);
    return NextResponse.json({ valid: false, status: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
