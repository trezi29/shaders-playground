/**
 * DitherGradient — standalone Framer component
 *
 * Two-color vertical gradient with organic noise warp, rendered through a
 * dither filter. Zero npm dependencies — paste directly into Framer's
 * code-component editor.
 */

import { useEffect, useRef } from 'react';
// @ts-ignore — Framer resolves this module internally at runtime
import { addPropertyControls, ControlType } from 'framer';

// ─── GLSL ─────────────────────────────────────────────────────────────────────

const VERT = `#version 300 es
layout(location = 0) in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec3  u_gradA;
uniform vec3  u_gradB;
uniform float u_speed;
uniform float u_distortion;
uniform float u_seed;
uniform int   u_pattern;    // 0=bayer2 1=bayer4 2=bayer8 3=clusteredDot 4=blueNoise 5=whiteNoise
uniform float u_pixelSize;
uniform float u_threshold;
uniform float u_spread;
uniform int   u_colorMode;  // 0=gradient 1=custom
uniform vec3  u_colorA;
uniform vec3  u_colorB;
uniform float u_opacity;

out vec4 outColor;

// ── Cheap value noise (4 hash calls) ─────────────────────────────────────────
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i),                  hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

// ── Bayer 2×2 ─────────────────────────────────────────────────────────────────
float bayer2(vec2 p) {
    const float m[4] = float[4](0.0, 2.0, 3.0, 1.0);
    int x = int(mod(p.x, 2.0));
    int y = int(mod(p.y, 2.0));
    return m[y * 2 + x] / 4.0;
}

// ── Bayer 4×4 ─────────────────────────────────────────────────────────────────
float bayer4(vec2 p) {
    const float m[16] = float[16](
         0.0,  8.0,  2.0, 10.0,
        12.0,  4.0, 14.0,  6.0,
         3.0, 11.0,  1.0,  9.0,
        15.0,  7.0, 13.0,  5.0
    );
    int x = int(mod(p.x, 4.0));
    int y = int(mod(p.y, 4.0));
    return m[y * 4 + x] / 16.0;
}

// ── Bayer 8×8 ─────────────────────────────────────────────────────────────────
float bayer8(vec2 p) {
    const float m[64] = float[64](
         0.0, 32.0,  8.0, 40.0,  2.0, 34.0, 10.0, 42.0,
        48.0, 16.0, 56.0, 24.0, 50.0, 18.0, 58.0, 26.0,
        12.0, 44.0,  4.0, 36.0, 14.0, 46.0,  6.0, 38.0,
        60.0, 28.0, 52.0, 20.0, 62.0, 30.0, 54.0, 22.0,
         3.0, 35.0, 11.0, 43.0,  1.0, 33.0,  9.0, 41.0,
        51.0, 19.0, 59.0, 27.0, 49.0, 17.0, 57.0, 25.0,
        15.0, 47.0,  7.0, 39.0, 13.0, 45.0,  5.0, 37.0,
        63.0, 31.0, 55.0, 23.0, 61.0, 29.0, 53.0, 21.0
    );
    int x = int(mod(p.x, 8.0));
    int y = int(mod(p.y, 8.0));
    return m[y * 8 + x] / 64.0;
}

// ── Clustered dot 4×4 ─────────────────────────────────────────────────────────
float clusteredDot(vec2 p) {
    const float m[16] = float[16](
        12.0,  5.0,  6.0, 13.0,
         4.0,  0.0,  1.0,  7.0,
        11.0,  3.0,  2.0,  8.0,
        15.0, 10.0,  9.0, 14.0
    );
    int x = int(mod(p.x, 4.0));
    int y = int(mod(p.y, 4.0));
    return m[y * 4 + x] / 16.0;
}

// ── Blue noise approximation ──────────────────────────────────────────────────
float blueNoise(vec2 p) {
    return fract(52.9829189 * fract(p.x * 0.06711056 + p.y * 0.00583715));
}

// ── White noise ───────────────────────────────────────────────────────────────
float whiteNoise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    // ── Step 1: snap to dither-cell grid ──────────────────────────────────────
    vec2 pixelCoord   = floor(gl_FragCoord.xy / u_pixelSize);
    vec2 pixelatedPos = (pixelCoord + 0.5) * u_pixelSize;

    // ── Step 2: screen UV (Y flipped so top=0) ────────────────────────────────
    vec2 uv = vec2(
        pixelatedPos.x / u_res.x,
        1.0 - pixelatedPos.y / u_res.y
    );

    // ── Step 3: vertical gradient + single noise warp ─────────────────────────
    // One noise call replaces the old 6×FBM stack (30 noise evaluations).
    float t    = u_time * u_speed * 0.08 + u_seed * 0.17;
    float warp = noise(vec2(uv.x * 2.5 + t * 0.3, t * 0.15)) - 0.5;
    float gradT = clamp(uv.y + warp * u_distortion * 0.6, 0.0, 1.0);

    // ── Step 4: dither value ──────────────────────────────────────────────────
    float ditherVal;
    if      (u_pattern == 0) ditherVal = bayer2(pixelCoord);
    else if (u_pattern == 1) ditherVal = bayer4(pixelCoord);
    else if (u_pattern == 2) ditherVal = bayer8(pixelCoord);
    else if (u_pattern == 3) ditherVal = clusteredDot(pixelCoord);
    else if (u_pattern == 4) ditherVal = blueNoise(pixelCoord);
    else                     ditherVal = whiteNoise(pixelCoord);

    // ── Step 5: threshold + spread ────────────────────────────────────────────
    float ditherResult = step(
        0.5 + (ditherVal - 0.5) * u_spread,
        gradT + u_threshold - 0.5
    );

    // ── Step 6: color output ──────────────────────────────────────────────────
    vec3 outRGB;
    if (u_colorMode == 0) {
        // gradient mode — each dithered pixel picks a slightly offset gradient stop
        float darkT   = clamp(gradT - 0.18, 0.0, 1.0);
        float brightT = clamp(gradT + 0.18, 0.0, 1.0);
        outRGB = mix(
            mix(u_gradA, u_gradB, darkT),
            mix(u_gradA, u_gradB, brightT),
            ditherResult
        );
    } else {
        // custom mode — two solid colors
        outRGB = mix(u_colorA, u_colorB, ditherResult);
    }

    outColor = vec4(outRGB, u_opacity);
}
`;

