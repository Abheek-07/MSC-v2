import { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { getAdminClient } from '@/lib/supabase/admin';
import { validateImageMagicBytes } from '@/lib/security';
import { auditLog, noStoreJson, requireAdmin } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Only these buckets may be written to. The old project let the client pick. */
const ALLOWED_BUCKETS = ['images'] as const;

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    // Enforce pre-parsing size ceiling if Content-Length header is present
    const maxPayloadLimit = MAX_IMAGE_BYTES + 64 * 1024;
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > maxPayloadLimit) {
      return noStoreJson({ error: 'Payload too large (max 5MB)' }, 413);
    }

    if (!req.body) {
      return noStoreJson({ error: 'No file provided' }, 400);
    }

    // Stream byte-counter protects against chunked/missing/misleading Content-Length attacks
    let bytesReceived = 0;
    const byteLimiter = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytesReceived += chunk.byteLength;
        if (bytesReceived > maxPayloadLimit) {
          controller.error(new Error('PAYLOAD_TOO_LARGE'));
          return;
        }
        controller.enqueue(chunk);
      },
    });

    const limitedStream = req.body.pipeThrough(byteLimiter);
    const limitedReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: limitedStream,
      // @ts-expect-error Node/undici RequestInit duplex property
      duplex: 'half',
    });

    let formData: FormData;
    try {
      formData = await limitedReq.formData();
    } catch (parseErr: any) {
      if (parseErr?.message === 'PAYLOAD_TOO_LARGE' || bytesReceived > maxPayloadLimit) {
        return noStoreJson({ error: 'Payload too large (max 5MB)' }, 413);
      }
      return noStoreJson({ error: 'Failed to parse form data' }, 400);
    }
    const file = formData.get('file');
    const pathPrefix = (formData.get('pathPrefix') as string | null) ?? 'upload';
    const bucket = (formData.get('bucket') as string | null) ?? 'images';

    if (!(file instanceof File)) {
      return noStoreJson({ error: 'No file provided' }, 400);
    }

    if (!(ALLOWED_BUCKETS as readonly string[]).includes(bucket)) {
      return noStoreJson({ error: 'Invalid bucket' }, 400);
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return noStoreJson({ error: 'File too large (max 5MB)' }, 413);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Verify the bytes really are an image. The client-declared MIME type and
    // file extension are attacker-controlled and were trusted previously.
    const magic = validateImageMagicBytes(buffer);
    if (!magic.valid) {
      return noStoreJson({ error: 'Unsupported or invalid image format' }, 400);
    }

    // Sanitise the path prefix so it cannot traverse out of the bucket.
    const safePrefix =
      pathPrefix
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'upload';

    const fileName = `${safePrefix}-${crypto.randomUUID()}.${magic.ext}`;

    const supabase = getAdminClient();
    const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
      contentType: magic.mime,
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      console.error('[Upload-image] storage error:', error.message);
      return noStoreJson({ error: 'Upload failed' }, 400);
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    auditLog('UPLOAD_IMAGE', auth.user.id, `${bucket}/${fileName}`);

    return noStoreJson({ url: publicData.publicUrl });
  } catch (err: any) {
    console.error('[Upload-image error]:', err);
    return noStoreJson({ error: 'Upload failed' }, 500);
  }
}
