import React from 'react';
import Link from 'next/link';
import { Award, Compass, Users, MapPin, CheckCircle, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'About MSC SRM AP — Origin, Provenance & Manifesto',
  description:
    'The official provenance and founding history of Microsoft Student Community at SRM University AP. Founded by Jayanth Ramakrishnan, guided by Dr. Murali Krishna Enduri & Dr. CV Tomy.',
};

export default function AboutPage() {
  const milestones = [
    {
      year: "2023",
      title: "Founding & Genesis",
      desc: "Founded by Jayanth Ramakrishnan at SRM University AP. Grew out of a passionate group of student builders pooling Azure cloud credits and sharing technical resources.",
    },
    {
      year: "2024",
      title: "Azure Cloud Infrastructure & First Bootcamps",
      desc: "Formalized institutional recognition under faculty advisors Dr. Murali Krishna Enduri and Dr. CV Tomy. Launched hands-on cloud microservice bootcamps.",
    },
    {
      year: "2025",
      title: "SYNORA National Hackathon Debut",
      desc: "Launched the SYNORA flagship hackathon brand with an F1 pit-stop engineering theme. Over 400 national student builders deployed production prototypes in 36 hours.",
    },
    {
      year: "2026",
      title: "Chapter '26 & Agentic AI Evolution",
      desc: "Expanding into autonomous agentic AI workflows, Azure OpenAI integrations, production engineering tooling, and formal MLSA leadership mentoring.",
    },
  ];

  const principles = [
    {
      title: "Production Over Toy Demos",
      desc: "We don't build throwaway prototypes that only run on localhost. Every workshop and hackathon emphasizes real deployments, CI/CD pipelines, containerization, and monitoring.",
    },
    {
      title: "Radical Resource Sharing",
      desc: "Cloud credits, enterprise compute vouchers, and specialized developer tooling are unlocked for every student member, eliminating economic barriers to learning distributed systems.",
    },
    {
      title: "Grounded Peer Mentorship",
      desc: "Senior students, alumni, and Microsoft Learn Student Ambassadors coach first-year builders through 1-on-1 code reviews, architectural feedback, and career navigation.",
    },
    {
      title: "Open Community Standards",
      desc: "Our internal platforms, hackathon registration systems, and tooling are engineered transparently. What we build for SRM AP is contributed back to open student engineering.",
    },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container">
        {/* Header Breadcrumb */}
        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Chapter Provenance &bull; SRM University AP
          </span>
          <h1 style={{ fontSize: '44px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '6px' }}>
            Founded on a shared ambition.
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '780px', marginTop: '14px', lineHeight: 1.5 }}>
            MSC grew from a small circle of students sharing Azure resources into SRM AP&apos;s most active engineering community — a launchpad for student engineers shipping real software.
          </p>
        </div>

        {/* PROVENANCE FACT BLOCK (Load-bearing real facts per prompt) */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-rest)',
            padding: '36px',
            margin: '40px 0 60px 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '30px',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              01 &bull; Founder
            </span>
            <h3 style={{ fontSize: '20px', color: 'var(--text-strong)', margin: '6px 0 4px 0' }}>
              Jayanth Ramakrishnan
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Visionary student founder who catalyzed the MSC engineering chapter at SRM AP.
            </p>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              02 &bull; Faculty Advisors
            </span>
            <h3 style={{ fontSize: '20px', color: 'var(--text-strong)', margin: '6px 0 4px 0' }}>
              Dr. Murali Krishna Enduri &amp; Dr. CV Tomy
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Departmental leadership and faculty mentorship guiding curriculum, lab access, and institutional support.
            </p>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              03 &bull; Institution
            </span>
            <h3 style={{ fontSize: '20px', color: 'var(--text-strong)', margin: '6px 0 4px 0' }}>
              SRM University AP
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Located in Mangalagiri, Andhra Pradesh (Coordinates: 16.4673&deg; N, 80.5284&deg; E).
            </p>
          </div>
        </div>

        {/* GUIDING FRAMEWORK & MANIFESTO */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ marginBottom: '32px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              The Foundational Principles
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
              Guiding Framework
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '680px', marginTop: '8px' }}>
              We reject the passivity of traditional club hierarchies. MSC operates as an engineering guild with clear commitments to its members.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {principles.map((p, idx) => (
              <div key={idx} className="fluent-card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircle size={18} color="var(--brand)" />
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)' }}>
                    {p.title}
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* EXPANSION CHRONICLE / TIMELINE */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ marginBottom: '36px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Journey to Chapter &apos;26
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
              The Expansion Chronicle
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', borderLeft: '3px solid var(--brand)', paddingLeft: '24px', marginLeft: '12px' }}>
            {milestones.map((m, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                {/* Timeline dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-31px',
                    top: '4px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'var(--brand)',
                    border: '2px solid var(--surface)',
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.05em' }}>
                  {m.year}
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)', margin: '4px 0 8px 0' }}>
                  {m.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '720px' }}>
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <div
          style={{
            background: 'var(--bg-tinted)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '8px' }}>
              Want to build with MSC SRM AP?
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Join our active community channels or browse upcoming hackathons and workshops.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/events" className="fluent-btn fluent-btn-primary" style={{ padding: '10px 22px' }}>
              Explore Events <ArrowRight size={15} />
            </Link>
            <Link href="/team" className="fluent-btn fluent-btn-secondary" style={{ padding: '10px 20px' }}>
              View Team Roster
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
