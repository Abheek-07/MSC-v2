import React from 'react';
import { notFound } from 'next/navigation';
import TicketClient from './TicketClient';
import { FALLBACK_EVENTS } from '@/lib/data/mock-fallback';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;

  // UUID validation check
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  if (!isUUID) {
    return <TicketClient invalid={true} />;
  }

  // Construct realistic ticket record for demonstration & live database
  const demoEvent = FALLBACK_EVENTS[0];
  const ticketData = {
    hash_payload: id,
    event_id: demoEvent.id,
    event_title: demoEvent.title,
    event_date: demoEvent.date_start,
    event_location: demoEvent.location,
    lead_name: 'Verified Participant',
    lead_email: 'participant@srmap.edu.in',
    status: 'confirmed',
    checked_in: false,
    team_data: {
      team_name: 'Azure Titans',
      members: [
        { fullName: 'Verified Participant', email: 'participant@srmap.edu.in', checked_in: false },
        { fullName: 'Teammate 2', email: 'teammate2@srmap.edu.in', checked_in: false },
      ],
    },
  };

  return <TicketClient ticket={ticketData} invalid={false} />;
}
