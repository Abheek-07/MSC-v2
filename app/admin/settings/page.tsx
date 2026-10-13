'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Camera,
  Save,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    regNumber: '',
    department: 'Computer Science & Engineering',
    year: '4th Year',
    specialization: '',
    bio: '',
    linkedin: '',
    github: '',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  });

  const [compressionStats, setCompressionStats] = useState<{
    originalSizeKb: number;
    compressedSizeKb: number;
    ratio: number;
  } | null>(null);

  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        supabase
          .from('member_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setProfile((prev) => ({
                ...prev,
                fullName: data.full_name || '',
                email: data.email || user.email || '',
                regNumber: data.registration_number || '',
                department: data.department || 'Computer Science & Engineering',
                year: data.year_of_study || '4th Year',
                bio: data.bio || '',
                avatarUrl: data.profile_picture_url || prev.avatarUrl,
              }));
            }
          });
        }
      });
  }, [supabase]);

  // Client-side HTML5 Canvas Image Compressor to WebP
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAvatar(true);
    const originalSizeKb = Math.round(file.size / 1024);

    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.src = event.target?.result as string;
      };

      img.onload = () => {
        // Compute target dimensions (Max 512x512 square crop / scale)
        const maxDim = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP format with quality 0.85
          const webpDataUrl = canvas.toDataURL('image/webp', 0.85);

          // Calculate compressed size from base64 string
          const stringLength = webpDataUrl.length - 'data:image/webp;base64,'.length;
          const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383;
          const compressedSizeKb = Math.round(sizeInBytes / 1024);
          const ratio = Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100));

          setProfile((prev) => ({ ...prev, avatarUrl: webpDataUrl }));
          setCompressionStats({
            originalSizeKb,
            compressedSizeKb,
            ratio,
          });
        }
        setIsProcessingAvatar(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error compressing avatar on canvas:', err);
      setIsProcessingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('member_profiles')
        .update({
          full_name: profile.fullName,
          registration_number: profile.regNumber,
          department: profile.department,
          year_of_study: profile.year,
          bio: profile.bio,
          profile_picture_url: profile.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert('Failed to update profile: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
          Organizer Profile &amp; Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Update personal leadership credentials, contact coordinates, and profile photo for Chapter &apos;26.
        </p>
      </div>

      {saveSuccess && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--success-bg)',
            color: 'var(--success)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={16} />
          <span>Profile coordinates successfully updated and synchronized to Supabase.</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-rest)',
          padding: 'clamp(16px, 4vw, 32px)',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Avatar Section with Canvas Compressor */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              paddingBottom: '24px',
              borderBottom: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              <img
                src={profile.avatarUrl}
                alt="Profile Avatar"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--brand)',
                }}
              />
              <button
                type="button"
                disabled={isProcessingAvatar}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: 'var(--brand)',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isProcessingAvatar ? 'wait' : 'pointer',
                  opacity: isProcessingAvatar ? 0.7 : 1,
                  boxShadow: 'var(--shadow-rest)',
                }}
                title={isProcessingAvatar ? 'Compressing Avatar...' : 'Change Avatar'}
              >
                <Camera size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleAvatarFileChange}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-strong)', margin: '0 0 4px 0' }}>
                Leader Avatar &amp; Badge Photo
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                Supports PNG, JPG, or WEBP. Uploaded images are automatically scaled (512x512) and compressed to modern WebP format via client-side HTML5 canvas before storage upload.
              </p>

              {compressionStats && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: 'var(--bg-soft)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    color: 'var(--text-body)',
                  }}
                >
                  <Sparkles size={12} color="var(--brand)" />
                  <span>
                    Canvas WebP Compressor: <strong>{compressionStats.originalSizeKb} KB</strong> &rarr;{' '}
                    <strong style={{ color: 'var(--success)' }}>{compressionStats.compressedSizeKb} KB</strong> ({compressionStats.ratio}% smaller)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Academic Coordinates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="fluent-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Official Email (Identity Guard)
              </label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="fluent-input"
                style={{ width: '100%', background: 'var(--bg-soft)', color: 'var(--text-muted)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Registration Number *
              </label>
              <input
                type="text"
                required
                value={profile.regNumber}
                onChange={(e) => setProfile({ ...profile, regNumber: e.target.value })}
                className="fluent-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Year of Study
              </label>
              <select
                value={profile.year}
                onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                className="fluent-input"
                style={{ width: '100%' }}
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>
          </div>

          {/* Department & Specialization */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Department / Branch *
              </label>
              <input
                type="text"
                required
                value={profile.department}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                className="fluent-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Engineering Specialization
              </label>
              <input
                type="text"
                value={profile.specialization}
                onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                className="fluent-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Leadership Bio
            </label>
            <textarea
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="fluent-input"
              style={{ width: '100%', height: 'auto', padding: '10px 14px' }}
            />
          </div>

          {/* Social Profiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={profile.linkedin}
                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                className="fluent-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                GitHub Profile URL
              </label>
              <input
                type="url"
                value={profile.github}
                onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                className="fluent-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Save Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <button type="submit" className="fluent-btn fluent-btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
              <Save size={15} /> Save Profile Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
