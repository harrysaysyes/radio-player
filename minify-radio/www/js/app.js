// ============================================================================
// Radio Player Application - v4.0
// ============================================================================

let audio = null;
let metadataInterval = null;
let currentStationId = '';
let currentStationName = '';

// Web Audio API for audio reactivity
let audioContext = null;
let analyserNode = null;
let sourceNode = null;
let frequencyData = null;

// iOS detection for audio reactivity fallback
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// DOM elements
const tagline = document.getElementById('tagline');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');
const nowPlaying = document.getElementById('nowPlaying');
const trackInfo = document.getElementById('trackInfo');
const trackArtist = document.getElementById('trackArtist');
const logoContainer = document.getElementById('logoContainer');
const stationGrid = document.getElementById('stationGrid');

// ============================================================================
// Station Data Layer
// ============================================================================

const DEFAULT_STATIONS = [
    {
        slotIndex: 0,
        id: 'classicfm',
        name: 'Classic FM',
        url: 'https://media-ice.musicradio.com/ClassicFMMP3',
        tagline: 'The World\'s Greatest Music',
        logoUrl: './assets/logos/classicfm.svg',
        isDefault: true,
        themeColor: null
    },
    {
        slotIndex: 1,
        id: 'reprezent',
        name: 'Reprezent 107.3 FM',
        url: 'https://reprezent.streammachine.co.uk/stream/reprezent',
        tagline: 'Voice of Young London',
        logoUrl: './assets/logos/reprezent.jpg',
        isDefault: true,
        themeColor: null
    },
    {
        slotIndex: 2,
        id: 'worldwide',
        name: 'Worldwide FM',
        url: 'https://worldwide-fm.radiocult.fm/stream',
        tagline: 'Gilles Peterson & Friends',
        logoUrl: null,
        isDefault: true,
        themeColor: null
    }
];

function loadStations() {
    try {
        const saved = localStorage.getItem('minify_stations');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length === 3) return parsed;
        }
    } catch (e) { /* fall through */ }
    return DEFAULT_STATIONS.map(s => Object.assign({}, s));
}

function saveStations(stations) {
    try {
        localStorage.setItem('minify_stations', JSON.stringify(stations));
    } catch (e) { /* storage unavailable */ }
}

let stations = loadStations();

// ============================================================================
// Dynamic Card Rendering
// ============================================================================

function renderStations(stationList) {
    stationGrid.innerHTML = '';
    stationList.forEach((station, i) => {
        const card = document.createElement('button');
        card.className = 'station-card';
        card.dataset.slotIndex = i;
        card.dataset.station = station.id;
        card.dataset.url = station.url || '';
        card.dataset.name = station.name || '';
        card.dataset.tagline = station.tagline || '';
        card.dataset.logoUrl = station.logoUrl || '';
        card.dataset.isDefault = station.isDefault ? 'true' : 'false';
        card.dataset.themeColor = station.themeColor || '';

        if (!station.url) {
            // Empty slot
            card.innerHTML = `
                <div class="station-empty-icon">+</div>
                <div class="station-title">Add station</div>
            `;
            card.classList.add('empty');
        } else {
            card.innerHTML = `
                <button class="edit-station-btn" title="Change station" aria-label="Change station">&#9998;</button>
                <div class="station-title">${escapeHtml(station.name)}</div>
                <div class="station-subtitle">${escapeHtml(station.tagline)}</div>
            `;
        }

        card.addEventListener('click', handleCardClick);
        stationGrid.appendChild(card);
    });

    // Wire up edit buttons (stop propagation so they don't trigger play)
    stationGrid.querySelectorAll('.edit-station-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.station-card');
            openModal(parseInt(card.dataset.slotIndex, 10));
        });
    });
}

function escapeHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ============================================================================
// Card Click Handler
// ============================================================================

