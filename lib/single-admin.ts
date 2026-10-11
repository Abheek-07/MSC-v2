/**
 * Single-admin enforcement — shared by all admin role-mutation routes.
 *
 * Rules:
 *  1. Promoting a user to `admin` when another admin already exists → 409.
 *  2. Demoting the sole admin → 409 (use SQL handover instead).
 *  3. Deleting the sole admin → 409 (use SQL handover instead).
 *
 * These are application-layer guards; the database has the ultimate backstop
 * via the deferred constraint trigger in 20261011_single_admin_constraint.sql.
 */

import { createClient } from '@/lib/supabase/server';

export const SINGLE_ADMIN_ERROR = {
  code: 'SINGLE_ADMIN_VIOLATION',
  message: 'Another administrator already exists. Use SQL handover to transfer admin rights.',
  status: 409,
} as const;

export const LAST_ADMIN_ERROR = {
  code: 'LAST_ADMIN_PROTECTED',
  message: 'Cannot demote or delete the only administrator. Use SQL handover to transfer admin rights first.',
  status: 409,
} as const;

/** Count current admins (server-side, bypasses RLS via service role if needed). */
export async function countAdmins(supabase: Awaited<ReturnType<typeof createClient>>): Promise<number> {
  const { count, error } = await supabase
    .from('member_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');
  if (error) throw error;
  return count ?? 0;
}

/** Guard: reject if promoting to admin while another admin exists. */
export async function guardRoleChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  targetRole: string,
  targetUserId: string
): Promise<{ error: typeof SINGLE_ADMIN_ERROR } | null> {
  if (targetRole !== 'admin') return null;

  const adminCount = await countAdmins(supabase);
  if (adminCount > 0) {
    // Check if the target is already the sole admin (no-op promotion)
    const { data: target } = await supabase
      .from('member_profiles')
      .select('role')
      .eq('id', targetUserId)
      .single();
    if (target?.role !== 'admin') {
      return { error: SINGLE_ADMIN_ERROR };
    }
  }
  return null;
}

/** Guard: reject demotion/deletion of the sole admin. */
export async function guardAdminRemoval(
  supabase: Awaited<ReturnType<typeof createClient>>,
  targetUserId: string,
  action: 'demote' | 'delete'
): Promise<{ error: typeof LAST_ADMIN_ERROR } | null> {
  const { data: target } = await supabase
    .from('member_profiles')
    .select('role')
    .eq('id', targetUserId)
    .single();

  if (target?.role !== 'admin') return null;

  const adminCount = await countAdmins(supabase);
  if (adminCount <= 1) {
    return { error: LAST_ADMIN_ERROR };
  }
  return null;
}