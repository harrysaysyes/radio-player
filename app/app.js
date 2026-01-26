// ============================================================================
// Radio Player Application - v3.4
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
const stationCards = document.querySelectorAll('.station-card');
const tagline = document.getElementById('tagline');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');
const nowPlaying = document.getElementById('nowPlaying');
const trackInfo = document.getElementById('trackInfo');
const trackArtist = document.getElementById('trackArtist');
const logoContainer = document.getElementById('logoContainer');

// ============================================================================
// Event Listeners
// ============================================================================

// Station card clicks
stationCards.forEach(card => {
    card.addEventListener('click', () => {
        const stationId = card.getAttribute('data-station');

        // TOGGLE LOGIC - If clicking active card, stop playback
        if (card.classList.contains('active')) {
            // Clicking active card stops playback
            stopStream();
            card.classList.remove('active');

            // Reset branding to default "My Vibe Radio"
            document.body.className = 'no-selection';
            logoContainer.innerHTML = '<div style="color: var(--text-primary); font-size: 40px; font-weight: 900;">Minify Radio</div>';
            tagline.textContent = 'Select a station to begin';

            // Update canvas animation to default theme
            if (window.waveGrid) {
                window.waveGrid.setTheme('default');
            }

            return;
        }

        // Otherwise, start playback
        const url = card.getAttribute('data-url');
        const urlAlt = card.getAttribute('data-url-alt');
        const name = card.getAttribute('data-name');
        const stationTagline = card.getAttribute('data-tagline');

        currentStationId = stationId;
        currentStationName = name;

        // Update theme
        document.body.className = `theme-${stationId}`;

        // Update canvas animation theme
        if (window.waveGrid) {
            window.waveGrid.setTheme(stationId);
        }

        // Update active state
        stationCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        // Update branding
        updateBranding(stationId, name, stationTagline);

        // Play station with fallback
        playStream(url, urlAlt);
    });
});


// ============================================================================
// Audio Stream Functions
// ============================================================================

