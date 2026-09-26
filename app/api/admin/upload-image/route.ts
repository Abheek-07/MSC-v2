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
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const formData = await req.formData();
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
