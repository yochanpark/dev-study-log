# Drive 폴더의 스프레드시트 목록 수집 — Google Apps Script

폴더 안의 스프레드시트만 골라 **파일명·URL·수정일**을 시트 한 장에 적는다.
RPA가 처리할 파일 목록을 사람이 손으로 모으지 않게 하려고 만들었다.

## 사용

1. [script.google.com](https://script.google.com)에서 새 프로젝트를 만들고 [`Code.gs`](Code.gs)를 붙여 넣는다.
2. 프로젝트 설정 → 스크립트 속성에 `FOLDER_ID`(대상 폴더), `OUTPUT_SHEET_ID`(결과 시트)를 넣는다.
3. `collectSpreadsheetUrls` 실행 → 처음 한 번 Drive·Sheets 권한을 승인한다.

## 만든 순서

1. 폴더 안 모든 파일의 URL을 로그로 출력
2. `getMimeType() === MimeType.GOOGLE_SHEETS`로 스프레드시트만 거르고, `setValues()`에 맞게 행마다 배열(`[[url], …]`)로 모음
3. 파일명 열을 더해 결과 시트에 기록

정리하면서 `getFilesByType`으로 바꾸고, 수정일 열·이름순 정렬·0건일 때 빈 범위를 쓰지 않는 처리, 폴더·시트 ID를 코드 대신 스크립트 속성에 두는 방식을 더했다.

## 함께 다룬 것

RPA(Automation Anywhere)에서 Google Drive·Sheets 액션을 쓰려면 Google Cloud에서 **OAuth 클라이언트 ID와 리디렉트 URI**를 만들고,
동의 화면을 Testing에서 Production으로 게시해야 다른 계정도 연결할 수 있었다.