// Play stream
async function playStream(url, urlAlt = null) {
    if (audio) {
        audio.pause();
        audio = null;
    }

    stopMetadataUpdates();

    // Clean up previous Web Audio connections
    if (sourceNode) {
        try {
            sourceNode.disconnect();
        } catch (e) {
            // Already disconnected, ignore
        }
        sourceNode = null;
    }

    audio = new Audio(url);
    audio.crossOrigin = "anonymous";  // Required for Web Audio API with CORS

    // Try to setup Web Audio API for audio reactivity
    try {
        // Create AudioContext if needed
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 256;
            analyserNode.smoothingTimeConstant = 0.8;
            frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
        }

        // Connect audio element to analyser (can only be done once per audio element)
        sourceNode = audioContext.createMediaElementSource(audio);
        sourceNode.connect(analyserNode);
        analyserNode.connect(audioContext.destination);
        console.log('✓ Web Audio API connected successfully - audio reactivity enabled');
    } catch (err) {
        console.error('✗ Web Audio API connection failed:', err.message);
        console.error('  Audio will play normally without wave reactivity');
        sourceNode = null;
        // If Web Audio API fails, audio plays through normal browser output
    }

    // Validate audio reactivity is working (for debugging)
    if (sourceNode && analyserNode) {
        setTimeout(() => {
            const testData = new Uint8Array(analyserNode.frequencyBinCount);
            analyserNode.getByteFrequencyData(testData);
            const hasData = testData.some(value => value > 0);
            if (hasData) {
                console.log('✓ Audio reactivity confirmed - wave animation will respond to music');
            } else {
                console.warn('⚠ Audio reactivity not detecting signal - waves will animate at default speed');
            }
        }, 500);  // Wait 500ms for audio to start
    }

    let hasTriedAlt = false;

    audio.addEventListener('playing', () => {
        updateStatus('Streaming live', true);

        // Prevent screen sleep
        requestWakeLock();

        if (currentStationId) {
            startMetadataUpdates();
        } else {
            updateNowPlaying('Live Stream', currentStationName);
        }

        // Update CarPlay and lock screen controls
        updateMediaSession(trackInfo.textContent, trackArtist.textContent, currentStationName);

        // Set playback state
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
    });

    // Handle pause event
    audio.addEventListener('pause', () => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
    });

    // Handle ended event (shouldn't happen for live streams, but just in case)
    audio.addEventListener('ended', () => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'none';
        }
    });

    audio.addEventListener('error', (e) => {
        console.error('Stream error:', e, 'URL:', url);

        // Try alternative URL if available and not tried yet
        if (urlAlt && !hasTriedAlt) {
            hasTriedAlt = true;
            console.log('Trying alternative URL:', urlAlt);
            updateStatus('Trying alternative stream...', true);

            // Clean up previous Web Audio connections
            if (sourceNode) {
                try {
                    sourceNode.disconnect();
                } catch (e) {
                    // Already disconnected, ignore
                }
                sourceNode = null;
            }

            audio = new Audio(urlAlt);
            audio.crossOrigin = "anonymous";  // Required for Web Audio API with CORS

            // Connect fallback audio to analyser
            if (audio && audioContext) {
                try {
                    sourceNode = audioContext.createMediaElementSource(audio);
                    sourceNode.connect(analyserNode);
                    analyserNode.connect(audioContext.destination);
                    console.log('✓ Web Audio API connected successfully (fallback stream) - audio reactivity enabled');
                } catch (err) {
                    console.error('✗ Web Audio API connection failed (fallback):', err.message);
                    sourceNode = null;
                }
            }

            // Re-attach event listeners for the new audio element
            audio.addEventListener('playing', () => {
                updateStatus('Streaming live', true);
                requestWakeLock();

                if (currentStationId) {
                    startMetadataUpdates();
                } else {
                    updateNowPlaying('Live Stream', currentStationName);
                }

                updateMediaSession(trackInfo.textContent, trackArtist.textContent, currentStationName);

                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'playing';
                }
            });

            audio.addEventListener('pause', () => {
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'paused';
                }
            });

            audio.addEventListener('ended', () => {
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'none';
                }
            });

            audio.addEventListener('error', () => {
                stopMetadataUpdates();
                updateStatus('Connection error - Stream may be offline');
                updateNowPlaying('Error', 'Unable to connect to stream');
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'none';
                }
            });

            audio.addEventListener('waiting', () => {
                updateStatus('Buffering...', true);
            });

            audio.play().catch((err) => {
                console.error('Alternative stream failed:', err);
                stopMetadataUpdates();
                updateStatus('Both streams failed');
            });
        } else {
            stopMetadataUpdates();
            updateStatus('Connection error - Stream may be offline');
            updateNowPlaying('Error', 'Unable to connect to stream');
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'none';
            }
        }
    });

    audio.addEventListener('waiting', () => {
        updateStatus('Buffering...', true);
    });

    updateStatus('Connecting...', true);

    // Resume audio context if suspended (iOS requirement)
    if (audioContext) {
        console.log('AudioContext state:', audioContext.state);
        if (audioContext.state === 'suspended') {
            console.log('Resuming suspended AudioContext...');
            await audioContext.resume().catch(err => {
                console.warn('AudioContext resume failed:', err);
            });
            console.log('AudioContext state after resume:', audioContext.state);
        }
    }

    audio.play().catch((err) => {
        console.error('Play failed:', err);
        // Error event will be triggered automatically
    });
}

// Stop stream
function stopStream() {
    if (audio) {
        audio.pause();
        audio = null;
    }

    stopMetadataUpdates();
    releaseWakeLock();
    updateStatus('Stopped');
    updateNowPlaying('Stopped', 'Select a station to play');

    // Remove active class from all station cards
    stationCards.forEach(c => c.classList.remove('active'));

    // Update CarPlay/lock screen state
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
    }
}

// ============================================================================
// UI Update Functions
// ============================================================================

