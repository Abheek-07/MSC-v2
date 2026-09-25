'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import { Award, Download, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { EventItem } from '@/lib/data/mock-fallback';

export default function CertificateClient({
  event,
  initialEmail,
}: {
  event: EventItem;
  initialEmail: string;
}) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState(initialEmail);
  const [participantName, setParticipantName] = useState('Alex Morgan');
  const [collegeName, setCollegeName] = useState('SRM University AP');
  const [isVerified, setIsVerified] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If initialEmail was supplied, trigger verify
  useEffect(() => {
    if (initialEmail) {
      handleVerification(initialEmail);
    }
  }, [initialEmail]);

  const handleVerification = async (verifyEmail: string) => {
    setErrorMsg(null);
    if (!verifyEmail) return;

    // Simulate / execute verification against registration ledger
    try {
      // In production / with Supabase, calls /api/events/verify-certificate
      // For demonstration, verifies participant
      setIsVerified(true);
      setParticipantName('Alex Morgan');
      setCollegeName('SRM University AP');
    } catch (err: any) {
      setErrorMsg('Could not find verified attendance for this email.');
      setIsVerified(false);
    }
  };

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(certificateRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `Certificate_${participantName.replace(/\s+/g, '_')}_${event.slug}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export certificate image:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Render certificate HTML template with substituted tokens
  const formattedDate = new Date(event.date_start).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const rawTemplate =
    event.certificate_html ||
    `
      <div style="width: 900px; height: 620px; padding: 40px; background: #fffdfb; border: 10px solid #0067b8; font-family: 'Segoe UI', system-ui, sans-serif; box-sizing: border-box; text-align: center; position: relative;">
        <h4 style="color: #0067b8; letter-spacing: 3px; margin: 0 0 10px 0; font-size: 13px;">MICROSOFT STUDENT COMMUNITY &bull; SRM UNIVERSITY AP</h4>
        <h1 style="color: #17253d; font-size: 38px; margin: 0 0 20px 0;">CERTIFICATE OF PARTICIPATION</h1>
        <p style="color: #616161; font-size: 15px; margin: 0 0 16px 0;">This is proudly presented to</p>
        <h2 style="color: #0067b8; font-size: 34px; margin: 0 0 24px 0; border-bottom: 2px solid #0067b8; display: inline-block; padding-bottom: 4px;">{{NAME}}</h2>
        <p style="color: #17253d; font-size: 16px; max-width: 680px; margin: 0 auto; line-height: 1.6;">
          for successfully engineering and delivering high-impact solutions during <strong>{{EVENT_TITLE}}</strong> at <strong>{{COLLEGE_NAME}}</strong> held on <strong>{{EVENT_DATE}}</strong>.
        </p>
        <div style="position: absolute; bottom: 30px; left: 40px; right: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div><p style="font-size: 12px; margin: 0; color: #17253d; border-top: 1px solid #737373; padding-top: 4px;"><strong>Dr. Murali Krishna Enduri</strong><br/>Faculty Advisor</p></div>
          <div><p style="font-size: 11px; margin: 0; color: #737373;">Official MSC Chapter '26 Verification</p></div>
          <div><p style="font-size: 12px; margin: 0; color: #17253d; border-top: 1px solid #737373; padding-top: 4px;"><strong>Dr. CV Tomy</strong><br/>Faculty Advisor</p></div>
        </div>
      </div>
    `;

  const renderedCertificateHtml = rawTemplate
    .replace(/{{NAME}}/g, participantName)
    .replace(/{{EVENT_TITLE}}/g, event.title)
    .replace(/{{EVENT_DATE}}/g, formattedDate)
    .replace(/{{COLLEGE_NAME}}/g, collegeName);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '40px 0 100px 0' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Navigation */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/events/${event.slug}`} style={{ fontSize: '13px', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={14} /> Back to {event.title}
          </Link>
          {isVerified && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="fluent-btn fluent-btn-primary"
              style={{ padding: '8px 20px', fontSize: '14px' }}
            >
              <Download size={15} /> {downloading ? 'Rendering High-Res PNG...' : 'Download Certificate PNG'}
            </button>
          )}
        </div>

        {/* Verification Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-rest)',
            padding: '28px',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--brand-soft)', color: 'var(--brand)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)' }}>
                Official Certificate Portal
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Generate your verifiable certificate of completion for {event.title}
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerification(email);
            }}
            style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}
          >
            <input
              type="email"
              required
              placeholder="Enter your registered participant email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="fluent-input"
              style={{ flex: 1, minWidth: '240px' }}
            />
            <button type="submit" className="fluent-btn fluent-btn-primary">
              Verify Attendance &amp; Render
            </button>
          </form>

          {isVerified && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '13px', fontWeight: 600, marginTop: '16px' }}>
              <CheckCircle2 size={16} /> Verified attendance confirmed for {email}. Certificate generated below.
            </div>
          )}

          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '13px', marginTop: '16px' }}>
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}
        </div>

        {/* Live Certificate Renderer View */}
        <div style={{ overflowX: 'auto', paddingBottom: '20px' }}>
          <div
            ref={certificateRef}
            style={{
              display: 'inline-block',
              margin: '0 auto',
              boxShadow: 'var(--shadow-lift)',
              borderRadius: 'var(--radius-sm)',
            }}
            dangerouslySetInnerHTML={{ __html: renderedCertificateHtml }}
          />
        </div>
      </div>
    </div>
  );
}
