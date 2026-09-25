import React from 'react';
import Link from 'next/link';
import { Award, Compass, Users, MapPin, CheckCircle, ArrowRight, Sparkles, Layers, Cpu, Rocket } from 'lucide-react';

export const metadata = {
  title: 'About MSC SRM AP | Origin, Mentors & Manifesto',
  description:
    'The official provenance and founding history of Microsoft Student Community at SRM University AP. Founded by Jayanth Ramakrishnan, guided by Dr. Murali Krishna Enduri Sir and Dr. CV Tomy Sir.',
};

export default function AboutPage() {
  const manifestoPillars = [
    {
      num: '01',
      title: 'The Vision (Aspiration)',
      statement: 'To position ourselves as a student focused community and create visionaries of tomorrow.',
      tags: ['Impact', 'Innovation', 'Scale'],
      icon: Rocket,
    },
    {
      num: '02',
      title: 'The Mission (Purpose)',
      statement:
        'To provide a student led and student focused platform for interaction and ideas. Committed towards bringing diversity in people and domains.',
      tags: ['Interaction', 'Ideas', 'Diversity'],
      icon: Users,
    },
    {
      num: '03',
      title: 'Core Technologies (Stack)',
      statement: 'We utilize industry-standard ecosystems to architect scalable student applications.',
      tags: ['Azure Cloud', 'Open Source', 'AI Integration', 'Web Dev', 'System Design'],
      icon: Cpu,
    },
  ];

  const journeyPhases = [
    {
      phase: 'Phase I',
      title: 'Foundations (The Past)',
      desc: "The community has successfully led major events providing student focused opportunities with events like HackMSC and Zero Jam which have formed a major part of the community's legacy and strengthen our vision for tomorrow.",
    },
    {
      phase: 'Phase II',
      title: 'Execution (The Present)',
      desc: 'The community continues in the tradition of the star events while bringing new ideas to diversify student outreach to different courses and specializations. Thus fulfilling the student first commitment.',
    },
    {
      phase: 'Phase III',
      title: 'Evolution (The Future)',
      desc: 'The community aims to be the forerunner in student led communities in providing students with opportunities while being transparent in its objective of working for all students and providing support.',
    },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container">
        {/* Hero Stage */}
        <div style={{ marginBottom: '40px', maxWidth: '840px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--brand)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Origin, Mentors &amp; Manifesto &bull; SRM University AP
          </span>
          <h1
            style={{
              fontSize: '44px',
              fontWeight: 700,
              color: 'var(--text-strong)',
              marginTop: '8px',
              lineHeight: 1.15,
            }}
          >
            We don&apos;t just learn tech. We build with it.
          </h1>
          <p
            style={{
              fontSize: '18px',
              color: 'var(--text-muted)',
              marginTop: '16px',
              lineHeight: 1.6,
            }}
          >
            A student-led space at SRM University AP where engineers, designers, and thinkers come together to ship real products with Microsoft technologies.
          </p>
        </div>

        {/* Visual Artwork Feature Container */}
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lift)',
            marginBottom: '60px',
            border: '1px solid var(--border)',
            background: '#0a0d14',
            maxHeight: '480px',
          }}
        >
          <img
            src="/about_visual.png"
            alt="Microsoft Student Community Innovation Lab at SRM University AP"
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '480px',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '24px 32px',
              background: 'linear-gradient(to top, rgba(7, 10, 18, 0.92) 0%, rgba(7, 10, 18, 0.4) 70%, transparent 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: '#00a4ef', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Engineering Collective
              </span>
              <h3 style={{ fontSize: '20px', color: '#ffffff', fontWeight: 600, margin: '2px 0 0 0' }}>
                Microsoft Student Community &bull; Chapter &apos;26
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)' }}>
              SRM University AP &bull; Amaravati, Andhra Pradesh
            </span>
          </div>
        </div>

        {/* Community Genesis & Provenance Block */}
        <section style={{ marginBottom: '70px' }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-rest)',
              padding: '40px',
            }}
          >
            <div style={{ marginBottom: '28px', maxWidth: '760px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--brand)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Community Genesis
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
                Origin Story &amp; Provenance
              </h2>
              <p style={{ fontSize: '16px', color: 'var(--text-body)', marginTop: '12px', lineHeight: 1.6 }}>
                What started as a handful of students sharing notes on Azure turned into SRM AP&apos;s most active engineering community. MSC isn&apos;t a club, it&apos;s a launchpad for future creators.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                borderTop: '1px solid var(--border)',
                paddingTop: '28px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  01 &bull; Founded By
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', margin: '6px 0 2px 0' }}>
                  Jayanth Ramakrishnan
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Visionary student founder who catalyzed the MSC engineering chapter.
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  02 &bull; Faculty Mentors
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', margin: '6px 0 2px 0' }}>
                  Dr. Murali Krishna Enduri Sir and Dr. CV Tomy Sir
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Departmental mentors guiding student research, lab access, and institutional support.
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  03 &bull; Established At
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', margin: '6px 0 2px 0' }}>
                  SRM University AP
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Andhra Pradesh &bull; Coordinates: 16.46&deg;N 80.50&deg;E
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Manifesto (3 Foundational Pillars) */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ marginBottom: '36px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--brand)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              The Manifesto
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
              3 Foundational Pillars
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '680px', marginTop: '8px' }}>
              Our charter defines how we operate, build, and support student developers across domains.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            {manifestoPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.num}
                  className="fluent-card"
                  style={{
                    padding: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          background: 'var(--brand-soft)',
                          color: 'var(--brand)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={22} />
                      </div>
                      <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--border-strong)', opacity: 0.4 }}>
                        {pillar.num}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '10px' }}>
                      {pillar.title}
                    </h3>

                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                      &ldquo;{pillar.statement}&rdquo;
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    {pillar.tags.map((t) => (
                      <span key={t} className="fluent-badge badge-neutral" style={{ fontSize: '11px' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* The Journey (Chronicle Timeline) */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ marginBottom: '40px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--brand)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Chronicle Timeline
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
              The Journey
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '640px', marginTop: '8px' }}>
              Tracing the 3-phase trajectory from nascent hackathons to a thriving campus guild.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
              borderLeft: '3px solid var(--brand)',
              paddingLeft: '28px',
              marginLeft: '12px',
            }}
          >
            {journeyPhases.map((phase, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-36px',
                    top: '4px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: 'var(--brand)',
                    border: '3px solid var(--surface)',
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {phase.phase}
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)', margin: '4px 0 8px 0' }}>
                  {phase.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '780px' }}>
                  {phase.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
            boxShadow: 'var(--shadow-rest)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '8px' }}>
              Experience the MSC Community in Action
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
              Connect with fellow student builders, participate in national hackathons, or meet the leadership board.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/events" className="fluent-btn fluent-btn-primary" style={{ padding: '10px 22px' }}>
              Explore Events <ArrowRight size={15} />
            </Link>
            <Link href="/team" className="fluent-btn fluent-btn-secondary" style={{ padding: '10px 20px' }}>
              Team Roster
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
