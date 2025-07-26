let data = {};
let keys = [];
let currentIndex = 0;
let wrongSet = [];
let currentCorrect = [];
let currentQuestion = null;

fetch('vocab_dict.json')
    .then(res => res.json())
    .then(json => {
        data = json;
        keys = Object.keys(data);
        renderFlashcards();
    });

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    if (tabId === 'wrong') {
        const saved = localStorage.getItem('wrongSet');
        wrongSet = saved ? JSON.parse(saved) : [];
        const cardBox = document.getElementById('wrongCards');
        cardBox.style.display = 'block';
        cardBox.innerHTML = wrongSet.map(q =>
            `<div class="card"><strong>${q.meaning}</strong><br>${q.correct.join(', ')}</div>`
        ).join('');
    }
}

function renderFlashcards() {
    const container = document.getElementById('flashcards');
    container.innerHTML = keys.map(k => {
        const [words, meaning] = data[k];
        return `<div class="card"><strong>${meaning}</strong><br>${words.join(', ')}</div>`;
    }).join('');
}

function startQuiz() {
    currentIndex = 0;
    document.getElementById('quizArea').innerHTML = '';
    nextQuiz();
}

function nextQuiz() {
    if (currentIndex >= keys.length) {
        document.getElementById('quizArea').innerHTML = '<p>做题结束！</p>';
        return;
    }

    const randomIndex = Math.floor(Math.random() * keys.length);
    const key = keys[randomIndex];
    currentQuestion = key;
    const [words, meaning] = data[key];
    currentCorrect = words.slice(0, 2);
    let distractors = [];

    while (distractors.length < 4) {
        const randKey = keys[Math.floor(Math.random() * keys.length)];
        if (randKey !== key) {
            distractors.push(...data[randKey][0].slice(0, 1));
        }
    }

    const options = [...currentCorrect, ...distractors.slice(0, 4)].sort(() => Math.random() - 0.5);

    const container = document.getElementById('quizArea');
    container.innerHTML = `<div class='card'>
    <strong>${meaning}</strong>
    <div class='choices'>
      ${options.map(o => `<label><input type="checkbox" name="choice" value="${o}"> ${o}</label>`).join('<br>')}
    </div>
    <button onclick="submitAnswer()">提交</button>
    <button id="nextQuizBtn" onclick="nextQuiz()" style="display:none;margin-top:1rem;">下一题</button>
  </div>`;
}

function submitAnswer() {
    const selected = Array.from(document.querySelectorAll('input[name="choice"]:checked')).map(el => el.value);
    if (selected.length !== 2) {
        alert("请选择两个答案！");
        return;
    }

    const labels = document.querySelectorAll('input[name="choice"]');
    const isCorrect = currentCorrect.every(ans => selected.includes(ans));
    const [_, meaning] = data[currentQuestion];

    if (isCorrect) {
        selected.forEach(sel => {
            const match = [...labels].find(l => l.value === sel);
            if (match) match.parentElement.style.background = '#c8f7c5';
        });
        setTimeout(nextQuiz, 1000);
    } else {
        selected.forEach(sel => {
            const match = [...labels].find(l => l.value === sel);
            if (match) match.parentElement.style.background = '#f8d7da';
        });
        [...labels].forEach(l => {
            if (currentCorrect.includes(l.value)) {
                l.parentElement.style.background = '#c8f7c5';
            }
        });

        if (!wrongSet.some(q => q.meaning === meaning)) {
            wrongSet.push({ meaning, correct: currentCorrect });
            localStorage.setItem('wrongSet', JSON.stringify(wrongSet));
        }

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
    const distractors = keys.flatMap(k => data[k][0]).filter(w => !q.correct.includes(w));
    const options = [...q.correct, ...distractors.sort(() => 0.5 - Math.random()).slice(0, 4)].sort(() => Math.random() - 0.5);

    const form = document.createElement('div');
    form.className = 'card';
    form.innerHTML = `
      <strong>${q.meaning}</strong>
      <div class='choices'>
        ${options.map(o => `<label><input type="checkbox" name="wrong_choice" value="${o}"> ${o}</label>`).join('<br>')}
      </div>
      <button onclick="submitWrongAnswer()">提交</button>
      <button id="nextWrongBtn" onclick="nextWrong()" style="display:none;margin-top:1rem;">下一题</button>
      <button onclick="removeWrong(${currentIndex - 1})" style="margin-top:1rem;">删除本题</button>
      <button onclick="exitWrongReview()" style="margin-top:1rem;background:#ccc;">退出训练</button>
    `;

    container.appendChild(form);
}

function submitWrongAnswer() {
    const selected = Array.from(document.querySelectorAll('input[name="wrong_choice"]:checked')).map(el => el.value);
    if (selected.length !== 2) {
        alert("请选择两个答案！");
        return;
    }

    const labels = document.querySelectorAll('input[name="wrong_choice"]');
    const q = wrongSet[currentIndex - 1];
    const isCorrect = q.correct.every(ans => selected.includes(ans));

    if (isCorrect) {
        selected.forEach(sel => {
            const match = [...labels].find(l => l.value === sel);
            if (match) match.parentElement.style.background = '#c8f7c5';
        });
        setTimeout(nextWrong, 1000);
    } else {
        selected.forEach(sel => {
            const match = [...labels].find(l => l.value === sel);
            if (match) match.parentElement.style.background = '#f8d7da';
        });
        [...labels].forEach(l => {
            if (q.correct.includes(l.value)) {
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
