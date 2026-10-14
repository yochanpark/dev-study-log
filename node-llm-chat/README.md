# LLM 웹 채팅 — Node.js + Gemini API

입력창에 쓴 메시지를 서버가 LLM API로 보내고 답을 말풍선으로 보여 주는 최소 구성의 채팅.
LLM API를 처음 직접 붙여 보면서 **요청 형식, 모델 이름, 할당량·과부하 오류**를 다뤄 본 연습이다.

```
public/index.html ──POST /chat { message }──▶ server.js ──▶ gemini.js ──▶ generateContent
       ◀──────────── { reply } 또는 { error } ◀────────────────────────┘
```

## 겪은 문제

| 오류 | 원인 → 해결 |
|---|---|
| `TypeError: request is not iterable` | `generateContent({ prompt: { text } })`처럼 잘못된 형태로 넘김 → 본문은 `contents[].parts[].text` |
| `503 The model is overloaded` | 상위 모델 혼잡 → 재시도, 화면엔 "잠시 후 다시" 안내 |
| `429 Too Many Requests` (free tier) | 메시지 한 번에도 걸림 — 분당·일일 무료 할당량 → 응답의 `RetryInfo.retryDelay`만큼 기다렸다 재시도 |
| `404 models/gemini-pro is not found` | 모델 이름이 바뀜 → 모델을 `GEMINI_MODEL` 환경 변수로 |
| 화면에 "죄송합니다. 오류가 발생했습니다."만 뜸 | 서버가 500만 돌려줌 → 상태별 안내 문구를 내려 화면에 그대로 표시 |

## 정리하면서 바꾼 점

SDK 대신 REST를 `fetch`로 직접 호출해 요청·응답 구조가 코드에 드러나게 했다. API 키는 URL 대신 `x-goog-api-key` 헤더로 보낸다.

## 실행

```bash
npm install
cp .env.example .env   # API_KEY 입력
npm start              # http://localhost:3000
npm test               # API 호출 없이 요청 형식·재시도·오류 응답 4개
```
