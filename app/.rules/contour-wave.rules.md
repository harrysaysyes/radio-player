# Contour Wave Field - Authoritative Rules
## Project Overview

This document defines the authoritative architectural and mathematical rules for implementing a cue++-style contour wave field using HTML5 Canvas 2D.

**Technology Stack:**
- HTML5 Canvas (CanvasRenderingContext2D only)
- Vanilla JavaScript (imperative, no frameworks)
- requestAnimationFrame for render loop
- Simplex noise for field generation

**Visual Target:**
- Horizontal contour lines (polylines)
- Line convergence zones (pinch regions)
- Ridge noise for topographic effect
- Elastic pointer interaction with velocity injection
- Smooth, organic, flowing motion

---

## Architectural Constraints (MANDATORY)

### 1. Canvas Rendering
- **Single `<canvas>` element** filling the viewport
- **CanvasRenderingContext2D only** - no WebGL, no shaders
- **requestAnimationFrame** for animation loop
- **No DOM reads inside RAF** - cache all dimensions
- **No object allocation inside RAF** - preallocate all structures

### 2. Framework Prohibitions
- ❌ NO React, Vue, Svelte, or JSX
- ❌ NO WebGL, Three.js, Pixi, Paper.js
- ❌ NO SVG or CSS animations for the field
- ❌ NO external animation libraries (GSAP, Anime.js, etc.)
- ❌ NO React state in render loop
- ❌ NO unnecessary class abstractions

### 3. Code Structure
- **Imperative** JavaScript only
- **Functional** separation: init(), update(), draw(), animate()
- **Preallocated** data structures for grid points
- **Single-pass** rendering (no multi-pass effects)
- **Flat** data layout for cache efficiency

---

## Mathematical Model (AUTHORITATIVE)

### Grid Structure

**Horizontal Contour Lines:**
- Grid consists of horizontal polylines (not a 2D point grid)
- Each line represents a contour level at a fixed base Y coordinate
- Lines are drawn left-to-right across the canvas
- Spacing between lines is configurable (yGap)
- Number of vertices per line is configurable (cols)

**Point Definition:**
```javascript
{
  baseX: number,      // Fixed X position (never changes)
  baseY: number,      // Base contour level (y0)
  currentX: number,   // Rendered X position (typically same as baseX)
  currentY: number,   // Rendered Y position (baseY + displacement)
  velocityX: number,  // Horizontal velocity (for cursor interaction)
  velocityY: number   // Vertical velocity (for cursor interaction)
}
```

### Vertical Displacement Model

Each point's vertical displacement is calculated from MULTIPLE noise layers:

#### Layer 1: Base Noise Displacement
```javascript
// Sample 3D noise (x, y, time)
const noiseValue = simplex.noise3D(
  x * noiseScale,
  y * noiseScale,
  time
);

// Convert to angle
const angle = noiseValue * PI;

// Vertical displacement only (no horizontal offset)
const baseDisplacement = sin(angle) * amplitude;
```

**Why:** Creates smooth, continuous vertical waves while keeping X positions fixed (horizontal lines remain horizontal).

#### Layer 2: Vertical Domain Warp (Line Convergence)
```javascript
// Sample separate noise field for domain warp
const warpNoise = simplex.noise3D(
  x * warpScale,
  y * warpScale,
  time * warpSpeed
);

// Apply to Y domain BEFORE sampling base noise
const warpedY = y + (warpNoise * warpAmplitude);

// Use warped Y in base noise calculation
const noiseValue = simplex.noise3D(
  x * noiseScale,
  warpedY * noiseScale,  // <-- warped Y coordinate
  time
);
```

**Why:** Creates line convergence and divergence - contour lines pinch together and spread apart organically. This is the KEY to the cue++ aesthetic.

**Visual Effect:** Lines bunch together in some regions (high curvature) and spread apart in others (low curvature), creating a topographic map effect.

#### Layer 3: Ridge Noise (Pinch Zones)
```javascript
// Sample ridge noise (absolute value creates ridges)
const ridgeNoise = abs(simplex.noise3D(
  x * ridgeScale,
  y * ridgeScale,
  time * ridgeSpeed
));

// Raise to power for sharper ridges
const ridgeValue = pow(ridgeNoise, ridgePower);

// Modulate amplitude
const ridgeAmplitude = amplitude * ridgeValue * ridgeStrength;
```

**Why:** Creates sharp compression zones where contour lines pinch dramatically, mimicking mountain ridges on a topographic map.

