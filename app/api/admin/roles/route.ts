import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, noStoreJson } from '@/lib/api-security';
import { checkRateLimit } from '@/lib/ratelimit';
import { guardRoleChange } from '@/lib/single-admin';

export const dynamic = 'force-dynamic';

const VALID_ROLES = ['admin', 'member'] as const;

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const rateLimit = await checkRateLimit(auth.user.id, 'api');
    if (!rateLimit.success) {
      return noStoreJson(
        { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
        429,
        { 'Retry-After': '60' }
      );
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('member_profiles')
      .select('id, email, full_name, role, is_onboarded, department, year_of_study, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return noStoreJson({ success: true, members: data || [] });
  } catch (err: any) {
    console.error('Error fetching member roles:', err);
    return noStoreJson({ error: err.message }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const rateLimit = await checkRateLimit(auth.user.id, 'api');
    if (!rateLimit.success) {
      return noStoreJson(
        { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
        429,
        { 'Retry-After': '60' }
      );
    }

    const { user_id, role } = await req.json();

    if (!user_id || !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      return noStoreJson({ error: 'Invalid user ID or role specified' }, 400);
    }

    // Single-admin guard
    const supabase = await createClient();
    const guard = await guardRoleChange(supabase, role, user_id);
    if (guard) {
      return noStoreJson(
        { error: guard.error.message, code: guard.error.code },
        guard.error.status
      );
    }

    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from('member_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', user_id);

    if (error) throw error;

    return noStoreJson({ success: true, user_id, role });
  } catch (err: any) {
    console.error('Error updating member role:', err);
    return noStoreJson({ error: err.message }, 500);
  }
}