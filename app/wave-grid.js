/**
 * Canvas Wave Grid Animation
 * Ported from cue++ implementation - matches exact behavior and constants
 * Implements performant 2D grid with noise-based motion and cursor interaction
 */

(function() {
  'use strict';

  // ===== CONFIGURATION (cue++ values) =====
  const config = {
    // Grid
    xGap: 40,              // Horizontal spacing (px) - cue++ value
    yGap: 40,              // Vertical spacing (px) - cue++ value

    // Noise parameters (cue++ values)
    noiseScaleX: 0.002,    // Spatial frequency in X
    noiseScaleY: 0.0015,   // Spatial frequency in Y
    noiseAmplitude: 12,    // Noise multiplier for angle
    speedX: 0.0125,        // Time scroll speed in X
    speedY: 0.005,         // Time scroll speed in Y

    // Wave displacement (cue++ values)
    waveAmpX: 32,          // Horizontal wave amplitude
    waveAmpY: 16,          // Vertical wave amplitude

    // Cursor physics (cue++ values)
    cursorBaseRadius: 175,          // Base interaction radius (px)
    cursorForceMultiplier: 0.00065, // Force injection strength
    maxCursorMove: 100,             // Max cursor displacement (px)
    tension: 0.005,                 // Spring restoration force
    friction: 0.925,                // Velocity damping (0-1)
    integrationFactor: 2,           // Velocity to position scalar

    // Cursor smoothing (cue++ values)
    cursorSmoothingAlpha: 0.1,    // Position smoothing alpha
    velocitySmoothingAlpha: 0.1,  // Velocity smoothing alpha
    maxVelocity: 100,             // Max smoothed velocity

    // Position rounding (cue++ value)
    roundingPrecision: 10,  // Rounds to 1 decimal place

    // Audio reactivity (disabled for initial port)
    audioReactivityEnabled: false
  };

  // ===== STATE =====
  let canvas = null;
  let ctx = null;

  // Grid data (preallocated)
  const grid = {
    points: [],
    rows: 0,
    cols: 0
  };

  // Cursor tracking (cue++ model with smoothing)
  const cursor = {
    // Raw position (from pointermove events)
    x: 0,
    y: 0,
    lx: 0,  // last x (for velocity calculation)
    ly: 0,  // last y (for velocity calculation)

    // Smoothed position
    sx: 0,
    sy: 0,

    // Velocity
    v: 0,   // raw velocity magnitude
    vs: 0,  // smoothed velocity magnitude
    a: 0,   // angle of movement

    isActive: false
  };

  // Theme system
  let currentTheme = 'default';
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

  // ===== GRID INITIALIZATION (cue++ formula) =====
  function initGrid(canvasElement, logicalWidth, logicalHeight) {
    const width = logicalWidth || canvasElement.width;
    const height = logicalHeight || canvasElement.height;

    // cue++ adds buffer for edge continuity
    const cols = Math.ceil((width + 200) / config.xGap);
    const rows = Math.ceil((height + 30) / config.yGap);

    // cue++ centers the grid
    const offsetX = (width - config.xGap * cols) / 2;
    const offsetY = (height - config.yGap * rows) / 2;

    grid.cols = cols;
    grid.rows = rows;
    grid.points = [];

    // Preallocate all point objects
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        grid.points.push({
          baseX: offsetX + col * config.xGap,
          baseY: offsetY + row * config.yGap,
          currentX: 0,  // calculated in update
          currentY: 0,  // calculated in update
          // Wave displacement
          waveX: 0,
          waveY: 0,
          // Cursor displacement
          cx: 0,
          cy: 0,
          cvx: 0,
          cvy: 0
        });
      }
    }
  }

  // ===== ANIMATION LOOP (cue++ implementation) =====
  function update(deltaTime) {
    // Use Date.now() for time (cue++ uses millisecond timestamp)
    const time = Date.now();

    // ===== UPDATE CURSOR TRACKING =====
    if (cursor.isActive) {
      // Calculate velocity
      const dx = cursor.x - cursor.lx;
      const dy = cursor.y - cursor.ly;
      cursor.v = Math.hypot(dx, dy);

      // Smooth velocity
      cursor.vs += (cursor.v - cursor.vs) * config.velocitySmoothingAlpha;
      cursor.vs = Math.min(config.maxVelocity, cursor.vs);

      // Direction angle
      cursor.a = Math.atan2(dy, dx);

      // Smooth position
      cursor.sx += (cursor.x - cursor.sx) * config.cursorSmoothingAlpha;
      cursor.sy += (cursor.y - cursor.sy) * config.cursorSmoothingAlpha;

      // Update last position
      cursor.lx = cursor.x;
      cursor.ly = cursor.y;
    }

    // ===== UPDATE EACH GRID POINT =====
    for (let i = 0; i < grid.points.length; i++) {
      const point = grid.points[i];
      const x = point.baseX;
      const y = point.baseY;

      // ===== WAVE DISPLACEMENT (cue++ formula) =====
      const noiseValue = simplex.noise2D(
        (x + time * config.speedX) * config.noiseScaleX,
        (y + time * config.speedY) * config.noiseScaleY
      );

      const t = config.noiseAmplitude * noiseValue;

      point.waveX = Math.cos(t) * config.waveAmpX;
      point.waveY = Math.sin(t) * config.waveAmpY;

      // ===== CURSOR INTERACTION (cue++ formula) =====
      if (cursor.isActive) {
        const dx = x - cursor.sx;
        const dy = y - cursor.sy;
        const distance = Math.hypot(dx, dy);

        // Dynamic cursor radius (expands with velocity)
        const cursorRadius = Math.max(config.cursorBaseRadius, cursor.vs);

        if (distance < cursorRadius && distance > 0) {
          // cue++ directional force formula
          const directionFactor = Math.cos(0.001 * distance) * (1 - distance / cursorRadius);

          // Inject force (not velocity!)
          point.cvx += Math.cos(cursor.a) * directionFactor * cursorRadius * cursor.vs * config.cursorForceMultiplier;
          point.cvy += Math.sin(cursor.a) * directionFactor * cursorRadius * cursor.vs * config.cursorForceMultiplier;
        }
      }

      // ===== SPRING PHYSICS =====
      point.cvx += (0 - point.cx) * config.tension;
      point.cvy += (0 - point.cy) * config.tension;

      // ===== FRICTION =====
      point.cvx *= config.friction;
      point.cvy *= config.friction;

      // ===== INTEGRATION (with factor of 2) =====
      point.cx += config.integrationFactor * point.cvx;
      point.cy += config.integrationFactor * point.cvy;

      // ===== CLAMP =====
      point.cx = Math.min(config.maxCursorMove, Math.max(-config.maxCursorMove, point.cx));
      point.cy = Math.min(config.maxCursorMove, Math.max(-config.maxCursorMove, point.cy));

      // ===== FINAL POSITION WITH ROUNDING =====
      const finalX = point.baseX + point.waveX + point.cx;
      const finalY = point.baseY + point.waveY + point.cy;

      point.currentX = Math.round(config.roundingPrecision * finalX) / config.roundingPrecision;
      point.currentY = Math.round(config.roundingPrecision * finalY) / config.roundingPrecision;
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

  let lastTime = 0;
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

  // ===== POINTER INTERACTION (cue++ model) =====
  function initPointerTracking(canvasElement) {
    canvasElement.addEventListener('pointermove', (e) => {
      const rect = canvasElement.getBoundingClientRect();

      // Update raw cursor position
      cursor.x = e.clientX - rect.left;
      cursor.y = e.clientY - rect.top;
      cursor.isActive = true;
    });

    canvasElement.addEventListener('pointerleave', () => {
      cursor.isActive = false;
    });

    canvasElement.addEventListener('pointerenter', (e) => {
      const rect = canvasElement.getBoundingClientRect();
      cursor.x = e.clientX - rect.left;
      cursor.y = e.clientY - rect.top;
      cursor.isActive = true;
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
