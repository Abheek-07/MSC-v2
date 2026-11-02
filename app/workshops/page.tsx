import type { Metadata } from 'next';
import Link from 'next/link';
import { FALLBACK_EVENTS, type EventItem } from '@/lib/data/mock-fallback';
import { getAdminClient } from '@/lib/supabase/admin';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mscsrmap.xyz';

export const metadata: Metadata = {
  title: 'Technology Workshops',
  description: 'Find hands-on technology workshops at Microsoft Student Community, SRM University-AP. Explore practical sessions in AI, cloud, software development, and emerging technologies.',
  alternates: { canonical: '/workshops' },
  openGraph: {
    title: 'Technology Workshops | Microsoft Student Community | SRM University-AP',
    description: 'Find hands-on technology workshops at Microsoft Student Community, SRM University-AP. Explore practical sessions in AI, cloud, software development, and emerging technologies.',
    url: '/workshops',
    type: 'website',
  },
};

function cleanDescription(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function getEvents(): Promise<EventItem[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .ilike('type', 'Workshop')
      .order('date_start', { ascending: false });

    if (!error && data) return data as EventItem[];
  } catch {
    // Fall through to the local catalog when Supabase is unavailable.
  }

  return FALLBACK_EVENTS.filter(
    (event) => event.is_published && event.type.toLowerCase() === 'workshop'
  );
}

export default async function WorkshopPage() {
  const events = await getEvents();
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Technology Workshops at Microsoft Student Community, SRM University-AP',
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${BASE_URL}/events/${encodeURIComponent(event.slug)}`,
      name: event.title,
    })),
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '56px 0 88px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <div className="container">
        <nav aria-label="Breadcrumb" style={{ fontSize: '13px', marginBottom: '24px', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'inherit' }}>Home</Link>
          {' / '}
          <Link href="/events" style={{ color: 'inherit' }}>Events</Link>
          {' / '}
          <span aria-current="page">Technology Workshops</span>
        </nav>

        <header style={{ maxWidth: '820px', marginBottom: '36px' }}>
          <p style={{ color: 'var(--brand)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Microsoft Student Community · SRM University-AP
          </p>
          <h1 style={{ color: 'var(--text-strong)', fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.12, margin: '10px 0 16px' }}>
            Technology Workshops
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.75 }}>
            Find hands-on technology workshops hosted by Microsoft Student Community at SRM University-AP. Explore practical learning sessions, technical topics, schedules, venues, and participation details.
          </p>
        </header>

        <section aria-labelledby="why-join" style={{ marginBottom: '40px' }}>
          <h2 id="why-join" style={{ color: 'var(--text-strong)', fontSize: '22px', marginBottom: '12px' }}>
            What to expect
          </h2>
          <p style={{ color: 'var(--text-body)', lineHeight: 1.75 }}>
            MSC workshops focus on practical learning across software development, cloud platforms, artificial intelligence, data, and emerging technologies. Each event listing provides the available topic, schedule, venue, and registration information.
          </p>
        </section>

        <section aria-labelledby="events-heading">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <h2 id="events-heading" style={{ color: 'var(--text-strong)', fontSize: '22px', margin: 0 }}>
              Workshop events
            </h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{events.length} published {events.length === 1 ? 'event' : 'events'}</span>
          </div>

          {events.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '18px' }}>
              {events.map((event) => {
                const summary = cleanDescription(event.description);
                return (
                  <article key={event.id} className="fluent-card" style={{ overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: '4px' }}>
                    {(event.banner_url || event.image_url) && (
                      <img
                        src={event.banner_url || event.image_url}
                        alt={`${event.title} hosted by Microsoft Student Community at SRM University-AP`}
                        loading="lazy"
                        style={{ display: 'block', width: '100%', height: '190px', objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ padding: '18px' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '0 0 8px' }}>
                        {new Date(event.date_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{event.location}
                      </p>
                      <h3 style={{ color: 'var(--text-strong)', fontSize: '18px', margin: '0 0 8px' }}>{event.title}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.65, margin: '0 0 16px' }}>
                        {summary.slice(0, 220)}{summary.length > 220 ? '…' : ''}
                      </p>
                      <Link href={`/events/${event.slug}`} style={{ color: 'var(--brand)', fontWeight: 600, fontSize: '14px' }}>
                        View event details →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              No {category.toLowerCase()} events are published right now. Check the full events page for the latest MSC activities.
            </p>
          )}
        </section>

        <p style={{ marginTop: '36px', fontSize: '14px' }}>
          <Link href="/events" style={{ color: 'var(--brand)', fontWeight: 600 }}>Browse all MSC events →</Link>
        </p>
      </div>
    </div>
  );
}
