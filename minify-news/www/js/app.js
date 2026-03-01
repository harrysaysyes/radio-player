// ============================================================================
// Minify News — v1.0
// Three headlines. One source. Nothing more.
// ============================================================================

'use strict';

(function () {
    const canvas = document.getElementById('backgroundCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;
    const GAP = 30;
    const COLOR = '96, 165, 250';
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cols = Math.ceil(canvas.width / GAP) + 2;
        const rows = Math.ceil(canvas.height / GAP) + 2;
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * GAP;
                const dy = Math.sin(i * 0.45 + t) * 7 + Math.sin(j * 0.35 + t * 0.55) * 3;
                const y = j * GAP + dy;
                const a = 0.05 + 0.035 * Math.sin(i * 0.2 + j * 0.25 + t * 0.3);
                ctx.fillStyle = `rgba(${COLOR}, ${a.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(x, y, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        t += 0.013;
        requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resize);
    resize();
    draw();
})();

const STORIES = [
    {
        title: 'Global leaders convene for climate summit',
        summary: 'Representatives from 190 countries met to discuss new emissions targets and funding mechanisms for developing nations.',
        url: '#'
    },
    {
        title: 'Tech sector sees record investment in AI infrastructure',
        summary: 'Data centre construction and chip manufacturing reached an all-time high as demand for compute continues to grow.',
        url: '#'
    },
    {
        title: 'Scientists identify new deep-sea species off Pacific coast',
        summary: 'A research vessel discovered three previously unknown species at depths exceeding 4,000 metres during a six-week expedition.',
        url: '#'
    },
    {
        title: 'Central banks signal pause on interest rate adjustments',
        summary: 'Multiple major economies indicated they would hold rates steady as inflation metrics show continued moderation.',
        url: '#'
    },
    {
        title: 'Space agency announces crewed lunar mission timeline',
        summary: 'Officials confirmed a target window for the next crewed moon landing, with training and hardware preparation underway.',
        url: '#'
    },
    {
        title: 'Urban farming expands across former industrial districts',
        summary: 'Cities are converting decommissioned warehouses into vertical growing facilities, reducing supply distances for fresh produce.',
        url: '#'
    },
    {
        title: 'Language preservation efforts receive new funding',
        summary: 'A coalition of universities announced grants to document endangered languages before the last fluent speakers are lost.',
        url: '#'
    },
    {
        title: 'Antarctic ice study reveals unexpectedly stable regions',
        summary: 'New satellite data shows certain ice sheets are more resilient than models predicted, though overall trends remain concerning.',
        url: '#'
    },
    {
        title: 'Breakthrough in solid-state battery development reported',
        summary: 'Researchers announced a new electrolyte formulation improving energy density and cycle life significantly in laboratory conditions.',
        url: '#'
    }
];

let offset = 0;

const headlineList = document.getElementById('headlineList');

function renderHeadlines() {
    headlineList.innerHTML = '';
    const batch = STORIES.slice(offset, offset + 3);
    batch.forEach(function (story) {
        const card = document.createElement('a');
        card.className = 'headline-card';
        card.href = story.url;
        if (story.url !== '#') {
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
        }
        const title = document.createElement('div');
        title.className = 'headline-title';
        title.textContent = story.title;
        const summary = document.createElement('div');
        summary.className = 'headline-summary';
        summary.textContent = story.summary;
        const link = document.createElement('div');
        link.className = 'headline-link';
        link.textContent = story.url === '#' ? 'Mock story' : 'Read more \u2192';
        card.appendChild(title);
        card.appendChild(summary);
        card.appendChild(link);
        headlineList.appendChild(card);
    });
}

function refresh() {
    offset = (offset + 3) % STORIES.length;
    if (offset + 3 > STORIES.length) offset = 0;
    renderHeadlines();
}

document.getElementById('refreshBtn').addEventListener('click', refresh);

renderHeadlines();
