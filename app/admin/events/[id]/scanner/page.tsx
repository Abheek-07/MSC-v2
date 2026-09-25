'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FALLBACK_EVENTS } from '@/lib/data/mock-fallback';
import QRScanner from '@/components/QRScanner';
import { ArrowLeft } from 'lucide-react';

export default function EventSpecificScannerPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const currentEvent = FALLBACK_EVENTS.find((e) => e.id === eventId) || FALLBACK_EVENTS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          href={`/admin/events/${eventId}`}
          style={{ fontSize: '13px', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <ArrowLeft size={14} /> Back to Event Management
        </Link>
      </div>

      <QRScanner eventId={eventId || currentEvent.id} eventTitle={currentEvent.title} />
    </div>
  );
}
