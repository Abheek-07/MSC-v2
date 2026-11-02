import React from 'react';
import TicketClient from './TicketClient';
import { getAdminClient } from '@/lib/supabase/admin';
import { isValidUUID } from '@/lib/security';
import { createSafeTeamOverview } from '@/lib/ticket-presentation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;

  if (!id) {
    return <TicketClient invalid={true} />;
  }

  try {
    const supabase = getAdminClient();
    const { data: revokedToken, error: revokedError } = await supabase
      .from('ticket_token_revocations').select('id').eq('token', id).maybeSingle();
    if (revokedError) throw revokedError;
    if (revokedToken) return <TicketClient invalid={true} />;
    // Bearer token verification: tickets can only be accessed with a valid secret UUID token.
    // Unauthenticated partial string matches and ILIKE wildcard searches are prohibited to prevent PII leakage.
    if (!isValidUUID(id)) {
      return <TicketClient invalid={true} />;
    }

    let reg: any = null;
    let matchedMember: any = null;

    // 1. Check primary registration by secret hash_payload
    const { data: primaryData, error: primaryError } = await supabase
      .from('registrations')
      .select('*, events(title, date_start, location)')
      .eq('hash_payload', id)
      .maybeSingle();

    if (primaryError) throw primaryError;
    reg = primaryData;

    // 2. If not found in primary registrations, search embedded team member QR tokens
    if (!reg) {
      const { data: memberRows, error: memberError } = await supabase
        .from('registrations')
        .select('*, events(title, date_start, location)')
        .contains('team_data', { members: [{ hash_payload: id }] })
        .limit(2);

      if (memberError) throw memberError;

      const matches = (memberRows || []).flatMap((row: any) =>
        (row.team_data?.members || [])
          .map((member: any) => ({ row, member }))
          .filter((entry: any) => entry.member.hash_payload === id)
      );

      if (matches.length === 1) {
        reg = matches[0].row;
        matchedMember = matches[0].member;
      }
    }

    if (reg) {
      // A bearer ticket authorizes one attendee only. The overview below is
      // deliberately credential-free and contains no sibling contact details.
      const teamMembers = createSafeTeamOverview(reg.id, reg.team_data?.members);
      const rawTeam = reg.team_data?.team_name?.trim();
      const isTeam = rawTeam && !['individual', 'solo', '-', 'n/a', 'none'].includes(rawTeam.toLowerCase());

      const attendee = matchedMember || {
        fullName: reg.form_data?.full_name || reg.form_data?.name || reg.lead_email.split('@')[0],
        email: reg.lead_email,
        regNum: reg.form_data?.registration_number || reg.form_data?.reg_num || 'N/A',
        branch: reg.form_data?.branch || 'N/A',
        college: reg.form_data?.college || 'SRM University-AP',
        role: reg.form_data?.role || reg.team_data?.role || 'Delegate',
        checked_in: Boolean(reg.checked_in),
      };

      const ticketData = {
        // Always retain the presented token; a member URL must never become a
        // parent registration credential.
        hash_payload: id,
        event_id: reg.event_id,
        event_title: reg.events?.title || 'SYNORA',
        event_date: reg.events?.date_start || new Date().toISOString(),
        event_location: reg.events?.location || 'SRM University AP',
        lead_name: attendee.fullName || attendee.name || 'Attendee',
        lead_email: attendee.email || reg.lead_email,
        reg_number: attendee.regNum || attendee.reg_number || attendee.registration_number || 'N/A',
        branch: attendee.branch || 'N/A',
        college: attendee.college || reg.form_data?.college || 'SRM University-AP',
        role: attendee.role || 'Delegate',
        status: reg.status,
        checked_in: Boolean(attendee.checked_in),
        team_data: isTeam
          ? {
              team_name: rawTeam,
              members: teamMembers,
            }
          : null,
      };

      return <TicketClient ticket={ticketData} invalid={false} />;
    }
  } catch (err) {
    console.error('Ticket lookup error:', err);
  }

  return <TicketClient invalid={true} />;
}
