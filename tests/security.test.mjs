import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidUUID,
  isValidEmail,
  isValidPhone,
  safeEqual,
  validateImageMagicBytes,
} from '../lib/security.ts';

test('UUID validation accepts canonical UUIDs and rejects malformed values', () => {
  assert.equal(isValidUUID('550e8400-e29b-41d4-a716-446655440000'), true);
  assert.equal(isValidUUID('not-a-uuid'), false);
  assert.equal(isValidUUID(''), false);
});

test('email validation rejects malformed and oversized addresses', () => {
  assert.equal(isValidEmail('student@srmap.edu.in'), true);
  assert.equal(isValidEmail('student@'), false);
  assert.equal(isValidEmail('x'.repeat(250) + '@example.com'), false);
});

test('phone validation accepts Indian and E.164-style numbers', () => {
  assert.equal(isValidPhone('+919876543210'), true);
  assert.equal(isValidPhone('9876543210'), true);
  assert.equal(isValidPhone('123'), false);
});

test('constant-time comparison helper returns false for unequal strings', () => {
  assert.equal(safeEqual('same-value', 'same-value'), true);
  assert.equal(safeEqual('first', 'second'), false);
  assert.equal(safeEqual('', 'x'), false);
});

test('image magic-byte validation accepts supported formats only', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xdb]);
  const invalid = Buffer.from('not an image');

  assert.deepEqual(validateImageMagicBytes(png), { valid: true, ext: 'png', mime: 'image/png' });
  assert.deepEqual(validateImageMagicBytes(jpeg), { valid: true, ext: 'jpg', mime: 'image/jpeg' });
  assert.deepEqual(validateImageMagicBytes(invalid), { valid: false });
});