// ─── WebGL helpers ────────────────────────────────────────────────────────────

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[DitherGradient] shader error:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function buildProgram(gl: WebGL2RenderingContext, vert: string, frag: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, vert);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const p = gl.createProgram()!;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.bindAttribLocation(p, 0, 'a_pos');
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('[DitherGradient] link error:', gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

// ─── Color helper ─────────────────────────────────────────────────────────────

function parseColor(color: string): [number, number, number] {
  if (!color) return [0, 0, 0];

  if (color.startsWith('#')) {
    const h = color.slice(1);
    if (h.length < 6) return [0, 0, 0];
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    if (isNaN(r) || isNaN(g) || isNaN(b)) return [0, 0, 0];
    return [r, g, b];
  }

  const m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (m) {
    return [
      parseFloat(m[1]) / 255,
      parseFloat(m[2]) / 255,
      parseFloat(m[3]) / 255,
    ];
  }

  return [0, 0, 0];
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  style?: React.CSSProperties;
  className?: string;
  gradA?: string;
  gradB?: string;
  speed?: number;
  distortion?: number;
  seed?: number;
  pattern?: 'bayer2' | 'bayer4' | 'bayer8' | 'clusteredDot' | 'blueNoise' | 'whiteNoise';
  pixelSize?: number;
  threshold?: number;
  spread?: number;
  colorMode?: 'gradient' | 'custom';
  colorA?: string;
  colorB?: string;
  opacity?: number;
}

const PATTERN_INT = {
  bayer2: 0, bayer4: 1, bayer8: 2,
  clusteredDot: 3, blueNoise: 4, whiteNoise: 5,
} as const;

export default function DitherGradient({
  style = {},
  className,
  gradA = '#0a0015',
  gradB = '#6b17e6',
  speed = 1,
  distortion = 0.5,
  seed = 0,
  pattern = 'bayer8',
  pixelSize = 3,
  threshold = 0,
  spread = 0.42,
  colorMode = 'gradient',
  colorA = '#000000',
  colorB = '#ffffff',
  opacity = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const propsRef = useRef({
    gradA, gradB, speed, distortion, seed,
    pattern, pixelSize, threshold, spread,
    colorMode, colorA, colorB, opacity,
  });
  propsRef.current = {
    gradA, gradB, speed, distortion, seed,
    pattern, pixelSize, threshold, spread,
    colorMode, colorA, colorB, opacity,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glNullable = canvas.getContext('webgl2', { alpha: true });
    if (!glNullable) {
      console.warn('[DitherGradient] WebGL2 not available');
      return;
    }
    const gl: WebGL2RenderingContext = glNullable;

    const prog = buildProgram(gl, VERT, FRAG);
    if (!prog) return;

    // ── Full-screen quad ──────────────────────────────────────────────────────
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // ── Uniform locations ─────────────────────────────────────────────────────
    const u = {
      res:        gl.getUniformLocation(prog, 'u_res'),
      time:       gl.getUniformLocation(prog, 'u_time'),
      gradA:      gl.getUniformLocation(prog, 'u_gradA'),
      gradB:      gl.getUniformLocation(prog, 'u_gradB'),
      speed:      gl.getUniformLocation(prog, 'u_speed'),
      distortion: gl.getUniformLocation(prog, 'u_distortion'),
      seed:       gl.getUniformLocation(prog, 'u_seed'),
      pattern:    gl.getUniformLocation(prog, 'u_pattern'),
      pixelSize:  gl.getUniformLocation(prog, 'u_pixelSize'),
      threshold:  gl.getUniformLocation(prog, 'u_threshold'),
      spread:     gl.getUniformLocation(prog, 'u_spread'),
      colorMode:  gl.getUniformLocation(prog, 'u_colorMode'),
      colorA:     gl.getUniformLocation(prog, 'u_colorA'),
      colorB:     gl.getUniformLocation(prog, 'u_colorB'),
      opacity:    gl.getUniformLocation(prog, 'u_opacity'),
    };

    // ── ResizeObserver ────────────────────────────────────────────────────────
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = Math.round(canvas.offsetWidth  * dpr) || 1;
      const h = Math.round(canvas.offsetHeight * dpr) || 1;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width  = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Render loop ───────────────────────────────────────────────────────────
    let rafId: number;
    const startTime = performance.now();

    const render = () => {
      const {
        gradA: gA, gradB: gB,
        speed: spd, distortion: dist, seed: sd,
        pattern: pat, pixelSize: ps, threshold: thr, spread: spr,
        colorMode: cm, colorA: cA, colorB: cB, opacity: op,
      } = propsRef.current;

      const elapsed = (performance.now() - startTime) / 1000;
      const cw = canvas.width;
      const ch = canvas.height;

      gl.viewport(0, 0, cw, ch);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);

      gl.uniform2f(u.res,  cw, ch);
      gl.uniform1f(u.time, elapsed);

      const [rA, gA_, bA] = parseColor(gA);
      const [rB, gB_, bB] = parseColor(gB);
      gl.uniform3f(u.gradA, rA, gA_, bA);
      gl.uniform3f(u.gradB, rB, gB_, bB);

      gl.uniform1f(u.speed,      spd);
      gl.uniform1f(u.distortion, dist);
      gl.uniform1f(u.seed,       sd);
      gl.uniform1i(u.pattern,    PATTERN_INT[pat] ?? 2);
      gl.uniform1f(u.pixelSize,  Math.max(1, ps));
      gl.uniform1f(u.threshold,  thr);
      gl.uniform1f(u.spread,     spr);
      gl.uniform1i(u.colorMode,  cm === 'gradient' ? 0 : 1);

      const [r0, g0, b0] = parseColor(cA);
      const [r1, g1, b1] = parseColor(cB);
      gl.uniform3f(u.colorA, r0, g0, b0);
      gl.uniform3f(u.colorB, r1, g1, b1);
      gl.uniform1f(u.opacity, op);

      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(vbo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={className}
      style={{ overflow: 'hidden', ...style }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

// ─── Framer property controls ─────────────────────────────────────────────────

addPropertyControls(DitherGradient, {
  gradA: {
    type: ControlType.Color,
    title: 'Color A',
    defaultValue: '#0a0015',
  },
  gradB: {
    type: ControlType.Color,
    title: 'Color B',
    defaultValue: '#6b17e6',
  },
  speed: {
    type: ControlType.Number,
    title: 'Speed',
    defaultValue: 1,
    min: 0,
    max: 10,
    step: 0.1,
    displayStepper: true,
  },
  distortion: {
    type: ControlType.Number,
    title: 'Distortion',
    defaultValue: 0.5,
    min: 0,
    max: 2,
    step: 0.01,
    displayStepper: true,
  },
  seed: {
    type: ControlType.Number,
    title: 'Seed',
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
    displayStepper: true,
  },
  pattern: {
    type: ControlType.Enum,
    title: 'Dither Pattern',
    defaultValue: 'bayer8',
    options: ['bayer2', 'bayer4', 'bayer8', 'clusteredDot', 'blueNoise', 'whiteNoise'],
    optionTitles: ['Bayer 2×2', 'Bayer 4×4', 'Bayer 8×8', 'Clustered Dot', 'Blue Noise', 'White Noise'],
  },
  pixelSize: {
    type: ControlType.Number,
    title: 'Pixel Size',
    defaultValue: 3,
    min: 1,
    max: 32,
    step: 1,
    displayStepper: true,
  },
  threshold: {
    type: ControlType.Number,
    title: 'Threshold',
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.01,
    displayStepper: true,
  },
  spread: {
    type: ControlType.Number,
    title: 'Spread',
    defaultValue: 0.42,
    min: 0,
    max: 2,
    step: 0.01,
    displayStepper: true,
  },
  colorMode: {
    type: ControlType.Enum,
    title: 'Color Mode',
    defaultValue: 'gradient',
    options: ['gradient', 'custom'],
    optionTitles: ['Gradient', 'Custom'],
  },
  colorA: {
    type: ControlType.Color,
    title: 'Color A (out)',
    defaultValue: '#000000',
    hidden: (props: Props) => props.colorMode !== 'custom',
  },
  colorB: {
    type: ControlType.Color,
    title: 'Color B (out)',
    defaultValue: '#ffffff',
    hidden: (props: Props) => props.colorMode !== 'custom',
  },
  opacity: {
    type: ControlType.Number,
    title: 'Opacity',
    defaultValue: 1,
    min: 0,
    max: 1,
    step: 0.01,
    displayStepper: true,
  },
});
