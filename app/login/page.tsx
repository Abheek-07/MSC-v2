'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signin') {
        const cleanEmail = email.trim().toLowerCase();

        // Strict Supabase cryptographic password verification
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;

        if (data?.user) {
          const { data: profile } = await supabase
            .from('member_profiles')
            .select('role, is_onboarded')
            .eq('id', data.user.id)
            .single();

          if (profile?.role === 'admin') {
            router.push('/admin');
            return;
          }

          if (!profile?.is_onboarded) {
            router.push('/onboarding');
            return;
          }
        }

        router.push('/events');
      } else if (mode === 'reset') {
        const res = await fetch('/api/auth/request-password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit reset request.');
        setMessage({
          type: 'success',
          text: 'If your account exists, your reset request has been submitted for administrator review.',
        });
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        setMessage({
          type: 'error',
          text: 'Cannot reach authentication service. Please check your network connection.',
        });
      } else {
        setMessage({ type: 'error', text: err.message || 'Authentication error.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg)',
        minHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        fontFamily: 'var(--font-family)',
      }}
    >
      {/* Microsoft Authentic Login Card: square corners on desktop */}
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '0',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04), 0 14px 40px rgba(0, 0, 0, 0.06)',
          padding: 'clamp(28px, 5vw, 44px)',
        }}
      >
        {/* Microsoft Logo Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <img
            src="https://lkbwunzswqbnoygxtilm.supabase.co/storage/v1/object/public/webpage/MSC%20Logo.png"
            alt="MSC Logo"
            style={{ width: '28px', height: '28px', objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>
              MSC Portal
            </span>
            <span style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-strong)', opacity: 0.4 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              SRM-AP Chapter
            </span>
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--text-strong)',
            margin: '0 0 4px 0',
            letterSpacing: '-0.01em',
          }}
        >
          {mode === 'signin' && 'Sign in'}
          {mode === 'reset' && 'Reset password'}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
          {mode === 'signin' && 'Sign in with your member or administrator account'}
          {mode === 'reset' && 'Submit a password reset request for approval'}
        </p>

        {/* Status Message */}
        {message && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12.5px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              background: message.type === 'error' ? 'var(--danger-bg)' : 'var(--success-bg)',
              color: message.type === 'error' ? 'var(--danger)' : 'var(--success)',
              border: `1px solid ${message.type === 'error' ? 'rgba(197, 15, 31, 0.2)' : 'rgba(14, 124, 65, 0.2)'}`,
            }}
          >
            {message.type === 'error' ? <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} /> : <CheckCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-strong)' }}>
              Email address
            </label>
            <input
              type="email"
              required
              placeholder="name@srmap.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="fluent-input"
              style={{ width: '100%' }}
            />
          </div>

          {mode === 'signin' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-strong)' }}>Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setMessage(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="fluent-input"
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* Links & Action Switchers */}
          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setMessage(null);
              }}
              style={{
                alignSelf: 'flex-start',
                background: 'none',
                border: 'none',
                color: 'var(--brand)',
                cursor: 'pointer',
                fontSize: '12.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0,
              }}
            >
              <ArrowLeft size={13} /> Back to sign in
            </button>
          )}

          {/* Full-width sign-in button (Microsoft login pattern) */}
          <button
            type="submit"
            disabled={loading}
            className="fluent-btn fluent-btn-primary"
            style={{
              width: '100%',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--brand)',
              marginTop: '4px',
            }}
          >
            {loading
              ? 'Processing...'
              : mode === 'signin'
              ? 'Sign in'
              : 'Submit request'}
          </button>

          {/* "No account? Contact admin" link */}
          {mode === 'signin' && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: '4px 0 0 0' }}>
              No account?{' '}
              <a
                href="mailto:msc.community@srmap.edu.in"
                style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}
              >
                Contact your administrator
              </a>
            </p>
          )}
        </form>
      </div>

      {/* Microsoft Legal & Identity Micro-footer */}
      <div
        style={{
          marginTop: '28px',
          display: 'flex',
          gap: '16px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <Link href="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Terms of use
        </Link>
        <span>|</span>
        <Link href="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Privacy
        </Link>
        <span>|</span>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Return to portal
        </Link>
      </div>
    </div>
  );
}
