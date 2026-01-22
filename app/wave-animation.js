// ============================================================================
// SimplexNoise Implementation (MIT Licensed - Based on Stefan Gustavson's work)
// ============================================================================

class SimplexNoise {
    constructor() {
        // Gradient vectors for 3D
        this.grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];

        // Permutation table
        this.p = [];
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(Math.random() * 256);
        }

        // Duplicate permutation table to avoid wrapping
        this.perm = new Array(512);
        this.gradP = new Array(512);
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.gradP[i] = this.grad3[this.perm[i] % 12];
        }
    }

    dot(g, x, y, z) {
        return g[0] * x + g[1] * y + g[2] * z;
    }

    // 3D simplex noise
    noise(xin, yin, zin) {
        let n0, n1, n2, n3; // Noise contributions from corners

        // Skew input space to determine simplex cell
        const F3 = 1.0 / 3.0;
        const s = (xin + yin + zin) * F3;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const k = Math.floor(zin + s);

        const G3 = 1.0 / 6.0;
        const t = (i + j + k) * G3;
        const X0 = i - t;
        const Y0 = j - t;
        const Z0 = k - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;
        const z0 = zin - Z0;

        // Determine which simplex we're in
        let i1, j1, k1;
        let i2, j2, k2;

        if (x0 >= y0) {
            if (y0 >= z0) {
                i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
            } else if (x0 >= z0) {
                i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
            } else {
                i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
            }
        } else {
            if (y0 < z0) {
                i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
            } else if (x0 < z0) {
                i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
            } else {
                i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
            }
        }

        // Offsets for remaining corners
        const x1 = x0 - i1 + G3;
        const y1 = y0 - j1 + G3;
        const z1 = z0 - k1 + G3;
        const x2 = x0 - i2 + 2.0 * G3;
        const y2 = y0 - j2 + 2.0 * G3;
        const z2 = z0 - k2 + 2.0 * G3;
        const x3 = x0 - 1.0 + 3.0 * G3;
        const y3 = y0 - 1.0 + 3.0 * G3;
        const z3 = z0 - 1.0 + 3.0 * G3;

        // Work out hashed gradient indices
        const ii = i & 255;
        const jj = j & 255;
        const kk = k & 255;
        const gi0 = this.gradP[ii + this.perm[jj + this.perm[kk]]];
        const gi1 = this.gradP[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]];
        const gi2 = this.gradP[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]];
        const gi3 = this.gradP[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]];

        // Calculate noise contributions
        let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 < 0) {
            n0 = 0.0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(gi0, x0, y0, z0);
        }

        let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 < 0) {
            n1 = 0.0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(gi1, x1, y1, z1);
        }

        let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 < 0) {
            n2 = 0.0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(gi2, x2, y2, z2);
        }

        let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 < 0) {
            n3 = 0.0;
        } else {
            t3 *= t3;
            n3 = t3 * t3 * this.dot(gi3, x3, y3, z3);
        }

        // Sum contributions and scale to [-1, 1]
        return 32.0 * (n0 + n1 + n2 + n3);
    }
}

// ============================================================================
// Canvas Animation Configurations (Updated to Match Cue++)
// ============================================================================

const CANVAS_CONFIGS = {
    'no-selection': {
        lineColor: '#667eea',
        backgroundColor: 'transparent',
        waveSpeedX: 0.03,      // Increased from 0.02 (+50%)
        waveSpeedY: 0.015,     // Increased from 0.01 (+50%)
        waveAmpX: 65,          // Increased from 40 (+60%)
        waveAmpY: 32,          // Increased from 20 (+60%)
        friction: 0.9,
        tension: 0.01,
        maxCursorMove: 120,
        xGap: 12,
        yGap: 36,
        lineWidth: 0.8,
        glowIntensity: 0.3,
        audioReactivity: 0.4
    },
    'theme-classicfm': {
        lineColor: '#FFD700',
        backgroundColor: 'transparent',
        waveSpeedX: 0.022,     // Increased from 0.015 (+50%)
        waveSpeedY: 0.012,     // Increased from 0.008 (+50%)
        waveAmpX: 55,          // Increased from 35 (+60%)
        waveAmpY: 28,          // Increased from 18 (+60%)
        friction: 0.9,
        tension: 0.01,
        maxCursorMove: 120,
        xGap: 14,
        yGap: 40,
        lineWidth: 0.7,
        glowIntensity: 0.5,
        audioReactivity: 0.3
    },
    'theme-reprezent': {
        lineColor: '#ffffff',
        backgroundColor: 'transparent',
        waveSpeedX: 0.037,     // Increased from 0.025 (+50%)
        waveSpeedY: 0.018,     // Increased from 0.012 (+50%)
        waveAmpX: 70,          // Increased from 45 (+60%)
        waveAmpY: 35,          // Increased from 22 (+60%)
        friction: 0.9,
        tension: 0.01,
        maxCursorMove: 120,
        xGap: 12,
        yGap: 36,
        lineWidth: 0.9,
        glowIntensity: 0.4,
        audioReactivity: 0.6
    }
};

// Make CANVAS_CONFIGS globally accessible for app.js
window.CANVAS_CONFIGS = CANVAS_CONFIGS;

// ============================================================================
// Audio Energy Helper (Provided by App)
// ============================================================================
// This function will be called from the main app.js which has access to
// the Web Audio API analyser node
function getAudioEnergy() {
    // This will be overridden by app.js
    return 0;
}

