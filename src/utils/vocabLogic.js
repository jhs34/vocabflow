/**
 * 원본 뜻 문자열을 정제하여 허용 가능한 정답 배열로 변환하는 함수
 * @param {string} rawString - 엑셀 등에서 가져온 원본 뜻 (예: "(설명·학설 등을) 인정하다")
 * @returns {string[]} - 정제된 정답 목록 (예: ["인정하다"])
 */
export function parseAnswerList(rawString) {
    if (!rawString) return [];

    // 1. 괄호와 괄호 안의 내용 제거 (소괄호 (), 대괄호 [])
    let cleaned = rawString.replace(/\(.*?\)|\[.*?\]/g, '');

    // 2. 특수문자 제거 (물결표 ~, 점 · 등)
    cleaned = cleaned.replace(/[~·]/g, '');

    // 3. 쉼표(,)를 기준으로 분리하여 배열로 만듦
    let answers = cleaned.split(',');

    // 4. 각 항목의 앞뒤 공백 제거 및 빈 항목 제거
    return answers
        .map(item => item.trim())
        .filter(item => item.length > 0);
}

/**
 * 사용자의 입력이 정답인지 확인하는 함수
 * @param {string} userInput - 사용자가 입력한 값
 * @param {string[]} allowedAnswers - 해당 단어의 허용 정답 목록 (processedData의 answer_list)
 * @returns {boolean} - 정답 여부
 */
export function checkAnswer(userInput, allowedAnswers) {
    if (!userInput || !allowedAnswers) return false;

    // 1. 사용자 입력 전처리: 모든 공백 제거
    const cleanInput = userInput.replace(/\s+/g, '');

    // 2. 정답 목록 중 하나라도 일치하는지 확인
    return allowedAnswers.some(answer => {
        const cleanAnswer = answer.replace(/\s+/g, '');
        return cleanInput === cleanAnswer;
    });
}

/**
 * 데이터에 정답 리스트 적용 (로딩 시 호출)
 * @param {Array} wordData 
 */
export function processWordData(wordData) {
    return wordData.map(item => ({
        ...item,
        answer_list: parseAnswerList(item.raw_meaning)
    }));
}

const MOCK_DATA = [
    { id: 1, word: "ignorant", raw_meaning: "무식한, 모르는" },
    { id: 2, word: "accept", raw_meaning: "(설명·학설 등을) 인정하다, 받아들이다" },
    { id: 3, word: "household", raw_meaning: "가정[가족]의, 가구" },
    { id: 4, word: "dynamic", raw_meaning: "동적인, (성격이) 활발한" },
    { id: 5, word: "aesthetics", raw_meaning: "미학, (성격이) 미적 감각" }
];

export async function fetchLessonData(dayId) {
    try {
        // 실제 파일 경로 예: /words/day1.json
        // public 폴더 내의 words 폴더를 참조한다고 가정
        const response = await fetch(`/words/day${dayId}.json`);
        if (!response.ok) {
            console.warn(`Failed to fetch day${dayId}.json, using mock data.`);
            // 데모를 위해 404일 경우 모의 데이터 반환 (실제 배포시 제거 가능)
            return processWordData(MOCK_DATA);
        }
        const data = await response.json();
        return processWordData(data);
    } catch (error) {
        console.error("Error fetching lesson data:", error);
        return processWordData(MOCK_DATA);
    }
}
// ... (previous code)

// 가용 Day 목록을 스캔하는 함수
// 가용 Day 목록을 스캔하는 함수
export async function getAvailableDays(maxDays = 50) {
    const available = [];
    // 병렬 요청으로 빠르게 확인
    const checks = Array.from({ length: maxDays }, (_, i) => i + 1).map(async (i) => {
        try {
            // 직접 JSON 파싱 시도 (가장 확실한 방법)
            const res = await fetch(`/words/day${i}.json`);
            if (!res.ok) return null;

            const json = await res.json();
            // 배열이고 내용이 있어야 유효한 포맷으로 인정
            if (Array.isArray(json) && json.length > 0) {
                return i;
            }
            return null;
        } catch {
            // JSON 파싱 에러(HTML 리턴 등) 시 여기로 옴
            return null;
        }
    });

    const results = await Promise.all(checks);
    return results.filter(d => d !== null).sort((a, b) => a - b);
}
