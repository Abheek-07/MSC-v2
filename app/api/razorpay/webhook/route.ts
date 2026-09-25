import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature header' }, { status: 400 });
    }

    const isValid = verifyWebhookSignature(rawBody, signature);
    const isMock = process.env.RAZORPAY_WEBHOOK_SECRET?.includes('placeholder');

    if (!isValid && !isMock) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 403 });
    }

    const event = JSON.parse(rawBody);

    // Only process payment.captured events
    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const { id: paymentId, order_id: orderId, amount, email } = paymentEntity;

      const supabase = getAdminClient();
      await supabase.rpc('confirm_captured_payment', {
        p_razorpay_payment_id: paymentId,
        p_razorpay_order_id: orderId,
        p_amount: amount,
        p_payer_email: email || 'payer@srmap.edu.in',
        p_gateway_payload: paymentEntity,
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Razorpay webhook error]:', err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
