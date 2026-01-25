# Wave Animation Rules - Mathematical Foundations & Physics

## Overview

This document preserves the **mathematical formulas** and **physics constants** that define the wave animation system. These rules ensure the wave grid maintains its characteristic fluid motion, audio reactivity, and cursor interaction behavior.

**Purpose**: Lock down the core mathematical and physical foundations that give the animation its unique feel.

**When to Consult**: Before modifying any parameters in `wave-grid.js`, noise algorithms, physics behavior, or audio reactivity formulas.

---

## 🚨 CRITICAL REQUIREMENT

**Any change to CRITICAL sections requires explicit user approval before implementation.**

If you need to modify a CRITICAL value, you must:
1. Identify which specific rule would be violated
2. Explain the rationale for the change
3. Request explicit user approval
4. Update this rules file if approved
5. Document the rationale in the commit message

---

## 1. Core Mathematical Formulas (CRITICAL - DO NOT MODIFY)

### 1.1 Simplex Noise Algorithm

The wave animation uses **2D Simplex Noise** to generate smooth, organic wave patterns.

**File**: `simplex-noise.js`

#### Skewing and Unskewing Constants (DERIVED - NEVER CHANGE)

These are mathematical constants required for the simplex noise algorithm to function correctly:

```javascript
// 2D Simplex Noise Constants
F2 = (√3 - 1) / 2  ≈ 0.366025403784439
G2 = (3 - √3) / 6  ≈ 0.211324865405187

// 3D Simplex Noise Constants
F3 = 1.0 / 3.0     = 0.333333333333333
G3 = 1.0 / 6.0     = 0.166666666666667
```

**Why these values**: These are derived from the geometry of the simplex grid and cannot be changed without breaking the algorithm.

#### Noise Normalization Scales (DERIVED - NEVER CHANGE)

```javascript
// 3D Noise Scale
return 32.0 * (n0 + n1 + n2 + n3);

// 2D Noise Scale
return 70.0 * (n0 + n1 + n2);
```

**Why these values**: These normalization factors ensure noise output is approximately in the range [-1, 1].

#### Quintic Smoothing Function (DERIVED - NEVER CHANGE)

```javascript
// Polynomial degree: 4 (quintic)
function fade(t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}
```

**Why this formula**: This 5th-degree polynomial (6t⁵ - 15t⁴ + 10t³) provides C2 continuity (smooth second derivative).

---

### 1.2 Angle-to-Displacement Mapping (CRITICAL)

**File**: `wave-grid.js` (lines 132-139)

Wave displacement is calculated by converting noise output to an angle, then using trigonometry:

```javascript
// Sample 2D noise to get angle for wave displacement
const t = config.angleGain * simplex.noise2D(
  x * config.xScale + time * config.speedX,
  y * config.yScale + time * config.speedY
);

// Wave displacement from angle
const waveX = Math.cos(t) * config.waveAmpX;  // Horizontal displacement (currently 0)
const waveY = Math.sin(t) * currentWaveAmpY;  // Vertical displacement
```

**Critical relationships**:
- `angleGain` controls the "choppiness" vs "smoothness" of waves
- `xScale` and `yScale` control spatial frequency (wave density)
- `speedX` and `speedY` control temporal evolution (animation speed)
- `waveAmpY` controls vertical wave height

**DO NOT MODIFY** this formula structure - it's fundamental to the wave character.

---

### 1.3 Audio Reactivity Formulas (CRITICAL)

**File**: `wave-grid.js` (lines 116-122) and `app.js` (lines 606-628)

#### Power Curve Mapping

```javascript
// Power curve: calm songs subtle, energetic songs dramatic
const audioResponse = Math.pow(audioEnergy, 1.5);
```

**Why 1.5**: This exponent creates a perceptually balanced response:
- Quiet passages (audioEnergy ≈ 0.2) → subtle waves (0.2^1.5 ≈ 0.09)
- Loud passages (audioEnergy ≈ 0.8) → dramatic waves (0.8^1.5 ≈ 0.72)

**Changing this value** alters the fundamental feel of audio reactivity.

#### Amplitude Modulation

```javascript
const currentWaveAmpY = config.waveAmpY * (1.0 + audioResponse * config.audioAmplitudeMultiplier);
```

**Breakdown**:
- `config.waveAmpY` = baseline wave amplitude (12px)
- `audioResponse` = power-curved audio energy (0-1)
- `config.audioAmplitudeMultiplier` = peak multiplier (4.0)

