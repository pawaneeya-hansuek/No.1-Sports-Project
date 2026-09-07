import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';

test('admin search, drafts and section request ordering', async () => {
  globalThis.location = { hash: '#admin' };
  globalThis.window = { location: { href: 'http://localhost/#admin' } };
  const server = await createServer({ server: { middlewareMode: true }, define: { 'import.meta.env.VITE_PREVIEW_MODE': '"false"' } });
  try {
    const s = await server.ssrLoadModule('/src/state.js');
    assert.equal(s.PREVIEW, false);
    s.user.value = { id: 1, role: 'admin' };
    const searches = [];
    globalThis.fetch = async url => {
      searches.push(url.searchParams.get('search'));
      return Response.json({ rows: [], total: 0, stats: {}, dashboard: {} });
    };
    s.adminSearch.value = '  first  ';
    await s.searchAdmin();
    s.adminSearch.value = 'unfinished';
    await s.refreshAdmin();
    assert.deepEqual(searches, ['first', 'first']);

    s.settings.value = { address: 'saved', booking_enabled: 1 };
    s.resetSettingsDraft();
    assert.equal(s.settingsDirty.value, false);
    s.settingsDraft.value.address = 'draft';
    await s.loadAdmin();
    assert.equal(s.settingsDraft.value.address, 'draft');
    assert.equal(s.settingsDirty.value, true);
    s.resetSettingsDraft();
    assert.equal(s.settingsDraft.value.address, 'saved');

    const pending = [];
    globalThis.fetch = () => new Promise(resolve => pending.push(resolve));
    s.adminTab.value = 'fields';
    // Flush the tab watcher before starting a newer refresh.
    await new Promise(resolve => setTimeout(resolve, 0));
    const latest = s.refreshAdminSection();
    pending[1](Response.json([{ id: 2, name: 'latest' }]));
    await latest;
    pending[0](Response.json([{ id: 1, name: 'stale' }]));
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(s.allFields.value[0].name, 'latest');
    globalThis.fetch = async () => { throw new Error('offline'); };
    await s.refreshAdminSection();
    assert.ok(s.adminSectionError.value);
    assert.equal(s.adminSectionLoading.value, false);
    assert.equal(s.allFields.value[0].name, 'latest');
    globalThis.fetch = async () => Response.json([]);
    const { default: Admin } = await server.ssrLoadModule('/src/Admin.vue');
    for (const tab of ['bookings', 'fields', 'settings', 'audit']) {
      s.adminTab.value = tab;
      const html = await renderToString(createSSRApp(Admin));
      assert.ok(html.includes('admin-page'));
      assert.ok(!html.includes('undefined'));
    }
  } finally {
    await server.close();
  }
});
