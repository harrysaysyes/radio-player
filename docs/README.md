# Radio Player - Rules Documentation System

## Overview

This documentation system preserves the core mathematical foundations and architectural patterns of the radio player application. These files serve as the **"source of truth"** that must be consulted before making changes to critical systems.

**Purpose**: Lock in the fundamental design decisions (math, physics, architecture) while allowing flexibility in styling and minor adjustments.

---

## 📚 Rules File Index

| File | Purpose | When to Consult |
|------|---------|-----------------|
| **[WAVE_ANIMATION_RULES.md](./WAVE_ANIMATION_RULES.md)** | Mathematical foundations, physics constants, audio reactivity | Before changing wave animation parameters, noise algorithms, or physics behavior |
| **[ARCHITECTURE_RULES.md](./ARCHITECTURE_RULES.md)** | Structural patterns, data flow, error handling | Before refactoring modules, changing state management, or modifying component communication |

---

## 🤖 For AI Assistants / Future Developers

### **CRITICAL: Read Before Making Changes**

**Before modifying any of the following, consult the appropriate rules file:**

✅ **Wave animation parameters** → Read `WAVE_ANIMATION_RULES.md`
- Noise scales (`xScale`, `yScale`)
- Physics constants (`tension`, `friction`)
- Audio reactivity formulas
- Cursor interaction strength

✅ **Application architecture** → Read `ARCHITECTURE_RULES.md`
- Module communication patterns
- Audio streaming flow
- Error handling mechanisms
- Component initialization order

---

### Process for Requesting Rule Changes

When you identify a potential rule violation:

1. **Identify the rule** - Note which specific rule would be violated
2. **Explain rationale** - Clearly articulate why the change is needed
3. **Request explicit user approval** - Never silently break rules
4. **Update rules file** - If approved, update the relevant rules file
5. **Document in commit** - Include rationale in commit message

**Example:**
```
❌ WRONG: "I changed tension from 0.03 to 0.06 because it felt better"

✅ CORRECT: "The current spring tension (0.03) produces too much drift.
I'd like to increase it to 0.045 for tighter cursor tracking.
This is within the CRITICAL range (0.01-0.05) documented in
WAVE_ANIMATION_RULES.md section 4, but I'm requesting approval
since it changes the fundamental feel of the interaction."
```

---

## 🚦 Modification Guidelines

### CRITICAL Sections (❗ Require Explicit Approval)

Changes to these require **explicit user approval before implementation**:

- Mathematical formulas (simplex noise, spring physics, audio response curves)
- Physics constant relationships (tension × friction constraints)
- Architectural patterns (module communication, data flow)
- Error handling mechanisms
- Component lifecycle and initialization order

**Why**: These define the fundamental behavior and feel of the application.

### SAFE TO MODIFY Sections (✅ Allowed Within Ranges)

Changes to these are allowed **within documented ranges**:

- Grid density (`xGap: 8-20px`, `yGap: 12-24px`)
- Wave amplitude (`waveAmpY: 8-16px`)
- Cursor interaction strength (`cursorStrength: 0.8-1.5`)
- Visual styling (colors, spacing, fonts)

**Why**: These are tuneable parameters with validated safe ranges.

### DERIVED VALUES (🚫 Never Change)

These are calculated constants and must **never be modified**:

- Simplex noise skewing factors (`F2 = (√3 - 1) / 2`)
- Noise normalization scales (`32.0` for 3D, `70.0` for 2D)
- Polynomial degrees (quintic smooth function)

**Why**: These are mathematical constants required for algorithm correctness.

---

## 📝 When to Update Rules Files

Update the rules documentation when:

1. **User explicitly approves rule deviation**
   - Document the new baseline
   - Explain rationale for change
   - Update constraint ranges if needed

2. **New feature adds architectural pattern**
   - Document the pattern in ARCHITECTURE_RULES.md
   - Explain when pattern should be used
   - Add to approval process if critical

3. **Parameter ranges are validated**
   - If testing proves wider ranges are stable
   - Update SAFE TO MODIFY ranges
   - Document validation testing performed

4. **Bug fix requires formula correction**
   - Update the mathematical formula
   - Explain what was wrong and why
   - Add regression test if applicable

**Always include rationale in commit message when updating rules.**

---

## 🎯 Quick Reference: What Requires Approval?

| Change | Requires Approval? | Rationale |
|--------|-------------------|-----------|
| Adjust `xGap` from 12px to 15px | ❌ No | Within SAFE range (8-20px) |
| Change `tension` from 0.03 to 0.04 | ✅ Yes | CRITICAL physics constant |
| Add new radio station | ❌ No | Doesn't affect core systems |
| Modify audio streaming flow | ✅ Yes | CRITICAL architectural pattern |
| Change theme colors | ❌ No | Visual styling, not locked |
| Adjust `friction` from 0.82 to 0.85 | ✅ Yes | CRITICAL physics constant |
| Add media query breakpoint | ❌ No | Responsive design, not locked |
| Change script loading order | ✅ Yes | CRITICAL initialization order |
| Tweak `waveAmpY` from 12px to 14px | ❌ No | Within SAFE range (8-16px) |
| Modify simplex noise formula | ✅ Yes | CRITICAL mathematical foundation |

---

## 🛡️ Philosophy: Why These Rules Exist

**The Problem**: Without rules, gradual drift can fundamentally change the character of the application. Small tweaks accumulate, and core design decisions get lost over time.

**The Solution**: Lock down the "essence" (math, physics, architecture) while preserving flexibility in presentation (colors, spacing, responsive breakpoints).

**The Balance**:
- **Too strict**: Can't improve the app, becomes stagnant
- **Too loose**: Loses its identity, becomes unrecognizable
- **Just right**: Core feel preserved, presentation evolves

**These rules achieve "just right" by**:
1. Protecting mathematical/physical foundations that define behavior
2. Protecting architectural patterns that ensure reliability
3. Allowing visual and UX improvements within proven safe ranges

---

## 📂 File Structure

```
/docs/
├── README.md                      ← You are here
├── WAVE_ANIMATION_RULES.md        ← Math, physics, audio reactivity
└── ARCHITECTURE_RULES.md          ← Patterns, data flow, error handling
```

---

## 🚀 Getting Started

**First time here?**

1. **Read this README** to understand the rules system
2. **Skim both rules files** to get familiar with what's locked down
3. **Bookmark relevant sections** for quick reference during development

**Before making a change:**

1. **Check if it affects locked systems** (wave animation? architecture?)
2. **Read the relevant rules file** (WAVE_ANIMATION_RULES.md or ARCHITECTURE_RULES.md)
3. **Determine if approval needed** (CRITICAL section? Outside SAFE ranges?)
4. **Request approval if needed** (explain rationale clearly)
5. **Update rules if approved** (document new baseline)

---

## ⚖️ When in Doubt

**If you're unsure whether something requires approval:**

1. **Describe the change** clearly and concisely
2. **Ask the user** if it requires approval
3. **Err on the side of asking** (better safe than sorry)

**Remember**: The goal is to preserve the app's identity while enabling improvement. When in doubt, ask!

---

**Last Updated**: 2026-01-25
**Rules Version**: 1.0