function handleCardClick(e) {
    const card = e.currentTarget;

    // If empty slot, open modal
    if (card.classList.contains('empty')) {
        openModal(parseInt(card.dataset.slotIndex, 10));
        return;
    }

    // TOGGLE LOGIC - clicking active card stops playback
    if (card.classList.contains('active')) {
        stopStream();
        card.classList.remove('active');
        document.body.className = 'no-selection';
        logoContainer.innerHTML = '<div style="color: var(--text-primary); font-size: 40px; font-weight: 900;">Minify Radio</div>';
        tagline.textContent = 'Select a station to begin';
        if (window.waveGrid) window.waveGrid.setTheme('default');
        return;
    }

    // Start playback
    const slotIndex = parseInt(card.dataset.slotIndex, 10);
    const station = stations[slotIndex];

    currentStationId = station.id;
    currentStationName = station.name;

    applyStationTheme(station);

    // Update active state
    stationGrid.querySelectorAll('.station-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    updateBranding(station);
    playStream(station.url);
}

// ============================================================================
// Theme Application
// ============================================================================

function applyStationTheme(station) {
    if (station.isDefault) {
        document.body.className = `theme-${station.id}`;
        if (window.waveGrid) window.waveGrid.setTheme(station.id);
    } else {
        const color = station.themeColor || '#6b7280';
        document.body.className = 'theme-custom';
        document.documentElement.style.setProperty('--custom-color', color);
        const rgb = hexToRgbComponents(color);
        document.documentElement.style.setProperty('--custom-rgb', `${rgb.r},${rgb.g},${rgb.b}`);
        if (window.waveGrid) window.waveGrid.setDynamicTheme(color);
    }
}

function hexToRgbComponents(hex) {
    const h = hex.replace('#', '');
    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16)
    };
}

// ============================================================================
// UI Update Functions
// ============================================================================

function updateBranding(station) {
    tagline.textContent = station.tagline || '';

    if (station.logoUrl) {
        const img = new Image();
        img.alt = station.name;
        img.style.cssText = 'max-height:80px;max-width:100%;object-fit:contain;';
        img.onload = () => {
            logoContainer.innerHTML = '';
            logoContainer.appendChild(img);
        };
        img.onerror = () => {
            logoContainer.innerHTML = `<div style="color:var(--text-primary);font-size:clamp(20px,5vw,36px);font-weight:900;">${escapeHtml(station.name)}</div>`;
        };
        img.src = station.logoUrl;
    } else {
        logoContainer.innerHTML = `<div style="color:var(--text-primary);font-size:clamp(20px,5vw,36px);font-weight:900;">${escapeHtml(station.name)}</div>`;
    }
}

function updateStatus(message, isPlaying = false) {
    statusText.textContent = message;
    statusBar.className = 'status-bar';
    if (isPlaying) statusBar.classList.add('playing');
}

function updateNowPlaying(title, artist) {
    trackInfo.textContent = title;
    trackArtist.textContent = artist || '';
    if (audio && !audio.paused) {
        updateMediaSession(title, artist, currentStationName);
    }
}

// ============================================================================
// Audio Stream Functions
// ============================================================================

