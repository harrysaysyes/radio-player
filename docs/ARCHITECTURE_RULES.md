# Architecture Rules - Structural Patterns & Data Flow

## Overview

This document preserves the **architectural patterns** and **data flow mechanisms** that ensure the radio player's reliability, maintainability, and user experience. These rules define how components communicate, how errors are handled, and how the application initializes.

**Purpose**: Lock down structural patterns that ensure reliability while allowing flexibility in features and styling.

**When to Consult**: Before refactoring modules, changing state management, modifying component communication, or altering error handling mechanisms.

---

## 🚨 CRITICAL REQUIREMENT

**Any change to CRITICAL architectural patterns requires explicit user approval before implementation.**

If you need to modify a CRITICAL pattern, you must:
1. Identify which specific pattern would be violated
2. Explain the rationale for the change
3. Request explicit user approval
4. Update this rules file if approved
5. Document the rationale in the commit message

---

## 1. Core Architectural Patterns (CRITICAL - DO NOT MODIFY)

### 1.1 Module Communication Pattern

**Files**: `wave-grid.js`, `app.js`

#### Global Namespace Coupling (CRITICAL)

The application uses **minimal global namespace coupling** for cross-module communication:

```javascript
// wave-grid.js exposes:
window.waveGrid = {
  init: function(canvasElement) { ... },
  setTheme: function(themeName) { ... },
  destroy: function() { ... }
};

// app.js exposes:
window.getAudioEnergy = function() {
  // Returns normalized audio energy [0, 1]
  return bassEnergy * 0.7 + midEnergy * 0.3;
};
```

**Critical characteristics**:
- **Unidirectional flow**: app.js → wave-grid.js only
- **No callbacks**: wave-grid.js never calls back into app.js
- **No event listeners**: Direct function calls only
- **Clean isolation**: Each module encapsulated in IIFE

**Why CRITICAL**: This pattern keeps modules decoupled while allowing necessary communication. Breaking it would tangle dependencies.

---

### 1.2 IIFE Encapsulation Pattern (CRITICAL)

**File**: `wave-grid.js` (lines 6-321)

```javascript
(function() {
  'use strict';

  // Private state
  const config = { ... };
  let canvas = null;
  let ctx = null;
  // ... more private variables

  // Private functions
  function update(deltaTime) { ... }
  function draw(context) { ... }

  // Public API
  window.waveGrid = {
    init: function(canvasElement) { ... },
    setTheme: function(themeName) { ... },
    destroy: function() { ... }
  };
})();
```

**Critical characteristics**:
- All internal state is **private** (not accessible outside IIFE)
- Only explicitly exposed functions are public (via `window.waveGrid`)
- Prevents global namespace pollution
- Enables clean teardown via `destroy()`

**Why CRITICAL**: This isolation pattern is fundamental to maintainability and prevents accidental coupling.

---

### 1.3 Data Flow Direction (CRITICAL)

```
┌─────────┐
│ app.js  │
└────┬────┘
     │
     │ waveGrid.setTheme(stationId)
     │ (one-way call)
     ↓
┌────────────┐
│wave-grid.js│←─── getAudioEnergy()
└────────────┘     (pull-based query)
```

**Rules**:
1. **app.js controls wave-grid.js** (not vice versa)
2. **wave-grid.js queries audio data** (pull, not push)
3. **No bidirectional coupling** (no callbacks from wave-grid to app)

**Why CRITICAL**: Unidirectional data flow prevents circular dependencies and makes debugging deterministic.

---

## 2. Audio Streaming Architecture (CRITICAL)

### 2.1 Audio Streaming Flow

**File**: `app.js` (lines 151-321)

```
User clicks station
  ↓
playStream(url, urlAlt)
  ↓
Stop current stream (if playing)
  ↓
Create new Audio element
  ↓
Setup Web Audio API (lazy init)
  ├─ Create AudioContext (if first time)
  ├─ Create AnalyserNode (if first time)
  └─ Connect: audio → analyser → destination
  ↓
Attach event listeners
  ├─ 'playing' → Update UI, start metadata
  ├─ 'error' → Retry with urlAlt or show error
  ├─ 'waiting' → Show buffering status
  └─ 'pause' → Update UI
  ↓
audio.play()
  ↓
On error:
  ├─ Has urlAlt and not tried? → Retry with urlAlt
  └─ Already tried or no urlAlt → Show error
```

