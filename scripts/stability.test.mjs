import test from 'node:test';
import assert from 'node:assert/strict';
import { api, setCsrf } from '../src/api.js';
import { startPolling } from '../src/polling.js';

globalThis.window = { location: { href: 'http://localhost/sports/#home' } };

test('API preserves subdirectory, session and CSRF', async () => {
  setCsrf('test-token');
  globalThis.fetch = async (url, options) => {
    assert.equal(url.pathname, '/sports/api/index.php');
    assert.equal(url.searchParams.get('action'), 'book');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.headers['X-CSRF-Token'], 'test-token');
    return Response.json({ code: 'example' });
  };
  assert.deepEqual(await api('book', {}), { code: 'example' });
});

test('API handles malformed, null and error responses', async () => {
  for (const response of [new Response('<html>error</html>'), Response.json(null), Response.json({ error: 'conflict' }, { status: 409 })]) {
    globalThis.fetch = async () => response;
    await assert.rejects(api('bootstrap'));
  }
});

test('network failures have readable message and never retry a booking', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new TypeError('Failed to fetch'); };
  await assert.rejects(api('book', {}), /เชื่อมต่อเซิร์ฟเวอร์ไม่ได้/);
  assert.equal(calls, 1);
});

test('slow polls do not overlap and stop does not schedule another poll', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  let finish;
  const stop = startPolling(() => {
    calls++;
    return new Promise(resolve => { finish = resolve; });
  }, 5);
  t.mock.timers.tick(5);
  assert.equal(calls, 1);
  t.mock.timers.tick(100);
  assert.equal(calls, 1);
  stop();
  finish();
  await Promise.resolve();
  t.mock.timers.tick(100);
  assert.equal(calls, 1);
});
