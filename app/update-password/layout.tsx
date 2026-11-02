import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Choose a New Password | Microsoft Student Community SRM AP',
  description: 'Choose a new password for your Microsoft Student Community account.',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function UpdatePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

