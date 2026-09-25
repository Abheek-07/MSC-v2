import React from 'react';
import { FALLBACK_EVENTS } from '@/lib/data/mock-fallback';
import EventsClient from './EventsClient';

export const metadata = {
  title: 'Events Directory — Microsoft Student Community | SRM University AP',
  description:
    'Explore hackathons, workshops, bootcamps, and technical conferences hosted by Microsoft Student Community at SRM University AP.',
};

export default async function EventsPage() {
  return <EventsClient events={FALLBACK_EVENTS} />;
}
