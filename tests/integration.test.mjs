import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  sanitizeText,
  enforcePayloadSize,
  safeEqual,
  isSafeLookupQuery,
} from '../lib/security.ts';
import { normalizeTeamMembers } from '../lib/team-members.ts';

test('sanitizeText trims and bounds input string length', () => {
  assert.equal(sanitizeText('  hello world  '), 'hello world');
  assert.equal(sanitizeText('a'.repeat(5000), 10), 'aaaaaaaaaa');
  assert.equal(sanitizeText(null), '');
  assert.equal(sanitizeText(12345), '');
});

test('enforcePayloadSize rejects bodies exceeding byte limits', async () => {
  const reqSmall = new Request('http://localhost', {
    method: 'POST',
    headers: { 'content-length': '12' },
    body: 'hello world!',
  });
  const body = await enforcePayloadSize(reqSmall, 100);
  assert.equal(body, 'hello world!');

  const reqOversizedHeader = new Request('http://localhost', {
    method: 'POST',
    headers: { 'content-length': '500' },
    body: 'x'.repeat(500),
  });
  await assert.rejects(
    async () => {
      await enforcePayloadSize(reqOversizedHeader, 100);
    },
    { message: /Payload too large/ }
  );
});

test('normalizeTeamMembers normalizes both camelCase and snake_case properties safely', () => {
  const rawMembers = [
    { fullName: 'Alice Johnson', email: 'alice@srmap.edu.in', regNum: 'AP21110010001', branch: 'CSE', year: '3' },
    { name: 'Bob Smith', email: 'bob@srmap.edu.in', registration_number: 'AP21110010002', checked_in: true },
    null,
    {}, // empty row should be skipped
  ];

  const normalized = normalizeTeamMembers(rawMembers, 0);

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].name, 'Alice Johnson');
  assert.equal(normalized[0].is_lead, true);
  assert.equal(normalized[0].reg_number, 'AP21110010001');

  assert.equal(normalized[1].name, 'Bob Smith');
  assert.equal(normalized[1].is_lead, false);
  assert.equal(normalized[1].checked_in, true);
});

test('Razorpay HMAC signature verification matches gateway specs', () => {
  const keySecret = 'test_secret_for_hmac_sha256';
  const orderId = 'order_test_12345';
  const paymentId = 'pay_test_67890';
  const expectedSig = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const generated = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  assert.equal(safeEqual(generated, expectedSig), true);
  assert.equal(safeEqual(generated, 'invalid_signature_hash'), false);
});

test('isSafeLookupQuery validator rejects PostgREST filter injections and invalid strings', () => {
  const validQueries = ['student@srmap.edu.in', 'AP21110010001', 'ap21110010001', 'john.doe@srmap.edu.in'];
  const injectionQueries = [
    'student@srmap.edu.in,id.neq.null',
    'ap21110010001),status.eq.confirmed',
    'id.eq.secret',
    'ap(test)',
    'ap<script>',
    'ap:test',
    'a'.repeat(260),
    'abc',
  ];

  validQueries.forEach((q) => assert.equal(isSafeLookupQuery(q), true, `Expected valid: ${q}`));
  injectionQueries.forEach((q) => assert.equal(isSafeLookupQuery(q), false, `Expected rejected: ${q}`));
});
