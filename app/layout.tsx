import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mscsrmap.xyz';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Microsoft Student Community | SRM University-AP',
    template: '%s | Microsoft Student Community SRM AP',
  },
  description:
    'Explore technology events, hackathons, workshops, and student developer opportunities at Microsoft Student Community, SRM University-AP.',
  applicationName: 'Microsoft Student Community SRM AP',
  keywords: [
    'Microsoft Student Community SRM AP',
    'MSC SRM AP',
    'SRM University AP events',
    'SRM AP hackathons',
    'student developer community',
    'technology workshops SRM AP',
    'Azure and AI workshops',
  ],
  authors: [{ name: 'Microsoft Student Community SRM AP', url: BASE_URL }],
  creator: 'Microsoft Student Community SRM AP',
  publisher: 'Microsoft Student Community SRM AP',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Microsoft Student Community | SRM University-AP',
    description:
      'Explore technology events, hackathons, workshops, and student developer opportunities at Microsoft Student Community, SRM University-AP.',
    url: '/',
    siteName: 'Microsoft Student Community SRM AP',
    images: [
      {
        url: '/hero_bg.png',
        width: 1200,
        height: 630,
        alt: 'Microsoft Student Community at SRM University-AP',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Microsoft Student Community | SRM University-AP',
    description:
      'Explore technology events, hackathons, workshops, and student developer opportunities at SRM University-AP.',
    images: ['/hero_bg.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0067b8',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${BASE_URL}/#organization`,
    name: 'Microsoft Student Community - SRM University-AP',
    alternateName: 'MSC SRM AP',
    url: BASE_URL,
    description:
      'A student-led technology community at SRM University-AP focused on developer learning, technical events, hackathons, and collaboration.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Neerukonda',
      addressRegion: 'Andhra Pradesh',
      postalCode: '522240',
      addressCountry: 'IN',
    },
    sameAs: [
      'https://github.com/YUVRAJ-SINGH-3178/MSC-v2',
      'https://linkedin.com/company/msc-srmap',
      'https://instagram.com/msc_srmap',
    ],
  };

  return (
    <html lang="en-IN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
