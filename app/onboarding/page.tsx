'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [regNum, setRegNum] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [yearOfStudy, setYearOfStudy] = useState('2nd Year');
  const [bio, setBio] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      setUserId(session.user.id);
      supabase
        .from('member_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setFullName(data.full_name || '');
            setRegNum(data.registration_number || '');
            setPhone(data.phone_number || '');
            setDepartment(data.department || 'CSE');
            setYearOfStudy(data.year_of_study || '2nd Year');
            setBio(data.bio || '');
          }
          setLoading(false);
        });
    });
  }, [router, supabase]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('member_profiles')
        .update({
          full_name: fullName,
          registration_number: regNum,
          phone_number: phone,
          department,
          year_of_study: yearOfStudy,
          bio,
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>Loading member profile...</span>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '85vh', padding: '60px 0 100px 0' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'var(--brand-soft)',
              color: 'var(--brand)',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <UserCheck size={24} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-strong)' }}>
            Complete Your Member Profile
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Provide your academic coordinates to streamline hackathon registrations and certificate issuance.
          </p>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-rest)',
            padding: '36px',
          }}
        >
          {errorMsg && (
            <div style={{ padding: '12px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="fluent-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Registration Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AP21110010123"
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  className="fluent-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Mobile / Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="fluent-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Department / Branch
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="fluent-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Year of Study
                </label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  className="fluent-input"
                  style={{ height: '38px' }}
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate / PhD">Postgraduate / PhD</option>
                  <option value="Alumni">Alumni</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Engineering Bio / Focus Areas
              </label>
              <textarea
                rows={3}
                placeholder="Cloud architecture, agentic AI, backend engineering, etc."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="fluent-input"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="fluent-btn fluent-btn-primary"
              style={{ padding: '12px', fontSize: '15px', marginTop: '10px' }}
            >
              {saving ? 'Saving Coordinates...' : 'Complete Profile & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