// Update branding
function updateBranding(stationId, name, stationTagline) {
    tagline.textContent = stationTagline;

    if (stationId === 'classicfm') {
        logoContainer.innerHTML = '<img src="./assets/logos/classicfm.svg" alt="Classic FM" style="max-height:80px;max-width:100%;object-fit:contain;">';
    } else if (stationId === 'reprezent') {
        logoContainer.innerHTML = '<img src="./assets/logos/reprezent.jpg" alt="Reprezent 107.3 FM" style="max-height:80px;max-width:100%;object-fit:contain;">';
    } else if (stationId === 'worldwide') {
        logoContainer.innerHTML = '<div style="color: var(--text-primary); font-size: 36px; font-weight: 900;">WORLDWIDE FM</div>';
    }
}

// Update status
function updateStatus(message, isPlaying = false) {
    statusText.textContent = message;
    statusBar.className = 'status-bar';
    if (isPlaying) {
        statusBar.classList.add('playing');
    }
}

// Update now playing
function updateNowPlaying(title, artist) {
    trackInfo.textContent = title;
    trackArtist.textContent = artist || '';

    // Update lock screen / notification controls
    if (audio && !audio.paused) {
        updateMediaSession(title, artist, currentStationName);
    }
}

// ============================================================================
// Metadata Fetching
// ============================================================================

async function fetchClassicFMNowPlaying() {
    try {
        // Use CORS proxy to fetch Classic FM playlist
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const response = await fetch(proxyUrl + encodeURIComponent('https://www.classicfm.com/radio/playlist/'), {
            timeout: 5000
        });

        if (!response.ok) {
            throw new Error('Failed to fetch playlist');
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Look for now-playing section
        const nowPlayingSection = doc.querySelector('.now-playing');
        if (nowPlayingSection) {
            const h3 = nowPlayingSection.querySelector('h3');
            const artistLink = nowPlayingSection.querySelector('p a');

            if (h3) {
                const title = h3.textContent.trim();
                const artist = artistLink ? artistLink.textContent.trim() : 'Classic FM';
                updateNowPlaying(title, artist);
                console.log('Classic FM now playing:', title, '-', artist);
                return;
            }
        }
    } catch (error) {
        console.log('Classic FM metadata unavailable:', error.message);
    }
    updateNowPlaying('Live on Classic FM', 'The World\'s Greatest Music');
}

async function fetchReprezentNowPlaying() {
    // Note: Reprezent stream metadata may not be available due to CORS restrictions
    // Showing default message for now
    console.log('Reprezent metadata: Using default (stream metadata not accessible)');
    updateNowPlaying('Live on Reprezent', 'Voice of Young London');
}

async function fetchWorldwideFMNowPlaying() {
    // Static metadata - Worldwide FM stream metadata requires special handling
    updateNowPlaying('Live on Worldwide FM', 'Gilles Peterson & Friends');
}

function startMetadataUpdates() {
    if (metadataInterval) {
        clearInterval(metadataInterval);
    }

    fetchNowPlaying();
    metadataInterval = setInterval(fetchNowPlaying, 15000);
}

function stopMetadataUpdates() {
    if (metadataInterval) {
        clearInterval(metadataInterval);
        metadataInterval = null;
    }
}

function fetchNowPlaying() {
    if (currentStationId === 'classicfm') {
        fetchClassicFMNowPlaying();
    } else if (currentStationId === 'reprezent') {
        fetchReprezentNowPlaying();
    } else if (currentStationId === 'worldwide') {
        fetchWorldwideFMNowPlaying();
    }
}

// ============================================================================
// Media Session API (CarPlay & Lock Screen Controls)
// ============================================================================

if ('mediaSession' in navigator) {
    // Play action
    navigator.mediaSession.setActionHandler('play', async () => {
        if (audio && audio.paused) {
            try {
                await audio.play();
                navigator.mediaSession.playbackState = 'playing';
            } catch (err) {
                console.error('Play failed:', err);
            }
        }
    });

    // Pause action
    navigator.mediaSession.setActionHandler('pause', () => {
        if (audio && !audio.paused) {
            audio.pause();
            navigator.mediaSession.playbackState = 'paused';
        }
    });

    // Stop action
    navigator.mediaSession.setActionHandler('stop', () => {
        stopStream();
        navigator.mediaSession.playbackState = 'none';
    });

    // Previous track (cycle to other station)
    navigator.mediaSession.setActionHandler('previoustrack', () => {
        // Switch stations
        const cards = Array.from(stationCards);
        const activeCard = cards.find(c => c.classList.contains('active'));
        if (activeCard) {
            const currentIndex = cards.indexOf(activeCard);
            const prevCard = cards[currentIndex === 0 ? cards.length - 1 : currentIndex - 1];
            prevCard.click();
        }
    });

    // Next track (cycle to other station)
    navigator.mediaSession.setActionHandler('nexttrack', () => {
        // Switch stations
        const cards = Array.from(stationCards);
        const activeCard = cards.find(c => c.classList.contains('active'));
        if (activeCard) {
            const currentIndex = cards.indexOf(activeCard);
            const nextCard = cards[(currentIndex + 1) % cards.length];
            nextCard.click();
        }
    });
}

// Update media session metadata when playing (for CarPlay and lock screen)
function updateMediaSession(title, artist, station) {
    if ('mediaSession' in navigator) {
        // Use local icon artwork for all stations
        let artworkUrl = './assets/icons/icon-192.png';
        let largeArtworkUrl = './assets/icons/icon-512.png';

        navigator.mediaSession.metadata = new MediaMetadata({
            title: title || 'Radio Stream',
            artist: artist || station,
            album: station || 'Radio Player',
            artwork: [
                { src: artworkUrl, sizes: '96x96', type: 'image/png' },
                { src: artworkUrl, sizes: '128x128', type: 'image/png' },
                { src: artworkUrl, sizes: '192x192', type: 'image/png' },
                { src: artworkUrl, sizes: '256x256', type: 'image/png' },
                { src: largeArtworkUrl, sizes: '384x384', type: 'image/png' },
                { src: largeArtworkUrl, sizes: '512x512', type: 'image/png' }
            ]
        });

        // Set playback state
        if (audio && !audio.paused) {
            navigator.mediaSession.playbackState = 'playing';
        } else {
            navigator.mediaSession.playbackState = 'paused';
        }

        // Set position state for live streams (always at current time)
        try {
            navigator.mediaSession.setPositionState({
                duration: Infinity,
                playbackRate: 1,
                position: 0
            });
        } catch (err) {
            // Position state not supported, ignore
        }
    }
}

// ============================================================================
// Wake Lock API (Prevent Sleep During Playback)
// ============================================================================

let wakeLock = null;

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.log('Wake Lock error:', err);
    }
}

