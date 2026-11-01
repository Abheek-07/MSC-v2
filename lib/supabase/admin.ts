import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

type UntypedDatabaseClient = SupabaseClient<any>;

let adminClient: UntypedDatabaseClient | null = null;

/**
 * Creates a server-only Supabase service-role client.
 * Never expose this client to browser code. Its key bypasses Row Level Security.
 */
export function getAdminClient(): UntypedDatabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !/^https:\/\//.test(supabaseUrl)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing or invalid.');
  }
  if (!serviceRoleKey || serviceRoleKey.toLowerCase().includes('placeholder')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing or invalid.');
  }

  adminClient = createSupabaseClient<any>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
