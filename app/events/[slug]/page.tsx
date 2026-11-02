import React from 'react';
import { notFound } from 'next/navigation';
import { FALLBACK_EVENTS, EventItem } from '@/lib/data/mock-fallback';
import { getAdminClient } from '@/lib/supabase/admin';
import EventDetailClient from './EventDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface EventPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string; invite?: string; tab?: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mscsrmap.xyz';

async function getEventBySlug(slug: string): Promise<EventItem | null> {
  try {
    const supabase = getAdminClient();
    // The events.id column is UUID. Comparing a normal slug (for example,
    // "msc") against it makes PostgreSQL reject the entire OR filter.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let filter = isUuid
      ? `slug.eq.${slug},id.eq.${slug}`
      : `slug.eq.${slug}`;

    if (slug === 'synora' || slug === 'synora-2026' || slug === 'synora-pitstop') {
      filter += ',slug.eq.synora-26';
    }

    const queryPromise = supabase
      .from('events')
      .select('*')
      .or(filter)
      .eq('is_published', true)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error('Event detail fetch timeout')), 6000)
    );

    const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any;
    if (!error) return data ? (data as EventItem) : null;
  } catch {
    return (
      FALLBACK_EVENTS.find(
        (event) =>
          event.is_published &&
          (event.slug === slug ||
            event.id === slug ||
            (slug === 'synora' && event.slug === 'synora-26'))
      ) || null
    );
  }

  return null;
}

export async function generateMetadata({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return {
      title: 'Event not found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${event.title} | Microsoft Student Community SRM AP`;
  const plainDescription = (event.description || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
  const description = plainDescription.slice(0, 160) ||
    `Event details, schedule, and registration information for ${event.title} at SRM University-AP.`;
  const canonicalPath = `/events/${event.slug}`;
  const image = event.banner_url || event.image_url || '/hero_bg.png';

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: 'article',
      images: [{ url: image, width: 1200, height: 630, alt: event.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function EventDetailPage({ params, searchParams }: EventPageProps) {
  const { slug } = await params;
  const { view, invite, tab } = await searchParams;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  if ((slug === 'synora' || slug === 'synora-pitstop') && view !== 'portal') {
    return (
      <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            zIndex: 100,
            background: 'rgba(10, 10, 12, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm, 4px)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <span style={{ fontSize: '12px', color: '#ffb900', fontWeight: 600 }}>FLAGSHIP MICROSITE</span>
          <a
            href={`/events/${slug}?view=portal`}
            style={{
              fontSize: '12px',
              color: '#ffffff',
              background: '#e10600',
              padding: '5px 12px',
              borderRadius: '2px',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'background 0.2s ease',
            }}
          >
            Switch to Standard Portal Tab View &rarr;
          </a>
        </div>
        <iframe
          src="/custom-events/synora-pitstop-01/index.html"
          title="SYNORA Flagship Microsite"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    );
  }

  const now = Date.now();
  const endTime = event.date_end ? new Date(event.date_end).getTime() : Number.NaN;
  const isCompleted =
    event.status === 'completed' || (Number.isFinite(endTime) && endTime < now);

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    url: `${BASE_URL}/events/${event.slug}`,
    image: [event.banner_url || event.image_url || `${BASE_URL}/hero_bg.png`],
    startDate: event.date_start,
    ...(event.date_end ? { endDate: event.date_end } : {}),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: isCompleted
      ? 'https://schema.org/EventCompleted'
      : 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Neerukonda',
        addressRegion: 'Andhra Pradesh',
        postalCode: '522240',
        addressCountry: 'IN',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Microsoft Student Community SRM AP',
      url: BASE_URL,
      logo: 'https://lkbwunzswqbnoygxtilm.supabase.co/storage/v1/object/public/webpage/MSC%20Logo.png',
    },
    ...(event.registration_open && !isCompleted
      ? {
          offers: {
            '@type': 'Offer',
            url: `${BASE_URL}/events/${event.slug}`,
            price: Number(event.form_requirements?.registration_fee || 0),
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <EventDetailClient event={event} initialInvite={invite} initialTab={tab} />
    </>
  );
}
