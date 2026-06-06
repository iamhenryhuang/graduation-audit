import http from 'k6/http';
import { check, sleep } from 'k6';

const fileContent = open('./test.json');
const baseJson = JSON.parse(fileContent);

export const options = {
    stages: [
        { duration: '10s', target: 20 }, // 暖身：10 秒內增加到 20 人
        { duration: '30s', target: 50 }, // 壓力測試：保持 50 人狂打 API 30 秒
        { duration: '10s', target: 0 },  // 降溫：10 秒內慢慢退場
    ],
    thresholds: {
        http_req_duration: ['p(90) < 2000'],
        http_req_failed: ['rate < 0.01'], 
    },
};

export default function () {
    let myJson = JSON.parse(JSON.stringify(baseJson));
    
    // 3. 隨機產生虛擬學號 (例如 1112xxxxx)，避免資料庫重複寫入報錯
    const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
    const virtualStudentId = `1112${randomSuffix}`;
    
    myJson[0]["課業學習"]["aboutMe"]["studentNumber"] = virtualStudentId;

    const payload = JSON.stringify({ data: myJson });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const url = 'http://localhost:8000/upload'; 
    
    const res = http.post(url, payload, params);

    check(res, {
        'status is 200 (上傳並計算成功)': (r) => r.status === 200,
    });

    sleep(Math.random() * 0.5 + 0.5); 
}