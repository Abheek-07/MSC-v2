import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ticket Verification | Microsoft Student Community SRM AP',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function TicketVerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
