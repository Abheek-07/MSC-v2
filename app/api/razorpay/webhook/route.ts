import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, 'utf8') > 1024 * 1024) {
      return NextResponse.json({ error: 'Webhook payload too large.' }, { status: 413 });
    }

    const signature = req.headers.get('x-razorpay-signature');
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 403 });
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 });
    }

    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      if (
        !payment ||
        typeof payment.id !== 'string' ||
        typeof payment.order_id !== 'string' ||
        payment.status !== 'captured' ||
        payment.currency !== 'INR' ||
        !Number.isSafeInteger(payment.amount) ||
        payment.amount <= 0
      ) {
        return NextResponse.json({ error: 'Invalid captured-payment payload.' }, { status: 400 });
      }

      const supabase = getAdminClient();
      const { error } = await supabase.rpc('confirm_captured_payment', {
        p_razorpay_payment_id: payment.id,
        p_razorpay_order_id: payment.order_id,
        p_amount: payment.amount,
        p_payer_email: payment.email || null,
        p_gateway_payload: payment,
      });

      if (error) {
        console.error('[Razorpay webhook confirmation failed]:', error.message);
        return NextResponse.json({ error: 'Payment confirmation could not be recorded.' }, { status: 503 });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[Razorpay webhook error]:', err);
    return NextResponse.json({ error: 'Webhook processing error.' }, { status: 500 });
  }
}
