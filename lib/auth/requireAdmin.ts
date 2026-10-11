import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Server Component / Action guard for admin pages.
 * Throws a redirect if the user is not an admin.
 */
export async function requireAdmin(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string | null };
  role: 'admin';
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login?redirect=/admin');
  }

  const { data: profile, error: profileError } = await supabase
    .from('member_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/login?error=unauthorized');
  }

  return { supabase, user, role: 'admin' };
}