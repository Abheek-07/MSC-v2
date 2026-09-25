'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FALLBACK_GALLERY } from '@/lib/data/mock-fallback';
import { Search, X, ChevronLeft, ChevronRight, Maximize2, Tag, Calendar } from 'lucide-react';

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: 'All Archives' },
    { id: 'hackathons', label: 'Hackathons' },
    { id: 'workshops', label: 'Workshops' },
    { id: 'festivals', label: 'Festivals' },
    { id: 'community', label: 'Community' },
    { id: 'awards', label: 'Awards' },
  ];

  const filteredItems = FALLBACK_GALLERY.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category.toLowerCase() === activeCategory.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      item.title.toLowerCase().includes(query) ||
      item.alt_text.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const handlePrev = useCallback(() => {
    if (selectedIdx === null || filteredItems.length === 0) return;
    setSelectedIdx((prev) => (prev! - 1 + filteredItems.length) % filteredItems.length);
  }, [selectedIdx, filteredItems.length]);

  const handleNext = useCallback(() => {
    if (selectedIdx === null || filteredItems.length === 0) return;
    setSelectedIdx((prev) => (prev! + 1) % filteredItems.length);
  }, [selectedIdx, filteredItems.length]);

  const handleClose = useCallback(() => {
    setSelectedIdx(null);
  }, []);

  // Keyboard navigation listener (Left, Right, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIdx === null) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, handlePrev, handleNext, handleClose]);

  const currentPhoto = selectedIdx !== null && filteredItems[selectedIdx] ? filteredItems[selectedIdx] : null;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Visual Archives &bull; Chapter &apos;26
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 600, color: 'var(--text-strong)', marginTop: '4px' }}>
            Community Photo Gallery
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '680px', marginTop: '8px' }}>
            Capturing the energy of midnight hackathon sprints, Azure cloud architectures, and campus tech summits at SRM University AP.
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '36px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '20px',
          }}
        >
          {/* Real-time search bar */}
          <div style={{ position: 'relative', maxWidth: '420px', width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIdx(null);
              }}
              placeholder="Search by title, category, or keyword..."
              className="fluent-input"
              style={{
                paddingLeft: '38px',
                paddingRight: searchQuery ? '36px' : '14px',
                fontSize: '13px',
                borderRadius: 'var(--radius-sm)',
                height: '40px',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSelectedIdx(null);
                  }}
                  style={{
                    background: isActive ? 'var(--brand)' : 'var(--surface)',
                    color: isActive ? '#ffffff' : 'var(--text-body)',
                    border: isActive ? '1px solid var(--brand)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '7px 16px',
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
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              Showing {filteredItems.length} {filteredItems.length === 1 ? 'photo' : 'photos'}
            </span>
          </div>
        </div>

        {/* Photo Grid with Hover-Reveal Focus Cards */}
        {filteredItems.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-strong)', marginBottom: '8px' }}>
              No photography matches your search
            </p>
            <p style={{ fontSize: '13px', margin: 0 }}>
              Try adjusting your search query or switching categories.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              gap: '24px',
            }}
          >
            {filteredItems.map((photo, idx) => (
              <div
                key={photo.id}
                onClick={() => setSelectedIdx(idx)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedIdx(idx);
                  }
                }}
                className="fluent-card focus-card-container"
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-sm)',
                  height: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <img
                  src={photo.image_url}
                  alt={photo.alt_text}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="focus-card-image"
                />

                {/* Permanent Category Pill */}
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(10, 10, 12, 0.75)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '2px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    zIndex: 2,
                  }}
                >
                  {photo.category}
                </span>

                {/* Hover-Reveal Focus Overlay */}
                <div
                  className="focus-card-overlay"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(10,14,24,0.92) 0%, rgba(10,14,24,0.4) 60%, rgba(10,14,24,0.1) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '20px',
                    color: '#ffffff',
                    opacity: 0.9,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                      {photo.title}
                    </h3>
                    <Maximize2 size={16} color="var(--accent-strong)" />
                  </div>
                  <p style={{ fontSize: '12px', color: '#d1d5db', margin: 0, lineHeight: 1.4 }}>
                    {photo.alt_text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Lightbox Modal with Keyboard Navigation & Chevrons */}
        {currentPhoto && selectedIdx !== null && (
          <div
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(8, 10, 15, 0.92)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Previous Button */}
            {filteredItems.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="Previous photo"
                style={{
                  position: 'fixed',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 1010,
                  transition: 'background 0.2s ease',
                }}
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Next Button */}
            {filteredItems.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next photo"
                style={{
                  position: 'fixed',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 1010,
                  transition: 'background 0.2s ease',
                }}
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* Modal Card */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '920px',
                width: '100%',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lift)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Top Modal Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="fluent-badge badge-neutral" style={{ textTransform: 'uppercase' }}>
                    {currentPhoto.category}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Photo {selectedIdx + 1} of {filteredItems.length}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Tip: Use &larr; &rarr; arrows to browse, Esc to close
                  </span>
                  <button
                    onClick={handleClose}
                    aria-label="Close lightbox"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-strong)',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>

              {/* Image Viewport */}
              <div
                style={{
                  maxHeight: '65vh',
                  minHeight: '340px',
                  background: '#0a0a0c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={currentPhoto.image_url}
                  alt={currentPhoto.alt_text}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '65vh',
                    objectFit: 'contain',
                    userSelect: 'none',
                  }}
                />
              </div>

              {/* Metadata & Description Footer */}
              <div style={{ padding: '18px 24px', background: 'var(--surface)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '6px' }}>
                  {currentPhoto.title}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-body)', margin: 0, lineHeight: 1.5 }}>
                  {currentPhoto.alt_text}
                </p>
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                  <span>Chapter &apos;26 Archives</span>
                  <span>&bull;</span>
                  <span>SRM University AP</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .focus-card-container:hover .focus-card-image {
          transform: scale(1.05);
        }
        .focus-card-container:hover .focus-card-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
