const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server');
const { hashPassword } = require('../password');

// MSSQL 대신 메모리 저장소 (memberRepository와 같은 인터페이스)
function memoryRepo(members) {
    const rows = new Map(members.map((m) => [m.id, { ...m }]));
    return {
        rows,
        findById: async (id) => rows.get(id) ?? null,
        page: async (page, size) => {
            const all = [...rows.values()].sort((a, b) => a.id.localeCompare(b.id));
            return { rows: all.slice((page - 1) * size, page * size).map(({ id, name }) => ({ id, name })), totalCount: all.length };
        },
        insert: async (m) => void rows.set(m.id, m),
        update: async (m) => void rows.set(m.id, m),
        remove: async (id) => void rows.delete(id),
    };
}

async function start(t) {
    const members = Array.from({ length: 10 }, (_, i) => ({ id: `user${String(i + 1).padStart(2, '0')}`, pw: hashPassword('pw1234'), name: `회원${i + 1}` }));
    const repo = memoryRepo(members);
    const server = createApp({ repo, sessionSecret: 'test' }).listen(0);
    await new Promise((r) => server.once('listening', r));
    t.after(() => server.close());

    const base = `http://127.0.0.1:${server.address().port}`;
    let cookie = '';
    const call = async (method, path, body) => {
        const res = await fetch(base + path, {
            method,
            headers: { 'Content-Type': 'application/json', cookie },
            body: body && JSON.stringify(body),
        });
        cookie = res.headers.get('set-cookie')?.split(';')[0] ?? cookie;
        return { status: res.status, body: await res.json() };
    };
    return { repo, call };
}

test('로그인 전에는 목록을 볼 수 없다', async (t) => {
    const { call } = await start(t);
    assert.equal((await call('GET', '/api/board')).status, 401);
});

test('틀린 비밀번호는 거절, 맞으면 세션 생성', async (t) => {
    const { call } = await start(t);
    assert.equal((await call('POST', '/api/login', { id: 'user01', pw: 'wrong' })).status, 401);
    assert.equal((await call('POST', '/api/login', { id: 'user01', pw: 'pw1234' })).body.success, true);
    assert.equal((await call('GET', '/api/board')).status, 200);
});

test('8건씩 페이징', async (t) => {
    const { call } = await start(t);
    await call('POST', '/api/login', { id: 'user01', pw: 'pw1234' });
    const page2 = (await call('GET', '/api/board?page=2')).body;
    assert.equal(page2.totalPages, 2);
    assert.deepEqual(page2.data.map((m) => m.id), ['user09', 'user10']);
    assert.ok(!('pw' in page2.data[0])); // 비밀번호는 내려보내지 않는다
});

test('추가·수정·삭제, 비밀번호는 해시로 저장', async (t) => {
    const { repo, call } = await start(t);
    await call('POST', '/api/login', { id: 'user01', pw: 'pw1234' });

    assert.equal((await call('POST', '/api/addUser', { id: 'kim', pw: 'secret', name: '김광수' })).body.success, true);
    assert.notEqual(repo.rows.get('kim').pw, 'secret');
    assert.equal((await call('POST', '/api/addUser', { id: 'kim', pw: 'x', name: 'x' })).status, 409);

    await call('POST', '/api/update-member', { id: 'kim', name: '김광수2', password: 'newpw' });
    assert.equal((await call('GET', '/api/member?id=kim')).body.member.name, '김광수2');

    await call('POST', '/api/logout');
    assert.equal((await call('POST', '/api/login', { id: 'kim', pw: 'newpw' })).body.success, true);

    await call('POST', '/api/delete-member', { id: 'kim' });
    assert.equal((await call('GET', '/api/member?id=kim')).status, 404);
});
