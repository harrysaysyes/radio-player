/**
 * Canvas Wave Grid Animation
 * Implements performant 2D grid with noise-based motion and cursor interaction
 */

(function() {
  'use strict';

  // ===== CONFIGURATION =====
  const config = {
    // Grid
    xGap: 12,              // Horizontal spacing (px) - reduced for smoother polylines
    yGap: 18,              // Vertical spacing (px) - creates ~60 lines vs ~44

    // Noise Angle Field
    xScale: 0.002,         // Spatial frequency in X (reduced for smoother waves)
    yScale: 0.0015,        // Spatial frequency in Y (reduced for smoother waves)
    speedX: 0.03,          // Time scroll speed in X (slower for fluid motion)
    speedY: 0.015,         // Time scroll speed in Y (slower for fluid motion)
    angleGain: 6,          // Angle multiplier for noise (reduced for smoother undulation)

    // Wave Displacement
    waveAmpX: 0,           // Horizontal wave amplitude (0 = horizontal lines only)
    waveAmpY: 12,          // Vertical wave amplitude (slightly increased for more visible waves)

    // Cursor Interaction
    influenceRadius: 350,  // Cursor effect radius (px) - wider to affect 5+ lines
    cursorStrength: 3.5,   // Impulse strength (high for dramatic stretch)
    velocityScale: 0.35,   // Velocity to impulse conversion (high for big deformation)
    pointerLerp: 0.2,      // Pointer smoothing (0.15-0.25 for premium feel)
    cursorXScale: 0.3,     // Horizontal cursor displacement scale
    maxCursorMoveY: 45,    // Max cursor Y offset (increased for bigger push)

    // Physics (under-damped spring for bounce)
    tension: 0.035,        // Spring restoration force (slightly lower for bigger push before bounce)
    friction: 0.88,        // Velocity damping (higher = less damping, more overshoot)

    // Audio Reactivity
    audioReactivityEnabled: true,
    audioAmplitudeMultiplier: 4.0  // Multiplier for wave amplitude during audio peaks (increased for power curve)
  };

  // ===== STATE =====
  let canvas = null;
  let ctx = null;
  let time = 0;
  let lastTime = 0;

  // Grid data (preallocated)
  const grid = {
    points: [],
    rows: 0,
    cols: 0
  };

  // Pointer tracking (smoothed for premium feel)
  const pointer = {
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    velocityX: 0,
    velocityY: 0,
    isActive: false
  };

  // Theme system
  let currentTheme = 'default';
  const themes = {
    default: {
      background: '#0a0a0a',
      lineColor: 'rgba(100, 100, 100, 0.25)'
    },
    classicfm: {
      background: '#1a0000',
      lineColor: 'rgba(255, 215, 0, 0.4)'
    },
    reprezent: {
      background: '#0a0a0a',
      lineColor: 'rgba(255, 255, 255, 0.25)'
    },
    worldwide: {
      background: '#1a2f1a',
      lineColor: 'rgba(251, 191, 36, 0.4)'
    }
  };

  // ===== GRID INITIALIZATION =====
  function initGrid(canvasElement, logicalWidth, logicalHeight) {
    const width = logicalWidth || canvasElement.width;
    const height = logicalHeight || canvasElement.height;
    const cols = Math.ceil(width / config.xGap) + 1;
    const rows = Math.ceil(height / config.yGap) + 1;

    grid.cols = cols;
    grid.rows = rows;
    grid.points = [];

    // Preallocate all point objects
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        grid.points.push({
          baseX: col * config.xGap,
          baseY: row * config.yGap,
          currentX: col * config.xGap,
          currentY: row * config.yGap,
          cx: 0,         // Cursor offset X
          cy: 0,         // Cursor offset Y
          cvx: 0,        // Cursor velocity X
          cvy: 0         // Cursor velocity Y
        });
      }
    }
  }

  // ===== ANIMATION LOOP =====
  function update(deltaTime) {
    // Increment time
    time += deltaTime * 0.001;

    // Normalize deltaTime for stable physics (clamp to avoid frame spikes)
    const dtSeconds = Math.max(1/120, Math.min(1/30, deltaTime / 1000));

    // Get audio energy for amplitude modulation
    let audioEnergy = 0;
    if (config.audioReactivityEnabled && typeof window.getAudioEnergy === 'function') {
      audioEnergy = window.getAudioEnergy();
    }

    // Modulate wave amplitude based on audio with exponential curve for wider dynamic range
    const audioResponse = Math.pow(audioEnergy, 1.5); // Power curve: calm songs subtle, energetic songs dramatic
    const currentWaveAmpY = config.waveAmpY * (1.0 + audioResponse * config.audioAmplitudeMultiplier);

    // Update each point with simple angle-based noise field
    for (let i = 0; i < grid.points.length; i++) {
      const point = grid.points[i];
      const x = point.baseX;
      const y = point.baseY;

      // ===== NOISE ANGLE FIELD =====
      // Sample 2D noise to get angle for wave displacement
      const t = config.angleGain * simplex.noise2D(
        x * config.xScale + time * config.speedX,
        y * config.yScale + time * config.speedY
      );

      // Wave displacement from angle
      const waveX = Math.cos(t) * config.waveAmpX;
      const waveY = Math.sin(t) * currentWaveAmpY;

      // ===== CURSOR VELOCITY INJECTION =====
      // Directional velocity-based push: only affect points in front of cursor (like finger through water)
      if (pointer.isActive) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate cursor velocity magnitude for directional filtering
        const velMag = Math.sqrt(pointer.velocityX * pointer.velocityX + pointer.velocityY * pointer.velocityY);

        if (distance < config.influenceRadius) {
          // Check if point is in front of cursor using dot product
          const alignment = (dx * pointer.velocityX + dy * pointer.velocityY) / (velMag || 1);

          // Smooth directional falloff with minimum distance to prevent spikes on closest wave
          const minDist = Math.max(distance, config.yGap * 0.5);  // Prevent division by very small numbers
          const alignmentFactor = Math.max(0, alignment / minDist);

          // Smooth squared falloff (cue++ feel)
          const normalizedDist = distance / config.influenceRadius;
          const falloff = Math.pow(1 - normalizedDist, 2);

          // Combine radial and directional falloff for smooth gradient
          const directionalFalloff = falloff * alignmentFactor;

          // Inject pointer velocity into point velocity (not position-based attraction)
          const impulse = directionalFalloff * config.cursorStrength;
          point.cvx += pointer.velocityX * impulse * config.velocityScale;
          point.cvy += pointer.velocityY * impulse * config.velocityScale;
        }
      }

      // ===== SPRING + FRICTION (under-damped for bounce) =====
      // Spring pulls cursor offset back to zero
      point.cvx += (-point.cx) * config.tension;
      point.cvy += (-point.cy) * config.tension;

      // Friction (higher value = less damping = more overshoot/bounce)
      point.cvx *= config.friction;
      point.cvy *= config.friction;

      // Integrate with frame-rate independence
      const dtScale = dtSeconds * 60;  // Normalize to 60fps baseline
      point.cx += point.cvx * dtScale;
      point.cy += point.cvy * dtScale;

      // ===== CLAMP CURSOR OFFSET =====
      const maxCursorMoveX = config.maxCursorMoveY; // Use same limit for X
      point.cx = Math.max(-maxCursorMoveX, Math.min(maxCursorMoveX, point.cx));
      point.cy = Math.max(-config.maxCursorMoveY, Math.min(config.maxCursorMoveY, point.cy));

      // ===== FINAL POSITION =====
      point.currentX = point.baseX + waveX + point.cx * config.cursorXScale;
      point.currentY = point.baseY + waveY + point.cy;
    }
  }

  function draw(context) {
    const theme = themes[currentTheme];

    // Clear canvas with theme background
    context.fillStyle = theme.background;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    // Draw horizontal contour lines as polylines
    context.strokeStyle = theme.lineColor;
    context.lineWidth = 1;
    context.lineJoin = 'round';
    context.lineCap = 'round';

    for (let row = 0; row < grid.rows; row++) {
      context.beginPath();

      // First point
      const firstIdx = row * grid.cols;
      const firstPoint = grid.points[firstIdx];
      context.moveTo(firstPoint.currentX, firstPoint.currentY);

      // Draw line segments through all points in row
      for (let col = 1; col < grid.cols; col++) {
        const point = grid.points[row * grid.cols + col];
        context.lineTo(point.currentX, point.currentY);
      }

      context.stroke();
    }
  }

  function animate(currentTime) {
    // Initialize lastTime on first frame to avoid huge deltaTime
    if (lastTime === 0) {
      lastTime = currentTime;
    }

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    update(deltaTime);
    draw(ctx);

    requestAnimationFrame(animate);
  }

  // ===== POINTER INTERACTION =====
  function initPointerTracking(canvasElement) {
    canvasElement.addEventListener('pointermove', (e) => {
      const rect = canvasElement.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;

      // Store previous smoothed position for velocity calculation
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;

      // Smooth pointer position (lerp for premium feel)
      pointer.x += (rawX - pointer.x) * config.pointerLerp;
      pointer.y += (rawY - pointer.y) * config.pointerLerp;

      // Calculate velocity from smoothed movement (px per frame)
      pointer.velocityX = pointer.x - pointer.prevX;
      pointer.velocityY = pointer.y - pointer.prevY;

      // Clamp velocity to avoid spikes on dropped frames (max ~100px/frame)
      const velMag = Math.sqrt(pointer.velocityX * pointer.velocityX + pointer.velocityY * pointer.velocityY);
      if (velMag > 100) {
        const scale = 100 / velMag;
        pointer.velocityX *= scale;
        pointer.velocityY *= scale;
      }

      pointer.isActive = true;
    });

    canvasElement.addEventListener('pointerleave', () => {
      pointer.isActive = false;
    });

    canvasElement.addEventListener('pointerenter', () => {
      pointer.isActive = true;
    });
  }

  // ===== RESIZE HANDLING =====
  function resize(canvasElement, context) {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Set canvas size scaled by DPR for crisp rendering
    canvasElement.width = width * dpr;
    canvasElement.height = height * dpr;
    canvasElement.style.width = width + 'px';
    canvasElement.style.height = height + 'px';

    // Scale context to match DPR
    context.scale(dpr, dpr);

    // Reinitialize grid with logical dimensions
    initGrid(canvasElement, width, height);
  }

  // Debounced resize handler
  let resizeTimeout;
  function handleResize() {
    if (!canvas || !ctx) return;

    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resize(canvas, ctx);
    }, 100);
  }

  // ===== THEME SYSTEM =====
  function setTheme(themeName) {
    if (themes[themeName]) {
      currentTheme = themeName;
    } else {
      currentTheme = 'default';
    }
  }

  // ===== PUBLIC API =====
  window.waveGrid = {
    init: function(canvasElement) {
      canvas = canvasElement;
      ctx = canvas.getContext('2d');

      // Initial setup
      resize(canvas, ctx);
      initPointerTracking(canvas);

      // Set up resize listener
      window.addEventListener('resize', handleResize);

      // Start animation
      requestAnimationFrame(animate);
    },

    setTheme: setTheme,

    destroy: function() {
      window.removeEventListener('resize', handleResize);
      canvas = null;
      ctx = null;
    }
  };
})();
