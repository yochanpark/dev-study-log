/**
 * 지정한 Google Drive 폴더 안의 스프레드시트만 골라 이름·URL을 시트에 적는다.
 * RPA가 처리할 파일 목록을 시트 한 장으로 모으려고 만들었다.
 *
 * - setValues()는 2차원 배열이 필요하다 → 행마다 [이름, URL, 수정일]로 push
 * - 결과가 0건이면 행 수 0인 범위를 만들지 않는다
 */

// 스크립트 속성(프로젝트 설정 → 스크립트 속성)에 넣는다. 코드에 ID를 적지 않는다.
const props = PropertiesService.getScriptProperties();
const FOLDER_ID = props.getProperty('FOLDER_ID');
const OUTPUT_SHEET_ID = props.getProperty('OUTPUT_SHEET_ID');

function collectSpreadsheetUrls() {
  const files = DriveApp.getFolderById(FOLDER_ID).getFilesByType(MimeType.GOOGLE_SHEETS);

  const rows = [];
  while (files.hasNext()) {
    const file = files.next();
    rows.push([file.getName(), file.getUrl(), file.getLastUpdated()]);
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]));

  writeRows(rows);
  Logger.log(`${rows.length}건 기록`);
}

function writeRows(rows) {
  const sheet = SpreadsheetApp.openById(OUTPUT_SHEET_ID).getSheets()[0];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 3).setValues([['파일명', 'URL', '수정일']]);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }
}
