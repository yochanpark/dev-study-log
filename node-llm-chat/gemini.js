// Gemini REST API(generateContent)를 SDK 없이 fetch로 부른다.
// 처음엔 SDK에 { prompt: { text } } 형태로 넘겨 "request is not iterable"이 났다 →
// 요청 본문은 contents[].parts[].text 구조여야 한다.
//
// 겪은 오류와 처리:
//   503 The model is overloaded  → 잠시 후 재시도
//   429 free tier quota          → 응답의 RetryInfo.retryDelay만큼 기다렸다 재시도
//   404 models/gemini-pro        → 모델 이름이 바뀌었다. 모델은 환경 변수로 받는다

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function retryDelayMs(errorBody, attempt) {
    const info = errorBody?.error?.details?.find((d) => d['@type']?.endsWith('RetryInfo'));
    const seconds = parseFloat(info?.retryDelay); // "37s"
    return Number.isFinite(seconds) ? seconds * 1000 : 1000 * 2 ** attempt;
}

function createGeminiClient({ apiKey, model, fetchImpl = fetch, maxAttempts = 3, maxDelayMs = 10000 }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    return {
        async generate(message) {
            for (let attempt = 0; ; attempt++) {
                const res = await fetchImpl(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: message }] }] }),
                });
                const body = await res.json();

                if (res.ok) {
                    return body.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
                }
                const retryable = res.status === 429 || res.status === 503;
                if (!retryable || attempt + 1 >= maxAttempts) {
                    const error = new Error(body?.error?.message ?? `Gemini ${res.status}`);
                    error.status = res.status;
                    throw error;
                }
                await sleep(Math.min(retryDelayMs(body, attempt), maxDelayMs));
            }
        },
    };
}

module.exports = { createGeminiClient };
