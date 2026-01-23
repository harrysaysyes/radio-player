/**
 * Canvas Wave Grid Animation
 * Implements performant 2D grid with noise-based motion and cursor interaction
 */

(function() {
  'use strict';

  // ===== CONFIGURATION =====
  const config = {
    // Grid
    xGap: 40,              // Horizontal spacing (px)
    yGap: 40,              // Vertical spacing (px)

    // Noise
    noiseScale: 0.003,     // Spatial frequency
    noiseSpeed: 0.0002,    // Temporal frequency
    maxDisplacement: 20,   // Max noise offset (px)

    // Physics
    springStrength: 0.03,  // Spring restoration force
    friction: 0.85,        // Velocity damping (0-1)

    // Cursor
    influenceRadius: 150,  // Cursor effect radius (px)
    cursorStrength: 0.5,   // Cursor force multiplier

    // Audio Reactivity
    audioReactivityEnabled: true,
    audioSpeedMultiplier: 2.0,      // Max speed increase (1x to 3x)
    audioAmplitudeMultiplier: 2.0,  // Max amplitude increase (1x to 3x)
    audioSmoothingFactor: 0.15      // EMA smoothing (lower = smoother)
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

  // Pointer tracking
  const pointer = {
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    isActive: false,
    influenceRadius: config.influenceRadius,
    strength: config.cursorStrength
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

  // Audio reactivity
  let smoothedAudioEnergy = 0;

  // ===== GRID INITIALIZATION =====
  function initGrid(canvasElement) {
    const cols = Math.ceil(canvasElement.width / config.xGap) + 1;
    const rows = Math.ceil(canvasElement.height / config.yGap) + 1;

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
          velocityX: 0,
          velocityY: 0
        });
      }
    }
  }

  // ===== AUDIO REACTIVITY =====
  function smoothAudioEnergy(rawEnergy) {
    // Exponential moving average (EMA) for smooth audio response
    const alpha = config.audioSmoothingFactor;
    smoothedAudioEnergy = (alpha * rawEnergy) + ((1 - alpha) * smoothedAudioEnergy);
    return smoothedAudioEnergy;
  }

  // ===== ANIMATION LOOP =====
  function update(deltaTime) {
    // Get current audio energy (0-1) and smooth it
    let audioEnergy = 0;
    if (config.audioReactivityEnabled && typeof window.getAudioEnergy === 'function') {
      audioEnergy = window.getAudioEnergy();
      audioEnergy = smoothAudioEnergy(audioEnergy);
    }

    // Modulate animation speed based on audio energy
    const speedMultiplier = 1.0 + (audioEnergy * config.audioSpeedMultiplier);
    time += deltaTime * config.noiseSpeed * speedMultiplier;

    // Modulate wave amplitude based on audio energy
    const amplitudeMultiplier = 1.0 + (audioEnergy * config.audioAmplitudeMultiplier);
    const currentMaxDisplacement = config.maxDisplacement * amplitudeMultiplier;

    // Update each point
    for (let i = 0; i < grid.points.length; i++) {
      const point = grid.points[i];

      // 1. Calculate noise displacement with modulated amplitude
      const noiseValue = simplex.noise3D(
        point.baseX * config.noiseScale,
        point.baseY * config.noiseScale,
        time
      );
      const angle = noiseValue * Math.PI;
      const noiseX = Math.cos(angle) * currentMaxDisplacement;
      const noiseY = Math.sin(angle) * currentMaxDisplacement;

      // 2. Calculate cursor force (if pointer is active)
      let forceX = 0;
      let forceY = 0;
      if (pointer.isActive) {
        const dx = point.currentX - pointer.x;
        const dy = point.currentY - pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < pointer.influenceRadius && distance > 0) {
          const force = (1 - distance / pointer.influenceRadius) * pointer.strength;
          forceX = (dx / distance) * force;
          forceY = (dy / distance) * force;
        }
      }

      // 3. Calculate spring force back to rest position
      const restX = point.baseX + noiseX;
      const restY = point.baseY + noiseY;
      const springX = (restX - point.currentX) * config.springStrength;
      const springY = (restY - point.currentY) * config.springStrength;

      // 4. Update velocity
      point.velocityX += forceX + springX;
      point.velocityY += forceY + springY;
      point.velocityX *= config.friction;
      point.velocityY *= config.friction;

      // 5. Update position
      point.currentX += point.velocityX;
      point.currentY += point.velocityY;
    }
  }

  function draw(context) {
    const theme = themes[currentTheme];

    // Clear canvas with theme background
    context.fillStyle = theme.background;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    // Draw grid as smooth curved lines using quadratic curves
    context.strokeStyle = theme.lineColor;
    context.lineWidth = 1;

    for (let row = 0; row < grid.rows; row++) {
      context.beginPath();

      // Collect all points for this row
      const rowPoints = [];
      for (let col = 0; col < grid.cols; col++) {
        rowPoints.push(grid.points[row * grid.cols + col]);
      }

      if (rowPoints.length < 2) continue;

      // Start at first point
      context.moveTo(rowPoints[0].currentX, rowPoints[0].currentY);

      // Use quadratic curves for smooth interpolation between points
      for (let i = 0; i < rowPoints.length - 1; i++) {
        const p0 = rowPoints[i];
        const p1 = rowPoints[i + 1];

        // Control point is the current point, curve to midpoint
        const cx = p0.currentX;
        const cy = p0.currentY;
        const midX = (p0.currentX + p1.currentX) / 2;
        const midY = (p0.currentY + p1.currentY) / 2;

        context.quadraticCurveTo(cx, cy, midX, midY);
      }

      // Final segment to last point
      const lastPoint = rowPoints[rowPoints.length - 1];
      context.lineTo(lastPoint.currentX, lastPoint.currentY);

      context.stroke();
    }
  }

  function animate(currentTime) {
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
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;

      pointer.velocityX = newX - pointer.x;
      pointer.velocityY = newY - pointer.y;
      pointer.x = newX;
      pointer.y = newY;
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
    // Set canvas size to window size
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;

    // Reinitialize grid
    initGrid(canvasElement);
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