**Example**: At peak audio energy (audioResponse ≈ 0.72):
```
currentWaveAmpY = 12 * (1.0 + 0.72 * 4.0) = 12 * 3.88 ≈ 46.6px
```

#### Audio Energy Extraction

**File**: `app.js` (lines 606-628)

```javascript
window.getAudioEnergy = function() {
  if (!analyserNode || !audio || audio.paused) {
    return 0;
  }

  analyserNode.getByteFrequencyData(frequencyData);

  // Bass frequencies (bins 0-10 ≈ 0-200Hz) - 70% weight
  let bassSum = 0;
  for (let i = 0; i < 10; i++) {
    bassSum += frequencyData[i];
  }
  const bassEnergy = bassSum / (10 * 255);

  // Mid frequencies (bins 10-40 ≈ 200-800Hz) - 30% weight
  let midSum = 0;
  for (let i = 10; i < 40; i++) {
    midSum += frequencyData[i];
  }
  const midEnergy = midSum / (30 * 255);

  // Weighted combination
  return bassEnergy * 0.7 + midEnergy * 0.3;
};
```

**Critical configuration**:
- `fftSize: 256` → 128 frequency bins
- Bass bins: 0-10 (0-200 Hz) → 70% weight
- Mid bins: 10-40 (200-800 Hz) → 30% weight

**Why this weighting**: Bass frequencies are more perceptually impactful for wave motion.

---

### 1.4 Cursor Interaction Formula (CRITICAL)

**File**: `wave-grid.js` (lines 142-162)

#### Distance Calculation and Quadratic Falloff

```javascript
const dx = x - pointer.x;
const dy = y - pointer.y;
const distance = Math.sqrt(dx * dx + dy * dy);

if (distance < config.influenceRadius && distance > 0) {
  // Quadratic falloff
  const normalizedDist = distance / config.influenceRadius;
  const falloff = 1 - (normalizedDist * normalizedDist);

  // Wobble term (creates concentric ripples)
  const wobble = 0.6 + 0.4 * Math.cos(distance * config.wobbleFreq);

  // Impulse strength
  const impulse = falloff * wobble * config.cursorStrength;

  // Inject velocity
  point.cvx += pointer.velocityX * impulse;
  point.cvy += pointer.velocityY * impulse;
}
```

**Critical components**:
- **Quadratic falloff**: `1 - (d/r)²` provides smooth decay to zero at radius boundary
- **Wobble frequency**: `0.015` creates ripple effect (constant)
- **Wobble amplitude**: `0.6 + 0.4 * cos(...)` oscillates between 0.2 and 1.0

**DO NOT MODIFY** the falloff curve shape or wobble constants.

---

## 2. Physics Constants (CRITICAL - DO NOT MODIFY)

### 2.1 Spring-Mass-Damper System

**File**: `wave-grid.js` (lines 34-35, 165-175)

```javascript
// Physics
tension: 0.03,   // Spring restoration force
friction: 0.82,  // Velocity damping
```

#### Spring Physics Implementation

```javascript
// Spring pulls cursor offset back to zero
point.cvx += (-point.cx) * config.tension;
point.cvy += (-point.cy) * config.tension;

// Friction
point.cvx *= config.friction;
point.cvy *= config.friction;

// Integrate
point.cx += point.cvx;
point.cy += point.cvy;
```

**What this creates**: An **underdamped oscillation** system where:
- Points are pulled back to rest position by spring force
- Velocity decays over time due to friction
- System settles smoothly without abrupt stops

#### Physics Relationship (CRITICAL CONSTRAINT)

**Stability requirement**:
```
tension × friction < 0.082
```

**Current values**:
```
0.03 × 0.82 = 0.0246 < 0.082 ✅ STABLE
```

**Why this matters**: Exceeding this threshold causes oscillation explosion (points never settle).

**Valid ranges**:
- If `tension = 0.03`, then `friction` must be < 2.73 (but should stay 0.75-0.88)
- If `friction = 0.82`, then `tension` must be < 0.10 (but should stay 0.01-0.05)

---

### 2.2 Audio Frequency Weighting (CRITICAL)

**File**: `app.js` (lines 606-628)

```javascript
// Bass frequencies: 70% weight
bassEnergy * 0.7

// Mid frequencies: 30% weight
midEnergy * 0.3
```

**Why 70/30**:
- Bass frequencies (0-200 Hz) are more viscerally felt
- Mid frequencies (200-800 Hz) add detail without overwhelming
- Higher frequencies (>800 Hz) are ignored to reduce noise

