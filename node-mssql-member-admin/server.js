const express = require('express');
const path = require('path');
const session = require('express-session');
const { hashPassword, verifyPassword } = require('./password');

const PAGE_SIZE = 8; // 한 페이지당 회원 수

// repo를 밖에서 받아 테스트에서는 메모리 저장소로 바꿔 끼운다
function createApp({ repo, sessionSecret }) {
    const app = express();

    app.use(session({ secret: sessionSecret, resave: false, saveUninitialized: false }));
    app.use(express.json());

    // 수정한 화면이 캐시 때문에 안 바뀌던 문제(304) → 정적 파일 캐시 끔
    app.use(express.static(path.join(__dirname, 'public'), {
        etag: false,
        lastModified: false,
        setHeaders: (res) => res.setHeader('Cache-Control', 'no-store'),
    }));

    app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

    // 로그인
    app.post('/api/login', async (req, res) => {
        const { id, pw } = req.body;
        if (!id || !pw) return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력하세요.' });

        const member = await repo.findById(id);
        if (!member || !verifyPassword(pw, member.pw)) {
            return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
        }
        req.session.user = { id: member.id, name: member.name };
        res.json({ success: true, message: '로그인 성공!' });
    });

    app.post('/api/logout', (req, res) => {
        req.session.destroy(() => res.json({ success: true, message: '로그아웃 성공!' }));
    });

    // 여기부터는 로그인한 사용자만
    app.use('/api', (req, res, next) => {
        if (!req.session.user) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        next();
    });

    // 목록 + 페이징
    app.get('/api/board', async (req, res) => {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const { rows, totalCount } = await repo.page(page, PAGE_SIZE);
        res.json({ success: true, data: rows, totalPages: Math.ceil(totalCount / PAGE_SIZE), currentPage: page });
    });

    // 단건 조회 (수정 화면에서 사용)
    app.get('/api/member', async (req, res) => {
        if (!req.query.id) return res.status(400).json({ success: false, message: 'ID가 필요합니다.' });
        const member = await repo.findById(req.query.id);
        if (!member) return res.status(404).json({ success: false, message: '해당 회원을 찾을 수 없습니다.' });
        res.json({ success: true, member: { id: member.id, name: member.name } });
    });

    app.post('/api/addUser', async (req, res) => {
        const { id, pw, name } = req.body;
        if (!id || !pw || !name) return res.status(400).json({ success: false, message: '모든 항목을 입력하세요.' });
        if (await repo.findById(id)) return res.status(409).json({ success: false, message: '이미 있는 아이디입니다.' });
        await repo.insert({ id, pw: hashPassword(pw), name });
        res.json({ success: true });
    });

    // 아이디는 바꾸지 않고 이름·비밀번호만
    app.post('/api/update-member', async (req, res) => {
        const { id, name, password } = req.body;
        if (!id || !name || !password) return res.status(400).json({ success: false, message: '모든 항목을 입력하세요.' });
        if (!(await repo.findById(id))) return res.status(404).json({ success: false, message: '존재하지 않는 ID입니다.' });
        await repo.update({ id, name, pw: hashPassword(password) });
        res.json({ success: true });
    });

    app.post('/api/delete-member', async (req, res) => {
        const { id } = req.body;
        if (!id) return res.status(400).json({ success: false, message: 'ID가 필요합니다.' });
        if (!(await repo.findById(id))) return res.status(404).json({ success: false, message: '존재하지 않는 ID입니다.' });
        await repo.remove(id);
        res.json({ success: true });
    });

    app.use((err, req, res, next) => {
        console.error('서버 오류:', err);
        res.status(500).json({ success: false, message: '서버 오류' });
    });

    return app;
}

module.exports = { createApp };

if (require.main === module) {
    const { createMemberRepository } = require('./memberRepository');
    const env = process.env;
    const repo = createMemberRepository({
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        server: env.DB_HOST,
        port: Number(env.DB_PORT || 1433),
        database: env.DB_NAME,
        options: { encrypt: false, trustServerCertificate: true },
    });
    // 웹 서버 포트를 DB 포트(1433)와 같게 잡아 EACCES가 났던 적이 있어 기본값을 3000으로 둔다
    const port = Number(env.PORT || 3000);
    createApp({ repo, sessionSecret: env.SESSION_SECRET }).listen(port, () => {
        console.log(`서버 실행 중: http://localhost:${port}`);
    });
}
