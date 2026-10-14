// 흐름: 화면에서 "수집" → /run-bot → AA 봇 실행 → 봇이 수집한 뉴스를 /rpa/news로 되돌려 보냄 → /news/list에 표시
const express = require('express');
const path = require('path');

function createApp({ aa }) {
    const app = express();
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));

    let newsListData = []; // 봇이 마지막으로 보낸 뉴스

    // RPA 봇 실행. 본문은 봇 입력(dicInput)으로 그대로 넘어간다. 예: { keyword: "RPA" }
    app.post('/run-bot', async (req, res) => {
        try {
            const result = await aa.deployBot(req.body ?? {});
            res.json({ result: 'ok', deploymentId: result.deploymentId });
        } catch (error) {
            console.error('봇 실행 오류:', error.message);
            res.status(502).json({ result: 'error', message: error.message });
        }
    });

    // 봇(또는 화면)이 뉴스 목록을 보낸다: [{ newstitle, url?, date? }, ...]
    app.post('/rpa/news', (req, res) => {
        const sendData = req.body;
        if (!Array.isArray(sendData) || !sendData.every((n) => typeof n?.newstitle === 'string')) {
            return res.status(400).json({ result: 'error', message: 'Invalid data format' });
        }
        newsListData = sendData;
        res.json({ result: 'ok', count: sendData.length });
    });

    app.get('/news/list', (req, res) => res.render('list', { news: newsListData }));
    app.get('/news/list/json', (req, res) => res.json(newsListData));

    return app;
}

module.exports = { createApp };

if (require.main === module) {
    const { createAaClient } = require('./aaClient');
    const env = process.env;
    const aa = createAaClient({
        controlRoomUrl: env.AA_CONTROL_ROOM_URL,
        username: env.AA_USERNAME,
        apiKey: env.AA_API_KEY,
        botId: Number(env.AA_BOT_ID),
        automationName: env.AA_AUTOMATION_NAME,
    });
    const port = Number(env.PORT || 3000);
    createApp({ aa }).listen(port, () => console.log(`서버 실행 중: http://localhost:${port}/news/list`));
}
