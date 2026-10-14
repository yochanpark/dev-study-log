# 브라우저 자동화 — Puppeteer

포털 검색창에 검색어를 넣고 첫 결과를 여는 스크립트. RPA 도구 없이 코드로 브라우저를 다뤄 본 연습이다.

```bash
npm install            # Chromium을 함께 내려받는다
node search.js "RPA" 5 # 검색어, 결과를 띄워 둘 초
```

## 겪은 문제

| 증상 | 원인 → 해결 |
|---|---|
| 포털만 뜨고 검색어가 입력되지 않은 채 닫힘 | 검색창 셀렉터가 그 포털의 것이 아니었고(`#APjFqb`는 다른 검색 사이트의 입력창 id), 요소가 null이라 입력·클릭이 건너뛰어짐 → 포털 검색창 `#query`, `waitForSelector`로 나타날 때까지 대기 |
| `page.$x is not a function` | 설치된 Puppeteer 버전에서 `$x`가 제거됨 → `xpath/` 접두 셀렉터 사용 |

정리본은 실행해 보지 않았다(Chromium 내려받기 필요). 포털 화면 구조는 자주 바뀌므로 결과 링크 셀렉터(`FIRST_RESULT`)는 실행 전에 확인해야 한다.
