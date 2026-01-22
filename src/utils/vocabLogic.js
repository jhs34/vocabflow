/**
 * 원본 뜻 문자열을 정제하여 허용 가능한 정답 배열로 변환하는 함수
 * @param {string} rawString - 엑셀 등에서 가져온 원본 뜻 (예: "(설명·학설 등을) 인정하다")
 * @returns {string[]} - 정제된 정답 목록 (예: ["인정하다"])
 */
export function parseAnswerList(rawString) {
    if (!rawString) return [];

    // 1. 괄호와 괄호 안의 내용 제거 (소괄호 (), 대괄호 [], 꺾쇠 <>)
    let cleaned = rawString.replace(/\(.*?\)|\[.*?\]|<.*?>/g, '');

    // 2. 특수문자 제거 (물결표 ~, 점 ·, 마침표 .)
    cleaned = cleaned.replace(/[~·.]/g, '');

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
// 사용자의 입력이 정답인지 확인하는 함수
export function checkAnswer(userInput, allowedAnswers) {
    if (!userInput || !allowedAnswers) return false;

    // 입력값 정규화 함수
    const normalize = (str) => {
        let s = str;
        // 1. 괄호와 그 안의 내용 제거
        s = s.replace(/\(.*?\)|\[.*?\]|<.*?>/g, '');
        // 2. 특수문자 제거 (~, ·, .)
        s = s.replace(/[~·.]/g, '');
        // 3. 공백 제거
        s = s.replace(/\s+/g, '');
        return s;
    };

    const cleanInput = normalize(userInput);

    // 정답 목록 중 하나라도 일치하는지 확인
    return allowedAnswers.some(answer => {
        const cleanAnswer = answer.replace(/\s+/g, ''); // 정답은 이미 parseAnswerList를 거쳐서 특수문자는 없지만 공백은 있을 수 있음
        return cleanInput === cleanAnswer;
    });
}

/**
 * 데이터에 정답 리스트 적용 (로딩 시 호출)
 * @param {Array} wordData 
 */
export function processWordData(wordData) {
    if (!Array.isArray(wordData)) return [];
    return wordData.map(item => ({
        ...item,
        answer_list: parseAnswerList(item.raw_meaning)
    }));
}

export async function fetchLessonData(dayId) {
    try {
        const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
        const response = await fetch(`${baseUrl}words/day${dayId}.json`);
        if (!response.ok) {
            console.warn(`Failed to fetch day${dayId}.json`);
            return [];
        }
        const data = await response.json();
        return processWordData(data);
    } catch (error) {
        console.error("Error fetching lesson data:", error);
        return [];
    }
}

// 가용 Day 목록을 스캔하는 함수
export async function getAvailableDays(maxDays = 50) {
    const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
    const available = [];

    // 배치 처리를 통해 브라우저 요청 제한(보통 6개)을 우회하고 안정적으로 가져옵니다.
    const batchSize = 10;

    for (let i = 1; i <= maxDays; i += batchSize) {
        const batchPromises = [];
        for (let j = i; j < i + batchSize && j <= maxDays; j++) {
            batchPromises.push(
                fetch(`${baseUrl}words/day${j}.json`)
                    .then(async res => {
                        if (!res.ok) return null;
                        try {
                            const json = await res.json();
                            return Array.isArray(json) && json.length > 0 ? j : null;
                        } catch {
                            return null;
                        }
                    })
                    .catch(() => null)
            );
        }

        const results = await Promise.all(batchPromises);
        results.forEach(val => {
            if (val !== null) available.push(val);
        });
    }

    return available.sort((a, b) => a - b);
}

// 전체 단어 검색 함수
export async function searchAllWords(query) {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();

    // 1. 가용 가능한 모든 날짜를 먼저 확인 (캐싱된 목록이 있다면 좋겠지만, 여기선 간단히 스캔)
    // 성능을 위해 일단 최대 50일 정도만 검색하거나, getAvailableDays 결과를 활용해야 함.
    // 여기서는 사용자가 검색 버튼을 누르면 getAvailableDays를 먼저 호출한다고 가정하거나,
    // 직접 1~60 정도를 찔러봅니다.
    const days = await getAvailableDays(50);

    const results = [];
    const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

    // 병렬로 모든 파일 fetch
    await Promise.all(days.map(async (day) => {
        try {
            const res = await fetch(`${baseUrl}words/day${day}.json`);
            if (!res.ok) return;
            const data = await res.json();

            // 단어 검색
            data.forEach(item => {
                if (item.word.toLowerCase().includes(lowerQuery) ||
                    item.raw_meaning.includes(query)) {
                    results.push({
                        day,
                        ...item
                    });
                }
            });
        } catch (e) {
            // ignore error
        }
    }));

    return results.sort((a, b) => a.day - b.day);
}