async function playStream(url, urlAlt = null) {
    if (audio) {
        audio.pause();
        audio = null;
    }

    stopMetadataUpdates();

    if (sourceNode) {
        try { sourceNode.disconnect(); } catch (e) {}
        sourceNode = null;
    }

    audio = new Audio(url);
    audio.crossOrigin = "anonymous";

    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 256;
            analyserNode.smoothingTimeConstant = 0.8;
            frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
        }

        sourceNode = audioContext.createMediaElementSource(audio);
        sourceNode.connect(analyserNode);
        analyserNode.connect(audioContext.destination);
        console.log('✓ Web Audio API connected successfully - audio reactivity enabled');
    } catch (err) {
        console.error('✗ Web Audio API connection failed:', err.message);
        sourceNode = null;
    }

    if (sourceNode && analyserNode) {
        setTimeout(() => {
            const testData = new Uint8Array(analyserNode.frequencyBinCount);
            analyserNode.getByteFrequencyData(testData);
            if (testData.some(v => v > 0)) {
                console.log('✓ Audio reactivity confirmed');
            } else {
                console.warn('⚠ Audio reactivity not detecting signal');
            }
        }, 500);
    }

    let hasTriedAlt = false;

    audio.addEventListener('playing', () => {
        updateStatus('Streaming live', true);
        requestWakeLock();
        if (currentStationId) {
            startMetadataUpdates();
        } else {
            updateNowPlaying('Live Stream', currentStationName);
        }
        updateMediaSession(trackInfo.textContent, trackArtist.textContent, currentStationName);
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    });

    audio.addEventListener('pause', () => {
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    });

    audio.addEventListener('ended', () => {
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
    });

    audio.addEventListener('error', (e) => {
        console.error('Stream error:', e, 'URL:', url);
        if (urlAlt && !hasTriedAlt) {
            hasTriedAlt = true;
            updateStatus('Trying alternative stream...', true);
            if (sourceNode) { try { sourceNode.disconnect(); } catch(e){} sourceNode = null; }

            audio = new Audio(urlAlt);
            audio.crossOrigin = "anonymous";

            if (audioContext) {
                try {
                    sourceNode = audioContext.createMediaElementSource(audio);
                    sourceNode.connect(analyserNode);
                    analyserNode.connect(audioContext.destination);
                } catch (err) { sourceNode = null; }
            }

            audio.addEventListener('playing', () => {
                updateStatus('Streaming live', true);
                requestWakeLock();
                if (currentStationId) startMetadataUpdates();
                else updateNowPlaying('Live Stream', currentStationName);
                updateMediaSession(trackInfo.textContent, trackArtist.textContent, currentStationName);
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            });
            audio.addEventListener('pause', () => { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; });
            audio.addEventListener('ended', () => { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none'; });
            audio.addEventListener('error', () => {
                stopMetadataUpdates();
                updateStatus('Connection error - Stream may be offline');
                updateNowPlaying('Error', 'Unable to connect to stream');
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
            });
            audio.addEventListener('waiting', () => { updateStatus('Buffering...', true); });
            audio.play().catch(err => { console.error('Alternative stream failed:', err); updateStatus('Both streams failed'); });
        } else {
            stopMetadataUpdates();
            updateStatus('Connection error - Stream may be offline');
            updateNowPlaying('Error', 'Unable to connect to stream');
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
        }
    });

    audio.addEventListener('waiting', () => { updateStatus('Buffering...', true); });

    updateStatus('Connecting...', true);

    if (audioContext) {
        console.log('AudioContext state:', audioContext.state);
        if (audioContext.state === 'suspended') {
            await audioContext.resume().catch(err => console.warn('AudioContext resume failed:', err));
        }
    }

    audio.play().catch(err => console.error('Play failed:', err));
}

function stopStream() {
    if (audio) {
        audio.pause();
        audio = null;
    }
    stopMetadataUpdates();
    releaseWakeLock();
    updateStatus('Stopped');
    updateNowPlaying('Stopped', 'Select a station to play');
    stationGrid.querySelectorAll('.station-card').forEach(c => c.classList.remove('active'));
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
}

// ============================================================================
// Metadata Fetching
// ============================================================================

async function fetchClassicFMNowPlaying() {
    try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const response = await fetch(proxyUrl + encodeURIComponent('https://www.classicfm.com/radio/playlist/'), { timeout: 5000 });
        if (!response.ok) throw new Error('Failed to fetch playlist');
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const nowPlayingSection = doc.querySelector('.now-playing');
        if (nowPlayingSection) {
            const h3 = nowPlayingSection.querySelector('h3');
            const artistLink = nowPlayingSection.querySelector('p a');
            if (h3) {
                updateNowPlaying(h3.textContent.trim(), artistLink ? artistLink.textContent.trim() : 'Classic FM');
                return;
            }
        }
    } catch (error) {
        console.log('Classic FM metadata unavailable:', error.message);
    }
    updateNowPlaying('Live on Classic FM', 'The World\'s Greatest Music');
}

function startMetadataUpdates() {
    if (metadataInterval) clearInterval(metadataInterval);
    fetchNowPlaying();
    metadataInterval = setInterval(fetchNowPlaying, 15000);
}

function stopMetadataUpdates() {
    if (metadataInterval) { clearInterval(metadataInterval); metadataInterval = null; }
}