**Critical invariants**:
- **Always create new Audio element** per stream (don't reuse)
- **Recreate Web Audio connections** per stream (avoid double-connection errors)
- **Event listeners attached before play()** (avoid race conditions)
- **Fallback to urlAlt exactly once** (prevent infinite retry loops)

---

### 2.2 Error Handling & Fallback (CRITICAL)

**File**: `app.js` (lines 225-321)

```javascript
let hasTriedAlt = false;

audio.addEventListener('error', (e) => {
  console.error('Stream error:', e, 'URL:', url);

  if (urlAlt && !hasTriedAlt) {
    hasTriedAlt = true;
    console.log('Retrying with alternate URL:', urlAlt);

    // Create entirely new Audio element
    audio = new Audio(urlAlt);

    // Recreate Web Audio API connections
    if (audioContext) {
      try {
        sourceNode = audioContext.createMediaElementSource(audio);
        sourceNode.connect(analyserNode);
        analyserNode.connect(audioContext.destination);
      } catch (err) {
        console.warn('Web Audio connection failed:', err);
        // Audio still plays without visualization
      }
    }

    // Re-attach all event listeners
    attachAudioEventListeners();

    // Retry playback
    audio.play().catch(playErr => {
      console.error('Alternate URL also failed:', playErr);
      updateStatus('Connection error - Stream may be offline');
      stopBtn.disabled = true;
    });
  } else {
    // Final failure
    updateStatus('Connection error - Stream may be offline');
    stopBtn.disabled = true;
  }
});
```

**Critical error handling rules**:
1. **Exactly one retry** with alternate URL (via `hasTriedAlt` flag)
2. **Create new Audio element** on retry (don't reuse failed one)
3. **Recreate Web Audio connections** (avoid connection state issues)
4. **Graceful degradation** on Web Audio failure (audio still plays)
5. **Clear error messaging** to user on final failure
6. **Disable stop button** on failure (prevents undefined state)

**Why CRITICAL**: This multi-level fallback ensures maximum stream reliability.

---

### 2.3 Web Audio API Fallback (CRITICAL)

**File**: `app.js` (lines 138-149)

```javascript
// Try to create Web Audio visualization
if (audioContext) {
  try {
    sourceNode = audioContext.createMediaElementSource(audio);
    sourceNode.connect(analyserNode);
    analyserNode.connect(audioContext.destination);
  } catch (err) {
    console.warn('Could not connect audio for visualization:', err);
    console.warn('This can happen due to CORS or if already connected');
    // Fallback: Audio will still play, just no wave visualization
  }
}
```

**Critical fallback rule**:
- **Never block playback** on Web Audio API failure
- Web Audio is "nice-to-have" (visualization)
- Core playback is "must-have" (audio element)

**Common failure scenarios**:
1. **CORS restrictions**: Stream URL doesn't allow cross-origin access
2. **Double connection**: Attempted to connect same audio element twice
3. **Browser incompatibility**: Old browsers without Web Audio API

**Why CRITICAL**: Ensures audio playback never fails just because visualization fails.

---

## 3. Theme System Architecture (CRITICAL)

### 3.1 CSS-First Theme Approach

**Files**: `styles.css` (lines 25-91), `app.js` (lines 164-173)

#### Theme Application Flow

```
User selects station
  ↓
app.js: document.body.className = `theme-${stationId}`
  ↓
CSS cascade applies theme-specific rules
  ↓
app.js: waveGrid.setTheme(stationId)
  ↓
wave-grid.js updates canvas colors
```

#### CSS Custom Properties (CRITICAL)

**File**: `styles.css`

```css
/* Default/Neutral theme */
body.no-selection {
    background: linear-gradient(135deg, #0f3460 0%, #1a1f3a 50%, #16213e 100%);
    --text-primary: #e2e8f0;
    --text-secondary: #94a3b8;
    --border-color: rgba(139, 76, 246, 0.2);
}

/* Classic FM Theme */
body.theme-classicfm {
    background: linear-gradient(135deg, #0a0000 0%, #1a0000 30%, #2a0505 70%, #0a0000 100%);
    --text-primary: #ffffff;
    --text-secondary: #FFD700;
    --border-color: rgba(255, 215, 0, 0.3);
}

/* All components reference custom properties */
.player-container {
    border: 1px solid var(--border-color);
}

.track-info {
    color: var(--text-primary);
}
```

**Critical characteristics**:
- **Body class mutation** triggers theme change
- **CSS custom properties** cascade to all components
- **No runtime theme calculation** (all predefined)
- **Canvas theme updated separately** via `waveGrid.setTheme()`

**Why CRITICAL**: This declarative approach keeps theme logic in CSS where it belongs, avoiding JavaScript DOM manipulation.

---

### 3.2 Canvas Theme Synchronization (CRITICAL)

**File**: `wave-grid.js` (lines 64-79, 287-294)

```javascript
const themes = {
  default: {
    background: '#0a0a0a',
    lineColor: 'rgba(139, 76, 246, 0.3)'
  },
  classicfm: {
    background: '#1a0000',
    lineColor: 'rgba(255, 215, 0, 0.4)'
  },
  reprezent: {
    background: '#0a0a0a',
    lineColor: 'rgba(255, 255, 255, 0.25)'
  }
};

// Public API
setTheme: function(themeName) {
  if (themes[themeName]) {
    currentTheme = themeName;
  } else {
    currentTheme = 'default';
  }
}
```

**Critical rule**: Canvas theme **must be updated explicitly** (can't access CSS custom properties from canvas).

---

## 4. Component Lifecycle & Initialization Order (CRITICAL)

### 4.1 Script Loading Order (CRITICAL)

**File**: `radio-player.html` (lines 82-91)

```html
<script src="simplex-noise.js"></script>       <!-- 1. Defines window.simplex -->
<script src="wave-grid.js"></script>           <!-- 2. Defines window.waveGrid -->
<script src="app.js"></script>                 <!-- 3. Uses both APIs -->
<script>
  // 4. Inline script initializes wave grid
  const canvas = document.getElementById('backgroundCanvas');
  if (canvas && window.waveGrid) {
    waveGrid.init(canvas);
  }
</script>
```

**Why this order is CRITICAL**:
1. **simplex-noise.js first** → Provides `window.simplex` for wave-grid.js
2. **wave-grid.js second** → Needs `simplex`, provides `window.waveGrid`
3. **app.js third** → Needs `waveGrid` API, provides `getAudioEnergy()`
4. **Inline script last** → DOM ready, all APIs available

**Violation consequence**:
- Load wave-grid.js before simplex-noise.js → `ReferenceError: simplex is not defined`
- Load app.js before wave-grid.js → `waveGrid.setTheme()` fails silently
- Initialize before DOM ready → `canvas` element not found

---

### 4.2 Initialization Sequence (CRITICAL)

**File**: `app.js` (lines 1-90)

```javascript
// 1. Query all UI elements (cached for performance)
const stationCards = document.querySelectorAll('.station-card');
const stopBtn = document.getElementById('stopBtn');
const volumeSlider = document.getElementById('volumeSlider');
// ... etc.

// 2. Attach event listeners
stationCards.forEach(card => {
  card.addEventListener('click', () => { ... });
});

stopBtn.addEventListener('click', stopStream);
volumeSlider.addEventListener('input', updateVolume);

// 3. Register service worker (deferred, non-blocking)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(reg => console.log('Service Worker registered'))
    .catch(err => console.error('Service Worker registration failed:', err));
}

// 4. Wave grid initialized by inline script (after DOM ready)
```

**Critical characteristics**:
- **Cache DOM queries** (don't query repeatedly)
- **Attach listeners early** (before user interaction)
- **Service worker registration deferred** (non-blocking)
- **Wave grid initialized last** (canvas ready)

**Why CRITICAL**: This sequence ensures UI is interactive immediately while background features initialize asynchronously.

---

## 5. State Management Pattern (CRITICAL)

### 5.1 Direct DOM Manipulation (CRITICAL)

**File**: `app.js`

The application uses **direct DOM manipulation** (no virtual DOM or state libraries):

```javascript
// Update UI directly
function updateNowPlaying(stationName, trackInfo = '', trackArtist = '') {
  document.getElementById('trackInfo').textContent = trackInfo || 'Loading...';
  document.getElementById('trackArtist').textContent = trackArtist;
  document.getElementById('tagline').textContent = getStationTagline(currentStationId);
}

function updateStatus(message, isPlaying = false) {
  document.getElementById('statusText').textContent = message;
  const statusBar = document.getElementById('statusBar');
  if (isPlaying) {
    statusBar.classList.add('playing');
  } else {
    statusBar.classList.remove('playing');
  }
}
```

**Critical characteristics**:
- **No state store** (DOM is the source of truth)
- **Imperative updates** (directly set textContent, classList)
- **Event-driven** (audio element events trigger updates)

**Why CRITICAL**: This simple pattern keeps the app lightweight and predictable. Adding a state layer would overcomplicate for this use case.

---

### 5.2 Single Source of Truth: Audio Element (CRITICAL)

**File**: `app.js` (lines 91-148)

The `audio` element's playback state is the **single source of truth**:

```javascript
let audio = null;  // Currently playing audio element

// State derived from audio element
const isPlaying = audio && !audio.paused;
const currentVolume = audio ? audio.volume : 0.8;

// Events drive UI updates
audio.addEventListener('playing', () => {
  updateStatus('Playing', true);
  nowPlaying.classList.add('playing');
  stopBtn.disabled = false;
});

audio.addEventListener('pause', () => {
  updateStatus('Paused', false);
  nowPlaying.classList.remove('playing');
});
```

**Critical rule**: **Never store playback state separately** - always query audio element.

**Why CRITICAL**: Prevents state synchronization bugs (UI saying "playing" when audio is paused).

---

### 5.3 No State Persistence (CRITICAL)

The application **does not persist state** across page reloads:

```javascript
// NO localStorage
// NO sessionStorage
// NO cookies for app state
```

**Why CRITICAL**:
- Simpler mental model (fresh start every time)
- No stale state bugs
- Privacy-friendly (no tracking)

**Exception**: Service worker caches static assets, but not application state.

---

## 6. Service Worker Cache Strategy (CRITICAL)

### 6.1 Static Asset Caching (CRITICAL)

**File**: `service-worker.js` (lines 1-21)

```javascript
const CACHE_NAME = 'radio-player-v3.6';
const urlsToCache = [
  './',
  './radio-player.html',
  './styles.css',
  './simplex-noise.js',
  './wave-grid.js',
  './app.js',
  './manifest.json',
  './assets/logos/classicfm.svg',
  './assets/logos/reprezent.jpg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();  // Activate immediately
});
```

**Critical rules**:
- **Cache all static assets** (HTML, CSS, JS, images)
- **Version-named cache** (increment on every change)
- **skipWaiting()** ensures immediate activation
- **Precache on install** (not on first fetch)

---

### 6.2 Cache Cleanup Strategy (CRITICAL)

**File**: `service-worker.js` (lines 23-37)

```javascript
// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);  // Delete old versions
          }
        })
      );
    })
  );
  self.clients.claim();  // Take control immediately
});
```

**Critical rules**:
- **Delete all old caches** (prevents storage bloat)
- **clients.claim()** takes control of existing pages
- **Atomic update** (old cache deleted after new cache ready)

---

### 6.3 Audio Stream Exclusion (CRITICAL)

**File**: `service-worker.js` (lines 39-57)

```javascript
// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  // Don't cache audio streams
  if (event.request.url.includes('.mp3') ||
      event.request.url.includes('radio.canstream') ||
      event.request.url.includes('musicradio.com')) {
    return;  // Let browser fetch directly (network-only)
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;  // Serve from cache
        }
        return fetch(event.request);  // Fetch from network
      })
  );
});
```

**Critical rules**:
- **NEVER cache audio streams** (they're live, not static)
- **Cache-first for static assets** (fast offline loading)
- **Network fallback** for uncached resources

**Why CRITICAL**: Caching audio streams would:
- Break live radio (serve stale audio)
- Fill disk storage rapidly
- Cause stream synchronization issues

---

## 7. Audio Context Lifecycle (CRITICAL)

### 7.1 Lazy Initialization (CRITICAL)

**File**: `app.js` (lines 91-103)

```javascript
let audioContext = null;
let analyserNode = null;
let sourceNode = null;
let frequencyData = null;

// Lazy initialization on first play
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 256;
    frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
  }
}
```

**Critical rule**: **Create AudioContext only when needed** (user gesture required).

**Why lazy**:
- Browser autoplay policies require user gesture
- Saves resources if user never plays audio
- Avoids "AudioContext was not allowed to start" errors

---

### 7.2 Connection Recreation Pattern (CRITICAL)

**File**: `app.js` (lines 133-149)

```javascript
// MUST recreate connection for each new audio element
if (audioContext) {
  try {
    sourceNode = audioContext.createMediaElementSource(audio);
    sourceNode.connect(analyserNode);
    analyserNode.connect(audioContext.destination);
  } catch (err) {
    console.warn('Could not connect audio for visualization:', err);
  }
}
```

**Critical rules**:
- **Create new sourceNode** for each audio element (can't reuse)
- **Catch connection errors** (CORS, double-connection)
- **Never block playback** on connection failure

**Why recreate**: Each `<audio>` element needs its own `MediaElementSourceNode`.

---

## 8. Global State Variables (CRITICAL - Do Not Expand)

### 8.1 Current Global State (CRITICAL)

**File**: `app.js` (lines 1-90)

```javascript
// Audio Playback State
let audio = null;
let audioContext = null;
let analyserNode = null;
let sourceNode = null;
let frequencyData = null;

// Metadata & Station State
let metadataInterval = null;
let currentStationId = '';
let currentStationName = '';

// UI Element References (cached at init)
const stationCards = document.querySelectorAll('.station-card');
const stopBtn = document.getElementById('stopBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const nowPlaying = document.getElementById('nowPlaying');
const trackInfo = document.getElementById('trackInfo');
const trackArtist = document.getElementById('trackArtist');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');
const logoContainer = document.getElementById('logoContainer');
const brandBadge = document.getElementById('brandBadge');
const tagline = document.getElementById('tagline');
const customBtn = document.getElementById('customBtn');
const customStream = document.getElementById('customStream');
const customStreamInput = document.getElementById('customStreamInput');
const playCustomBtn = document.getElementById('playCustomBtn');
```

**Critical rule**: **No additional global state without explicit approval.**

**Why CRITICAL**: Global state expansion leads to:
- Harder debugging (who modified this variable?)
- Coupling between unrelated features
- State synchronization bugs

---

### 8.2 Acceptable State Additions

New global variables are acceptable **only if**:
1. They represent **truly global** concerns (e.g., new audio feature)
2. They're **necessary for cross-function communication**
3. They can't be scoped to a single function
4. User has **explicitly approved** the addition

---

## 9. Metadata Fetching Pattern (CRITICAL)

### 9.1 Graceful Degradation (CRITICAL)

**File**: `app.js` (lines 373-502)

```javascript
function startMetadataPolling() {
  clearInterval(metadataInterval);

  metadataInterval = setInterval(async () => {
    try {
      const response = await fetch(apiUrl, {
        timeout: 5000  // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      updateNowPlaying(currentStationName, data.track, data.artist);

    } catch (error) {
      console.warn('Metadata fetch failed:', error);
      // Fallback: Don't clear current display
      // Just log and continue polling
    }
  }, 10000);  // Poll every 10 seconds
}
```

**Critical characteristics**:
- **5 second fetch timeout** (don't wait forever)
- **Continue polling on error** (transient failures are common)
- **Don't clear display on error** (preserve last known good data)
- **Log but don't alert user** (metadata is "nice-to-have")

**Why CRITICAL**: Metadata should **never block or break playback**.

---

## 10. Browser API Feature Detection (CRITICAL)

### 10.1 Progressive Enhancement Pattern (CRITICAL)

**File**: `app.js` (lines 431-502)

```javascript
// Media Session API (CarPlay, lock screen controls)
if ('mediaSession' in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: trackInfo,
    artist: trackArtist,
    album: currentStationName
  });

  navigator.mediaSession.setActionHandler('play', () => {
    if (audio) audio.play();
  });

  navigator.mediaSession.setActionHandler('pause', () => {
    if (audio) audio.pause();
  });
}

// Wake Lock API (prevent screen sleep)
if ('wakeLock' in navigator && document.visibilityState === 'visible') {
  navigator.wakeLock.request('screen')
    .catch(err => console.warn('Wake lock failed:', err));
}

// Service Worker (offline capability)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .catch(err => console.error('Service Worker failed:', err));
}
```

**Critical pattern**:
```javascript
if ('feature' in navigator) {
  // Use feature
} else {
  // Silently degrade (no error)
}
```

**Why CRITICAL**: Ensures app works on **all browsers** (old and new).

---

## 11. Event Listener Cleanup (CRITICAL)

### 11.1 Memory Leak Prevention (CRITICAL)

**File**: `wave-grid.js` (lines 306-319)

```javascript
window.waveGrid = {
  destroy: function() {
    window.removeEventListener('resize', handleResize);
    canvas = null;
    ctx = null;
  }
};
```

**Critical rule**: **Always provide cleanup method** for modules with event listeners.

**Why CRITICAL**: Prevents memory leaks in single-page apps where modules are dynamically loaded/unloaded.

---

## 12. Approval Process for Architecture Changes

### 12.1 How to Request Approval

When you need to modify a CRITICAL architectural pattern:

1. **Identify the pattern**:
   - State which pattern needs changing
   - Cite section of this document
   - Describe current behavior

2. **Explain rationale**:
   - What problem does current architecture have?
   - Why is the change necessary?
   - What alternatives were considered?

3. **Assess impact**:
   - What components are affected?
   - Are there backward compatibility concerns?
   - What are the risks?

4. **Request approval**:
   - Ask user explicitly if change is acceptable
   - Provide clear before/after comparison
   - Explain implications for future development

5. **Update documentation**:
   - If approved, update this file with new pattern
   - Document rationale in commit message
   - Add examples of new pattern

---

### 12.2 Example: CORRECT Approval Request

```
I'd like to introduce a centralized state store for managing playback state.

**Current pattern**: Direct DOM manipulation + audio element as source of truth
**Proposed pattern**: Redux-style state store with reducers

**Rationale**:
- Current pattern makes it hard to synchronize playback state across multiple UI components
- Want to add playlist feature that needs coordinated state updates
- State store would provide single source of truth and predictable updates

**Impact**:
- Affects: app.js (entire state management section)
- Breaks: Direct DOM manipulation pattern (Section 5.1)
- Adds: ~500 lines of state management code
- Dependencies: Would need to add Redux library

**Risks**:
- Increased complexity (from 0 dependencies to 1)
- Larger bundle size (~10KB minified)
- Steeper learning curve for future developers

**Request**: This violates Section 5.1 (Direct DOM Manipulation) and
Section 8.1 (Global State Variables). May I proceed with this architectural change?
```

✅ **CORRECT**: Identifies pattern, explains rationale, assesses impact, requests approval

---

### 12.3 Example: INCORRECT Approach

```
I refactored the app to use React because it's better.
```

❌ **INCORRECT**:
- No identification of violated patterns
- No rationale beyond "it's better"
- No impact assessment
- No approval requested
- Massive architectural change

---

## 13. Quick Reference: Pattern Categories

### CRITICAL Patterns (Require Approval)
- Module communication (global namespace, unidirectional flow)
- IIFE encapsulation
- Audio streaming flow (error handling, fallback)
- Theme system (CSS-first approach)
- Script loading order
- Initialization sequence
- State management (direct DOM, no persistence)
- Service worker cache strategy
- Audio context lifecycle
- Global state variables (no expansion)

### SAFE TO MODIFY
- Metadata polling interval (within 5-30 seconds)
- UI element styling (colors, spacing, animations)
- Station list (add/remove stations)
- Feature detection warnings (console messages)
- Error message text

### NEVER CHANGE
- Script loading order (simplex → wave-grid → app → inline)
- Audio stream exclusion from cache
- Lazy AudioContext initialization (browser requirement)
- Unidirectional data flow (app.js → wave-grid.js)

---

## 14. When to Update This Rules File

Update this document when:

1. **User approves architectural pattern change**
   - Document new pattern in CRITICAL section
   - Explain when pattern should be used
   - Update affected sections

2. **New feature adds cross-module communication**
   - Document communication contract
   - Explain data flow direction
   - Add to Data Flow Contracts section

3. **New error handling mechanism added**
   - Document fallback strategy
   - Explain graceful degradation
   - Add to Error Handling section

4. **Component initialization order changes**
   - Update initialization sequence
   - Explain new dependencies
   - Add to Lifecycle section

**Always include rationale in commit message when updating architecture rules.**

---

**Last Updated**: 2026-01-25
**Rules Version**: 1.0
**Source Files**: `app.js` (lines 1-650), `wave-grid.js` (lines 1-321), `service-worker.js` (lines 1-57)
