const express = require('express');
const path = require('path');
const { createGeminiClient } = require('./gemini');

const MESSAGES = {
    429: '요청 한도를 넘었습니다. 잠시 후 다시 시도해 주세요.',
    503: '모델이 혼잡합니다. 잠시 후 다시 시도해 주세요.',
};

function createApp({ llm }) {
    const app = express();
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.json());

    app.post('/chat', async (req, res) => {
        const message = String(req.body?.message ?? '').trim();
        if (!message) return res.status(400).json({ error: '메시지를 입력하세요.' });

        try {
            res.json({ reply: await llm.generate(message) });
        } catch (error) {
            console.error('Gemini 오류:', error.message);
            const status = MESSAGES[error.status] ? error.status : 500;
            res.status(status).json({ error: MESSAGES[status] ?? '서버 오류가 발생했습니다.' });
        }
    });

    return app;
}

module.exports = { createApp };

if (require.main === module) {
    const llm = createGeminiClient({
        apiKey: process.env.API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    });
    const port = Number(process.env.PORT || 3000);
    createApp({ llm }).listen(port, () => console.log(`서버 실행 중: http://localhost:${port}`));
}