function fetchNowPlaying() {
    if (currentStationId === 'classicfm') {
        fetchClassicFMNowPlaying();
    } else {
        // For all other stations (default non-classicfm and custom), show station name
        const station = stations.find(s => s.id === currentStationId);
        updateNowPlaying(
            `Live on ${station ? station.name : currentStationName}`,
            station ? station.tagline : ''
        );
    }
}

// ============================================================================
// Station Search Modal
// ============================================================================

let targetSlotIndex = 0;
let selectedSearchResult = null;
let selectedColor = '#6b7280';
let searchDebounceTimer = null;

const modal = document.getElementById('stationModal');
const stationSearch = document.getElementById('stationSearch');
const searchResults = document.getElementById('searchResults');
const colorPicker = document.getElementById('colorPicker');
const saveBtn = document.getElementById('saveStation');
const modalCloseBtn = document.getElementById('modalClose');
const swatches = document.querySelectorAll('.swatch');

const SEARCH_HINT_HTML = '<div class="search-hint">Search by name, genre or country</div>';

function openModal(slotIndex) {
    targetSlotIndex = slotIndex;
    selectedSearchResult = null;
    selectedColor = '#6b7280';
    stationSearch.value = '';
    searchResults.innerHTML = SEARCH_HINT_HTML;
    colorPicker.classList.add('hidden');
    swatches.forEach(s => s.classList.remove('selected'));
    swatches[0].classList.add('selected');
    modal.classList.add('open');
    setTimeout(() => stationSearch.focus(), 350);
}

function closeModal() {
    modal.classList.remove('open');
    // Clear after slide-out animation
    setTimeout(() => {
        stationSearch.value = '';
        searchResults.innerHTML = SEARCH_HINT_HTML;
        colorPicker.classList.add('hidden');
        selectedSearchResult = null;
    }, 350);
}

modalCloseBtn.addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

stationSearch.addEventListener('input', () => {
    const query = stationSearch.value.trim();
    clearTimeout(searchDebounceTimer);
    colorPicker.classList.add('hidden');
    selectedSearchResult = null;

    if (query.length < 2) {
        searchResults.innerHTML = SEARCH_HINT_HTML;
        return;
    }

    searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
    searchDebounceTimer = setTimeout(() => searchStations(query), 300);
});

async function searchStations(query) {
    try {
        const url = `https://de1.api.radio-browser.info/json/stations/search?name=${encodeURIComponent(query)}&limit=20&hidebroken=true&order=clickcount`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Search failed');
        const results = await response.json();
        renderSearchResults(results);
    } catch (err) {
        console.error('Station search error:', err);
        searchResults.innerHTML = '<div class="search-empty">Search unavailable. Check your connection.</div>';
    }
}

// Generate initials and a stable hue from a station name
function stationInitials(name) {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

function stationHue(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
    return Math.abs(h) % 360;
}

function renderSearchResults(results) {
    if (!results || results.length === 0) {
        searchResults.innerHTML = '<div class="search-empty">No stations found. Try a different name.</div>';
        return;
    }

    searchResults.innerHTML = '';
    results.forEach(station => {
        const item = document.createElement('div');
        item.className = 'result-item';

        const hue = stationHue(station.name);
        const initials = stationInitials(station.name);
        const meta = [station.country, station.tags ? station.tags.split(',')[0] : '', station.bitrate ? station.bitrate + 'kbps' : '']
            .filter(Boolean).join(' · ');

        item.innerHTML = `
            <div class="result-icon" style="background:hsl(${hue},45%,28%)">
                <span class="result-initials">${escapeHtml(initials)}</span>
                ${station.favicon ? `<img class="result-favicon" src="${escapeHtml(station.favicon)}" alt="" onerror="this.remove()">` : ''}
            </div>
            <div class="result-info">
                <div class="result-name">${escapeHtml(station.name)}</div>
                <div class="result-meta">${escapeHtml(meta)}</div>
            </div>
        `;

        item.addEventListener('click', () => selectSearchResult(item, station));
        searchResults.appendChild(item);
    });
}

function selectSearchResult(itemEl, station) {
    searchResults.querySelectorAll('.result-item').forEach(el => el.classList.remove('selected'));
    itemEl.classList.add('selected');
    selectedSearchResult = station;
    colorPicker.classList.remove('hidden');
}

// Swatch selection
swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        selectedColor = swatch.dataset.color;
    });
});