// ============================================================================
// WaveGrid Class with Grid Mesh Architecture (Cue++ Approach)
// ============================================================================

class WaveGrid {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.isAnimating = false;
        this.animationFrameId = null;  // Track animation frame for cleanup
        this.grid = [];  // 2D array: grid[col][row]
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        this.time = 0;
        this.audioEnergy = 0;

        this.init();
    }

    init() {
        this.resize();
        console.log('Canvas initialized:', this.width, 'x', this.height);
        this.createGrid();
        console.log('Grid created with', this.grid.length, 'columns');
        this.setupEventListeners();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;

        // Use window dimensions directly
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Setting canvas.width/height resets the context
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;

        // Reset context and reapply scaling
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(dpr, dpr);
    }

    createGrid() {
        this.grid = [];
        const { xGap, yGap } = this.config;

        // Add 20% padding to bleed beyond viewport edges for smooth wave continuity
        const padding = 0.2;  // 20% bleed
        const startX = -this.width * padding;
        const endX = this.width * (1 + padding);
        const startY = -this.height * padding;
        const endY = this.height * (1 + padding);

        // Create columns (x-axis) with bleed
        for (let x = startX; x <= endX; x += xGap) {
            const column = [];

            // Create rows for this column (y-axis) with bleed
            for (let y = startY; y <= endY; y += yGap) {
                column.push({
                    baseX: x,
                    baseY: y,
                    x: x,
                    y: y,
                    vx: 0,
                    vy: 0
                });
            }

            this.grid.push(column);
        }
    }

    setupEventListeners() {
        // Mouse/touch interaction (desktop only)
        if (!('ontouchstart' in window)) {
            this.canvas.style.pointerEvents = 'auto';

            this.canvas.addEventListener('mousemove', (e) => {
                this.targetMouseX = e.clientX;
                this.targetMouseY = e.clientY;
            });

            this.canvas.addEventListener('mouseleave', () => {
                this.targetMouseX = this.width / 2;
                this.targetMouseY = this.height / 2;
            });
        }

        window.addEventListener('resize', () => {
            this.resize();
            this.createGrid();
        });
    }

    updateParticles() {
        const {
            waveSpeedX, waveSpeedY, waveAmpX, waveAmpY,
            friction, tension, maxCursorMove
        } = this.config;

        this.time += 0.01;

        // Smooth mouse interpolation
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.1;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.1;

        // Update each vertex in the grid
        this.grid.forEach(column => {
            column.forEach(vertex => {
                // Use Simplex noise for smooth wave displacement
                const noiseX = simplex.noise(
                    vertex.baseX * 0.003,
                    vertex.baseY * 0.003,
                    this.time * waveSpeedX
                ) * waveAmpX;

                const noiseY = simplex.noise(
                    vertex.baseX * 0.003 + 100,  // Offset for independent Y
                    vertex.baseY * 0.003,
                    this.time * waveSpeedY
                ) * waveAmpY;

                // Cursor repulsion - optimized with squared distance
                const dx = this.mouseX - vertex.baseX;
                const dy = this.mouseY - vertex.baseY;
                const distSq = dx * dx + dy * dy;
                const maxDistSq = maxCursorMove * maxCursorMove;

                let cursorForceX = 0;
                let cursorForceY = 0;

                if (distSq < maxDistSq && distSq > 0) {
                    const dist = Math.sqrt(distSq);  // Only sqrt if within range
                    const force = (1 - dist / maxCursorMove) * 30;
                    cursorForceX = (dx / dist) * force;
                    cursorForceY = (dy / dist) * force;
                }

                // Target position
                const targetX = vertex.baseX + noiseX - cursorForceX;
                const targetY = vertex.baseY + noiseY - cursorForceY;

                // Spring physics
                const ax = (targetX - vertex.x) * tension;
                const ay = (targetY - vertex.y) * tension;

                vertex.vx += ax;
                vertex.vy += ay;
                vertex.vx *= friction;
                vertex.vy *= friction;

                vertex.x += vertex.vx;
                vertex.y += vertex.vy;
            });
        });
    }

    drawGrid() {
        const { lineColor, lineWidth, glowIntensity } = this.config;

        this.ctx.clearRect(0, 0, this.width, this.height);

        // Set line style
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.shadowBlur = 15 * glowIntensity;
        this.ctx.shadowColor = lineColor;

        // Draw each vertical line (column)
        this.grid.forEach(column => {
            this.ctx.beginPath();

            column.forEach((vertex, row) => {
                if (row === 0) {
                    this.ctx.moveTo(vertex.x, vertex.y);
                } else {
                    this.ctx.lineTo(vertex.x, vertex.y);
                }
            });

            this.ctx.stroke();
        });
    }

    animate() {
        if (!this.isAnimating) return;

        this.audioEnergy = getAudioEnergy();
        this.updateParticles();
        this.drawGrid();

        // Store animation frame ID for proper cleanup
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    start() {
        // Prevent multiple animation loops
        if (this.isAnimating) {
            console.log('Animation already running, skipping start()');
            return;
        }

        console.log('Starting animation...');
        this.isAnimating = true;
        this.animate();
    }

    stop() {
        this.isAnimating = false;

        // Cancel pending animation frame to prevent loop accumulation
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

// ============================================================================
// Initialization (Will be called from app.js)
// ============================================================================

// Global simplex noise instance
const simplex = new SimplexNoise();

// Wave grid instance will be created by app.js
let waveGridInstance = null;
