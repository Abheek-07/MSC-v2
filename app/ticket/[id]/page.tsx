import React from 'react';
import TicketClient from './TicketClient';
import { getAdminClient } from '@/lib/supabase/admin';

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
    const { data: reg, error } = await supabase
      .from('registrations')
      .select('*, events(title, date_start, location)')
      .or(`hash_payload.eq.${id},id.eq.${id}`)
      .maybeSingle();

    if (!error && reg) {
      const ticketData = {
        hash_payload: reg.hash_payload || reg.id,
        event_id: reg.event_id,
        event_title: reg.events?.title || 'SYNORA',
        event_date: reg.events?.date_start || new Date().toISOString(),
        event_location: reg.events?.location || 'SRM University AP',
        lead_name: reg.form_data?.full_name || reg.form_data?.name || reg.lead_email.split('@')[0],
        lead_email: reg.lead_email,
        status: reg.status,
        checked_in: Boolean(reg.checked_in),
        team_data: reg.team_data,
      };

      return <TicketClient ticket={ticketData} invalid={false} />;
    }
  } catch (err) {
    console.error('Ticket lookup error:', err);
  }

  return <TicketClient invalid={true} />;
}