**Visual Effect:** Regions of extreme line convergence creating visual "peaks" and "valleys."

#### Layer 4: Secondary Vector Warp
```javascript
// Sample two noise fields for vector warp
const warpX = simplex.noise3D(x * vecWarpScale, y * vecWarpScale, time + 100);
const warpY = simplex.noise3D(x * vecWarpScale, y * vecWarpScale, time + 200);

// Apply warp to base coordinates BEFORE all other sampling
const warpedX = x + (warpX * vecWarpAmp);
const warpedY = y + (warpY * vecWarpAmp);

// Use warped coordinates in all subsequent noise samples
```

**Why:** Adds swirling, organic motion to the field. Lines don't just wave up and down - they twist and curve.

**Visual Effect:** Subtle spiral and vortex patterns in the field motion.

### Combined Displacement Formula

```javascript
// 1. Apply secondary vector warp to base coordinates
const vWarpX = simplex.noise3D(x * vecWarpScale, y * vecWarpScale, time + 100);
const vWarpY = simplex.noise3D(x * vecWarpScale, y * vecWarpScale, time + 200);
const wx = x + (vWarpX * vecWarpAmp);
const wy = y + (vWarpY * vecWarpAmp);

// 2. Apply vertical domain warp
const domainWarp = simplex.noise3D(wx * warpScale, wy * warpScale, time * warpSpeed);
const warpedY = wy + (domainWarp * warpAmp);

// 3. Calculate base displacement
const baseNoise = simplex.noise3D(wx * noiseScale, warpedY * noiseScale, time);
const angle = baseNoise * PI;
const baseDisp = sin(angle) * amplitude;

// 4. Calculate ridge contribution
const ridgeNoise = abs(simplex.noise3D(wx * ridgeScale, wy * ridgeScale, time * ridgeSpeed));
const ridgeValue = pow(ridgeNoise, ridgePower);
const ridgeDisp = baseDisp * ridgeValue * ridgeStrength;

// 5. Final displacement (vertical only)
const finalDisplacement = baseDisp + ridgeDisp;
point.currentY = point.baseY + finalDisplacement;
```

**Key Properties:**
- X coordinates remain fixed (horizontal lines stay horizontal)
- Y displacement is cumulative from multiple layers
- Each layer operates at different scales and speeds
- Result is organic, topographic contour field

---

## Interaction Model (AUTHORITATIVE)

### Pointer Tracking

**State:**
```javascript
pointer = {
  x: number,              // Canvas-space X coordinate
  y: number,              // Canvas-space Y coordinate
  velocityX: number,      // Change in X per frame
  velocityY: number,      // Change in Y per frame
  isActive: boolean,      // True when pointer over canvas
  influenceRadius: number // Radius of effect (pixels)
}
```

**Velocity Calculation:**
```javascript
// On pointermove event
const newX = e.clientX - rect.left;
const newY = e.clientY - rect.top;

pointer.velocityX = (newX - pointer.x) * velocityMultiplier;
pointer.velocityY = (newY - pointer.y) * velocityMultiplier;
pointer.x = newX;
pointer.y = newY;
```

### Force Injection Model

**Distance-Based Falloff:**
```javascript
// For each point
const dx = point.currentX - pointer.x;
const dy = point.currentY - pointer.y;
const distance = sqrt(dx * dx + dy * dy);

if (distance < pointer.influenceRadius && distance > 0) {
  // Normalized distance (0 at cursor, 1 at radius edge)
  const normalizedDist = distance / pointer.influenceRadius;

  // Falloff curve (quadratic easing)
  const falloff = 1 - (normalizedDist * normalizedDist);

  // Force magnitude
  const forceMagnitude = falloff * cursorStrength * pointer.velocity;

  // Force direction (repulsion away from cursor)
  const forceX = (dx / distance) * forceMagnitude * pointer.velocityX;
  const forceY = (dy / distance) * forceMagnitude * pointer.velocityY;

  // Inject into point velocity
  point.velocityX += forceX;
  point.velocityY += forceY;
}
```

**Why Velocity Injection:**
- Creates elastic, bouncy feel (not stiff displacement)
- Points "remember" cursor motion and oscillate
- Fast cursor motion creates larger disturbances
- Stationary cursor has no effect (velocity = 0)

### Spring Physics

**Rest Position:**
```javascript
// Rest position = base position + noise displacement
const restY = point.baseY + noiseDisplacement;
```

