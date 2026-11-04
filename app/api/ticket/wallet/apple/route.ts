import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import archiver from 'archiver';
import sharp from 'sharp';
import { getConfirmedWalletTicket } from '@/lib/wallet-ticket';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { isValidUUID } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);
const MSC_LOGO_URL = 'https://lkbwunzswqbnoygxtilm.supabase.co/storage/v1/object/public/webpage/MSC%20Logo.png';

function escapeJson(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

async function makeIcon() {
  const response = await fetch(MSC_LOGO_URL, { cache: 'force-cache' });
  if (!response.ok) throw new Error('MSC logo asset is unavailable');
  const source = Buffer.from(await response.arrayBuffer());
  return sharp(source).resize(29, 29, { fit: 'contain' }).png().toBuffer();
}

async function createPkpass(pass: Record<string, any>, icon: Buffer) {
  const certificate = process.env.APPLE_WALLET_SIGNING_CERTIFICATE;
  const privateKey = process.env.APPLE_WALLET_PRIVATE_KEY;
  const wwdrCertificate = process.env.APPLE_WALLET_WWDR_CERTIFICATE;
  if (!certificate || !privateKey || !wwdrCertificate) {
    throw new Error('Apple Wallet signing credentials are missing');
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'msc-wallet-'));
  try {
    const passPath = path.join(tempDir, 'pass.json');
    const iconPath = path.join(tempDir, 'icon.png');
    const manifestPath = path.join(tempDir, 'manifest.json');
    const signaturePath = path.join(tempDir, 'signature');
    const certPath = path.join(tempDir, 'signer.pem');
    const keyPath = path.join(tempDir, 'signer-key.pem');
    const wwdrPath = path.join(tempDir, 'wwdr.pem');

    await Promise.all([
      fs.writeFile(passPath, JSON.stringify(pass)),
      fs.writeFile(iconPath, icon),
      fs.writeFile(certPath, certificate),
      fs.writeFile(keyPath, privateKey),
      fs.writeFile(wwdrPath, wwdrCertificate),
    ]);

    const manifest = {
      'pass.json': crypto.createHash('sha1').update(await fs.readFile(passPath)).digest('hex'),
      'icon.png': crypto.createHash('sha1').update(icon).digest('hex'),
    };
    const manifestBytes = Buffer.from(JSON.stringify(manifest));
    await fs.writeFile(manifestPath, manifestBytes);

    // Apple's Wallet pass signature is detached CMS/PKCS#7. OpenSSL is used
    // only for this standard signing operation; pass data remains server-side.
    await execFileAsync('openssl', [
      'smime', '-binary', '-sign',
      '-signer', certPath,
      '-inkey', keyPath,
      '-certfile', wwdrPath,
      '-in', manifestPath,
      '-out', signaturePath,
      '-outform', 'DER',
    ]);

    const chunks: Buffer[] = [];
    const archive = archiver('zip', { store: true });
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    const finished = new Promise<void>((resolve, reject) => {
      archive.on('end', resolve);
      archive.on('error', reject);
    });
    archive.file(passPath, { name: 'pass.json' });
    archive.file(iconPath, { name: 'icon.png' });
    archive.file(manifestPath, { name: 'manifest.json' });
    archive.file(signaturePath, { name: 'signature' });
    await archive.finalize();
    await finished;
    return Buffer.concat(chunks);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export async function GET(req: Request, context: { params?: Promise<Record<string, string>> }) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';
    if (!isValidUUID(token)) return NextResponse.json({ error: 'Invalid ticket token.' }, { status: 400 });

    const ip = getClientIP(req.headers);
    const limit = await checkRateLimit(`wallet_apple_${ip}`, 'api');
    if (!limit.success) return NextResponse.json({ error: 'Too many wallet requests.' }, { status: 429 });

    const passTypeIdentifier = process.env.APPLE_WALLET_PASS_TYPE_IDENTIFIER;
    const teamIdentifier = process.env.APPLE_WALLET_TEAM_IDENTIFIER;
    const organizationName = process.env.APPLE_WALLET_ORGANIZATION || 'Microsoft Student Community';
    if (!passTypeIdentifier || !teamIdentifier) {
      return NextResponse.json({ error: 'Apple Wallet is not configured for this site yet.' }, { status: 503 });
    }

    const ticket = await getConfirmedWalletTicket(token);
    if (!ticket) return NextResponse.json({ error: 'This ticket is not active or confirmed.' }, { status: 409 });

    const icon = await makeIcon();
    const serialNumber = `msc-${ticket.token}`;
    const pass = {
      formatVersion: 1,
      passTypeIdentifier,
      serialNumber,
      teamIdentifier,
      organizationName,
      description: `${ticket.eventTitle} ticket`,
      logoText: 'MSC',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(0, 103, 184)',
      labelColor: 'rgb(225, 239, 255)',
      eventTicket: {
        primaryFields: [{ key: 'event', label: 'EVENT', value: ticket.eventTitle }],
        secondaryFields: [
          { key: 'attendee', label: 'ATTENDEE', value: ticket.attendeeName },
          { key: 'date', label: 'DATE', value: new Date(ticket.eventDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) },
        ],
        auxiliaryFields: [
          { key: 'venue', label: 'LOCATION', value: ticket.eventLocation },
          { key: 'registration', label: 'REGISTRATION', value: ticket.registrationNumber },
        ],
      },
      barcode: {
        format: 'PKBarcodeFormatQR',
        message: ticket.token,
        messageEncoding: 'iso-8859-1',
        altText: 'MSC event ticket',
      },
      barcodes: [{
        format: 'PKBarcodeFormatQR',
        message: ticket.token,
        messageEncoding: 'iso-8859-1',
        altText: 'MSC event ticket',
      }],
    };

    const archive = await createPkpass(pass, icon);
    return new NextResponse(new Uint8Array(archive), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="MSC-${ticket.token.slice(0, 8)}.pkpass"`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[Apple Wallet route]', error);
    return NextResponse.json({ error: 'Apple Wallet ticket generation failed. Check server signing configuration.' }, { status: 500 });
  }
}