function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}

// ============================================================================
// Audio Energy Helper (For Canvas Animation)
// ============================================================================

// Make this function available globally for wave-animation.js to call
window.getAudioEnergy = function() {
    // Fallback for iOS when Web Audio API fails (CORS issue)
    if (isIOS && (!analyserNode || !sourceNode) && audio && !audio.paused) {
        // Subtle static motion: gentle oscillation 0.15-0.25
        const time = Date.now() / 1000;
        return 0.20 + 0.05 * Math.sin(time * 0.5);
    }

    if (!analyserNode || !frequencyData) return 0;

    analyserNode.getByteFrequencyData(frequencyData);

    // Bass frequencies (bins 0-10 ≈ 0-200Hz) - for low-end energy
    let bassSum = 0;
    for (let i = 0; i < 10; i++) {
        bassSum += frequencyData[i];
    }

    // Mid frequencies (bins 10-40 ≈ 200-800Hz) - for beat/tempo detection
    let midSum = 0;
    for (let i = 10; i < 40; i++) {
        midSum += frequencyData[i];
    }

    // Weighted blend: 70% bass, 30% mids (emphasize low-end but detect beats)
    const bassEnergy = (bassSum / 10) / 255;
    const midEnergy = (midSum / 30) / 255;

    return bassEnergy * 0.7 + midEnergy * 0.3; // Normalize to 0-1
};

// ============================================================================
// PWA Service Worker Registration
// ============================================================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// ============================================================================
// Canvas Animation - Already initialized in HTML
// ============================================================================
// The wave grid animation is initialized in radio-player.html
