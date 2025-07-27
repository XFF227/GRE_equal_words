let data = {};
let keys = [];
let currentIndex = 0;
let wrongSet = [];
let currentCorrect = [];
let currentQuestion = null;
let scoreDict = {};
const SCORE_KEY = "scoreDict";

fetch('vocab_dict.json')
    .then(res => res.json())
    .then(json => {
        data = json;
        keys = Object.keys(data);
        initScoreDict();
        renderFlashcards();
    });

function initScoreDict() {
    const stored = localStorage.getItem(SCORE_KEY);
    if (stored) {
        scoreDict = JSON.parse(stored);
    } else {
        for (const k of keys) {
            for (const word of data[k][0]) {
                scoreDict[word] = 0;
            }
        }
        localStorage.setItem(SCORE_KEY, JSON.stringify(scoreDict));
    }
}

function getColor(score) {
    if (score <= -5) return 'red';
    if (score <= -3) return 'orange';
    if (score < 0) return 'orange';
    if (score === 0) return 'black';
    if (score <= 3) return 'blue';
    return 'green';
}

function getLevelName(score) {
    if (score <= -5) return '很差';
    if (score <= -3) return '较差';
    if (score < 0) return '稍差';
    if (score === 0) return '中等';
    if (score <= 3) return '良好';
    return '精通';
}

function minScore(words) {
    return Math.min(...words.map(w => scoreDict[w] ?? 0));
}

function colorWord(word) {
    const score = scoreDict[word] ?? 0;
    return `<span style="color:${getColor(score)}">${word}</span>`;
}

function plainWord(word) {
    return word;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    if (tabId === 'wrong') {
        const saved = localStorage.getItem('wrongSet');
        wrongSet = saved ? JSON.parse(saved) : [];
        const cardBox = document.getElementById('wrongCards');
        cardBox.style.display = 'block';
        cardBox.innerHTML = wrongSet.map(q =>
            `<div class="card"><strong>${q.meaning}</strong><br>${q.correct.map(colorWord).join(', ')}</div>`
        ).join('');
    }
}

function renderFlashcards() {
    const container = document.getElementById('flashcards');
    container.innerHTML = keys.map(k => {
        const [words, meaning] = data[k];
        const avg = minScore(words);
        return `<div class="card">
          <strong>${meaning}</strong><br>
          掌握程度：<span style="color:${getColor(avg)}">${getLevelName(avg)}</span><br>
          ${words.map(colorWord).join(', ')}
        </div>`;
    }).join('');
}

function categorizeKeysByPriority() {
    const categories = { red: [], orange: [], black: [], blue: [], green: [] };
    for (const k of keys) {
        const scoreMin = Math.min(...data[k][0].map(w => scoreDict[w] ?? 0));
        if (scoreMin <= -5) categories.red.push(k);
        else if (scoreMin <= -3) categories.orange.push(k);
        else if (scoreMin === 0) categories.black.push(k);
        else if (scoreMin <= 3) categories.blue.push(k);
        else categories.green.push(k);
    }
    return [...categories.red, ...categories.orange, ...categories.black, ...categories.blue, ...categories.green];
}

function startQuiz() {
    currentIndex = 0;
    document.getElementById('quizArea').innerHTML = '';
    nextQuiz();
}

