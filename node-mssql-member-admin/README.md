# 회원 관리 웹앱 — Node.js + MSSQL

로그인한 사용자만 회원 목록을 보고, 회원을 추가·수정·삭제하는 작은 관리 화면.
처음으로 웹 서버·DB·화면을 혼자 끝까지 연결해 본 연습이다.

```
login.html ──POST /api/login──▶ 세션 생성 ──▶ board.html (8명씩 페이징)
                                               ├─ 회원 추가 ▶ add.html  ──POST /api/addUser
                                               └─ 수정      ▶ edit.html ──GET /api/member?id=
                                                                          POST /api/update-member
                                                                          POST /api/delete-member
```

| 파일 | 내용 |
|---|---|
| [`server.js`](server.js) | Express 라우트, 세션, 로그인 확인 미들웨어 |
| [`memberRepository.js`](memberRepository.js) | MSSQL 쿼리. 모든 값은 `request.input()` 바인딩 |
| [`password.js`](password.js) | scrypt 해시·검증 |
| [`public/`](public) | 로그인·목록·수정·추가 화면 (바닐라 JS + fetch) |
| [`sql/schema.sql`](sql/schema.sql) | 테이블 |

페이징은 `ORDER BY id OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`와 `COUNT(*)`로 총 페이지를 계산한다.

## 겪은 문제

| 증상 | 원인 → 해결 |
|---|---|
| 한글 이름이 `???`로 저장 | `VARCHAR`·접두사 없는 리터럴 → 컬럼 `NVARCHAR`, 직접 넣을 땐 `N'…'`, 드라이버에선 `sql.NVarChar`로 바인딩 |
| 수정 화면에서 "서버 오류로 데이터를 불러올 수 없습니다" | 목록에서 id를 안 넘겨 `memberId`가 null → `edit.html?id=` 로 넘기고 `GET /api/member` 추가 |
| 수정·삭제가 반영 안 됨 | MySQL식 `db.query(sql, [배열])`과 `@id` 자리표시자를 섞어 씀 → `mssql`의 `request().input()`으로 통일 |
| 서버가 `EACCES`로 안 뜸 | 웹 서버 포트를 DB 포트 1433과 같게 잡음 → 웹은 3000 |
| 화면을 고쳐도 그대로(304) | 정적 파일 캐시 → ETag·Last-Modified 끄고 `Cache-Control: no-store` |
| PowerShell로 API 테스트 시 헤더 오류 | `curl -H` 문법을 그대로 씀 → `Invoke-WebRequest -Headers @{ "Content-Type" = "application/json; charset=utf-8" }` |

## 정리하면서 바꾼 점

- 비밀번호를 평문으로 저장·비교하던 것을 **scrypt 해시**로 바꿨다.
- DB 접속 정보와 세션 secret을 코드에서 빼 `.env`로 옮겼다.
- 로그인하지 않으면 `/api/*`가 401을 돌려주도록 했다(처음엔 목록 API가 열려 있었다).
- DB 없이 도는 테스트를 위해 쿼리를 `memberRepository.js`로 분리하고, 테스트에서는 메모리 저장소로 바꿔 끼운다.

## 실행

```bash
npm install
cp .env.example .env   # DB 접속 정보 입력, sql/schema.sql로 테이블 생성
npm start              # http://localhost:3000
npm test               # DB 없이 로그인·권한·페이징·CRUD 4개
```
