'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [proposedPassword, setProposedPassword] = useState('');
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

          if (profile?.role === 'admin' || profile?.role === 'core_member') {
            router.push('/admin');
            return;
          }

          if (!profile?.is_onboarded) {
            router.push('/onboarding');
            return;
          }
        }

        router.push('/');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setMessage({
          type: 'success',
          text: 'Account created! Please check your email to confirm registration or sign in directly.',
        });
      } else if (mode === 'reset') {
        // Submit admin-approved password reset request
        const res = await fetch('/api/auth/reset-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, proposedPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit reset request.');
        setMessage({
          type: 'success',
          text: 'Password reset request submitted securely for administrator approval.',
        });
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        setMessage({
          type: 'error',
          text: 'Cannot reach Supabase: Please update .env.local with your real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from your Supabase Dashboard (Project Settings > API).',
        });
      } else {
        setMessage({ type: 'error', text: err.message || 'Authentication error.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-lift)',
          padding: '36px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              background: 'var(--brand-soft)',
              color: 'var(--brand)',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <Shield size={22} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
            {mode === 'signin' && 'Sign in to MSC'}
            {mode === 'signup' && 'Create Member Account'}
            {mode === 'reset' && 'Request Password Reset'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {mode === 'signin' && 'Microsoft Student Community • SRM University AP'}
            {mode === 'signup' && 'Join the premier student engineering guild'}
            {mode === 'reset' && 'Admin-approved cryptographic password reset'}
          </p>
        </div>

        {message && (
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: message.type === 'error' ? 'var(--danger-bg)' : 'var(--success-bg)',
              color: message.type === 'error' ? 'var(--danger)' : 'var(--success)',
            }}
          >
            {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="fluent-input"
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              University / Personal Email
            </label>
            <input
              type="email"
              required
              placeholder="alex@srmap.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="fluent-input"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="fluent-input"
              />
            </div>
          )}

          {mode === 'reset' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Proposed New Password
              </label>
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={proposedPassword}
                onChange={(e) => setProposedPassword(e.target.value)}
                className="fluent-input"
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Stored as AES-256-GCM ciphertext until an administrator reviews and approves.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="fluent-btn fluent-btn-primary"
            style={{ padding: '10px', fontSize: '14px', marginTop: '8px' }}
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Submit Reset Request'}
          </button>
        </form>

        {/* Mode Switcher */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