**Changing this** alters the fundamental audio-reactive character.

---

## 3. Parameter Constraints & Safe Ranges

### 3.1 CRITICAL Parameters (Require Approval)

These parameters fundamentally affect the wave behavior and feel:

| Parameter | Current Value | Valid Range | Constraint | Effect if Violated |
|-----------|---------------|-------------|------------|-------------------|
| `tension` | 0.03 | 0.01 - 0.05 | `tension × friction < 0.082` | Oscillation explosion or sluggish response |
| `friction` | 0.82 | 0.75 - 0.88 | `tension × friction < 0.082` | Oscillation explosion or too much drift |
| `angleGain` | 6 | 4 - 8 | `angleGain ≤ 8` | Aliasing artifacts, visual noise |
| `xScale / yScale` ratio | 1.33 | 1.3 - 3.0 | Preserves wave direction | Circular waves (bad) or extreme anisotropy |
| `speedX / speedY` ratio | 2.0 | 1.5 - 4.0 | Maintains temporal consistency | Spinning motion or temporal aliasing |
| `audioAmplitudeMultiplier` | 4.0 | 2.0 - 6.0 | Perceptual range | Too subtle or overwhelming |

**Why these are CRITICAL**: They define the fundamental physics and perceptual character.

---

### 3.2 SAFE TO MODIFY Parameters (Within Ranges)

These parameters can be adjusted **within documented ranges** without approval:

| Parameter | Current Value | Safe Range | Effect |
|-----------|---------------|------------|--------|
| `xGap` | 12px | 8 - 20px | Grid density (horizontal) |
| `yGap` | 18px | 12 - 24px | Grid density (vertical) |
| `waveAmpY` | 12px | 8 - 16px | Baseline wave height (±25%) |
| `cursorStrength` | 1.2 | 0.8 - 1.5 | Cursor interaction intensity |
| `influenceRadius` | 150px | 100 - 200px | Cursor effect area |
| `maxCursorMoveY` | 20px | 15 - 25px | Max cursor displacement |

**Why these are SAFE**: They're tuneable parameters with validated ranges that don't break physics.

**Example**:
```javascript
// ✅ SAFE - Within range
config.waveAmpY = 14;  // Was 12px, now 14px (within 8-16px range)

// ❌ REQUIRES APPROVAL - Outside range
config.waveAmpY = 20;  // Outside safe range, changes character
```

---

### 3.3 DERIVED VALUES (NEVER CHANGE)

These are calculated constants that must **never be modified**:

| Constant | Value | Source | Why Immutable |
|----------|-------|--------|---------------|
| `F2` | 0.366025403784439 | (√3 - 1) / 2 | Simplex grid geometry |
| `G2` | 0.211324865405187 | (3 - √3) / 6 | Simplex unskewing factor |
| `F3` | 0.333333333333333 | 1 / 3 | 3D simplex skewing |
| `G3` | 0.166666666666667 | 1 / 6 | 3D simplex unskewing |
| Noise 3D scale | 32.0 | Empirical normalization | Ensures [-1, 1] range |
| Noise 2D scale | 70.0 | Empirical normalization | Ensures [-1, 1] range |
| Wobble base | 0.6 | Constant | Ripple effect amplitude |
| Wobble amplitude | 0.4 | Constant | Ripple effect oscillation |

**Why NEVER CHANGE**: These are either mathematical constants or empirically validated normalization factors. Changing them breaks algorithm correctness.

---

## 4. Stability Constraints (MUST MAINTAIN)

### 4.1 Spring-Friction Stability (CRITICAL)

```
tension × friction < 0.082
```

**Current validation**:
```javascript
0.03 × 0.82 = 0.0246 ✅
```

**What happens if violated**:
- System becomes **over-energized**
- Points oscillate with increasing amplitude
- Visual explosion / unstable waves

**Valid combinations**:
```
tension = 0.02, friction = 0.85 → 0.017 ✅
tension = 0.04, friction = 0.80 → 0.032 ✅
tension = 0.05, friction = 0.82 → 0.041 ✅
tension = 0.06, friction = 0.82 → 0.049 ✅ (but requires approval - outside CRITICAL range)
```

---

### 4.2 Spatial Frequency Ratio (CRITICAL)

```
1.3 ≤ (xScale / yScale) ≤ 3.0
```

**Current validation**:
```javascript
0.002 / 0.0015 = 1.333 ✅
```

