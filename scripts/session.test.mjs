import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('login succeeds even when the following booking refresh is offline', async () => {
  globalThis.location = { hash: '#home' };
  globalThis.window = { location: { href: 'http://localhost/#home' }, scrollTo() {} };
  const server = await createServer({ server: { middlewareMode: true, ws: false }, define: { 'import.meta.env.VITE_PREVIEW_MODE': '"false"' } });
  try {
    const s = await server.ssrLoadModule('/src/state.js');
    s.show('auth');
    s.auth.value.password = 'temporary-password';
    globalThis.fetch = async url => {
      if (url.searchParams.get('action') === 'login')
        return Response.json({ user: { id: 7, role: 'customer' }, csrf: 'session-token' });
      throw new TypeError('offline');
    };
    await s.authenticate();
    assert.equal(s.user.value.id, 7);
    assert.equal(s.modal.value, '');
    assert.equal(s.auth.value.password, '');
    assert.equal(s.error.value, '');
    assert.match(s.offline.value, /เชื่อมต่อเซิร์ฟเวอร์ไม่ได้/);
    assert.match(s.notice.value, /เข้าสู่ระบบแล้ว/);
  } finally {
    await server.close();
  }
});

test('closing the scanner while camera permission is pending releases the camera', async () => {
  globalThis.location = { hash: '#admin' };
  let grant;
  let stopped = 0;
  const original = Object.getOwnPropertyDescriptor(globalThis.navigator, 'mediaDevices');
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: () => new Promise(resolve => { grant = resolve; }) },
  });
  const server = await createServer({ server: { middlewareMode: true, ws: false }, define: { 'import.meta.env.VITE_PREVIEW_MODE': '"false"' } });
  try {
    const s = await server.ssrLoadModule('/src/state.js');
    const pending = s.startScanner();
    s.stopScanner();
    grant({ getTracks: () => [{ stop() { stopped++; } }] });
    await pending;
    assert.equal(stopped, 1);
    assert.equal(s.scanError.value, '');
  } finally {
    if (original) Object.defineProperty(globalThis.navigator, 'mediaDevices', original);
    else delete globalThis.navigator.mediaDevices;
    await server.close();
  }
});
