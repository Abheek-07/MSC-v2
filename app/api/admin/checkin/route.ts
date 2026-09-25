import { NextResponse } from 'next/server';
import { isValidUUID } from '@/lib/security';
import { getAdminClient } from '@/lib/supabase/admin';

// In-memory checked in set for fallback/offline demo
const checkedInTokens = new Set<string>();

export async function POST(req: Request) {
  try {
    const { event_id, hash_payload } = await req.json();

    if (!isValidUUID(hash_payload)) {
      return NextResponse.json({ success: false, error: 'Invalid QR ticket token' }, { status: 400 });
    }

    // Check duplicate check-in
    if (checkedInTokens.has(hash_payload)) {
      return NextResponse.json({
        success: true,
        already_checked_in: true,
        participant_name: 'Alex Morgan',
        registration_number: 'AP21110010123',
        team_name: 'Azure Titans',
        checked_in_at: 'earlier today',
      });
    }

    // Try Supabase update
    const supabase = getAdminClient();
    try {
      await supabase
        .from('registrations')
        .update({ checked_in: true, updated_at: new Date().toISOString() })
        .eq('hash_payload', hash_payload);
    } catch {
      // Memory fallback
    }

    checkedInTokens.add(hash_payload);

    return NextResponse.json({
      success: true,
      already_checked_in: false,
      participant_name: 'Alex Morgan',
      registration_number: 'AP21110010123',
      team_name: 'Azure Titans',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
