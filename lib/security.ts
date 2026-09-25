import crypto from 'node:crypto';

// Strict UUID regex
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// RFC 5322 compliant email regex
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// E.164 phone number regex (e.g. +919876543210 or 10-digit Indian mobile)
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * Validate UUID string format
 */
export function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

/**
 * Validate email string format and maximum length
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string' || email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== 'string' || phone.length > 20) return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return PHONE_REGEX.test(cleaned);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Run dummy timingSafeEqual against self to normalize timing before returning false
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Get the 32-byte encryption key for AES-256-GCM.
 * Refuses to run if missing or invalid.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.DB_ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error('Fatal: DB_ENCRYPTION_KEY environment variable is not defined.');
  }
  const keyBuf = Buffer.from(envKey, 'utf8');
  if (keyBuf.length !== 32) {
    // If provided as a 64-char hex string, parse it
    if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
      return Buffer.from(envKey, 'hex');
    }
    throw new Error(`Fatal: DB_ENCRYPTION_KEY must be exactly 32 bytes (got ${keyBuf.length} bytes).`);
  }
  return keyBuf;
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns format: "iv:authTag:ciphertext" in hex.
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM ciphertext in format: "iv:authTag:ciphertext"
 */
export function decryptSecret(ciphertextWithMetadata: string): string {
  const key = getEncryptionKey();
  const parts = ciphertextWithMetadata.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format. Expected iv:authTag:ciphertext');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Enforce maximum request payload size ceiling (default 64KB)
 */
export async function enforcePayloadSize(req: Request, maxBytes = 64 * 1024): Promise<string> {
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    throw new Error(`Payload too large. Exceeds limit of ${maxBytes} bytes.`);
  }

  const raw = await req.text();
  if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
    throw new Error(`Payload too large. Exceeds limit of ${maxBytes} bytes.`);
  }

  return raw;
}

/**
 * Clean & truncate free-text fields
 */
export function sanitizeText(text: unknown, maxLength = 4096): string {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, maxLength);
}

/**
 * Magic-byte validation for image uploads
 */
export function validateImageMagicBytes(buffer: Buffer): { valid: boolean; ext?: string; mime?: string } {
  if (buffer.length < 4) return { valid: false };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, ext: 'jpg', mime: 'image/jpeg' };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, ext: 'png', mime: 'image/png' };
  }
  // WebP: RIFF ... WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { valid: true, ext: 'webp', mime: 'image/webp' };
  }

  return { valid: false };
}
