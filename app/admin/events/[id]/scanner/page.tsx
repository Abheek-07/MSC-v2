'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Volume2,
  VolumeX,
  RefreshCw,
} from 'lucide-react';

type ScanOutcome = 'idle' | 'success' | 'already_checked_in' | 'invalid';

interface ScanResult {
  outcome: ScanOutcome;
  message: string;
  name?: string;
  regNum?: string;
  teamName?: string;
  timestamp: string;
}

export default function QRScannerPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Audio cues synthesizer (free browser Web Audio API, no paid audio assets)
  const playAudioCue = (outcome: ScanOutcome) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (outcome === 'success') {
        // High pleasant ding
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (outcome === 'already_checked_in') {
        // Double warning beep
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else {
        // Low error buzz
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch {
      // Audio autoplay blocked or unsupported
    }
  };

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      );
      setScannerActive(true);
    } catch (err) {
      console.error('Failed to start camera scanner:', err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScannerActive(false);
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    // Prevent rapid multiple triggers on same frame
    if (scannerRef.current) {
      scannerRef.current.pause();
    }

    // Extract hash payload from scanned URL or text
    let hash = decodedText.trim();
    if (hash.includes('/admin/checkin/')) {
      hash = hash.split('/admin/checkin/')[1].split('?')[0];
    } else if (hash.includes('/ticket/')) {
      hash = hash.split('/ticket/')[1].split('?')[0];
    }

    try {
      const res = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, hash_payload: hash }),
      });

      const data = await res.json();
      let result: ScanResult;

      if (!res.ok || !data.success) {
        result = {
          outcome: 'invalid',
          message: data.error || 'Invalid or unverified ticket identifier.',
          timestamp: new Date().toLocaleTimeString(),
        };
      } else if (data.already_checked_in) {
        result = {
          outcome: 'already_checked_in',
          message: `Already Checked In at ${data.checked_in_at || 'prior turnstile'}`,
          name: data.participant_name || 'Participant',
          regNum: data.registration_number,
          teamName: data.team_name,
          timestamp: new Date().toLocaleTimeString(),
        };
      } else {
        result = {
          outcome: 'success',
          message: 'Admission Check-in Confirmed!',
          name: data.participant_name || 'Participant',
          regNum: data.registration_number,
          teamName: data.team_name,
          timestamp: new Date().toLocaleTimeString(),
        };
      }

      setScanResult(result);
      playAudioCue(result.outcome);
      setRecentScans((prev) => [result, ...prev.slice(0, 9)]);
    } catch (err: any) {
      const result: ScanResult = {
        outcome: 'invalid',
        message: 'Network check-in failed.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setScanResult(result);
      playAudioCue('invalid');
    } finally {
      // Resume scanner after 2 seconds
      setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
      }, 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/admin" style={{ fontSize: '13px', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="fluent-btn fluent-btn-secondary"
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} Sound Cues {soundEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Scanner Column */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-rest)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)' }}>
              Camera Scanner
            </h2>
            <span className="fluent-badge badge-success">Live Camera Active</span>
          </div>

          {/* html5-qrcode video viewport */}
          <div
            id="qr-reader"
            style={{
              width: '100%',
              maxWidth: '380px',
              minHeight: '280px',
              background: '#000000',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}
          />

          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
            Position the digital ticket QR code within the highlighted viewfinder.
          </span>
        </div>

        {/* Scan Status & History Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Current Outcome Panel */}
          {scanResult ? (
            <div
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid',
                background:
                  scanResult.outcome === 'success'
                    ? 'var(--success-bg)'
                    : scanResult.outcome === 'already_checked_in'
                    ? 'var(--warning-bg)'
                    : 'var(--danger-bg)',
                borderColor:
                  scanResult.outcome === 'success'
                    ? 'var(--success)'
                    : scanResult.outcome === 'already_checked_in'
                    ? 'var(--warning)'
                    : 'var(--danger)',
                color:
                  scanResult.outcome === 'success'
                    ? 'var(--success)'
                    : scanResult.outcome === 'already_checked_in'
                    ? 'var(--warning)'
                    : 'var(--danger)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                {scanResult.outcome === 'success' && <CheckCircle2 size={28} />}
                {scanResult.outcome === 'already_checked_in' && <AlertTriangle size={28} />}
                {scanResult.outcome === 'invalid' && <XCircle size={28} />}
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                  {scanResult.outcome === 'success' && 'CHECK-IN GRANTED'}
                  {scanResult.outcome === 'already_checked_in' && 'ALREADY CHECKED IN'}
                  {scanResult.outcome === 'invalid' && 'INVALID TICKET'}
                </h3>
              </div>

              <p style={{ fontSize: '14px', margin: '0 0 12px 0', fontWeight: 500 }}>
                {scanResult.message}
              </p>

              {scanResult.name && (
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-strong)', fontSize: '13px' }}>
                  <div><strong>Participant:</strong> {scanResult.name}</div>
                  {scanResult.regNum && <div><strong>Reg Number:</strong> {scanResult.regNum}</div>}
                  {scanResult.teamName && <div><strong>Team:</strong> {scanResult.teamName}</div>}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '36px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Camera size={36} color="var(--brand)" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>
                Ready to scan. Present an attendee ticket QR to record check-in.
              </p>
            </div>
          )}

          {/* Recent Scans History */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '20px',
              flex: 1,
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '12px' }}>
              Turnstile Session History
            </h3>
            {recentScans.length === 0 ? (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No scans recorded this session yet.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentScans.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--bg-soft)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-strong)' }}>{s.name || 'Unidentified'}</strong>
                      <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>{s.message}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>{s.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
