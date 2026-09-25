import React from 'react';
import { notFound } from 'next/navigation';
import { FALLBACK_EVENTS } from '@/lib/data/mock-fallback';
import CertificateClient from './CertificateClient';

interface CertificatePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ email?: string }>;
}

export async function generateMetadata({ params }: CertificatePageProps) {
  const { slug } = await params;
  const event = FALLBACK_EVENTS.find((e) => e.slug === slug);
  if (!event) return { title: 'Certificate' };

  return {
    title: `Certificate of Participation — ${event.title}`,
    description: `Official verified certificate for ${event.title} issued by Microsoft Student Community SRM AP.`,
  };
}

export default async function CertificatePage({ params, searchParams }: CertificatePageProps) {
  const { slug } = await params;
  const { email } = await searchParams;

  const event = FALLBACK_EVENTS.find((e) => e.slug === slug);
  if (!event) {
    notFound();
  }

  return (
    <CertificateClient
      event={event}
      initialEmail={email || ''}
    />
  );
}