**Spring Force:**
```javascript
// Spring pulls point back to rest position
const springForceY = (restY - point.currentY) * springStrength;
point.velocityY += springForceY;
```

**Friction:**
```javascript
// Dampen velocity each frame
point.velocityX *= friction;  // friction = 0.85 typical
point.velocityY *= friction;
```

**Position Update:**
```javascript
// Integrate velocity
point.currentX += point.velocityX;
point.currentY += point.velocityY;
```

**Why Spring + Friction:**
- Points return to rest position smoothly
- Overshooting creates natural oscillation
- Friction prevents infinite oscillation
- Feels organic and elastic

### Displacement Clamping

```javascript
// Clamp vertical displacement to prevent extreme outliers
const maxOffset = amplitude * 3;  // Allow 3x normal amplitude
const clampedY = clamp(
  point.currentY,
  point.baseY - maxOffset,
  point.baseY + maxOffset
);
point.currentY = clampedY;
```

---

## Performance Rules (MANDATORY)

### Critical Performance Constraints

1. **No Allocation in RAF:**
   - Preallocate all point objects during init
   - Preallocate all arrays
   - Reuse objects - never create new ones in update/draw

2. **No DOM Reads in RAF:**
   - Cache canvas.width and canvas.height
   - Never call getBoundingClientRect() in animation loop
   - Store all dimensions during init/resize only

3. **Resize Handling:**
   - Debounce resize events (100ms typical)
   - Rebuild grid ONCE per resize
   - Clear old grid, create new grid
   - Do NOT rebuild every frame

4. **Single-Pass Rendering:**
   - One beginPath() per contour line
   - One stroke() per contour line
   - No complex blending or multi-pass effects
   - No shadows or filters (performance killer)

5. **Cache Efficiency:**
   - Store points in flat array (not nested)
   - Sequential memory access pattern
   - Minimize pointer chasing
   - Use Float32Array if profiling shows benefit

### Performance Targets

- **CPU Usage:** < 10% average (target: 5-8%)
- **Frame Rate:** Solid 60 FPS
- **Frame Time:** < 16ms per frame (ideally < 10ms)
- **Memory:** Stable (no leaks over time)
- **Fan Activity:** No audible spin-up on modern hardware

---

## Rendering Approach (AUTHORITATIVE)

### Smooth Curve Rendering

**Quadratic Bézier Curves:**
```javascript
// For each contour line
ctx.beginPath();
ctx.moveTo(points[0].currentX, points[0].currentY);

for (let i = 0; i < points.length - 1; i++) {
  const p0 = points[i];
  const p1 = points[i + 1];

  // Control point = current point
  const cx = p0.currentX;
  const cy = p0.currentY;

  // End point = midpoint to next
  const midX = (p0.currentX + p1.currentX) / 2;
  const midY = (p0.currentY + p1.currentY) / 2;

  ctx.quadraticCurveTo(cx, cy, midX, midY);
}

// Final segment to last point
const last = points[points.length - 1];
ctx.lineTo(last.currentX, last.currentY);

ctx.stroke();
```

**Why Quadratic Curves:**
- Smooth interpolation between points
- No visible vertices or kinks
- Performant (simpler than cubic Bézier)
- Creates organic, flowing lines

### Visual Style

**Stroke Properties:**
- Line width: 1px (constant)
- Line color: Semi-transparent (alpha 0.25-0.4)
- No gradients, no fills
- No shadows, no filters

