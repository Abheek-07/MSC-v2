'use client';

import React from 'react';
import { Sparkles, Terminal, Cloud, Award, Users, Trophy, GitBranch } from 'lucide-react';

export default function TelemetryMarquee({ activeEventTitle }: { activeEventTitle?: string }) {
  const featuredTitle = activeEventTitle ? activeEventTitle.toUpperCase() : "SYNORA '26";
  const items = [
    { text: `01 // ${featuredTitle} // Chapter '26 [FEATURED]`, icon: Trophy },
    { text: "02 // Azure & Cloud // Distributed Scale", icon: Cloud },
    { text: "03 // Applied AI // LLMs & Cognitive Services", icon: Terminal },
    { text: "04 // 50+ Engineers // Active Campus Guild", icon: Users },
    { text: "05 // Technical Sprints // Hackathon Bounty Pool", icon: Sparkles },
    { text: "06 // Open Source // Production Tooling", icon: GitBranch },
    { text: "07 // MLSA Chapter // Microsoft Ambassadors", icon: Award },
  ];

  return (
    <div
      style={{
        overflow: 'hidden',
        background: '#071524',
        borderTop: '1px solid rgba(0, 103, 184, 0.3)',
        borderBottom: '1px solid rgba(0, 103, 184, 0.3)',
        color: '#ffffff',
        padding: '12px 0',
        whiteSpace: 'nowrap',
        position: 'relative',
      }}
    >
      <div
        className="marquee-track"
        style={{
          display: 'inline-flex',
          gap: '40px',
          animation: 'marquee 32s linear infinite',
        }}
      >
        {/* Render items twice for seamless infinite scroll */}
        {[...items, ...items].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                fontFamily: 'monospace',
                letterSpacing: '0.02em',
              }}
            >
              <Icon size={14} color="#00a4ef" />
              <strong style={{ color: '#ffffff', fontWeight: 600 }}>{item.text}</strong>
              <span style={{ color: 'rgba(255,255,255,0.25)', marginLeft: '20px' }}>&bull;</span>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
