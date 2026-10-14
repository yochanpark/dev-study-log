const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGeminiClient } = require('../gemini');
const { createApp } = require('../server');

const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
const reply = (text) => json(200, { candidates: [{ content: { parts: [{ text }] } }] });

function fakeFetch(...responses) {
    const calls = [];
    const fn = async (url, init) => {
        calls.push({ url, headers: init.headers, body: JSON.parse(init.body) });
        return responses.shift();
    };
    fn.calls = calls;
    return fn;
}

test('요청 본문은 contents[].parts[].text, 키는 헤더로', async () => {
    const fetchImpl = fakeFetch(reply('안녕하세요'));
    const llm = createGeminiClient({ apiKey: 'k', model: 'gemini-2.5-flash', fetchImpl });
    assert.equal(await llm.generate('하이'), '안녕하세요');
    assert.match(fetchImpl.calls[0].url, /models\/gemini-2\.5-flash:generateContent$/);
    assert.equal(fetchImpl.calls[0].headers['x-goog-api-key'], 'k');
    assert.deepEqual(fetchImpl.calls[0].body, { contents: [{ role: 'user', parts: [{ text: '하이' }] }] });
});

test('429는 RetryInfo만큼 기다렸다 재시도', async () => {
    const quota = json(429, { error: { message: 'quota', details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '0.01s' }] } });
    const fetchImpl = fakeFetch(quota, reply('ok'));
    const llm = createGeminiClient({ apiKey: 'k', model: 'm', fetchImpl });
    assert.equal(await llm.generate('x'), 'ok');
    assert.equal(fetchImpl.calls.length, 2);
});

test('503이 계속되면 횟수만큼만 시도하고 상태 코드를 넘긴다', async () => {
    const busy = () => json(503, { error: { message: 'overloaded' } });
    const fetchImpl = fakeFetch(busy(), busy());
    const llm = createGeminiClient({ apiKey: 'k', model: 'm', fetchImpl, maxAttempts: 2, maxDelayMs: 1 });
    await assert.rejects(llm.generate('x'), { status: 503 });
    assert.equal(fetchImpl.calls.length, 2);
});

test('/chat은 오류 종류별 안내 문구를 돌려준다', async (t) => {
    const errors = [Object.assign(new Error('busy'), { status: 503 })];
    const llm = { generate: async (m) => { if (errors.length) throw errors.shift(); return `echo:${m}`; } };
    const server = createApp({ llm }).listen(0);
    await new Promise((r) => server.once('listening', r));
    t.after(() => server.close());
    const post = (message) =>
        fetch(`http://127.0.0.1:${server.address().port}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });

    const busy = await post('hi');
    assert.equal(busy.status, 503);
    assert.match((await busy.json()).error, /혼잡/);
    assert.deepEqual(await (await post('hi')).json(), { reply: 'echo:hi' });
    assert.equal((await post('  ')).status, 400);
});
