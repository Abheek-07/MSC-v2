import { NextResponse } from 'next/server';
import { enforcePayloadSize, isPayloadTooLargeError } from '@/lib/security';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { verifyRazorpaySignature, getRazorpayClient } from '@/lib/razorpay';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rawBody = await enforcePayloadSize(req, 16 * 1024);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const clientIp = getClientIP(req.headers);
    const rateLimit = await checkRateLimit(`rzp_verify_${clientIp}`, 'payment');
    if (!rateLimit.success) return NextResponse.json({ error: 'Too many verification attempts.' }, { status: 429 });

    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;
    if (
      typeof orderId !== 'string' || !orderId.startsWith('order_') ||
      typeof paymentId !== 'string' || !paymentId.startsWith('pay_') ||
      typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)
    ) {
      return NextResponse.json({ error: 'Invalid payment verification parameters.' }, { status: 400 });
    }

    if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
      return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 });
    }

    const payment = await getRazorpayClient().payments.fetch(paymentId);
    if (payment.status !== 'captured') return NextResponse.json({ error: 'Payment has not been captured.' }, { status: 409 });
    if (payment.order_id !== orderId) return NextResponse.json({ error: 'Payment does not belong to the supplied order.' }, { status: 400 });
    const amountPaise = Number(payment.amount);
    if (payment.currency !== 'INR' || !Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      return NextResponse.json({ error: 'Payment amount or currency is invalid.' }, { status: 400 });
    }

    const { data, error } = await getAdminClient().rpc('confirm_captured_payment', {
      p_razorpay_payment_id: paymentId,
      p_razorpay_order_id: orderId,
      p_amount: amountPaise,
      p_payer_email: payment.email || null,
      p_gateway_payload: payment,
    });

    if (error) {
      console.error('[Payment confirmation RPC failed]:', error.message);
      return NextResponse.json({ error: 'Payment was verified by the gateway but could not be recorded. Contact support before retrying.' }, { status: 503 });
    }
    if (!data || data.success !== true) {
      console.error('[Payment confirmation rejected]:', data?.error || 'Unknown RPC rejection');
      return NextResponse.json({ error: data?.error || 'Payment confirmation was rejected.' }, { status: 409 });
    }

    return NextResponse.json({ success: true, status: 'confirmed', confirmation: data });
  } catch (err) {
    if (isPayloadTooLargeError(err)) {
      return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    }
    console.error('[Verify-payment error]:', err);
    return NextResponse.json({ error: 'Payment verification failed. Please retry or contact support.' }, { status: 502 });
  }
}
