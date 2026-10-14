// 포털에서 검색어를 입력하고 첫 결과를 여는 브라우저 자동화 연습
// 사용: node search.js "검색어" [대기초]
//
// 겪은 문제
//  1) 다른 사이트의 검색창 셀렉터를 써서 요소가 null → 입력이 안 된 채 끝남. 셀렉터 확인 + waitForSelector
//  2) page.$x is not a function — $x가 제거된 버전 → 'xpath/...' 접두 셀렉터
const puppeteer = require('puppeteer');

const SEARCH_URL = 'https://www.naver.com/';
const INPUT = '#query';
const FIRST_RESULT = 'xpath///a[contains(@class, "title") or contains(@class, "link_tit")]';

async function main(keyword, waitSeconds) {
    const browser = await puppeteer.launch({ headless: false });
    try {
        const page = await browser.newPage();
        await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded' });

        await page.waitForSelector(INPUT);
        await page.type(INPUT, keyword);
        await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.keyboard.press('Enter')]);

        const first = await page.waitForSelector(FIRST_RESULT, { timeout: 10000 }).catch(() => null);
        if (first) {
            console.log('첫 결과:', await first.evaluate((a) => a.textContent.trim()));
            await first.click();
        } else {
            console.log('결과 링크를 찾지 못했습니다. 셀렉터를 확인하세요.');
        }

        await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
    } finally {
        await browser.close();
    }
}

const [keyword = 'RPA', waitSeconds = '5'] = process.argv.slice(2);
main(keyword, Number(waitSeconds)).catch((error) => {
    console.error(error);
    process.exit(1);
});
