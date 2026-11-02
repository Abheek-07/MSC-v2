import type { Metadata } from 'next';
import Link from 'next/link';
import { FALLBACK_EVENTS, type EventItem } from '@/lib/data/mock-fallback';
import { getAdminClient } from '@/lib/supabase/admin';
import { Calendar, MapPin, ArrowRight, Trophy, Users } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mscsrmap.xyz';

export const metadata: Metadata = {
  title: 'Student Hackathons',
  description: 'Explore student hackathons at Microsoft Student Community, SRM University-AP. Find team-based coding challenges, project-building events, and registration details.',
  alternates: { canonical: '/hackathons' },
  openGraph: {
    title: 'Student Hackathons | Microsoft Student Community | SRM University-AP',
    description: 'Explore student hackathons at Microsoft Student Community, SRM University-AP. Find team-based coding challenges, project-building events, and registration details.',
    url: '/hackathons',
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
      .ilike('type', 'Hackathon')
      .order('date_start', { ascending: false });

    if (!error && data) return data as EventItem[];
  } catch {
    // Fall through to the local catalog when Supabase is unavailable.
  }

  return FALLBACK_EVENTS.filter(
    (event) => event.is_published && event.type.toLowerCase() === 'hackathon'
  );
}

export default async function HackathonPage() {
  const events = await getEvents();
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Student Hackathons at Microsoft Student Community, SRM University-AP',
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
          <span aria-current="page" style={{ color: 'var(--text-strong)', fontWeight: 500 }}>Student Hackathons</span>
        </nav>

        <header style={{ maxWidth: '820px', marginBottom: '36px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--text-body)',
            }}
          >
            <Trophy size={13} color="#107c10" />
            <span>MSC &bull; COMPETITIVE HACKATHONS &bull; SRM-AP</span>
          </div>
          <h1 style={{ color: 'var(--text-strong)', fontSize: 'clamp(32px, 5vw, 44px)', lineHeight: 1.15, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Student Hackathons
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.65 }}>
            Flagship competitive hackathons, prototyping sprints, and engineering challenges hosted by Microsoft Student Community at SRM University-AP. Build in teams, ship working software, and compete with top student innovators.
          </p>
        </header>

        <section aria-labelledby="events-heading">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <h2 id="events-heading" style={{ color: 'var(--text-strong)', fontSize: '20px', fontWeight: 600, margin: 0 }}>
              Flagship hackathons
            </h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {events.length} {events.length === 1 ? 'hackathon' : 'hackathons'} listed
            </span>
          </div>

          {events.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '22px' }}>
              {events.map((event) => {
                const summary = cleanDescription(event.description);
                const isPaid = event.form_requirements?.event_pricing === 'paid';
                return (
                  <article
                    key={event.id}
                    className="fluent-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                    }}
                  >
                    {(event.banner_url || event.image_url) && (
                      <div style={{ position: 'relative', width: '100%', height: '180px', background: 'var(--bg-soft)' }}>
                        <img
                          src={event.banner_url || event.image_url}
                          alt={event.title}
                          loading="lazy"
                          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: isPaid ? 'rgba(0, 103, 184, 0.92)' : 'rgba(16, 124, 16, 0.92)',
                            color: '#ffffff',
                          }}
                        >
                          {isPaid ? `₹${event.form_requirements?.registration_fee || 0}` : 'Free Entry'}
                        </div>
                      </div>
                    )}
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '10px' }}>
                        <Calendar size={13} color="var(--brand)" />
                        <span>{new Date(event.date_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>&bull;</span>
                        <MapPin size={13} color="var(--brand)" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.location}</span>
                      </div>

                      <h3 style={{ color: 'var(--text-strong)', fontSize: '18px', fontWeight: 600, margin: '0 0 10px 0', letterSpacing: '-0.01em' }}>
                        {event.title}
                      </h3>

                      <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: 1.6, margin: '0 0 20px 0', flex: 1 }}>
                        {summary.slice(0, 180)}{summary.length > 180 ? '…' : ''}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {event.form_requirements?.allow_teams && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={12} color="var(--brand)" />
                            <span>Teams up to {event.form_requirements?.max_team_size || 4}</span>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/events/${event.slug}`}
                        className="fluent-btn fluent-btn-primary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-sm)',
                          marginTop: 'auto',
                          textDecoration: 'none',
                        }}
                      >
                        <span>Hackathon details & register</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
                No active hackathons open right now. Check back soon for the next flagship competition.
              </p>
            </div>
          )}
        </section>

        <p style={{ marginTop: '40px', fontSize: '13.5px' }}>
          <Link href="/events" style={{ color: 'var(--brand)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>Browse all MSC events</span>
            <ArrowRight size={13} />
          </Link>
        </p>
      </div>
    </div>
  );
}
