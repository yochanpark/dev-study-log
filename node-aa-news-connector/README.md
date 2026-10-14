# RPA 봇 실행 웹 서버 — Node.js + Automation Anywhere API

RPA 봇을 Control Room 화면이 아니라 **웹 서버에서 API로 실행**하고, 봇이 수집한 결과를 다시 받아
화면에 보여 주는 연습. "다른 시스템이 RPA를 부르고, RPA가 결과를 돌려준다"는 연동 구조를 직접 만들어 봤다.

```
[화면] 검색어 → POST /run-bot ─┐
                               ├─ POST /v2/authentication       → token
                               └─ POST /v4/automations/deploy   (X-Authorization: token)
                                     botInput.dicInput = { keyword }
                                              │
                               [RPA 봇] 뉴스 수집
                                              │
                    POST /rpa/news [{ newstitle, url, date }] ─▶ 저장 ─▶ GET /news/list (EJS)
```

| 파일 | 내용 |
|---|---|
| [`aaClient.js`](aaClient.js) | 토큰 발급, 봇 실행(`dicInput` DICTIONARY) |
| [`app.js`](app.js) | `/run-bot`, `/rpa/news`(배열 검증), `/news/list`, `/news/list/json` |
| [`views/list.ejs`](views/list.ejs) | 뉴스 목록 화면 |
| [`public/news.js`](public/news.js) | 봇 실행·직접 추가 |

## 겪은 문제

| 증상 | 원인 → 해결 |
|---|---|
| `ERR_REQUIRE_ESM` | `node-fetch` v3는 ESM 전용인데 `require()`로 불러옴 → 이후 토큰이 정상 발급됨. 여기서는 Node 내장 `fetch` 사용 |
| 토큰이 콘솔에 안 보임 | 응답 JSON을 확인하지 않음 → `response.ok` 확인 후 `data.token` 출력 |
| `app.set is not a function` | Express Generator 구조에서 `bin/www`가 받은 `app`이 Express 앱이 아님 → `app.js` 끝의 `module.exports = app` 확인. 여기서는 `bin/www` 없이 `app.js`에서 바로 실행 |

## 실행

```bash
npm install
cp .env.example .env   # Control Room 주소, 계정, API 키, 봇 ID
npm start              # http://localhost:3000/news/list
npm test               # 가짜 Control Room으로 토큰·실행·목록 3개
```