function nextQuiz() {
    const prioritizedKeys = categorizeKeysByPriority();
    if (currentIndex >= prioritizedKeys.length) {
        document.getElementById('quizArea').innerHTML = '<p>做题结束！</p>';
        return;
    }

    const key = prioritizedKeys[currentIndex++];
    currentQuestion = key;
    const [words, meaning] = data[key];

    currentCorrect = words
        .slice()
        .sort((a, b) => (scoreDict[a] ?? 0) - (scoreDict[b] ?? 0))
        .slice(0, 2);

    let distractorKey;
    do {
        distractorKey = keys[Math.floor(Math.random() * keys.length)];
    } while (
        distractorKey === key ||
        data[distractorKey][0].some(w => currentCorrect.includes(w))
        );

    const chineseOptions = [key, distractorKey]
        .map(k => ({ key: k, meaning: data[k][1] }))
        .sort(() => Math.random() - 0.5);

    const distractorWords = data[distractorKey][0];
    const fillerWords = keys
        .flatMap(k => data[k][0])
        .filter(w => !currentCorrect.includes(w) && !distractorWords.includes(w))
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

    const allWords = [...currentCorrect, ...fillerWords].sort(() => Math.random() - 0.5);

    const container = document.getElementById('quizArea');
    container.innerHTML = `
      <div class='card'>
        <strong>选择两个英文词和对应的一个中文释义</strong>
        <div class="chinese-options">
        ${chineseOptions.map(opt =>
        `<label id="chinese_${opt.key}"><input type="radio" name="chinese_choice" value="${opt.key}"> ${opt.meaning}</label>`).join('')}
      </div>
        
        <div class='choices'>
          ${allWords.map(w =>
        `<label><input type="checkbox" name="choice" value="${w}"> ${plainWord(w)}</label>`).join('<br>')}
        </div>
        <button onclick="submitAnswer()">提交</button>
        <button id="nextQuizBtn" onclick="nextQuiz()" style="display:none;margin-top:1rem;">下一题</button>
      </div>`;
}

function updateScore(words, delta) {
    for (const w of words) {
        scoreDict[w] = (scoreDict[w] ?? 0) + delta;
    }
    localStorage.setItem(SCORE_KEY, JSON.stringify(scoreDict));
}

function submitAnswer() {
    const selectedWords = Array.from(document.querySelectorAll('input[name="choice"]:checked')).map(el => el.value);
    const selectedChinese = document.querySelector('input[name="chinese_choice"]:checked');

    if (selectedWords.length !== 2 || !selectedChinese) {
        alert("请选择两个英文和一个中文！");
        return;
    }

    const labels = document.querySelectorAll('input[name="choice"]');
    const isChineseCorrect = selectedChinese.value === currentQuestion;
    const isWordsCorrect = currentCorrect.every(w => selectedWords.includes(w));

    const selectedChineseKey = selectedChinese.value;
    const correctChineseLabel = document.getElementById(`chinese_${currentQuestion}`);
    const chosenChineseLabel = document.getElementById(`chinese_${selectedChineseKey}`);

    if (correctChineseLabel) correctChineseLabel.style.background = '#c8f7c5';
    if (!isChineseCorrect && chosenChineseLabel) chosenChineseLabel.style.background = '#f8d7da';

    if (isChineseCorrect && isWordsCorrect) {
        updateScore(currentCorrect, 1);
        selectedWords.forEach(sel => {
            const match = [...labels].find(l => l.value === sel);
            if (match) match.parentElement.style.background = '#c8f7c5';
        });
        setTimeout(nextQuiz, 1000);
    } else {
        updateScore(currentCorrect, -1);

        // ✅ 保存错题
        wrongSet.push({
            meaning: data[currentQuestion][1],
            correct: currentCorrect
        });
        localStorage.setItem('wrongSet', JSON.stringify(wrongSet));

        selectedWords.forEach(sel => {
            const match = [...labels].find(l => l.value === sel);
            if (match) match.parentElement.style.background = '#f8d7da';
        });
        [...labels].forEach(l => {
            if (currentCorrect.includes(l.value)) {
                l.parentElement.style.background = '#c8f7c5';
            }
        });

        const nextBtn = document.getElementById('nextQuizBtn');
        if (nextBtn) nextBtn.style.display = 'inline-block';
    }
}

function startWrongReview() {
    const saved = localStorage.getItem('wrongSet');
    wrongSet = saved ? JSON.parse(saved) : [];
    currentIndex = 0;

    document.getElementById('wrongCards').style.display = 'none';
    document.getElementById('wrongArea').innerHTML = '';
    nextWrong();
}

