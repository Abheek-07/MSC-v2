import React from 'react';
import { notFound } from 'next/navigation';
import { FALLBACK_EVENTS } from '@/lib/data/mock-fallback';
import EventDetailClient from './EventDetailClient';

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventPageProps) {
  const { slug } = await params;
  const event = FALLBACK_EVENTS.find((e) => e.slug === slug);
  if (!event) return { title: 'Event Not Found' };

  return {
    title: `${event.title} — Microsoft Student Community | SRM AP`,
    description: event.description,
  };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = FALLBACK_EVENTS.find((e) => e.slug === slug);

  if (!event) {
    notFound();
  }

  return <EventDetailClient event={event} />;
}