**Why this matters**:
- Ratio < 1.3: Waves become too circular (loses horizontal flow)
- Ratio > 3.0: Waves become too stretched (extreme anisotropy)

---

### 4.3 Temporal Scroll Ratio (CRITICAL)

```
1.5 ≤ (speedX / speedY) ≤ 4.0
```

**Current validation**:
```javascript
0.03 / 0.015 = 2.0 ✅
```

**Why this matters**:
- Ratio < 1.5: Diagonal drift (spinning appearance)
- Ratio > 4.0: Temporal aliasing (stuttering motion)

---

### 4.4 Angle Gain Limit (CRITICAL)

```
angleGain ≤ 8
```

**Current value**: `6`

**Why this matters**:
- angleGain > 8 causes **spatial aliasing**
- Waves change direction too rapidly between neighboring points
- Visual result: noisy, chaotic patterns

---

### 4.5 Audio Amplitude Range (CRITICAL)

```
2.0 ≤ audioAmplitudeMultiplier ≤ 6.0
```

**Current value**: `4.0`

**Why this matters**:
- < 2.0: Audio reactivity too subtle to notice
- > 6.0: Audio reactivity overwhelming, dominates visual

---

## 5. Audio Analysis Configuration (CRITICAL)

**File**: `app.js` (lines 138-143, 606-628)

### 5.1 FFT Configuration

```javascript
analyserNode.fftSize = 256;  // → 128 frequency bins
```

**Why 256**:
- Balances frequency resolution with performance
- Provides 128 bins (fftSize / 2)
- Bin width ≈ 172 Hz (44100 Hz / 256)

**DO NOT CHANGE** unless you recalibrate frequency ranges below.

---

### 5.2 Frequency Bin Mapping

```javascript
// Sample rate: 44100 Hz (standard)
// Bin width: 44100 / 256 ≈ 172.27 Hz

// Bass frequencies (bins 0-10 ≈ 0-200 Hz)
// 10 bins × 172 Hz ≈ 1720 Hz range (but weighted toward lower bins)

// Mid frequencies (bins 10-40 ≈ 200-800 Hz)
// 30 bins × 172 Hz ≈ 5160 Hz range (but weighted toward 200-800 Hz)
```

**Critical relationships**:
- Bass bins: 0-10 (8.5% of spectrum, 70% weight)
- Mid bins: 10-40 (25% of spectrum, 30% weight)
- High frequencies: 40-128 (66.5% of spectrum, **0% weight** - ignored)

**Why ignore high frequencies**: They create visual noise without adding perceptual value.

---

### 5.3 Frequency Weighting Formula

```javascript
return bassEnergy * 0.7 + midEnergy * 0.3;
```

**Normalized calculation**:
```javascript
// Bass: sum(bins 0-10) / (10 bins × 255 max) → [0, 1]
const bassEnergy = bassSum / (10 * 255);

// Mid: sum(bins 10-40) / (30 bins × 255 max) → [0, 1]
const midEnergy = midSum / (30 * 255);
```

**DO NOT MODIFY** weighting (70/30) without approval.

---

## 6. Noise Sampling Configuration (CRITICAL)

**File**: `wave-grid.js` (lines 16-20, 132-135)

### 6.1 Spatial Scales

```javascript
xScale: 0.002,   // Spatial frequency in X
yScale: 0.0015,  // Spatial frequency in Y
```

**What this means**:
- Point at `x = 1000px` samples noise at `1000 × 0.002 = 2.0` in noise space
- Point at `y = 1000px` samples noise at `1000 × 0.0015 = 1.5` in noise space

**Effect of changing**:
- **Increase** xScale/yScale → Higher frequency waves (more wrinkles)
- **Decrease** xScale/yScale → Lower frequency waves (smoother, broader)

**Constraint**: Must maintain ratio `xScale / yScale ≈ 1.3-3.0`

---

### 6.2 Temporal Speeds

```javascript
speedX: 0.03,    // Time scroll speed in X
speedY: 0.015,   // Time scroll speed in Y
```

**What this means**:
- Noise field scrolls at `0.03` units/second in X direction
- Noise field scrolls at `0.015` units/second in Y direction

**Effect of changing**:
- **Increase** speedX/speedY → Faster wave evolution (busier animation)
- **Decrease** speedX/speedY → Slower wave evolution (calmer, meditative)

**Constraint**: Must maintain ratio `speedX / speedY ≈ 1.5-4.0`

---

## 7. Cursor Clamping Limits (SAFE TO MODIFY)

