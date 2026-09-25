import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Microsoft Student Community | SRM University-AP',
  description:
    'The premier student engineering guild at SRM University AP. Official Microsoft Student Community organizing national hackathons, Azure cloud computing workshops, and AI bootcamps.',
  keywords: [
    'Microsoft Student Community',
    'MSC SRM AP',
    'SRM University AP',
    'SYNORA Hackathon',
    'Azure Cloud',
    'Developer Community',
  ],
  authors: [{ name: 'MSC SRM AP Core Team' }],
  openGraph: {
    title: 'Microsoft Student Community | SRM University-AP',
    description:
      'Where Student Builders Engineer Production Scale. Official chapter organizing hackathons, Azure compute bootcamps, and technical summits.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'MSC SRM AP',
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
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
