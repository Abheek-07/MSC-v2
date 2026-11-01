import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, noStoreJson } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

function pdfEscape(value: string) {
  return value.replace(/[^\x20-\x7E]/g, '?').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function makePdf(lines: string[]) {
  const commands = ['BT', '/F1 11 Tf', '50 790 Td', '15 TL'];
  lines.forEach((line, index) => {
    if (index) commands.push('T*');
    commands.push(`(${pdfEscape(line)}) Tj`);
  });
  commands.push('ET');
  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'ascii');
}

export async function GET(_request: Request, context: { params: Promise<{ paymentId: string }> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { paymentId } = await context.params;
    const supabase = getAdminClient();

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .maybeSingle();

    if (error) throw error;
    if (!payment) return noStoreJson({ error: 'Payment record not found.' }, 404);
    if (payment.status !== 'captured') {
      return noStoreJson({ error: 'Receipts are available only for captured payments.' }, 409);
    }

    const [{ data: event }, { data: registration }] = await Promise.all([
      supabase.from('events').select('title').eq('id', payment.event_id).maybeSingle(),
      supabase.from('registrations').select('lead_email,form_data,team_data').eq('id', payment.registration_id).maybeSingle(),
    ]);

    const name = registration?.form_data?.full_name || registration?.form_data?.name || registration?.lead_email || payment.payer_email || 'Attendee';
    const email = registration?.lead_email || payment.payer_email || 'Not provided';
    const receiptNo = `MSC-${String(payment.id).replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    const amount = (Number(payment.amount || 0) / 100).toFixed(2);
    const paidAt = payment.verified_at || payment.created_at || new Date().toISOString();
    const lines = [
      'MICROSOFT STUDENT COMMUNITY - SRM UNIVERSITY AP',
      'PAYMENT RECEIPT',
      '',
      `Receipt Number: ${receiptNo}`,
      `Attendee: ${name}`,
      `Email: ${email}`,
      `Event: ${event?.title || 'MSC Event'}`,
      `Amount Paid: INR ${amount}`,
      `Payment Status: ${payment.status}`,
      `Payment Date: ${new Date(paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
      `Razorpay Order ID: ${payment.razorpay_order_id || 'N/A'}`,
      `Razorpay Payment ID: ${payment.razorpay_payment_id || 'N/A'}`,
      '',
      'This receipt confirms a payment recorded as captured.',
      'Successful payments are final and non-refundable under the event policy.',
      '',
      'This is a computer-generated receipt.',
    ];
    const pdf = makePdf(lines);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${receiptNo}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[Payment receipt] failed:', error);
    return noStoreJson({ error: 'Failed to generate payment receipt.' }, 500);
  }
}