**Background:**
- Dark solid color (#0a0a0a typical)
- No gradients, no patterns
- Clear each frame with solid fill

**Theme Integration:**
- Background and line color vary by theme
- All other properties remain constant
- Theme changes do not affect performance

---

## Prohibited Approaches (MANDATORY)

### ❌ DO NOT USE:

1. **Sine-Only Waves:**
   - No `y = sin(x)` waves
   - No simple harmonic motion
   - Must use domain-warped noise fields

2. **Position Snapping:**
   - No discrete jumps between states
   - No lerp-to-target without physics
   - Must use velocity integration

3. **React-Driven Animation:**
   - No setState() in animation loop
   - No virtual DOM updates in RAF
   - No React hooks for animation state

4. **External Libraries:**
   - No GSAP, Anime.js, Motion One, etc.
   - No visual effect libraries
   - Simplex noise is the ONLY allowed dependency

5. **WebGL/Shaders:**
   - No fragment shaders
   - No vertex shaders
   - No texture sampling
   - Canvas 2D ONLY

6. **Complex Rendering:**
   - No multi-pass effects
   - No layered canvases
   - No blend modes (except simple alpha)
   - No shadows or filters

---

## Configuration Parameters

### Default Values (cue++ Approximation)

```javascript
const config = {
  // Grid
  yGap: 40,                  // Vertical spacing between lines (px)
  cols: 50,                  // Number of vertices per line

  // Base Noise
  noiseScale: 0.003,         // Spatial frequency of base noise
  noiseSpeed: 0.0002,        // Temporal frequency (animation speed)
  amplitude: 20,             // Max vertical displacement (px)

  // Vertical Domain Warp (Line Convergence)
  warpScale: 0.001,          // Spatial frequency of domain warp
  warpSpeed: 0.0001,         // Temporal frequency of warp
  warpAmp: 60,               // Strength of domain warp (px)

  // Ridge Noise (Pinch Zones)
  ridgeScale: 0.002,         // Spatial frequency of ridge noise
  ridgeSpeed: 0.00015,       // Temporal frequency of ridge
  ridgePower: 2.0,           // Sharpness exponent (higher = sharper)
  ridgeStrength: 0.5,        // Multiplier for ridge contribution

  // Secondary Vector Warp
  vecWarpScale: 0.0015,      // Spatial frequency of vector warp
  vecWarpAmp: 15,            // Strength of vector warp (px)

  // Cursor Interaction
  influenceRadius: 150,      // Radius of cursor effect (px)
  cursorStrength: 0.5,       // Force multiplier
  velocityMultiplier: 0.3,   // Cursor velocity scaling

  // Spring Physics
  springStrength: 0.03,      // Spring restoration force
  friction: 0.85             // Velocity damping (0-1)
};
```

**Tunable Parameters:**
- All config values should be exposed in tuning app
- Real-time slider updates
- Export to JSON for production use

---

## Implementation Sequence

### Phase 1: Rules File ✅
This file - authoritative source of truth

### Phase 2: Math Replacement (NEXT)
- User provides current displacement code
- Apply diff-style patch to wave-grid.js
- Replace ONLY math in update() function
- Preserve structure, naming, render loop
- Add explanatory comments

### Phase 3: Parameter Tuning App
- Standalone HTML file
- Canvas + control panel layout
- Real-time sliders for all config values
- Live preview of changes
- Defaults approximate cue++ aesthetic

### Phase 4: Config Export
- Export button in tuning app
- JSON output to textarea
- Copy/paste into production code
- Clear mapping of config to math terms

---

## Testing Checklist

### Visual
- [ ] Horizontal contour lines visible
- [ ] Line convergence zones present (pinch regions)
- [ ] Ridge noise creates sharp compression
- [ ] Smooth, organic motion (no jitter)
- [ ] Cursor interaction feels elastic
- [ ] Fast cursor creates large disturbances
- [ ] Lines return to rest position smoothly

### Performance
- [ ] CPU usage < 10% during animation
- [ ] 60 FPS maintained consistently
- [ ] No memory leaks over 5 minutes
- [ ] Fan stays quiet
- [ ] Frame time < 16ms in profiler
- [ ] No allocation spikes in profiler

### Mathematical
- [ ] Domain warp creates visible line convergence
- [ ] Ridge noise creates visible pinch zones
- [ ] Vector warp adds swirl/vortex patterns
- [ ] Cursor velocity injection works (not displacement)
- [ ] Spring physics creates oscillation
- [ ] Friction dampens motion appropriately

### Code Quality
- [ ] No console errors
- [ ] No object allocation in RAF
- [ ] No DOM reads in RAF
- [ ] Grid rebuilds only on resize
- [ ] All parameters tunable
- [ ] Config export/import works

---

## Notes

- **This file is authoritative** - follow even if conversation context is lost
- **Any deviations** from these rules must be explicitly justified
- **Performance is critical** - profile before and after changes
- **Simplicity over cleverness** - imperative Canvas 2D is the goal
- **Mathematical accuracy** - domain warp and ridge noise are KEY to the aesthetic

---

## References

**Noise Functions:**
- Simplex noise (already implemented in simplex-noise.js)
- Domain warping technique
- Ridge noise via absolute value

**Physics Simulation:**
- Spring-mass-damper system
- Velocity Verlet integration
- Distance-based force falloff

**Visual Style:**
- Topographic contour maps
- cue++ (YCAM) aesthetic
- Organic field visualization

---

**Version:** 1.0
**Last Updated:** 2026-01-23
**Status:** Authoritative
