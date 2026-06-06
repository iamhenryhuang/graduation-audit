import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
// 💡 新增 1：引入 k6 的編碼模組
import encoding from 'k6/encoding';

const uploadRenderTime = new Trend('ui_upload_render_time');

// 💡 新增 2：在腳本最外層讀取 JSON 檔案 (加上 'b' 以二進位讀取，避免編碼問題)
const fileContent = open('./test.json', 'b');

export const options = {
    scenarios: {
        ui_upload_test: {
            executor: 'constant-vus',
            vus: 5,
            duration: '15s',
            options: {
                browser: {
                    type: 'chromium',
                },
            },
        },
    },
};

export default async function () {
    const page = await browser.newPage();

    try {
        await page.goto('http://localhost:5173/');

        // 等待畫面載入
        const title = page.locator('h1');
        await title.waitFor({ state: 'visible' });

        // 💡 關鍵修改 A：使用 await page.$() 取得 DOM 元素 (ElementHandle)
        const fileInput = await page.$('input[type="file"]');
        
        const startTime = Date.now();

        await fileInput.setInputFiles({
            name: 'test.json',
            mimetype: 'application/json',
            buffer: encoding.b64encode(fileContent),
        });

        // 鎖定跳轉後畫面上應該要出現的學生姓名
        const studentName = page.locator('//*[contains(text(), "林佳穎")]');
        
        // 等待新頁面載入，並且名字成功顯示 (最多等 10 秒)
        await studentName.waitFor({ state: 'visible', timeout: 10000 });

        // 計算從按下上傳，到 API 算完，再到前端成功跳轉並畫出新頁面的「總耗時」
        uploadRenderTime.add(Date.now() - startTime);

        // 斷言驗證
        check(page, {
            '成功跳轉並顯示學生姓名': (p) => studentName.isVisible(),
        });

    } finally {
        await page.close();
    }
}