**File**: `wave-grid.js` (lines 31, 177-180)

```javascript
maxCursorMoveY: 20,  // Max cursor Y offset (0.8 * yGap = 20)

// Clamping
const maxCursorMoveX = config.maxCursorMoveY;
point.cx = Math.max(-maxCursorMoveX, Math.min(maxCursorMoveX, point.cx));
point.cy = Math.max(-config.maxCursorMoveY, Math.min(config.maxCursorMoveY, point.cy));
```

**Safe range**: 15px - 25px

**Why clamping**: Prevents cursor from dragging points too far, which would:
- Break grid topology
- Create visual artifacts (crossing lines)
- Ruin the organic feel

---

## 8. Approval Process for Rule Changes

### 8.1 How to Request Approval

When you identify a need to modify a CRITICAL parameter:

1. **Identify the rule**:
   - State which parameter needs changing
   - Note current value and proposed value
   - Cite which section of this document

2. **Explain rationale**:
   - Why is the change needed?
   - What problem does it solve?
   - What is the expected outcome?

3. **Check constraints**:
   - Will it violate stability constraints?
   - Is it within valid ranges?
   - What are the risks?

4. **Request approval**:
   - Ask user explicitly if change is acceptable
   - Provide clear before/after comparison
   - Explain implications

5. **Update rules**:
   - If approved, update this file with new baseline
   - Document rationale in commit message
   - Update any affected constraint calculations

---

### 8.2 Example: CORRECT Approval Request

```
I'd like to increase spring tension from 0.03 to 0.045 for tighter cursor tracking.

**Current behavior**: Points drift slightly after cursor passes (feels floaty)
**Proposed behavior**: Points snap back faster (feels tighter, more responsive)

**Constraint check**:
- Current: 0.03 × 0.82 = 0.0246 ✅
- Proposed: 0.045 × 0.82 = 0.0369 ✅ (still < 0.082)

**Valid range check**:
- CRITICAL range for tension: 0.01-0.05
- 0.045 is within range ✅

**Request**: This is within the documented CRITICAL range, but changes
the fundamental feel of cursor interaction. May I proceed with this change?
```

✅ **CORRECT**: Identifies rule, explains rationale, checks constraints, requests approval

---

### 8.3 Example: INCORRECT Approach

```
I changed tension from 0.03 to 0.06 because it felt better.
```

❌ **INCORRECT**:
- No constraint check (0.06 × 0.82 = 0.0492, getting close to 0.082 limit)
- No approval requested
- Outside CRITICAL range (0.01-0.05)
- Doesn't explain "felt better"

---

## 9. Quick Reference: Parameter Categories

### CRITICAL (Require Approval)
- `tension`, `friction` (spring physics)
- `angleGain` (noise multiplier)
- `xScale`, `yScale`, ratio (spatial frequency)
- `speedX`, `speedY`, ratio (temporal scroll)
- `audioAmplitudeMultiplier` (audio peak response)
- Audio weighting (70/30 bass/mid split)
- FFT size and frequency bin ranges

### SAFE TO MODIFY (Within Ranges)
- `xGap` (8-20px)
- `yGap` (12-24px)
- `waveAmpY` (8-16px)
- `cursorStrength` (0.8-1.5)
- `influenceRadius` (100-200px)
- `maxCursorMoveY` (15-25px)

### DERIVED (NEVER CHANGE)
- `F2`, `G2`, `F3`, `G3` (simplex constants)
- Noise normalization scales (32.0, 70.0)
- Wobble base/amplitude (0.6, 0.4)
- Quintic polynomial coefficients

---

## 10. When to Update This Rules File

Update this document when:

1. **User approves CRITICAL parameter change**
   - Update baseline value
   - Explain rationale for deviation
   - Recalculate constraint validations

2. **New feature adds mathematical formula**
   - Document formula in CRITICAL section
   - Define valid ranges
   - Add to constraint checks

3. **Parameter ranges are validated through testing**
   - Expand SAFE TO MODIFY ranges if proven stable
   - Document validation testing performed
   - Keep CRITICAL ranges conservative

4. **Bug fix requires formula correction**
   - Update incorrect formula
   - Explain what was wrong and why
   - Add regression test reference

**Always include rationale in commit message when updating rules.**

---

**Last Updated**: 2026-01-25
**Rules Version**: 1.0
**Source Files**: `wave-grid.js` (lines 10-320), `simplex-noise.js`, `app.js` (lines 138-143, 606-628)
