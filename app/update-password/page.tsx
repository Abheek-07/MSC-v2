'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle2, ArrowLeft, LoaderCircle } from 'lucide-react';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [validatingSession, setValidatingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const initAuth = async () => {
      try {
        // If arrived via PKCE flow, exchange code from URL query
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              setStatus({
                type: 'error',
                text: 'This password recovery link is invalid or has expired. Please request a new one.',
              });
              setValidatingSession(false);
              return;
            }
          }
        }

        // Check for active recovery session or established session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasSession(true);
        } else {
          // If hash fragment contains access_token, give client a moment to resolve
          if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
            setHasSession(true);
          } else {
            setStatus({
              type: 'error',
              text: 'No active recovery session found. Please open this page from the password reset email link.',
            });
          }
        }
      } catch (err: any) {
        setStatus({
          type: 'error',
          text: err?.message || 'Failed to initialize password recovery session.',
        });
      } finally {
        setValidatingSession(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setHasSession(true);
        if (event === 'PASSWORD_RECOVERY') {
          setStatus(null);
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (password.length < 8) {
      return setStatus({ type: 'error', text: 'Password must contain at least 8 characters.' });
    }
    if (password !== confirmation) {
      return setStatus({ type: 'error', text: 'Passwords do not match.' });
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setPassword('');
      setConfirmation('');
      setStatus({
        type: 'success',
        text: 'Password updated successfully! Redirecting to sign in…',
      });

      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (error) {
      setStatus({
        type: 'error',
        text: error instanceof Error ? error.message : 'The recovery link is invalid or expired. Request a new one.',
      });
    } finally {
      setLoading(false);
    }
  }

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
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04), 0 14px 40px rgba(0, 0, 0, 0.06)',
          padding: 'clamp(28px, 5vw, 44px)',
        }}
      >
        {/* Microsoft 4-Color Logo Header */}
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
          Choose a new password
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
          Enter and confirm your new account password below.
        </p>

        {/* Validating Session Loader */}
        {validatingSession ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            <LoaderCircle size={18} className="animate-spin" />
            <span>Verifying recovery session…</span>
          </div>
        ) : (
          <>
            {/* Status Message */}
            {status && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12.5px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: status.type === 'error' ? 'var(--danger-bg)' : 'var(--success-bg)',
                  color: status.type === 'error' ? 'var(--danger)' : 'var(--success)',
                  border: `1px solid ${status.type === 'error' ? 'rgba(197, 15, 31, 0.2)' : 'rgba(14, 122, 13, 0.2)'}`,
                }}
              >
                {status.type === 'error' ? (
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                ) : (
                  <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                )}
                <span style={{ lineHeight: 1.4 }}>{status.text}</span>
              </div>
            )}

            {/* If password was successfully updated */}
            {status?.type === 'success' ? (
              <div style={{ marginTop: '16px' }}>
                <Link
                  href="/login"
                  className="fluent-btn fluent-btn-primary"
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                  }}
                >
                  Proceed to Sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label
                    htmlFor="new-password"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-strong)',
                      marginBottom: '6px',
                    }}
                  >
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    required
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="fluent-input"
                    disabled={!hasSession}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13.5px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-strong)',
                      marginBottom: '6px',
                    }}
                  >
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    required
                    placeholder="Re-enter password"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    className="fluent-input"
                    disabled={!hasSession}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13.5px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !hasSession}
                  className="fluent-btn fluent-btn-primary"
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginTop: '8px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            )}
          </>
        )}

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <Link
            href="/login"
            style={{
              fontSize: '13px',
              color: 'var(--brand)',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={13} /> Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
