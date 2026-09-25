#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const email = process.argv[2];

if (!email) {
  console.error('Error: Email argument required.');
  console.error('Usage: npm run admin:make -- <email@srmap.edu.in>');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('placeholder')) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured with real project values to run make_admin.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function makeAdmin() {
  console.log(`[Admin Bootstrap] Elevating ${email} to 'admin'...`);

  const { data, error } = await supabaseAdmin
    .from('member_profiles')
    .update({ role: 'admin' })
    .eq('email', email)
    .select();

  if (error) {
    console.error('[Admin Bootstrap] Elevation failed:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.warn(`[Admin Bootstrap] No member_profile found with email ${email}. Ensure user has signed up first.`);
  } else {
    console.log(`[Admin Bootstrap] Successfully elevated ${email} to admin role.`);
  }
}

makeAdmin().catch((err) => {
  console.error('[Admin Bootstrap] Uncaught error:', err);
  process.exit(1);
});
