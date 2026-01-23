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
    yGap: 25,              // Vertical spacing (px) - reduced for more lines

    // Base Noise
    noiseScale: 0.003,     // Spatial frequency of base noise
    noiseSpeed: 0.0002,    // Temporal frequency (animation speed)
    amplitude: 12,         // Max vertical displacement (px) - reduced for calmer base

    // Vertical Domain Warp (Line Convergence)
    warpScale: 0.001,      // Spatial frequency of domain warp
    warpSpeed: 0.0001,     // Temporal frequency of warp
    warpAmp: 40,           // Strength of domain warp (px) - reduced for less chaos

    // Ridge Noise (Pinch Zones)
    ridgeScale: 0.002,     // Spatial frequency of ridge noise
    ridgeSpeed: 0.00015,   // Temporal frequency of ridge
    ridgePower: 2.0,       // Sharpness exponent (higher = sharper)
    ridgeStrength: 0.3,    // Multiplier for ridge contribution - reduced

    // Secondary Vector Warp
    vecWarpScale: 0.0015,  // Spatial frequency of vector warp
    vecWarpAmp: 10,        // Strength of vector warp (px) - reduced

    // Physics
    springStrength: 0.03,  // Spring restoration force
    friction: 0.85,        // Velocity damping (0-1)

    // Cursor Interaction
    influenceRadius: 150,  // Cursor effect radius (px)
    cursorStrength: 1.0,   // Force multiplier - increased for stronger interaction
    velocityMult: 0.5,     // Cursor velocity scaling - increased

    // Audio Reactivity
    audioReactivityEnabled: true,
    audioSpeedMultiplier: 1.5,      // Max speed increase - reduced for calmer feel
    audioAmplitudeMultiplier: 4.0,  // Max amplitude increase - INCREASED for dramatic response
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
    strength: config.cursorStrength,
    velocityMult: config.velocityMult
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
    const currentAmplitude = config.amplitude * amplitudeMultiplier;

    // Update each point with contour wave field
    for (let i = 0; i < grid.points.length; i++) {
      const point = grid.points[i];
      const x = point.baseX;
      const y = point.baseY;

      // ===== LAYER 1: Secondary Vector Warp =====
      // Adds swirling, organic motion to the entire field
      // Two offset noise fields create a 2D vector field
      const vWarpX = simplex.noise3D(
        x * config.vecWarpScale,
        y * config.vecWarpScale,
        time + 100  // Offset in time for independent motion
      );
      const vWarpY = simplex.noise3D(
        x * config.vecWarpScale,
        y * config.vecWarpScale,
        time + 200  // Different offset for Y component
      );
      // Apply vector warp to base coordinates
      const wx = x + (vWarpX * config.vecWarpAmp);
      const wy = y + (vWarpY * config.vecWarpAmp);

      // ===== LAYER 2: Vertical Domain Warp (Line Convergence) =====
      // Warps the Y coordinate before noise sampling
      // Creates regions where contour lines pinch together or spread apart
      const domainWarp = simplex.noise3D(
        wx * config.warpScale,
        wy * config.warpScale,
        time * config.warpSpeed
      );
      // Apply warp to Y domain only (creates vertical compression/expansion)
      const warpedY = wy + (domainWarp * config.warpAmp);

      // ===== LAYER 3: Base Noise Displacement =====
      // Primary vertical displacement using warped coordinates
      // Angle-based conversion ensures smooth, continuous motion
      const baseNoise = simplex.noise3D(
        wx * config.noiseScale,
        warpedY * config.noiseScale,  // Use warped Y for convergence effect
        time
      );
      const angle = baseNoise * Math.PI;
      // Vertical displacement only - X stays fixed for horizontal contours
      const baseDisp = Math.sin(angle) * currentAmplitude;

      // ===== LAYER 4: Ridge Noise (Pinch Zones) =====
      // Absolute value creates sharp ridges (topographic peaks)
      // Higher power creates sharper, more pronounced ridges
      const ridgeNoise = Math.abs(simplex.noise3D(
        wx * config.ridgeScale,
        wy * config.ridgeScale,
        time * config.ridgeSpeed
      ));
      // Raise to power for sharpness control
      const ridgeValue = Math.pow(ridgeNoise, config.ridgePower);
      // Ridge modulates the base displacement
      const ridgeDisp = baseDisp * ridgeValue * config.ridgeStrength;

      // ===== COMBINED DISPLACEMENT =====
      // Final noise-based vertical displacement
      const totalNoiseDisp = baseDisp + ridgeDisp;

      // ===== CURSOR VELOCITY INJECTION =====
      // Inject cursor velocity into point velocity (elastic interaction)
      // NOT direct force - velocity creates momentum and oscillation
      if (pointer.isActive) {
        const dx = point.currentX - pointer.x;
        const dy = point.currentY - pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < pointer.influenceRadius && distance > 0) {
          // Quadratic falloff for smooth, natural influence
          const normalizedDist = distance / pointer.influenceRadius;
          const falloff = 1 - (normalizedDist * normalizedDist);

          // Direction away from cursor (repulsion)
          const dirX = dx / distance;
          const dirY = dy / distance;

          // Inject velocity based on cursor motion and distance
          // Fast cursor creates large velocity injection
          const velocityInjection = falloff * pointer.strength * config.velocityMult;
          point.velocityX += dirX * velocityInjection * pointer.velocityX;
          point.velocityY += dirY * velocityInjection * pointer.velocityY;
        }
      }

      // ===== SPRING PHYSICS =====
      // Rest position = base position + noise displacement
      // X rest position is always baseX (no horizontal drift)
      const restX = point.baseX;
      const restY = point.baseY + totalNoiseDisp;

      // Spring force pulls point back to rest position
      const springX = (restX - point.currentX) * config.springStrength;
      const springY = (restY - point.currentY) * config.springStrength;

      // ===== VELOCITY INTEGRATION =====
      // Add spring force to velocity
      point.velocityX += springX;
      point.velocityY += springY;

      // Apply friction damping
      point.velocityX *= config.friction;
      point.velocityY *= config.friction;

      // Integrate velocity to position
      point.currentX += point.velocityX;
      point.currentY += point.velocityY;

      // ===== DISPLACEMENT CLAMPING =====
      // Prevent extreme outliers from cursor interaction
      const maxOffset = currentAmplitude * 3;
      point.currentY = Math.max(
        point.baseY - maxOffset,
        Math.min(point.baseY + maxOffset, point.currentY)
      );
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
