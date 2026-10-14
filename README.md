# 개발 학습 기록 (2024 ~ 2025)

RPA 개발자로 일하면서 **업무 밖에서 따로 익힌 것들**을 작은 프로젝트로 남긴 저장소다.
RPA만으로는 닿지 않는 부분 — 웹 서버, DB, LLM API, 브라우저 자동화, 클라우드 스크립트 — 을 직접 만들어 보며 익혔다.
실무 프로젝트는 다른 저장소에 따로 정리했다.

당시 연습하며 남긴 코드와 겪은 오류를 기준으로 다시 정리했다. 정리하면서 실행되게 다듬고,
설정값은 환경 변수로 빼고, 테스트를 붙였다. 처음 버전과 달라진 점은 각 README에 적었다.

| 프로젝트 | 무엇을 익혔나 | 기술 | 테스트 |
|---|---|---|---|
| [**node-mssql-member-admin**](node-mssql-member-admin) | 로그인·세션, 목록 페이징, 회원 추가·수정·삭제 웹앱 | Node.js · Express · MSSQL · 바닐라 JS | 4 |
| [**node-llm-chat**](node-llm-chat) | 웹 채팅 화면에서 LLM API 호출, 429·503 재시도 | Node.js · Express · Gemini API | 4 |
| [**node-aa-news-connector**](node-aa-news-connector) | 웹 서버에서 RPA 봇을 실행하고 결과를 되받아 화면에 표시 | Node.js · Automation Anywhere API · EJS | 3 |
| [**puppeteer-search**](puppeteer-search) | 코드로 브라우저 조작(검색·클릭) | Puppeteer | — |
| [**apps-script-sheet-urls**](apps-script-sheet-urls) | Drive 폴더의 스프레드시트 목록을 시트로 수집 | Google Apps Script | — |

```bash
cd node-mssql-member-admin   # 각 폴더가 독립 프로젝트
npm install
npm test
```

## 코드 없이 남은 학습

| 주제 | 내용 |
|---|---|
| LLM 구조 | 토크나이저 → 임베딩 → 위치 인코딩 → 트랜스포머 블록 → 로짓·소프트맥스. SentencePiece BPE 토크나이저 학습, Top-k·Top-p·Temperature 샘플링 함수(PyTorch)를 따라 구현, LoRA·RAG 개념 |
| Python 웹 | Flask로 블로그(회원가입·글쓰기·수정·삭제, 사이드 메뉴), Flask + OpenAI 입력 화면 |
| React | CRA·Vite + TypeScript Todo, ESLint(airbnb) 설정과 의존성 충돌 해결, styled-components |
| 테스트 | ISTQB 실러버스 학습 |
