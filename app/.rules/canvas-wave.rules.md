# Canvas Wave Animation - Architecture Rules

## Project Overview

This is a performant animated background using HTML5 Canvas 2D.

**Technology Stack:**
- HTML5 Canvas (CanvasRenderingContext2D only)
- Vanilla JavaScript (imperative, no frameworks)
- requestAnimationFrame for render loop

**Prohibitions:**
- ❌ NO React, Vue, Svelte, or JSX
- ❌ NO WebGL, Three.js, Pixi, Paper.js
- ❌ NO SVG or CSS animations for the grid
- ❌ NO external animation libraries
- ❌ NO unnecessary class abstractions
- ❌ NO animation logic in event handlers

---

## Architecture Rules (MANDATORY)

### 1. Rendering
- Use a single `<canvas>` element filling the viewport
- Use `CanvasRenderingContext2D` only
- Use `requestAnimationFrame` for the render loop
- Never store animation state in a framework state system

### 2. Grid Model
- Precompute a 2D grid of points at initialization
- Points are arranged in horizontal rows
- Each row is drawn as a single continuous polyline using `ctx.moveTo()` and `ctx.lineTo()`
- Grid spacing is configurable (`xGap`, `yGap`)
- Points stored in flat array for cache efficiency

### 3. Motion Model

Each point has:
- **Base position** (`baseX`, `baseY`) - never changes
- **Current position** (`currentX`, `currentY`) - animated position
- **Velocity** (`velocityX`, `velocityY`) - for spring physics

Point displacement comes from two sources:

**A. Noise Displacement:**
- Noise is continuous over time (Simplex or Perlin)
- Noise controls ANGLE, not raw offset
- `angle = noise(x, y, time) * PI`
- `offsetX = cos(angle) * maxDisplacement`
- `offsetY = sin(angle) * maxDisplacement`

**B. Cursor Displacement:**
- Applied via spring physics
- Force decays by distance from cursor
- Includes friction and spring restoration

### 4. Interaction Model

**Pointer Tracking:**
- Track pointer position (`pointer.x`, `pointer.y`)
- Track pointer velocity for momentum
- Track active state (`pointer.isActive`)

**Force Application:**
- Points inside influence radius receive force
- Force magnitude: `(1 - distance / radius) * strength`
- Force direction: repulsion away from cursor
- Force applied to velocity, not position directly

**Physics:**
- Spring force pulls point back to rest position (base + noise offset)
- Friction applied to velocity each frame
- Max displacement can be clamped

### 5. Rendering Style

- **Stroke-only** lines (no fills)
- **Constant line width** (typically 1px)
- **Dark background** (`#0a0a0a` or theme-based)
- **Subtle hue or alpha variation** allowed for theme colors
- **No gradients, textures, or complex fills**

### 6. Performance Requirements

**Critical:**
- ❌ NO object allocation inside animation loop
- ❌ NO DOM reads inside animation loop (e.g., `getBoundingClientRect()`)
- ✅ Resize rebuilds grid only once (not every frame)
- ✅ Use debounced resize handler

**Optimization:**
- Preallocate all point objects during initialization
- Cache canvas dimensions
- Use single `beginPath()` per row (not per point)
- Consider `Float32Array` for point storage if profiling shows benefit

### 7. Code Structure

**File Organization:**
- `simplex-noise.js` - Noise implementation only
- `wave-grid.js` - Grid logic, animation loop, pointer tracking
- `radio-player.html` - Bootstrap and initialization

**Function Separation:**
- `init()` - Initialize grid, set up canvas
- `resize()` - Handle window resize, rebuild grid
- `update(deltaTime)` - Update all point positions
- `draw(ctx)` - Render grid to canvas
- `animate(timestamp)` - Main loop coordinator

**Never:**
- Don't mix initialization logic with animation logic
- Don't put animation state in global scope haphazardly
- Don't use complex class hierarchies

---

## Deliverable Sequence (MUST FOLLOW)

### Step 1: Create Rules File ✅
This file - authoritative source of truth

### Step 2: Implement Noise Function
- Clean Simplex noise implementation
- Support 2D and 3D noise
- Export `simplex.noise3D(x, y, z)` function

### Step 3: Implement Grid Initialization
- `initGrid(canvas)` function
- Calculate rows/cols from canvas size
- Preallocate point array
- Initialize all point properties

### Step 4: Implement Animation Loop
- `update(deltaTime)` - calculate noise displacement
- `draw(ctx)` - render polylines
- `animate(timestamp)` - main loop with RAF

### Step 5: Implement Pointer Interaction
- Track pointer position and velocity
- Calculate cursor force for each point
- Apply spring physics
- Apply friction

### Step 6: Implement Resize Handling
- Debounced resize event
- Rebuild grid on resize
- Cache new canvas dimensions

### Step 7: Bootstrap Integration
- Add `<script>` tags to HTML
- Initialize canvas reference
- Call `resize()`, `initPointerTracking()`
- Start animation loop

### Step 8: Theme Integration
- Add theme color system
- Expose `setTheme(name)` function
- Integrate with station switching

---

## Configuration Defaults

```javascript
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
  cursorStrength: 0.5    // Cursor force multiplier
};
```

---

## Performance Targets

- **CPU Usage:** < 10% average (target: 5-8%)
- **Frame Rate:** Solid 60 FPS
- **Frame Time:** < 16ms per frame
- **Memory:** No leaks (stable over time)
- **Fan Activity:** No audible fan spin-up

---

## Testing Checklist

### Visual
- [ ] Grid is clearly visible on load
- [ ] Grid animates smoothly (flowing wave motion)
- [ ] Cursor interaction works (repulsion effect)
- [ ] Theme colors change with station selection

### Performance
- [ ] CPU usage < 10% during animation
- [ ] 60 FPS maintained consistently
- [ ] No memory leaks over 5 minutes
- [ ] Fan stays quiet

### Code Quality
- [ ] No console errors
- [ ] No allocation spikes in profiler
- [ ] RAF callbacks complete in < 16ms
- [ ] Grid rebuilds only on resize (verify with breakpoint)

---

## Notes

- This file is **authoritative** - follow even if conversation context is lost
- Any deviations from these rules must be explicitly justified
- Performance is critical - original implementation caused fan spinning
- Simplicity over cleverness - imperative Canvas 2D is the goal
