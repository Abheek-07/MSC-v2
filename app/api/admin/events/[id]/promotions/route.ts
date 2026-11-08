import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, noStoreJson } from '@/lib/api-security';
import { checkRateLimit } from '@/lib/ratelimit';
import { isValidUUID } from '@/lib/security';

export const dynamic = 'force-dynamic';

type PromotionInput = {
  promotion_type?: unknown;
  code?: unknown;
  discount_type?: unknown;
  discount_value?: unknown;
  starts_at?: unknown;
  ends_at?: unknown;
  max_redemptions?: unknown;
  max_per_email?: unknown;
  min_order_amount?: unknown;
  active?: unknown;
};

function normalizePromotion(body: PromotionInput) {
  const promotionType = body.promotion_type;
  const discountType = body.discount_type;
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  const discountValue = Number(body.discount_value);
  const maxPerEmail = Number(body.max_per_email ?? 1);
  const minOrderAmount = Number(body.min_order_amount ?? 0);
  const maxRedemptions = body.max_redemptions === '' || body.max_redemptions == null ? null : Number(body.max_redemptions);
  const startsAt = typeof body.starts_at === 'string' ? new Date(body.starts_at) : new Date();
  const endsAt = typeof body.ends_at === 'string' && body.ends_at ? new Date(body.ends_at) : null;

  if (promotionType !== 'early_bird' && promotionType !== 'coupon') throw new Error('Choose early-bird or coupon promotion type.');
  if (discountType !== 'fixed' && discountType !== 'percentage') throw new Error('Choose fixed amount or percentage discount.');
  if (promotionType === 'coupon' && !/^[A-Z0-9_-]{3,32}$/.test(code)) throw new Error('Coupon code must be 3–32 letters, numbers, hyphens, or underscores.');
  if (promotionType === 'early_bird' && code) throw new Error('Early-bird offers do not use coupon codes.');
  if (!Number.isSafeInteger(discountValue) || discountValue < 1 || (discountType === 'percentage' && discountValue > 99)) {
    throw new Error('Discount must be a positive whole number. Percentage discounts must be 1–99%.');
  }
  if (!Number.isSafeInteger(maxPerEmail) || maxPerEmail < 1) throw new Error('Per-email redemption limit must be at least 1.');
  if (!Number.isSafeInteger(minOrderAmount) || minOrderAmount < 0) throw new Error('Minimum order amount must be zero or more.');
  if (maxRedemptions !== null && (!Number.isSafeInteger(maxRedemptions) || maxRedemptions < 1)) throw new Error('Total redemption limit must be a positive whole number.');
  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) throw new Error('Enter valid offer dates.');
  if (endsAt && endsAt <= startsAt) throw new Error('Offer end date must be after its start date.');

  return {
    promotion_type: promotionType,
    code: promotionType === 'coupon' ? code : null,
    discount_type: discountType,
    discount_value: discountValue,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt?.toISOString() ?? null,
    max_redemptions: maxRedemptions,
    max_per_email: maxPerEmail,
    min_order_amount: minOrderAmount,
    active: body.active !== false,
    updated_at: new Date().toISOString(),
  };
}

async function authorize() {
  const auth = await requireAdmin();
  if ('error' in auth) return { response: auth.error };
  const limit = await checkRateLimit(auth.user.id, 'admin');
  if (!limit.success) return { response: noStoreJson({ error: 'Rate limit exceeded. Please wait and retry.' }, 429) };
  return { user: auth.user };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!isValidUUID(id)) return noStoreJson({ error: 'Invalid event identifier.' }, 400);
  const { data, error } = await getAdminClient().from('event_promotions').select('*').eq('event_id', id).order('created_at', { ascending: false });
  if (error) return noStoreJson({ error: 'Unable to load promotions.' }, 500);
  return noStoreJson({ success: true, promotions: data || [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!isValidUUID(id)) return noStoreJson({ error: 'Invalid event identifier.' }, 400);
  try {
    const body = await req.json();
    const promotion = normalizePromotion(body);
    const { data, error } = await getAdminClient().from('event_promotions')
      .insert({ ...promotion, event_id: id, created_by: auth.user.id }).select().single();
    if (error) {
      if (error.code === '23505') return noStoreJson({ error: 'This coupon code already exists for the event.' }, 409);
      throw error;
    }
    return noStoreJson({ success: true, promotion: data }, 201);
  } catch (error: any) {
    return noStoreJson({ error: error.message || 'Unable to create promotion.' }, 400);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!isValidUUID(id)) return noStoreJson({ error: 'Invalid event identifier.' }, 400);
  try {
    const body = await req.json();
    if (!isValidUUID(body.promotion_id)) return noStoreJson({ error: 'Invalid promotion identifier.' }, 400);
    const promotion = normalizePromotion(body);
    const { data, error } = await getAdminClient().from('event_promotions')
      .update(promotion).eq('id', body.promotion_id).eq('event_id', id).select().single();
    if (error) {
      if (error.code === '23505') return noStoreJson({ error: 'This coupon code already exists for the event.' }, 409);
      throw error;
    }
    return noStoreJson({ success: true, promotion: data });
  } catch (error: any) {
    return noStoreJson({ error: error.message || 'Unable to update promotion.' }, 400);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!isValidUUID(id)) return noStoreJson({ error: 'Invalid event identifier.' }, 400);
  const promotionId = new URL(req.url).searchParams.get('promotion_id');
  if (!promotionId || !isValidUUID(promotionId)) return noStoreJson({ error: 'Invalid promotion identifier.' }, 400);
  const { data, error } = await getAdminClient().from('event_promotions')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', promotionId).eq('event_id', id).select().single();
  if (error) return noStoreJson({ error: 'Unable to disable promotion.' }, 500);
  return noStoreJson({ success: true, promotion: data });
}
