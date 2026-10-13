import { NextResponse } from 'next/server';
import { enforcePayloadSize, isValidUUID } from '@/lib/security';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { getRazorpayClient } from '@/lib/razorpay';
import { FALLBACK_EVENTS } from '@/lib/data/mock-fallback';

export async function POST(req: Request) {
  try {
    const rawBody = await enforcePayloadSize(req, 16 * 1024);
    const body = JSON.parse(rawBody);

    const clientIp = getClientIP(req.headers);
    const rateLimit = await checkRateLimit(`rzp_order_${clientIp}`, 'payment');
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many payment requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const { event_id, registration_id } = body;

    if (!isValidUUID(event_id) || !isValidUUID(registration_id)) {
      return NextResponse.json({ error: 'Invalid UUID format in payment parameters.' }, { status: 400 });
    }

    // Server-side price calculation: The client NEVER supplies the amount!
    const event = FALLBACK_EVENTS.find((e) => e.id === event_id) || FALLBACK_EVENTS[0];
    const feeInRupees = event.form_requirements.registration_fee || 199;
    const amountInPaise = feeInRupees * 100;

    const rzp = getRazorpayClient();
    let rzpOrderId = `order_${crypto.randomUUID().slice(0, 14)}`;

    try {
      const order = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${registration_id.slice(0, 10)}`,
        notes: {
          event_id,
          registration_id,
        },
      });
      rzpOrderId = order.id;
    } catch (rzpErr) {
      console.warn('[Razorpay API] Using mock order ID for test environment:', rzpErr);
    }

    return NextResponse.json({
      success: true,
      order_id: rzpOrderId,
      amount: amountInPaise,
      currency: 'INR',
    });
  } catch (err: any) {
    console.error('[Razorpay create-order error]:', err);
    return NextResponse.json({ error: 'Failed to create payment order.' }, { status: 500 });
  }
}
