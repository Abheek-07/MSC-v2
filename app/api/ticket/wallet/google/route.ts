import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getConfirmedWalletTicket } from '@/lib/wallet-ticket';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { enforcePayloadSize, isPayloadTooLargeError, isValidUUID } from '@/lib/security';

export const dynamic = 'force-dynamic';

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signedJwt(payload: Record<string, unknown>, privateKey: string) {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const input = `${header}.${body}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(input), privateKey);
  return `${input}.${base64url(signature)}`;
}

async function getGoogleAccessToken(serviceAccount: any) {
  const now = Math.floor(Date.now() / 1000);
  const assertion = signedJwt({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }, serviceAccount.private_key);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok || typeof result.access_token !== 'string') {
    throw new Error('Google Wallet authentication failed');
  }
  return result.access_token as string;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req.headers);
    const limit = await checkRateLimit(`wallet_google_${ip}`, 'api');
    if (!limit.success) return NextResponse.json({ error: 'Too many wallet requests.' }, { status: 429 });

    const raw = await enforcePayloadSize(req, 8 * 1024);
    let body: any;
    try { body = JSON.parse(raw); } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    if (!isValidUUID(body?.token)) {
      return NextResponse.json({ error: 'Invalid ticket token.' }, { status: 400 });
    }

    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    const classId = process.env.GOOGLE_WALLET_CLASS_ID;
    const serviceAccountRaw = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON;
    if (!issuerId || !classId || !serviceAccountRaw) {
      return NextResponse.json({ error: 'Google Wallet is not configured for this site yet.' }, { status: 503 });
    }

    const ticket = await getConfirmedWalletTicket(body.token);
    if (!ticket) return NextResponse.json({ error: 'This ticket is not active or confirmed.' }, { status: 409 });

    let serviceAccount: any;
    try { serviceAccount = JSON.parse(serviceAccountRaw); } catch {
      return NextResponse.json({ error: 'Google Wallet service account configuration is invalid.' }, { status: 503 });
    }

    const objectId = `${issuerId}.msc_${ticket.token.replace(/-/g, '')}`;
    const accessToken = await getGoogleAccessToken(serviceAccount);
    const eventTime = new Date(ticket.eventDate);
    const objectPayload = {
      id: objectId,
      classId,
      state: 'ACTIVE',
      ticketHolderName: ticket.attendeeName,
      ticketNumber: ticket.registrationNumber,
      barcode: { type: 'QR_CODE', value: ticket.token, alternateText: 'MSC event ticket' },
      eventName: { defaultValue: { language: 'en', value: ticket.eventTitle } },
      venue: { name: ticket.eventLocation },
      dateTime: { start: Number.isNaN(eventTime.getTime()) ? ticket.eventDate : eventTime.toISOString() },
      textModulesData: [
        { id: 'community', header: 'Organizer', body: 'Microsoft Student Community, SRM University-AP' },
      ],
    };

    const apiUrl = `https://walletobjects.googleapis.com/walletobjects/v1/eventTicketObject/${encodeURIComponent(objectId)}`;
    const create = await fetch(apiUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

    if (create.status === 404) {
      const response = await fetch('https://walletobjects.googleapis.com/walletobjects/v1/eventTicketObject', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(objectPayload),
        cache: 'no-store',
      });
      if (!response.ok && response.status !== 409) {
        console.error('[Google Wallet object create failed]', response.status, await response.text());
        return NextResponse.json({ error: 'Could not create the Google Wallet ticket.' }, { status: 502 });
      }
    } else if (!create.ok) {
      console.error('[Google Wallet object lookup failed]', create.status);
      return NextResponse.json({ error: 'Could not access the Google Wallet ticket.' }, { status: 502 });
    }

    const saveJwt = signedJwt({
      iss: serviceAccount.client_email,
      aud: 'google',
      typ: 'savetowallet',
      payload: { eventTicketObjects: [{ id: objectId }] },
    }, serviceAccount.private_key);

    return NextResponse.json({ saveUrl: `https://pay.google.com/gp/v/save/${saveJwt}` }, {
      headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (error) {
    if (isPayloadTooLargeError(error)) return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    console.error('[Google Wallet route]', error);
    return NextResponse.json({ error: 'Google Wallet ticket generation failed.' }, { status: 500 });
  }
}
