'use client';

import React, { useState } from 'react';
import { FALLBACK_GALLERY } from '@/lib/data/mock-fallback';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<typeof FALLBACK_GALLERY[0] | null>(null);

  const categories = [
    { id: 'all', label: 'All Archives' },
    { id: 'hackathons', label: 'Hackathons & Sprints' },
    { id: 'workshops', label: 'Cloud Workshops' },
    { id: 'festivals', label: 'Tech Festivals' },
    { id: 'community', label: 'Community & Guild' },
  ];

  const filteredItems =
    activeCategory === 'all'
      ? FALLBACK_GALLERY
      : FALLBACK_GALLERY.filter((item) => item.category === activeCategory);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Visual Archives &bull; Chapter &apos;26
          </span>
          <h1 style={{ fontSize: '44px', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
            Community Photo Gallery
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '680px', marginTop: '8px' }}>
            Capturing the energy of midnight hackathon sprints, Azure cloud architectures, and campus tech summits at SRM University AP.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '36px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '12px',
          }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  background: isActive ? 'var(--brand)' : 'var(--surface)',
                  color: isActive ? '#ffffff' : 'var(--text-body)',
                  border: isActive ? '1px solid var(--brand)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Photo Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredItems.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="fluent-card"
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ height: '240px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={photo.image_url}
                  alt={photo.alt_text}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    textTransform: 'uppercase',
                  }}
                >
                  {photo.category}
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '4px' }}>
                  {photo.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {photo.alt_text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              backdropFilter: 'blur(6px)',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '900px',
                width: '100%',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lift)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-strong)' }}>
                  {selectedPhoto.title}
                </h3>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ maxHeight: '600px', overflow: 'hidden', background: '#000000', display: 'flex', justifyContent: 'center' }}>
                <img
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.alt_text}
                  style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
                />
              </div>

              <div style={{ padding: '16px 24px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-body)', margin: 0 }}>
                  {selectedPhoto.alt_text}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
