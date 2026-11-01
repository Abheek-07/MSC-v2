import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { safeEqual } from '@/lib/security';

let razorpayInstance: Razorpay | null = null;

function getRequiredCredential(name: 'RAZORPAY_KEY_ID' | 'RAZORPAY_KEY_SECRET'): string {
  const value = process.env[name];
  if (!value || value.toLowerCase().includes('placeholder')) {
    throw new Error(`${name} is not configured with a valid credential.`);
  }
  return value;
}

export function getRazorpayClient(): Razorpay {
  if (razorpayInstance) return razorpayInstance;

  razorpayInstance = new Razorpay({
    key_id: getRequiredCredential('RAZORPAY_KEY_ID'),
    key_secret: getRequiredCredential('RAZORPAY_KEY_SECRET'),
  });

  return razorpayInstance;
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || secret.toLowerCase().includes('placeholder')) return false;

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return safeEqual(generatedSignature, signature);
}

export function verifyWebhookSignature(rawBody: string, webhookSignature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.toLowerCase().includes('placeholder')) return false;

  const generatedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return safeEqual(generatedSignature, webhookSignature);
}
