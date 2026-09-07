import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('successful slip remains submitted when subsequent list refresh fails', async () => {
  globalThis.location = { hash: '#bookings' };
  globalThis.window = { location: { href: 'http://localhost/#bookings' } };
  const server = await createServer({ server: { middlewareMode: true, ws: false }, define: { 'import.meta.env.VITE_PREVIEW_MODE': '"false"' } });
  try {
    const s = await server.ssrLoadModule('/src/state.js');
    s.user.value = { id: 5, role: 'customer' };
    s.activeBooking.value = { code: 'TEST', status: 'pending_payment' };
    s.slip.value = new File(['image'], 'slip.png', { type: 'image/png' });
    globalThis.fetch = async url => {
      if (url.searchParams.get('action') === 'slip')
        return Response.json({ ok: true, booking: { code: 'TEST', status: 'review' } });
      throw new TypeError('offline');
    };
    await s.sendSlip();
    assert.equal(s.activeBooking.value.status, 'review');
    assert.equal(s.modal.value, 'ticket');
    assert.equal(s.slip.value, null);
    assert.equal(s.error.value, '');
    assert.match(s.notice.value, /ส่งสลิปแล้ว/);
  } finally {
    await server.close();
  }
});
