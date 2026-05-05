/**
 * DitherNoise — standalone Framer component
 *
 * A FBM noise field drives WHERE dither dots appear; a separate color gradient
 * (any angle) drives WHAT COLOR each dot is. The two are independent, so you
 * get organic dot clusters that smoothly shift color across the canvas.
 *
 * Zero npm dependencies — paste directly into Framer's code-component editor.
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
uniform float u_speed;
uniform float u_seed;
uniform float u_noiseScale;  // controls patch size
uniform float u_detail;      // 0=single smooth octave, 1=full 3-octave FBM
uniform float u_gradAngle;   // color gradient angle in degrees (0 = top→bottom)
uniform int   u_pattern;     // 0=bayer2 1=bayer4 2=bayer8 3=clusteredDot 4=blueNoise 5=whiteNoise
uniform float u_pixelSize;
uniform float u_threshold;
uniform float u_spread;
uniform vec3  u_bgColor;
uniform vec3  u_colorA;
uniform vec3  u_colorB;
uniform float u_opacity;

out vec4 outColor;

// ── Value noise ───────────────────────────────────────────────────────────────
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

// 3-octave FBM — organic patches without being expensive
float fbm(vec2 p) {
    float v  = noise(p)                          * 0.50;
    v       += noise(p * 2.1 + vec2(3.7,  1.3)) * 0.30;
    v       += noise(p * 4.3 + vec2(7.1,  4.9)) * 0.20;
    return v;
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
    // ── Snap to dither grid ───────────────────────────────────────────────────
    vec2 pixelCoord   = floor(gl_FragCoord.xy / u_pixelSize);
    vec2 pixelatedPos = (pixelCoord + 0.5) * u_pixelSize;

    // ── UV (Y flipped: top = 0) ───────────────────────────────────────────────
    vec2 uv = vec2(
        pixelatedPos.x / u_res.x,
        1.0 - pixelatedPos.y / u_res.y
    );

    // ── Noise field → luminance (WHERE dots appear) ───────────────────────────
    float t      = u_time * u_speed * 0.1 + u_seed * 0.3;
    vec2  p      = uv * u_noiseScale + vec2(t * 0.13, t * 0.09);
    float lumBase = noise(p);          // single octave — rounded blobs
    float lumFull = fbm(p);           // 3 octaves  — organic clouds
    float lum     = mix(lumBase, lumFull, clamp(u_detail, 0.0, 1.0));

    // ── Color gradient → dot color (WHAT COLOR each dot is) ──────────────────
    // angle 0° = colorA at top, colorB at bottom
    // angle 90° = colorA at left, colorB at right
    float rad    = u_gradAngle * 3.14159265 / 180.0;
    vec2  dir    = vec2(sin(rad), cos(rad));
    float colorT = clamp(dot(uv - 0.5, dir) * 1.5 + 0.5, 0.0, 1.0);
    vec3  dotColor = mix(u_colorA, u_colorB, colorT);

    // ── Dither value ──────────────────────────────────────────────────────────
    float ditherVal;
    if      (u_pattern == 0) ditherVal = bayer2(pixelCoord);
    else if (u_pattern == 1) ditherVal = bayer4(pixelCoord);
    else if (u_pattern == 2) ditherVal = bayer8(pixelCoord);
    else if (u_pattern == 3) ditherVal = clusteredDot(pixelCoord);
    else if (u_pattern == 4) ditherVal = blueNoise(pixelCoord);
    else                     ditherVal = whiteNoise(pixelCoord);

    // ── Threshold + spread ────────────────────────────────────────────────────
    float ditherResult = step(
        0.5 + (ditherVal - 0.5) * u_spread,
        lum + u_threshold - 0.5
    );

    // ── Output: dot color or background ──────────────────────────────────────
    outColor = vec4(mix(u_bgColor, dotColor, ditherResult), u_opacity);
}
`;

// ─── WebGL helpers ────────────────────────────────────────────────────────────

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[DitherNoise] shader error:', gl.getShaderInfoLog(s));
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
    console.error('[DitherNoise] link error:', gl.getProgramInfoLog(p));
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
  bgColor?: string;
  colorA?: string;
  colorB?: string;
  gradAngle?: number;
  noiseScale?: number;
  detail?: number;
  speed?: number;
  seed?: number;
  pattern?: 'bayer2' | 'bayer4' | 'bayer8' | 'clusteredDot' | 'blueNoise' | 'whiteNoise';
  pixelSize?: number;
  threshold?: number;
  spread?: number;
  opacity?: number;
}

const PATTERN_INT = {
  bayer2: 0, bayer4: 1, bayer8: 2,
  clusteredDot: 3, blueNoise: 4, whiteNoise: 5,
} as const;

export default function DitherNoise({
  style = {},
  className,
  bgColor = '#e8e8ec',
  colorA = '#1133ee',
  colorB = '#cc2222',
  gradAngle = 0,
  noiseScale = 2.5,
  detail = 0,
  speed = 0.4,
  seed = 0,
  pattern = 'clusteredDot',
  pixelSize = 10,
  threshold = 0.05,
  spread = 1,
  opacity = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const propsRef = useRef({
    bgColor, colorA, colorB, gradAngle, noiseScale, detail, speed, seed,
    pattern, pixelSize, threshold, spread, opacity,
  });
  propsRef.current = {
    bgColor, colorA, colorB, gradAngle, noiseScale, detail, speed, seed,
    pattern, pixelSize, threshold, spread, opacity,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glNullable = canvas.getContext('webgl2', { alpha: true });
    if (!glNullable) {
      console.warn('[DitherNoise] WebGL2 not available');
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
      speed:      gl.getUniformLocation(prog, 'u_speed'),
      seed:       gl.getUniformLocation(prog, 'u_seed'),
      noiseScale: gl.getUniformLocation(prog, 'u_noiseScale'),
      detail:     gl.getUniformLocation(prog, 'u_detail'),
      gradAngle:  gl.getUniformLocation(prog, 'u_gradAngle'),
      pattern:    gl.getUniformLocation(prog, 'u_pattern'),
      pixelSize:  gl.getUniformLocation(prog, 'u_pixelSize'),
      threshold:  gl.getUniformLocation(prog, 'u_threshold'),
      spread:     gl.getUniformLocation(prog, 'u_spread'),
      bgColor:    gl.getUniformLocation(prog, 'u_bgColor'),
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
        bgColor: bg, colorA: cA, colorB: cB,
        gradAngle: ga, noiseScale: ns, detail: dt, speed: spd, seed: sd,
        pattern: pat, pixelSize: ps, threshold: thr, spread: spr, opacity: op,
      } = propsRef.current;

      const elapsed = (performance.now() - startTime) / 1000;
      const cw = canvas.width;
      const ch = canvas.height;

      gl.viewport(0, 0, cw, ch);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);

      gl.uniform2f(u.res,        cw, ch);
      gl.uniform1f(u.time,       elapsed);
      gl.uniform1f(u.speed,      spd);
      gl.uniform1f(u.seed,       sd);
      gl.uniform1f(u.noiseScale, ns);
      gl.uniform1f(u.detail,     dt);
      gl.uniform1f(u.gradAngle,  ga);
      gl.uniform1i(u.pattern,    PATTERN_INT[pat] ?? 3);
      gl.uniform1f(u.pixelSize,  Math.max(1, ps));
      gl.uniform1f(u.threshold,  thr);
      gl.uniform1f(u.spread,     spr);

      const [rBg, gBg, bBg] = parseColor(bg);
      const [rA,  gA,  bA]  = parseColor(cA);
      const [rB,  gB,  bB]  = parseColor(cB);
      gl.uniform3f(u.bgColor, rBg, gBg, bBg);
      gl.uniform3f(u.colorA,  rA,  gA,  bA);
      gl.uniform3f(u.colorB,  rB,  gB,  bB);
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

addPropertyControls(DitherNoise, {
  bgColor: {
    type: ControlType.Color,
    title: 'Background',
    defaultValue: '#e8e8ec',
  },
  colorA: {
    type: ControlType.Color,
    title: 'Color A',
    defaultValue: '#1133ee',
  },
  colorB: {
    type: ControlType.Color,
    title: 'Color B',
    defaultValue: '#cc2222',
  },
  gradAngle: {
    type: ControlType.Number,
    title: 'Gradient Angle',
    defaultValue: 0,
    min: 0,
    max: 360,
    step: 1,
    displayStepper: true,
  },
  noiseScale: {
    type: ControlType.Number,
    title: 'Patch Scale',
    defaultValue: 2.5,
    min: 0.5,
    max: 8,
    step: 0.1,
    displayStepper: true,
  },
  detail: {
    type: ControlType.Number,
    title: 'Detail',
    defaultValue: 0,
    min: 0,
    max: 1,
    step: 0.01,
    displayStepper: true,
  },
  speed: {
    type: ControlType.Number,
    title: 'Speed',
    defaultValue: 0.4,
    min: 0,
    max: 5,
    step: 0.05,
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
    defaultValue: 'clusteredDot',
    options: ['bayer2', 'bayer4', 'bayer8', 'clusteredDot', 'blueNoise', 'whiteNoise'],
    optionTitles: ['Bayer 2×2', 'Bayer 4×4', 'Bayer 8×8', 'Clustered Dot', 'Blue Noise', 'White Noise'],
  },
  pixelSize: {
    type: ControlType.Number,
    title: 'Pixel Size',
    defaultValue: 10,
    min: 1,
    max: 32,
    step: 1,
    displayStepper: true,
  },
  threshold: {
    type: ControlType.Number,
    title: 'Threshold',
    defaultValue: 0.05,
    min: -1,
    max: 1,
    step: 0.01,
    displayStepper: true,
  },
  spread: {
    type: ControlType.Number,
    title: 'Spread',
    defaultValue: 1,
    min: 0,
    max: 2,
    step: 0.01,
    displayStepper: true,
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