function nextWrong() {
    const container = document.getElementById('wrongArea');
    container.innerHTML = '';

    if (currentIndex >= wrongSet.length) {
        container.innerHTML = '<p>错题训练结束！</p>';
        return;
    }

    const q = wrongSet[currentIndex++];
    const correctKey = Object.keys(data).find(k => data[k][1] === q.meaning);
    const correctWords = data[correctKey][0];

    let distractorKey = null;
    const availableKeys = keys.filter(k => k !== correctKey);
    for (let i = 0; i < 50; i++) {
        const candidate = availableKeys[Math.floor(Math.random() * availableKeys.length)];
        const candidateWords = data[candidate][0];
        const overlap = candidateWords.filter(w => correctWords.includes(w));
        if (overlap.length === 0 && candidateWords.length <= 5) {
            distractorKey = candidate;
            break;
        }
    }

    if (!distractorKey) {
        nextWrong();
        return;
    }

    const chineseOptions = [correctKey, distractorKey]
        .map(k => ({ key: k, meaning: data[k][1] }))
        .sort(() => Math.random() - 0.5);

    const correct = correctWords.slice().sort((a, b) => (scoreDict[a] ?? 0) - (scoreDict[b] ?? 0)).slice(0, 2);
    const distractorWords = data[distractorKey][0].slice(0, 1);
    const fillerWords = keys
        .flatMap(k => data[k][0])
        .filter(w => !correct.includes(w) && !distractorWords.includes(w) && !correctWords.includes(w))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    const allOptions = [...correct, ...distractorWords, ...fillerWords].sort(() => Math.random() - 0.5);

    currentQuestion = correctKey;
    currentCorrect = correct;

    const form = document.createElement('div');
    form.className = 'card';
    form.innerHTML = `
      <strong>选择两个英文词和对应的一个中文释义</strong>
      <div class="chinese-options">
        ${chineseOptions.map(opt =>
        `<label id="wrong_chinese_${opt.key}"><input type="radio" name="chinese_choice" value="${opt.key}"> ${opt.meaning}</label>`).join('')}
      </div>
      <div class='choices'>
        ${allOptions.map(o => `<label><input type="checkbox" name="wrong_choice" value="${o}"> ${plainWord(o)}</label>`).join('<br>')}
      </div>
      <button onclick="submitWrongAnswer()">提交</button>
      <button id="nextWrongBtn" onclick="nextWrong()" style="display:none;margin-top:1rem;">下一题</button>
      <button onclick="removeWrong(${currentIndex - 1})" style="margin-top:1rem;">删除本题</button>
      <button onclick="exitWrongReview()" style="margin-top:1rem;background:#ccc;">退出训练</button>
    `;

    container.appendChild(form);
}


function submitWrongAnswer() {
    const selectedWords = Array.from(document.querySelectorAll('input[name="wrong_choice"]:checked')).map(el => el.value);
    const selectedChinese = document.querySelector('input[name="chinese_choice"]:checked');

    if (selectedWords.length !== 2 || !selectedChinese) {
        alert("请选择两个英文和一个中文！");
        return;
    }

    const labels = document.querySelectorAll('input[name="wrong_choice"]');
    const isChineseCorrect = selectedChinese.value === currentQuestion;
    const isWordsCorrect = currentCorrect.every(w => selectedWords.includes(w));

    const selectedChineseKey = selectedChinese.value;
    const correctChineseLabel = document.getElementById(`wrong_chinese_${currentQuestion}`);
    const chosenChineseLabel = document.getElementById(`wrong_chinese_${selectedChineseKey}`);

    if (correctChineseLabel) correctChineseLabel.style.background = '#c8f7c5';
    if (!isChineseCorrect && chosenChineseLabel) chosenChineseLabel.style.background = '#f8d7da';

    if (isChineseCorrect && isWordsCorrect) {
        selectedWords.forEach(sel => {
            const match = [...labels].find(l => l.value === sel);
            if (match) match.parentElement.style.background = '#c8f7c5';
        });
        setTimeout(nextWrong, 1000);
    } else {
        selectedWords.forEach(sel => {
            const match = [...labels].find(l => l.value === sel);
            if (match) match.parentElement.style.background = '#f8d7da';
        });
        [...labels].forEach(l => {
            if (currentCorrect.includes(l.value)) {
                l.parentElement.style.background = '#c8f7c5';
            }
        });

        const nextBtn = document.getElementById('nextWrongBtn');
        if (nextBtn) nextBtn.style.display = 'inline-block';
    }
}


function removeWrong(index) {
    wrongSet.splice(index, 1);
    localStorage.setItem('wrongSet', JSON.stringify(wrongSet));
    currentIndex = Math.max(0, currentIndex - 1);
    nextWrong();
}

function exitWrongReview() {
    document.getElementById('wrongArea').innerHTML = '';
    document.getElementById('wrongCards').style.display = 'block';
}