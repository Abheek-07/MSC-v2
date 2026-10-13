import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, noStoreJson } from '@/lib/api-security';
import { checkRateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

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
      .from('events')
      .select('*')
      .order('date_start', { ascending: false });

    if (error) throw error;

    return noStoreJson({ success: true, events: data || [] });
  } catch (err: any) {
    console.error('Error fetching admin events:', err);
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
    const body = await req.json();
    const supabase = getAdminClient();

    const hasCert = body.form_requirements?.provide_certificates ?? (body.certificate_html ? true : false);

    const newEv = {
      title: body.title || 'Untitled Event',
      slug: body.slug || (body.title || 'new-event').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: body.description || '',
      location: body.location || 'SRM University AP',
      type: body.type || 'Workshop',
      status: body.status || 'upcoming',
      date_start: body.date_start || new Date().toISOString(),
      date_end: body.date_end || new Date().toISOString(),
      image_url:
        body.image_url ||
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      registration_open: body.registration_open ?? true,
      show_opening_soon: false,
      is_published: body.is_published ?? true,
      max_capacity: body.max_capacity || 100,
      form_requirements: {
        event_pricing: body.form_requirements?.event_pricing || 'free',
        registration_fee: body.form_requirements?.registration_fee || 0,
        allow_teams: body.form_requirements?.allow_teams ?? false,
        max_team_size: body.form_requirements?.max_team_size || 4,
        provide_certificates: hasCert,
      },
      certificate_html: body.certificate_html || null,
      gallery_urls: body.gallery_urls || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('events').insert(newEv).select().single();
    if (error) throw error;

    try {
      revalidatePath('/', 'page');
      revalidatePath('/events', 'page');
      revalidatePath('/events/[slug]', 'page');
      if (data?.slug) revalidatePath(`/events/${data.slug}`, 'page');
      if (data?.slug === 'synora-26') revalidatePath('/events/synora', 'page');
      revalidatePath('/admin/events', 'page');
    } catch (e) {
      console.warn('Revalidate path warning:', e);
    }

    return noStoreJson({ success: true, event: data });
  } catch (err: any) {
    console.error('Error creating admin event:', err);
    return noStoreJson({ error: err.message }, 500);
  }
}

export async function PUT(req: Request) {
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
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return noStoreJson({ error: 'Event ID is required' }, 400);
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('events')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    try {
      revalidatePath('/', 'page');
      revalidatePath('/events', 'page');
      revalidatePath('/events/[slug]', 'page');
      if (data?.slug) revalidatePath(`/events/${data.slug}`, 'page');
      if (data?.slug === 'synora-26') revalidatePath('/events/synora', 'page');
      revalidatePath('/admin/events', 'page');
    } catch (e) {
      console.warn('Revalidate path warning:', e);
    }

    return noStoreJson({ success: true, event: data });
  } catch (err: any) {
    console.error('Error updating admin event:', err);
    return noStoreJson({ error: err.message }, 500);
  }
}

export async function DELETE(req: Request) {
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return noStoreJson({ error: 'Event ID is required' }, 400);
    }

    const supabase = getAdminClient();

    // 1. Delete associated registrations
    await supabase.from('registrations').delete().eq('event_id', id);

    // 2. Delete event
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;

    try {
      revalidatePath('/', 'page');
      revalidatePath('/events', 'page');
    } catch (e) {
      console.warn('Revalidate path warning:', e);
    }

    return noStoreJson({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting admin event:', err);
    return noStoreJson({ error: err.message }, 500);
  }
}