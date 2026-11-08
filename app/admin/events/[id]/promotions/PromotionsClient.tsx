'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Promotion = {
  id: string;
  promotion_type: 'early_bird' | 'coupon';
  code: string | null;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  starts_at: string;
  ends_at: string | null;
  max_redemptions: number | null;
  max_per_email: number;
  min_order_amount: number;
  active: boolean;
};

export default function PromotionsClient({ eventId }: { eventId: string }) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionType, setPromotionType] = useState<'early_bird' | 'coupon'>('coupon');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('percentage');
  const [discountValue, setDiscountValue] = useState('10');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [maxPerEmail, setMaxPerEmail] = useState('1');
  const [minimumAmount, setMinimumAmount] = useState('0');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/events/${eventId}/promotions`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load promotions.');
    setPromotions(data.promotions || []);
  }, [eventId]);

  useEffect(() => { load().catch((error) => setMessage(error.message)); }, [load]);

  const createPromotion = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/events/${eventId}/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotion_type: promotionType,
          code: promotionType === 'coupon' ? code : '',
          discount_type: discountType,
          discount_value: Number(discountValue),
          starts_at: startsAt || new Date().toISOString(),
          ends_at: endsAt || null,
          max_redemptions: maxRedemptions || null,
          max_per_email: Number(maxPerEmail),
          min_order_amount: Number(minimumAmount),
          active: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create promotion.');
      setMessage('Promotion created.');
      setCode('');
      await load();
    } catch (error: any) {
      setMessage(error.message || 'Unable to create promotion.');
    } finally {
      setBusy(false);
    }
  };

  const disablePromotion = async (promotionId: string) => {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/events/${eventId}/promotions?promotion_id=${promotionId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to disable promotion.');
      setMessage('Promotion disabled.');
      await load();
    } catch (error: any) {
      setMessage(error.message || 'Unable to disable promotion.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px', color: 'var(--text-strong)' }}>
      <div style={{ marginBottom: 22 }}>
        <Link href={`/admin/events/${eventId}`} style={{ color: 'var(--brand)', textDecoration: 'none', fontSize: 13 }}>← Back to event</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '10px 0 6px' }}>Pricing & promotions</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Create time-limited early-bird prices or coupon codes. Discounts are validated on the server.</p>
      </div>

      <form onSubmit={createPromotion} className="fluent-card" style={{ padding: 20, display: 'grid', gap: 14, marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 650 }}>Create a promotion</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>Offer type
            <select className="fluent-input" value={promotionType} onChange={(e) => setPromotionType(e.target.value as any)}>
              <option value="coupon">Coupon code</option>
              <option value="early_bird">Early-bird offer</option>
            </select>
          </label>
          {promotionType === 'coupon' && <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>Coupon code
            <input className="fluent-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="MSC20" required />
          </label>}
          <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>Discount type
            <select className="fluent-input" value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount (₹)</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>{discountType === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
            <input className="fluent-input" type="number" min="1" max={discountType === 'percentage' ? 99 : undefined} step="1" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} required />
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>Starts at
            <input className="fluent-input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>Ends at
            <input className="fluent-input" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>Total redemptions (optional)
            <input className="fluent-input" type="number" min="1" step="1" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="Unlimited" />
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>Uses per email
            <input className="fluent-input" type="number" min="1" step="1" value={maxPerEmail} onChange={(e) => setMaxPerEmail(e.target.value)} required />
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>Minimum order (₹)
            <input className="fluent-input" type="number" min="0" step="1" value={minimumAmount} onChange={(e) => setMinimumAmount(e.target.value)} required />
          </label>
        </div>
        <button className="fluent-btn fluent-btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create promotion'}</button>
        {message && <p role="status" style={{ margin: 0, fontSize: 13 }}>{message}</p>}
      </form>

      <section style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 650, margin: 0 }}>Existing promotions</h2>
        {promotions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No promotions created yet.</p>}
        {promotions.map((promotion) => (
          <article key={promotion.id} className="fluent-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <strong>{promotion.promotion_type === 'early_bird' ? 'Early-bird offer' : promotion.code}</strong>
              <p style={{ margin: '5px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                {promotion.discount_type === 'percentage' ? `${promotion.discount_value}% off` : `₹${promotion.discount_value} off`} · {promotion.max_redemptions ? `${promotion.max_redemptions} total uses` : 'No total use limit'} · {promotion.active ? 'Active' : 'Disabled'}
              </p>
              <small style={{ color: 'var(--text-muted)' }}>{new Date(promotion.starts_at).toLocaleString()} {promotion.ends_at ? `to ${new Date(promotion.ends_at).toLocaleString()}` : '· No end date'}</small>
            </div>
            {promotion.active && <button type="button" className="fluent-btn fluent-btn-secondary" disabled={busy} onClick={() => disablePromotion(promotion.id)}>Disable</button>}
          </article>
        ))}
      </section>
    </main>
  );
}
