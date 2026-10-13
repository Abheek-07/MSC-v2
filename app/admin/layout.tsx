import React from 'react';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import AdminShell from '@/components/AdminShell';

export const metadata = {
  title: 'Admin Portal | Microsoft Student Community SRM AP',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireAdmin();

  if (!auth) {
    redirect('/login?redirect=/admin');
  }

  const { user } = auth;

  return (
    <AdminShell userEmail={user.email ?? ''} userRole="admin">
      {children}
    </AdminShell>
  );
}