// Save station
saveBtn.addEventListener('click', () => {
    if (!selectedSearchResult) return;

    const station = selectedSearchResult;
    const newStation = {
        slotIndex: targetSlotIndex,
        id: 'custom_' + Date.now(),
        name: station.name,
        url: station.url_resolved || station.url,
        tagline: (station.tags ? station.tags.split(',')[0] : '') || station.country || '',
        logoUrl: station.favicon || null,
        isDefault: false,
        themeColor: selectedColor
    };

    stations[targetSlotIndex] = newStation;
    saveStations(stations);
    renderStations(stations);
    closeModal();
});

// ============================================================================
// Media Session API (CarPlay & Lock Screen Controls)
// ============================================================================

if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', async () => {
        if (audio && audio.paused) {
            try {
                await audio.play();
                navigator.mediaSession.playbackState = 'playing';
            } catch (err) { console.error('Play failed:', err); }
        }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        if (audio && !audio.paused) {
            audio.pause();
            navigator.mediaSession.playbackState = 'paused';
        }
    });

    navigator.mediaSession.setActionHandler('stop', () => {
        stopStream();
        navigator.mediaSession.playbackState = 'none';
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
        const cards = Array.from(stationGrid.querySelectorAll('.station-card:not(.empty)'));
        const activeCard = cards.find(c => c.classList.contains('active'));
        if (activeCard) {
            const idx = cards.indexOf(activeCard);
            cards[idx === 0 ? cards.length - 1 : idx - 1].click();
        }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
        const cards = Array.from(stationGrid.querySelectorAll('.station-card:not(.empty)'));
        const activeCard = cards.find(c => c.classList.contains('active'));
        if (activeCard) {
            const idx = cards.indexOf(activeCard);
            cards[(idx + 1) % cards.length].click();
        }
    });
}

function updateMediaSession(title, artist, station) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title || 'Radio Stream',
            artist: artist || station,
            album: station || 'Radio Player',
            artwork: [
                { src: './assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: './assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
            ]
        });

        if (audio && !audio.paused) {
            navigator.mediaSession.playbackState = 'playing';
        } else {
            navigator.mediaSession.playbackState = 'paused';
        }

        try {
            navigator.mediaSession.setPositionState({ duration: Infinity, playbackRate: 1, position: 0 });
        } catch (err) {}
    }
}

// ============================================================================
// Wake Lock API
// ============================================================================

let wakeLock = null;

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) { console.log('Wake Lock error:', err); }
}

function releaseWakeLock() {
    if (wakeLock) { wakeLock.release(); wakeLock = null; }
}

// ============================================================================
// Audio Energy Helper (For Canvas Animation)
// ============================================================================

window.getAudioEnergy = function() {
    if (isIOS && (!analyserNode || !sourceNode) && audio && !audio.paused) {
        const time = Date.now() / 1000;
        return 0.20 + 0.05 * Math.sin(time * 0.5);
    }
    if (!analyserNode || !frequencyData) return 0;

    analyserNode.getByteFrequencyData(frequencyData);

    let bassSum = 0;
    for (let i = 0; i < 10; i++) bassSum += frequencyData[i];

    let midSum = 0;
    for (let i = 10; i < 40; i++) midSum += frequencyData[i];

    const bassEnergy = (bassSum / 10) / 255;
    const midEnergy = (midSum / 30) / 255;

    return bassEnergy * 0.7 + midEnergy * 0.3;
};

// ============================================================================
// PWA Service Worker Registration
// ============================================================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => console.log('Service Worker registered:', registration))
            .catch(error => console.log('Service Worker registration failed:', error));
    });
}

// ============================================================================
// Init
// ============================================================================

renderStations(stations);
