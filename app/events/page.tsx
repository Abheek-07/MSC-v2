import React from 'react';
import { FALLBACK_EVENTS, EventItem } from '@/lib/data/mock-fallback';
import { getAdminClient } from '@/lib/supabase/admin';
import EventsClient from './EventsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Events | Microsoft Student Community | SRM University-AP',
  description:
    'Explore hackathons, workshops, bootcamps, and technical conferences hosted by Microsoft Student Community at SRM University-AP.',
};

export default async function EventsPage() {
  let eventsList: EventItem[] = FALLBACK_EVENTS;

  try {
    const supabase = getAdminClient();
    const queryPromise = supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('date_start', { ascending: false });

    const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error('Events fetch timeout')), 6000)
    );

    const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any;

    if (!error && data && data.length > 0) {
      eventsList = data as EventItem[];
    }
  } catch {
    // Immediately uses fallback events catalog if offline or slow
  }

  return <EventsClient events={eventsList} />;
}
