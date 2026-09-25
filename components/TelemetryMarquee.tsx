'use client';

import React from 'react';
import { Sparkles, Terminal, Cloud, Award, Users, Trophy } from 'lucide-react';

export default function TelemetryMarquee() {
  const items = [
    { label: 'FLAGSHIP HACKATHON', val: "SYNORA '26", icon: Trophy },
    { label: 'DISTRIBUTED SYSTEMS', val: 'Azure Kubernetes & Compute', icon: Cloud },
    { label: 'COGNITIVE SERVICES', val: 'Agentic AI & LLMs', icon: Terminal },
    { label: 'ACTIVE GUILD', val: '1,200+ Campus Engineers', icon: Users },
    { label: 'HACKATHON BOUNTY', val: '₹ 1,50,000+ Prize Pool', icon: Sparkles },
    { label: 'LEADERSHIP TRACK', val: 'Microsoft Ambassadors (MLSA)', icon: Award },
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
          gap: '48px',
          animation: 'marquee 28s linear infinite',
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
              }}
            >
              <Icon size={15} color="#58a6ff" />
              <span
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 600,
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {item.label}:
              </span>
              <strong style={{ color: '#ffffff', fontWeight: 600 }}>{item.val}</strong>
              <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: '16px' }}>&bull;</span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
