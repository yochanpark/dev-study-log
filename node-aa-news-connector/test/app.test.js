const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { createAaClient } = require('../aaClient');
const { createApp } = require('../app');

// 가짜 Control Room
async function fakeControlRoom(t) {
    const requests = [];
    const server = createServer((req, res) => {
        let raw = '';
        req.on('data', (c) => (raw += c));
        req.on('end', () => {
            requests.push({ url: req.url, auth: req.headers['x-authorization'], body: JSON.parse(raw) });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(req.url === '/v2/authentication' ? { token: 'tok-1' } : { deploymentId: 'dep-1' }));
        });
    });
    await new Promise((r) => server.listen(0, r));
    t.after(() => server.close());
    return { requests, url: `http://127.0.0.1:${server.address().port}` };
}

async function startApp(t, aa) {
    const server = createApp({ aa }).listen(0);
    await new Promise((r) => server.once('listening', r));
    t.after(() => server.close());
    const base = `http://127.0.0.1:${server.address().port}`;
    return (method, path, body) =>
        fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
}

test('토큰 발급 → X-Authorization으로 봇 실행, 입력은 dicInput', async (t) => {
    const cr = await fakeControlRoom(t);
    const aa = createAaClient({ controlRoomUrl: cr.url, username: 'u', apiKey: 'k', botId: 101, automationName: 'news' });
    const call = await startApp(t, aa);

    const res = await (await call('POST', '/run-bot', { keyword: 'RPA' })).json();
    assert.deepEqual(res, { result: 'ok', deploymentId: 'dep-1' });
    assert.deepEqual(cr.requests[0].body, { username: 'u', apiKey: 'k', multipleLogin: true });
    assert.equal(cr.requests[1].auth, 'tok-1');
    assert.deepEqual(cr.requests[1].body, {
        botId: 101,
        automationName: 'news',
        botInput: { dicInput: { type: 'DICTIONARY', dictionary: { keyword: 'RPA' } } },
    });
});

test('봇이 보낸 뉴스를 저장하고 목록 화면에 그린다', async (t) => {
    const call = await startApp(t, { deployBot: async () => ({}) });

    assert.equal((await call('POST', '/rpa/news', { newstitle: '배열 아님' })).status, 400);

    const news = [{ newstitle: 'RPA 도입 사례', url: 'https://example.com/1', date: '2025-03-04' }, { newstitle: '<b>태그</b>' }];
    assert.deepEqual(await (await call('POST', '/rpa/news', news)).json(), { result: 'ok', count: 2 });
    assert.deepEqual(await (await call('GET', '/news/list/json')).json(), news);

    const html = await (await call('GET', '/news/list')).text();
    assert.match(html, /RPA 도입 사례/);
    assert.match(html, /&lt;b&gt;태그&lt;\/b&gt;/); // 제목은 이스케이프해서 출력
});

test('Control Room 오류는 502로 알린다', async (t) => {
    const call = await startApp(t, { deployBot: async () => { throw new Error('토큰 발급 실패: 401'); } });
    const res = await call('POST', '/run-bot', {});
    assert.equal(res.status, 502);
    assert.match((await res.json()).message, /401/);
});
