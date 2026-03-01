// ============================================================================
// Minify Tasks — v1.0
// Three tasks. One day. No more.
// ============================================================================

'use strict';

const STORAGE_KEY = 'minify_tasks_data';
const PLACEHOLDERS = [
    'What matters most today?',
    'Second priority.',
    'One more \u2014 that\'s it.'
];

(function () {
    const canvas = document.getElementById('backgroundCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;
    const GAP = 30;
    const COLOR = '251, 191, 36';
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cols = Math.ceil(canvas.width / GAP) + 2;
        const rows = Math.ceil(canvas.height / GAP) + 2;
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * GAP;
                const dy = Math.sin(i * 0.5 + t) * 7 + Math.sin(j * 0.4 + t * 0.6) * 3;
                const y = j * GAP + dy;
                const a = 0.04 + 0.03 * Math.sin(i * 0.2 + j * 0.3 + t * 0.3);
                ctx.fillStyle = `rgba(${COLOR}, ${a.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(x, y, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        t += 0.012;
        requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resize);
    resize();
    draw();
})();

function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function defaultData() {
    return {
        date: todayKey(),
        tasks: [
            { text: '', done: false },
            { text: '', done: false },
            { text: '', done: false }
        ]
    };
}

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultData();
        const data = JSON.parse(raw);
        if (data.date !== todayKey()) return defaultData();
        return data;
    } catch (e) { return defaultData(); }
}

function saveData(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}

let data = loadData();
const taskList = document.getElementById('taskList');

function renderTasks() {
    taskList.innerHTML = '';
    data.tasks.forEach(function (task, i) {
        const row = document.createElement('div');
        row.className = 'task-row' + (task.done ? ' done' : '');

        const box = document.createElement('button');
        box.className = 'task-checkbox' + (task.done ? ' checked' : '');
        box.setAttribute('aria-label', task.done ? 'Mark incomplete' : 'Mark complete');
        box.setAttribute('type', 'button');
        box.addEventListener('click', function () { toggleTask(i); });

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-input';
        input.value = task.text;
        input.placeholder = PLACEHOLDERS[i];
        input.maxLength = 120;
        input.disabled = task.done;
        input.setAttribute('aria-label', 'Task ' + (i + 1));
        input.addEventListener('input', function () {
            data.tasks[i].text = input.value;
            saveData(data);
        });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        });

        row.appendChild(box);
        row.appendChild(input);
        taskList.appendChild(row);
    });
}

function toggleTask(index) {
    data.tasks[index].done = !data.tasks[index].done;
    saveData(data);
    renderTasks();
}

function scheduleMidnightReset() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    setTimeout(function () {
        data = defaultData();
        saveData(data);
        renderTasks();
        updateDateLabel();
        scheduleMidnightReset();
    }, midnight - now);
}

function updateDateLabel() {
    const label = document.getElementById('dateLabel');
    if (!label) return;
    const d = new Date();
    label.textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

updateDateLabel();
renderTasks();
scheduleMidnightReset();
