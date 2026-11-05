import { getAdminClient } from '@/lib/supabase/admin';
import { isValidUUID } from '@/lib/security';

export interface WalletTicket {
  token: string;
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  attendeeName: string;
  attendeeEmail: string;
  registrationNumber: string;
  status: string;
}

export async function getConfirmedWalletTicket(token: string): Promise<WalletTicket | null> {
  if (!isValidUUID(token)) return null;
  const db = getAdminClient();

  const { data: revoked, error: revokedError } = await db
    .from('ticket_token_revocations').select('id').eq('token', token).maybeSingle();
  if (revokedError) throw revokedError;
  if (revoked) return null;

  const { data: root, error: rootError } = await db.from('registrations')
    .select('id,event_id,status,hash_payload,form_data,lead_email,team_data,events(title,date_start,location)')
    .eq('hash_payload', token).maybeSingle();
  if (rootError) throw rootError;

  let registration: any = root;
  let attendee: any = null;

  if (!registration) {
    const { data: rows, error } = await db.from('registrations')
      .select('id,event_id,status,lead_email,form_data,team_data,events(title,date_start,location)')
      .contains('team_data', { members: [{ hash_payload: token }] }).limit(2);
    if (error) throw error;

    const matches = (rows || []).flatMap((row: any) =>
      (row.team_data?.members || [])
        .filter((member: any) => member.hash_payload === token)
        .map((member: any) => ({ row, member }))
    );
    if (matches.length !== 1) return null;
    registration = matches[0].row;
    attendee = matches[0].member;
  }

  // Wallet passes are only issued for confirmed registrations. Pending,
  // waitlisted, cancelled and expired payment reservations are not tickets.
  if (registration.status !== 'confirmed') return null;

  const event = Array.isArray(registration.events) ? registration.events[0] : registration.events;
  const form = registration.form_data || {};
  const person = attendee || {
    fullName: form.full_name || form.name || registration.lead_email?.split('@')[0] || 'Attendee',
    email: registration.lead_email,
    regNum: form.registration_number || form.reg_num || 'N/A',
  };

  return {
    token,
    registrationId: registration.id,
    eventId: registration.event_id,
    eventTitle: event?.title || 'MSC Event',
    eventDate: event?.date_start || new Date().toISOString(),
    eventLocation: event?.location || 'SRM University-AP',
    attendeeName: person.fullName || person.name || 'Attendee',
    attendeeEmail: person.email || registration.lead_email || '',
    registrationNumber: person.regNum || person.reg_number || person.registration_number || 'N/A',
    status: registration.status,
  };
}
