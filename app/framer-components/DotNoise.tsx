/**
 * DotNoise — standalone Framer component
 *
 * A regular grid of uniform circular dots whose presence is driven by a
 * smooth noise field. Each cell either has a dot or doesn't — no dither
 * matrix involved. The noise animates slowly, making dots appear and
 * disappear in organic, cloud-like clusters.
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
uniform float u_cellSize;    // grid spacing in canvas pixels
uniform float u_dotSize;     // dot radius as fraction of cell half-size (0–1)
uniform float u_noiseScale;  // spatial frequency of the noise field
uniform float u_threshold;   // shifts which noise values produce dots (-1 to 1)
uniform float u_contrast;    // sharpens cluster edges (1=smooth, high=hard boundary)
uniform int   u_shape;       // 0=circle 1=square 2=triangle
uniform vec3  u_bgColor;
uniform vec3  u_dotColor;
uniform float u_opacity;

out vec4 outColor;

// ── Smooth value noise ────────────────────────────────────────────────────────
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

void main() {
    // ── Which cell does this pixel belong to? ─────────────────────────────────
    vec2 cellCoord  = floor(gl_FragCoord.xy / u_cellSize);
    vec2 cellCenter = (cellCoord + 0.5) * u_cellSize;

    // ── Sample noise at cell center (Y flipped so top=0) ─────────────────────
    vec2 uv = vec2(
        cellCenter.x / u_res.x,
        1.0 - cellCenter.y / u_res.y
    );
    float t        = u_time * u_speed * 0.08 + u_seed * 0.3;
    float noiseVal = noise(uv * u_noiseScale + vec2(t * 0.13, t * 0.09));

    // ── Does this cell get a dot? ─────────────────────────────────────────────
    float n = clamp((noiseVal - 0.5) * u_contrast + 0.5, 0.0, 1.0);
    float cellActive = step(0.5 - u_threshold, n);

    // ── Shape SDF (negative = inside, positive = outside) ────────────────────
    vec2  p      = fract(gl_FragCoord.xy / u_cellSize) - 0.5;
    float radius = u_dotSize * 0.5;
    float aa     = 1.5 / u_cellSize;
    float d;

    if (u_shape == 1) {
        // Square — box SDF
        vec2 q = abs(p) - radius;
        d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    } else if (u_shape == 2) {
        // Equilateral triangle pointing up — IQ SDF scaled by radius
        const float k = 1.7320508;
        vec2 tp = p / radius;
        tp.x = abs(tp.x) - 1.0;
        tp.y = tp.y + 1.0 / k;
        if (tp.x + k * tp.y > 0.0) tp = vec2(tp.x - k*tp.y, -k*tp.x - tp.y) / 2.0;
        tp.x -= clamp(tp.x, -2.0, 0.0);
        d = -length(tp) * sign(tp.y) * radius;
    } else {
        // Circle (default)
        d = length(p) - radius;
    }

    float shape   = 1.0 - smoothstep(-aa, aa, d);
    float drawDot = shape * cellActive;

    outColor = vec4(mix(u_bgColor, u_dotColor, drawDot), u_opacity);
}
`;

// ─── WebGL helpers ────────────────────────────────────────────────────────────

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[DotNoise] shader error:', gl.getShaderInfoLog(s));
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
    console.error('[DotNoise] link error:', gl.getProgramInfoLog(p));
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
  dotColor?: string;
  shape?: 'circle' | 'square' | 'triangle';
  cellSize?: number;
  dotSize?: number;
  noiseScale?: number;
  contrast?: number;
  speed?: number;
  seed?: number;
  threshold?: number;
  opacity?: number;
}

const SHAPE_INDEX: Record<string, number> = { circle: 0, square: 1, triangle: 2 };

export default function DotNoise({
  style = {},
  className,
  bgColor = '#F0EDE8',
  dotColor = '#C4B8B0',
  shape = 'circle',
  cellSize = 18,
  dotSize = 0.38,
  noiseScale = 3,
  contrast = 1,
  speed = 0.3,
  seed = 0,
  threshold = 0,
  opacity = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dprRef    = useRef(1);

  const propsRef = useRef({
    bgColor, dotColor, shape, cellSize, dotSize, noiseScale, contrast, speed, seed, threshold, opacity,
  });
  propsRef.current = {
    bgColor, dotColor, shape, cellSize, dotSize, noiseScale, contrast, speed, seed, threshold, opacity,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glNullable = canvas.getContext('webgl2', { alpha: true });
    if (!glNullable) {
      console.warn('[DotNoise] WebGL2 not available');
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
      shape:      gl.getUniformLocation(prog, 'u_shape'),
      cellSize:   gl.getUniformLocation(prog, 'u_cellSize'),
      dotSize:    gl.getUniformLocation(prog, 'u_dotSize'),
      noiseScale: gl.getUniformLocation(prog, 'u_noiseScale'),
      contrast:   gl.getUniformLocation(prog, 'u_contrast'),
      threshold:  gl.getUniformLocation(prog, 'u_threshold'),
      bgColor:    gl.getUniformLocation(prog, 'u_bgColor'),
      dotColor:   gl.getUniformLocation(prog, 'u_dotColor'),
      opacity:    gl.getUniformLocation(prog, 'u_opacity'),
    };

    // ── ResizeObserver ────────────────────────────────────────────────────────
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      dprRef.current = dpr;
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
        bgColor: bg, dotColor: dc, shape: sh,
        cellSize: cs, dotSize: ds, noiseScale: ns, contrast: ct,
        speed: spd, seed: sd, threshold: thr, opacity: op,
      } = propsRef.current;

      const elapsed = (performance.now() - startTime) / 1000;
      const cw  = canvas.width;
      const ch  = canvas.height;
      const dpr = dprRef.current;

      gl.viewport(0, 0, cw, ch);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);

      gl.uniform2f(u.res,        cw, ch);
      gl.uniform1f(u.time,       elapsed);
      gl.uniform1f(u.speed,      spd);
      gl.uniform1f(u.seed,       sd);
      gl.uniform1i(u.shape,      SHAPE_INDEX[sh] ?? 0);
      // cellSize is specified in CSS pixels — scale to canvas pixels
      gl.uniform1f(u.cellSize,   Math.max(1, cs) * dpr);
      gl.uniform1f(u.dotSize,    ds);
      gl.uniform1f(u.noiseScale, ns);
      gl.uniform1f(u.contrast,   ct);
      gl.uniform1f(u.threshold,  thr);

      const [rBg, gBg, bBg] = parseColor(bg);
      const [rDc, gDc, bDc] = parseColor(dc);
      gl.uniform3f(u.bgColor,  rBg, gBg, bBg);
      gl.uniform3f(u.dotColor, rDc, gDc, bDc);
      gl.uniform1f(u.opacity,  op);

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
      style={{ overflow: 'hidden', background: bgColor, ...style }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

// ─── Framer property controls ─────────────────────────────────────────────────

addPropertyControls(DotNoise, {
  bgColor: {
    type: ControlType.Color,
    title: 'Background',
    defaultValue: '#F0EDE8',
  },
  dotColor: {
    type: ControlType.Color,
    title: 'Dot Color',
    defaultValue: '#C4B8B0',
  },
  shape: {
    type: ControlType.Enum,
    title: 'Shape',
    defaultValue: 'circle',
    options: ['circle', 'square', 'triangle'],
    optionTitles: ['Circle', 'Square', 'Triangle'],
  },
  cellSize: {
    type: ControlType.Number,
    title: 'Grid Spacing',
    defaultValue: 18,
    min: 4,
    max: 60,
    step: 1,
    displayStepper: true,
  },
  dotSize: {
    type: ControlType.Number,
    title: 'Dot Size',
    defaultValue: 0.38,
    min: 0.05,
    max: 0.95,
    step: 0.01,
    displayStepper: true,
  },
  noiseScale: {
    type: ControlType.Number,
    title: 'Patch Scale',
    defaultValue: 3,
    min: 0.5,
    max: 10,
    step: 0.1,
    displayStepper: true,
  },
  contrast: {
    type: ControlType.Number,
    title: 'Cluster Edge',
    defaultValue: 1,
    min: 0.1,
    max: 8,
    step: 0.1,
    displayStepper: true,
  },
  threshold: {
    type: ControlType.Number,
    title: 'Density',
    defaultValue: 0,
    min: -0.5,
    max: 0.5,
    step: 0.01,
    displayStepper: true,
  },
  speed: {
    type: ControlType.Number,
    title: 'Speed',
    defaultValue: 0.3,
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
