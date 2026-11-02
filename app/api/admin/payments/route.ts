import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, noStoreJson } from '@/lib/api-security';
import { checkRateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

function dateValue(value: unknown): number {
  if (typeof value !== 'string') return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const limit = await checkRateLimit(auth.user.id, 'admin');
    if (!limit.success) return noStoreJson({ error: 'Rate limit exceeded.' }, 429);

    const url = new URL(req.url);
    const eventId = url.searchParams.get('event_id') || '';
    const statusFilter = url.searchParams.get('status') || 'all';
    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';
    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    const format = url.searchParams.get('format') || 'json';

    const supabase = getAdminClient();
    let ordersQuery = supabase.from('payment_orders').select('*').order('created_at', { ascending: false }).limit(2000);
    let paymentsQuery = supabase.from('payments').select('*').order('verified_at', { ascending: false }).limit(2000);
    if (eventId) {
      ordersQuery = ordersQuery.eq('event_id', eventId);
      paymentsQuery = paymentsQuery.eq('event_id', eventId);
    }

    const [{ data: orders, error: ordersError }, { data: payments, error: paymentsError }] = await Promise.all([
      ordersQuery,
      paymentsQuery,
    ]);
    if (ordersError) throw ordersError;
    if (paymentsError) throw paymentsError;

    const orderRows = orders || [];
    const paymentRows = payments || [];
    const eventIds = [...new Set([...orderRows, ...paymentRows].map((row: any) => row.event_id).filter(Boolean))];
    const registrationIds = [...new Set([...orderRows, ...paymentRows].map((row: any) => row.registration_id).filter(Boolean))];

    const [{ data: events, error: eventsError }, { data: registrations, error: registrationsError }] = await Promise.all([
      eventIds.length ? supabase.from('events').select('id,title').in('id', eventIds) : Promise.resolve({ data: [], error: null }),
      registrationIds.length ? supabase.from('registrations').select('id,lead_email,form_data,team_data,status').in('id', registrationIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (eventsError) throw eventsError;
    if (registrationsError) throw registrationsError;

    const eventMap = new Map((events || []).map((event: any) => [event.id, event.title]));
    const registrationMap = new Map((registrations || []).map((registration: any) => [registration.id, registration]));
    const paymentByOrder = new Map(paymentRows.map((payment: any) => [payment.razorpay_order_id, payment]));

    const rows = orderRows.map((order: any) => {
      const payment: any = paymentByOrder.get(order.razorpay_order_id);
      const registration: any = registrationMap.get(order.registration_id);
      const status = payment?.status === 'captured'
        ? 'captured'
        : order.status === 'paid'
          ? 'paid_unverified'
          : String(order.status || 'unknown').toLowerCase();
      return {
        order_id: order.razorpay_order_id || '',
        payment_id: payment?.razorpay_payment_id || '',
        registration_id: order.registration_id || '',
        event_id: order.event_id || '',
        event: eventMap.get(order.event_id) || 'Unknown event',
        attendee: registration?.form_data?.full_name || registration?.form_data?.name || registration?.lead_email || payment?.payer_email || 'Unknown attendee',
        email: registration?.lead_email || payment?.payer_email || '',
        amount_paise: Number(payment?.amount ?? order.amount ?? 0),
        currency: payment?.currency || order.currency || 'INR',
        status,
        order_status: order.status || '',
        payment_status: payment?.status || '',
        created_at: order.created_at || '',
        paid_at: payment?.verified_at || payment?.created_at || '',
        payment_record_id: payment?.id || '',
        registration_status: registration?.status || '',
      };
    });

    // Include captured payment rows even if their order record is missing, so reconciliation exposes orphaned records.
    const knownPaymentIds = new Set(rows.map((row: any) => row.payment_id).filter(Boolean));
    for (const payment of paymentRows as any[]) {
      if (knownPaymentIds.has(payment.razorpay_payment_id)) continue;
      const registration: any = registrationMap.get(payment.registration_id);
      rows.push({
        order_id: payment.razorpay_order_id || '',
        payment_id: payment.razorpay_payment_id || '',
        registration_id: payment.registration_id || '',
        event_id: payment.event_id || '',
        event: eventMap.get(payment.event_id) || 'Unknown event',
        attendee: registration?.form_data?.full_name || registration?.form_data?.name || registration?.lead_email || payment.payer_email || 'Unknown attendee',
        email: registration?.lead_email || payment.payer_email || '',
        amount_paise: Number(payment.amount || 0),
        currency: 'INR',
        status: String(payment.status || 'unknown').toLowerCase(),
        order_status: 'missing_order_record',
        payment_status: payment.status || '',
        created_at: payment.created_at || '',
        paid_at: payment.verified_at || payment.created_at || '',
        payment_record_id: payment.id || '',
        registration_status: registration?.status || '',
      });
    }

    const filtered = rows.filter((row: any) => {
      const date = dateValue(row.paid_at || row.created_at);
      if (from && date < dateValue(from)) return false;
      if (to && date > dateValue(to + 'T23:59:59.999Z')) return false;
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (search) {
        const haystack = [row.event, row.attendee, row.email, row.order_id, row.payment_id, row.registration_id].join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
    filtered.sort((a: any, b: any) => dateValue(b.paid_at || b.created_at) - dateValue(a.paid_at || a.created_at));

    const captured = filtered.filter((row: any) => row.status === 'captured');
    const summary = {
      total_orders: filtered.length,
      captured_count: captured.length,
      pending_count: filtered.filter((row: any) => ['created', 'creating'].includes(row.status)).length,
      failed_count: filtered.filter((row: any) => row.status === 'failed').length,
      cancelled_count: filtered.filter((row: any) => row.status === 'cancelled').length,
      captured_amount_paise: captured.reduce((sum: number, row: any) => sum + row.amount_paise, 0),
      reconciliation_exceptions: filtered.filter((row: any) =>
        row.status === 'paid_unverified'
        || (row.status === 'captured' && row.order_status === 'missing_order_record')
      ).length,
    };

    if (format === 'csv') {
      const csv = Papa.unparse(filtered.map((row: any) => ({
        Event: row.event,
        Attendee: row.attendee,
        Email: row.email,
        'Order ID': row.order_id,
        'Payment ID': row.payment_id,
        'Registration ID': row.registration_id,
        'Amount (INR)': (row.amount_paise / 100).toFixed(2),
        Status: row.status,
        'Order Status': row.order_status,
        'Payment Status': row.payment_status,
        'Order Created': row.created_at,
        'Paid At': row.paid_at,
      })));
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="MSC_Payment_Reconciliation_${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    return noStoreJson({ rows: filtered, summary, events: (events || []).map((event: any) => ({ id: event.id, title: event.title })) });
  } catch (error) {
    console.error('[Admin payments] failed:', error);
    return noStoreJson({ error: 'Failed to load payment records.' }, 500);
  }
}
