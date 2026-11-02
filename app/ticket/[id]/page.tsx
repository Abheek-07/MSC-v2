import React from 'react';
import TicketClient from './TicketClient';
import { getAdminClient } from '@/lib/supabase/admin';
import { isValidUUID } from '@/lib/security';

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
    let matchedMemberIndex: number | undefined = undefined;

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
          .map((member: any, index: number) => ({ row, member, index }))
          .filter((entry: any) => entry.member.hash_payload === id)
      );

      if (matches.length === 1) {
        reg = matches[0].row;
        matchedMemberIndex = matches[0].index;
      }
    }

    if (reg) {
      let teamMembers = (reg.team_data?.members || []).map((member: any, index: number) => ({
        ...member,
        id: member.id || `${reg.id}-m-${index}`,
        fullName: member.fullName || member.name || 'Team member',
        email: member.email || '',
        regNum: member.regNum || member.reg_number || member.registration_number || '',
        checked_in: Boolean(member.checked_in),
      }));
      const rawTeam = reg.team_data?.team_name?.trim();
      const isTeam = rawTeam && !['individual', 'solo', '-', 'n/a', 'none'].includes(rawTeam.toLowerCase());

      // If team members are not embedded, look up all sibling records sharing team_id or team_name
      if (isTeam && teamMembers.length === 0) {
        const teamId = reg.team_data?.team_id;
        let tQuery = supabase
          .from('registrations')
          .select('id, hash_payload, lead_email, form_data, team_data, checked_in')
          .eq('event_id', reg.event_id);

        if (teamId) {
          tQuery = tQuery.filter('team_data->>team_id', 'eq', teamId);
        } else {
          tQuery = tQuery.filter('team_data->>team_name', 'eq', rawTeam);
        }

        const { data: siblingRows } = await tQuery;
        if (siblingRows && siblingRows.length > 0) {
          teamMembers = siblingRows.map((s: any, idx: number) => {
            const sReg = s.form_data?.registration_number || s.form_data?.reg_num || 'N/A';
            if (
              matchedMemberIndex === undefined &&
              (s.id === reg.id || s.hash_payload === id)
            ) {
              matchedMemberIndex = idx;
            }
            return {
              id: s.id,
              hash_payload: s.hash_payload,
              fullName: s.form_data?.full_name || s.form_data?.name || s.lead_email.split('@')[0],
              email: s.lead_email,
              regNum: sReg,
              branch: s.form_data?.branch || 'N/A',
              role: s.form_data?.role || s.team_data?.role || 'Member',
              checked_in: Boolean(s.checked_in),
            };
          });
        }
      }

      const ticketData = {
        hash_payload: reg.hash_payload || reg.id,
        event_id: reg.event_id,
        event_title: reg.events?.title || 'SYNORA',
        event_date: reg.events?.date_start || new Date().toISOString(),
        event_location: reg.events?.location || 'SRM University AP',
        lead_name: reg.form_data?.full_name || reg.form_data?.name || reg.lead_email.split('@')[0],
        lead_email: reg.lead_email,
        reg_number: reg.form_data?.registration_number || reg.form_data?.reg_num || 'N/A',
        branch: reg.form_data?.branch || 'N/A',
        college: reg.form_data?.college || 'SRM University-AP',
        role: reg.form_data?.role || reg.team_data?.role || 'Delegate',
        status: reg.status,
        checked_in: Boolean(reg.checked_in),
        team_data: isTeam
          ? {
              ...reg.team_data,
              team_name: rawTeam,
              members: teamMembers,
            }
          : null,
      };

      return (
        <TicketClient
          ticket={ticketData}
          invalid={false}
          initialMatchedIndex={matchedMemberIndex}
        />
      );
    }
  } catch (err) {
    console.error('Ticket lookup error:', err);
  }

  return <TicketClient invalid={true} />;
}
