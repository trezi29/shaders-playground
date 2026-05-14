/**
 * DitherImage — standalone Framer component
 *
 * Replicates the ImageTexture + Dither layer stack from the shader playground
 * using plain WebGL2. Zero npm dependencies — paste directly into Framer's
 * code-component editor.
 *
 * Framer resolves "react" and "framer" internally; no install needed.
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

uniform vec2      u_res;
uniform sampler2D u_image;
uniform float     u_imageAspect;
uniform int       u_objectFit;   // 0=cover 1=contain 2=fill
uniform float     u_imgScale;
uniform float     u_imgOffsetX;
uniform float     u_imgOffsetY;
uniform int       u_pattern;     // 0=bayer2 1=bayer4 2=bayer8 3=clusteredDot 4=blueNoise 5=whiteNoise
uniform float     u_pixelSize;
uniform float     u_threshold;
uniform float     u_spread;
uniform int       u_colorMode;   // 0=custom 1=source
uniform vec3      u_colorA;
uniform float     u_alphaA;
uniform vec3      u_colorB;
uniform float     u_alphaB;
uniform float     u_opacity;

out vec4 outColor;

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
    // ── Step 1: snap to dither-cell grid in screen pixel space ────────────────
    vec2 pixelCoord       = floor(gl_FragCoord.xy / u_pixelSize);
    vec2 pixelatedPos     = (pixelCoord + 0.5) * u_pixelSize;

    // ── Step 2: screen UV — Y flipped so top=0 matches HTMLImageElement layout ─
    vec2 screenUV = vec2(
        pixelatedPos.x / u_res.x,
        1.0 - pixelatedPos.y / u_res.y
    );

    // ── Step 3: objectFit UV scaling ──────────────────────────────────────────
    float viewAspect = u_res.x / u_res.y;
    vec2  uvScale;

    if (u_objectFit == 1) {           // contain
        float s = min(viewAspect / u_imageAspect, 1.0);
        uvScale = vec2(u_imageAspect / viewAspect * s, s);
    } else if (u_objectFit == 2) {    // fill
        uvScale = vec2(1.0, 1.0);
    } else {                          // cover (0)
        float s = max(viewAspect / u_imageAspect, 1.0);
        uvScale = vec2(u_imageAspect / viewAspect * s, s);
    }

    // Center the image, then scale to fit/cover
    vec2 fitUV = (screenUV - 0.5) / uvScale + 0.5;

    // ── Step 4: extra transform — zoom + pan ──────────────────────────────────
    float safeScale = max(u_imgScale, 0.001);
    vec2 imageUV = (fitUV - 0.5) / safeScale + 0.5
                   - vec2(u_imgOffsetX, u_imgOffsetY);

    // ── Step 5: sample image (transparent outside bounds) ─────────────────────
    bool oob = imageUV.x < 0.0 || imageUV.x > 1.0
            || imageUV.y < 0.0 || imageUV.y > 1.0;
    vec4 srcColor = oob ? vec4(0.0) : texture(u_image, imageUV);

    // ── Step 6: luminance (Rec. 601, weighted by alpha) ───────────────────────
    float lum = dot(srcColor.rgb, vec3(0.299, 0.587, 0.114)) * srcColor.a;

    // ── Step 7: dither value from pattern ─────────────────────────────────────
    float ditherVal;
    if      (u_pattern == 0) ditherVal = bayer2(pixelCoord);
    else if (u_pattern == 1) ditherVal = bayer4(pixelCoord);
    else if (u_pattern == 2) ditherVal = bayer8(pixelCoord);
    else if (u_pattern == 3) ditherVal = clusteredDot(pixelCoord);
    else if (u_pattern == 4) ditherVal = blueNoise(pixelCoord);
    else                     ditherVal = whiteNoise(pixelCoord);

    // ── Step 8: threshold + spread (mirrors original shader formula) ──────────
    float ditherResult = step(
        0.5 + (ditherVal - 0.5) * u_spread,
        lum + u_threshold - 0.5
    );

    // ── Step 9: color output ──────────────────────────────────────────────────
    vec3 outRGB;
    if (u_colorMode == 0) {
        outRGB = mix(u_colorA, u_colorB, ditherResult);
    } else {
        outRGB = mix(srcColor.rgb * 0.3, min(srcColor.rgb * 1.3, vec3(1.0)), ditherResult);
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
    console.error('[DitherImage] shader error:', gl.getShaderInfoLog(s));
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
    console.error('[DitherImage] link error:', gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

// ─── Color helper ─────────────────────────────────────────────────────────────
// Framer delivers ControlType.Color as hex in the editor but as rgba(...) on
// published sites, so we need to handle both formats.

function parseColor(color: string): [number, number, number, number] {
  if (!color) return [0, 0, 0, 1];

  if (color.startsWith('#')) {
    const h = color.slice(1);
    if (h.length < 6) return [0, 0, 0, 1];
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1.0;
    if (isNaN(r) || isNaN(g) || isNaN(b)) return [0, 0, 0, 1];
    return [r, g, b, a];
  }

  // rgb(...) / rgba(...)
  const m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (m) {
    return [
      parseFloat(m[1]) / 255,
      parseFloat(m[2]) / 255,
      parseFloat(m[3]) / 255,
      m[4] !== undefined ? parseFloat(m[4]) : 1.0,
    ];
  }

  return [0, 0, 0, 1];
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  style?: React.CSSProperties;
  className?: string;
  url?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  imgScale?: number;
  imgOffsetX?: number;
  imgOffsetY?: number;
  pattern?: 'bayer2' | 'bayer4' | 'bayer8' | 'clusteredDot' | 'blueNoise' | 'whiteNoise';
  pixelSize?: number;
  threshold?: number;
  spread?: number;
  colorMode?: 'custom' | 'source';
  colorA?: string;
  colorB?: string;
  opacity?: number;
  bgColor?: string;
}

const OBJECT_FIT_INT = { cover: 0, contain: 1, fill: 2 } as const;
const PATTERN_INT = {
  bayer2: 0, bayer4: 1, bayer8: 2,
  clusteredDot: 3, blueNoise: 4, whiteNoise: 5,
} as const;

export default function DitherImage({
  style = {},
  className,
  url = '/busto-completo.png',
  objectFit = 'contain',
  imgScale = 1.87,
  imgOffsetX = 0.07,
  imgOffsetY = -0.1,
  pattern = 'bayer8',
  pixelSize = 3,
  threshold = 0.24,
  spread = 0.42,
  colorMode = 'custom',
  colorA = '#c4213f',
  colorB = '#FBF9F6',
  opacity = 1,
  bgColor = '#FBF9F6',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const propsRef = useRef({
    url, objectFit, imgScale, imgOffsetX, imgOffsetY,
    pattern, pixelSize, threshold, spread,
    colorMode, colorA, colorB, opacity, bgColor,
  });
  propsRef.current = {
    url, objectFit, imgScale, imgOffsetX, imgOffsetY,
    pattern, pixelSize, threshold, spread,
    colorMode, colorA, colorB, opacity, bgColor,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glNullable = canvas.getContext('webgl2', { alpha: true });
    if (!glNullable) {
      console.warn('[DitherImage] WebGL2 not available');
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
      res:         gl.getUniformLocation(prog, 'u_res'),
      image:       gl.getUniformLocation(prog, 'u_image'),
      imageAspect: gl.getUniformLocation(prog, 'u_imageAspect'),
      objectFit:   gl.getUniformLocation(prog, 'u_objectFit'),
      imgScale:    gl.getUniformLocation(prog, 'u_imgScale'),
      imgOffsetX:  gl.getUniformLocation(prog, 'u_imgOffsetX'),
      imgOffsetY:  gl.getUniformLocation(prog, 'u_imgOffsetY'),
      pattern:     gl.getUniformLocation(prog, 'u_pattern'),
      pixelSize:   gl.getUniformLocation(prog, 'u_pixelSize'),
      threshold:   gl.getUniformLocation(prog, 'u_threshold'),
      spread:      gl.getUniformLocation(prog, 'u_spread'),
      colorMode:   gl.getUniformLocation(prog, 'u_colorMode'),
      colorA:      gl.getUniformLocation(prog, 'u_colorA'),
      alphaA:      gl.getUniformLocation(prog, 'u_alphaA'),
      colorB:      gl.getUniformLocation(prog, 'u_colorB'),
      alphaB:      gl.getUniformLocation(prog, 'u_alphaB'),
      opacity:     gl.getUniformLocation(prog, 'u_opacity'),
    };

    // ── Image texture ─────────────────────────────────────────────────────────
    const imgTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, imgTex);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let imageAspect = 1;
    let loadedUrl = '';

    function loadImage(nextUrl: string) {
      if (!nextUrl || nextUrl === loadedUrl) return;
      loadedUrl = nextUrl;
      // fetch + createImageBitmap avoids the WebGL cross-origin restriction that
      // causes a black texture when images are served from a CDN on a published site.
      fetch(nextUrl)
        .then(r => r.blob())
        .then(blob => createImageBitmap(blob))
        .then(bitmap => {
          imageAspect = bitmap.width / bitmap.height;
          gl.bindTexture(gl.TEXTURE_2D, imgTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
          gl.generateMipmap(gl.TEXTURE_2D);
          bitmap.close();
          canvas!.style.opacity = '1';
        })
        .catch(() => {
          loadedUrl = ''; // allow retry on next frame
        });
    }

    loadImage(url);

    // ── ResizeObserver ────────────────────────────────────────────────────────
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = Math.round(canvas.offsetWidth * dpr) || 1;
      const h = Math.round(canvas.offsetHeight * dpr) || 1;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Render loop ───────────────────────────────────────────────────────────
    let rafId: number;

    const render = () => {
      const {
        url: nextUrl,
        objectFit: of_,
        imgScale: is_,
        imgOffsetX: ox,
        imgOffsetY: oy,
        pattern: pat,
        pixelSize: ps,
        threshold: thr,
        spread: spr,
        colorMode: cm,
        colorA: cA,
        colorB: cB,
        opacity: op,
      } = propsRef.current;

      if (nextUrl !== loadedUrl) loadImage(nextUrl);

      const cw = canvas.width;
      const ch = canvas.height;

      gl.viewport(0, 0, cw, ch);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imgTex);
      gl.uniform1i(u.image, 0);

      gl.uniform2f(u.res, cw, ch);
      gl.uniform1f(u.imageAspect, imageAspect);
      gl.uniform1i(u.objectFit, OBJECT_FIT_INT[of_] ?? 0);
      gl.uniform1f(u.imgScale, is_);
      gl.uniform1f(u.imgOffsetX, ox);
      gl.uniform1f(u.imgOffsetY, oy);
      gl.uniform1i(u.pattern, PATTERN_INT[pat] ?? 2);
      gl.uniform1f(u.pixelSize, Math.max(1, ps));
      gl.uniform1f(u.threshold, thr);
      gl.uniform1f(u.spread, spr);
      gl.uniform1i(u.colorMode, cm === 'custom' ? 0 : 1);

      const [rA, gA, bA, aA] = parseColor(cA);
      const [rB, gB, bB, aB] = parseColor(cB);
      gl.uniform3f(u.colorA, rA, gA, bA);
      gl.uniform1f(u.alphaA, aA);
      gl.uniform3f(u.colorB, rB, gB, bB);
      gl.uniform1f(u.alphaB, aB);
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
      gl.deleteTexture(imgTex);
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
        style={{ width: '100%', height: '100%', display: 'block', opacity: 0, transition: 'opacity 0.3s ease' }}
      />
    </div>
  );
}

// ─── Framer property controls ─────────────────────────────────────────────────

addPropertyControls(DitherImage, {
  url: {
    type: ControlType.Image,
    title: 'Image',
  },
  objectFit: {
    type: ControlType.Enum,
    title: 'Object Fit',
    defaultValue: 'contain',
    options: ['cover', 'contain', 'fill'],
    optionTitles: ['Cover', 'Contain', 'Fill'],
  },
  imgScale: {
    type: ControlType.Number,
    title: 'Image Scale',
    defaultValue: 1.87,
    min: 0.1,
    max: 5,
    step: 0.01,
    displayStepper: true,
  },
  imgOffsetX: {
    type: ControlType.Number,
    title: 'Offset X',
    defaultValue: 0.07,
    min: -1,
    max: 1,
    step: 0.01,
    displayStepper: true,
  },
  imgOffsetY: {
    type: ControlType.Number,
    title: 'Offset Y',
    defaultValue: -0.1,
    min: -1,
    max: 1,
    step: 0.01,
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
    defaultValue: 0.24,
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
    defaultValue: 'custom',
    options: ['custom', 'source'],
    optionTitles: ['Custom', 'Source'],
  },
  colorA: {
    type: ControlType.Color,
    title: 'Color A',
    defaultValue: '#c4213f',
  },
  colorB: {
    type: ControlType.Color,
    title: 'Color B',
    defaultValue: '#FBF9F6',
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
  bgColor: {
    type: ControlType.Color,
    title: 'Background',
    defaultValue: '#FBF9F6',
  },
});
