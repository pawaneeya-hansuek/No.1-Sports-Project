import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

for (const role of ['admin', 'customer']) {
  test(`shared login and restored session route ${role} to the correct page`, async () => {
    globalThis.location = { hash: '#home' };
    globalThis.window = { location: { href: 'http://localhost/#home' }, scrollTo() {} };
    const server = await createServer({ server: { middlewareMode: true, ws: false }, define: { 'import.meta.env.VITE_PREVIEW_MODE': '"false"' } });
    const calls = [];
    const account = { id: 5, role };
    globalThis.fetch = async url => {
      const action = url.searchParams.get('action');
      calls.push(action);
      if (action === 'login') return Response.json({ user: account, csrf: 'token' });
      if (action === 'bootstrap') return Response.json({ user: account, csrf: 'token', fields: [], settings: { booking_enabled: 1 } });
      if (action === 'availability') return Response.json({ slots: [] });
      if (action === 'admin_bookings') return Response.json({ rows: [], total: 0, stats: {}, dashboard: {} });
      if (action === 'logout') return Response.json({ csrf: 'guest' });
      return Response.json([]);
    };
    const flush = () => new Promise(resolve => setTimeout(resolve, 0));
    try {
      const s = await server.ssrLoadModule('/src/state.js');
      if (role === 'customer') s.route.value = 'admin';
      s.show('auth');
      await s.authenticate();
      await flush();
      const expected = role === 'admin' ? 'admin' : 'home';
      assert.equal(s.route.value, expected);
      assert.equal(location.hash.replace(/^#/, ''), expected);
      assert.equal(s.modal.value, '');
      assert.equal(calls.includes('admin_bookings'), role === 'admin');
      s.route.value = role === 'admin' ? 'bookings' : 'admin';
      await flush();
      assert.equal(s.route.value, expected);
      await s.logout();
      await flush();
      assert.equal(s.user.value, null);
      assert.equal(s.route.value, 'home');
      if (role === 'customer') s.route.value = 'admin';
      await s.boot();
      await flush();
      assert.equal(s.route.value, expected);
      if (role === 'customer') assert.equal(calls.includes('admin_bookings'), false);
    } finally {
      await server.close();
    }
  });
}
