/**
 * ShaderAsciiImage — standalone Framer component
 *
 * Recreates the Shader + ImageTexture + Grayscale + Ascii stack from `shaders/react`
 * using plain WebGL2 + Canvas 2D. Zero npm dependencies — paste directly into
 * Framer's code-component editor.
 *
 * Framer resolves "react" and "framer" internally; no install needed.
 */

import { useEffect, useRef } from 'react';
// import { addPropertyControls, ControlType } from 'framer';

// ─── GLSL ─────────────────────────────────────────────────────────────────────

const VERT = `#version 300 es
layout(location = 0) in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Single-pass: image (cover-fit) → grayscale → ASCII art + cursor displacement.
// UV convention: Y=0 at top, matching WebGL texture layout for HTMLImageElement
// uploads (no UNPACK_FLIP_Y_WEBGL), so no extra flip is needed when sampling.
const FRAG = `#version 300 es
precision highp float;

uniform vec2      u_res;
uniform sampler2D u_imageTex;
uniform float     u_imageAspect;   // image width / height
uniform sampler2D u_atlasTex;
uniform float     u_cellSize;      // reference cell size (normalised to 1080p height)
uniform float     u_charCount;     // number of characters in the set
uniform float     u_atlasSize;     // ceil(sqrt(charCount))
uniform float     u_atlasScale;    // uvScale = atlasSize * cellPx / ATLAS_W
uniform float     u_gamma;         // brightness curve
uniform float     u_spacing;       // pre-transformed value: 0.1 + raw * 1.4
uniform sampler2D u_dispTex;       // rg = UV displacement, b = hole intensity

out vec4 outColor;

void main() {
    // Flip Y so uv.y=0 is at the top — matches HTMLImageElement texture layout.
    vec2 uv = vec2(gl_FragCoord.x / u_res.x, 1.0 - gl_FragCoord.y / u_res.y);

    // ── Cover-fit scale ────────────────────────────────────────────────────
    float vAspect    = u_res.x / u_res.y;
    float coverScale = max(vAspect / u_imageAspect, 1.0);
    vec2  uvScale    = vec2(u_imageAspect / vAspect * coverScale, coverScale);

    // ── ASCII cell grid (scaled relative to 1080p reference height) ────────
    float cellPx   = u_cellSize * (u_res.y / 1080.0);
    vec2  gridSize = u_res / cellPx;
    vec2  gCoords  = uv * gridSize;
    vec2  cell     = floor(gCoords);
    vec2  rawUV    = fract(gCoords);   // [0,1] within the cell

    // Character inner bounds — controls how large the glyph is within the cell.
    vec2 centered = rawUV - 0.5;
    vec2 charUV   = centered / u_spacing + 0.5;
    bool outside  = any(greaterThan(abs(centered), vec2(u_spacing * 0.5)));

    // ── Cursor displacement ────────────────────────────────────────────────
    // Sample per-cell displacement stored in the CPU-simulated field.
    vec2  cCenter  = (cell + 0.5) / gridSize;
    vec4  dispSamp = texture(u_dispTex, cCenter);
    vec2  disp     = dispSamp.rg;   // UV-space offset for image sampling
    float hole     = dispSamp.b;    // fade-out intensity (0 = fully visible)

    // Warp the image-sampling UV outward from the cursor.
    vec2 warpedCenter = cCenter + disp;

    // ── Sample image at (warped) cell centre (cover-fit) ───────────────────
    vec2 imgUV = (warpedCenter - 0.5) / uvScale + 0.5;
    bool oob   = imgUV.x < 0.0 || imgUV.x > 1.0
              || imgUV.y < 0.0 || imgUV.y > 1.0;
    vec3 srcRGB = oob ? vec3(0.0) : texture(u_imageTex, imgUV).rgb;

    // ── Grayscale (Rec. 709) + gamma ────────────────────────────────────────
    float gray       = dot(srcRGB, vec3(0.2126, 0.7152, 0.0722));
    float brightness = pow(gray, u_gamma);

    // ── Char index: white background convention ────────────────────────────
    // Bright pixels → sparse chars (high index, e.g. '.') → stays light on white.
    // Dark pixels  → dense chars  (low  index, e.g. '@') → looks dark on white.
    float idx = clamp(
        floor(brightness * u_charCount),
        0.0, u_charCount - 1.0
    );

    // ── Atlas UV lookup ────────────────────────────────────────────────────
    float acol = mod(idx, u_atlasSize);
    float arow = floor(idx / u_atlasSize);
    float acs  = (1.0 / u_atlasSize) * u_atlasScale;   // UV size of one atlas cell
    vec2  aUV  = vec2(acol, arow) * acs + charUV * acs;

    vec4 glyph = texture(u_atlasTex, aUV);
    bool isBg  = dot(glyph.rgb, vec3(0.299, 0.587, 0.114)) < 0.1;

    // hole fades the character out → black background shows through.
    float alpha = (isBg || outside || oob) ? 0.0 : (1.0 - hole);
    // White background: render glyphs as dark ink (invert gray so dark areas = dark chars).
    outColor = vec4(glyph.rgb * (1.0 - gray), alpha);
    
}
`;

// ─── WebGL helpers ─────────────────────────────────────────────────────────────

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[ShaderAsciiImage] shader error:', gl.getShaderInfoLog(s));
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
    console.error('[ShaderAsciiImage] link error:', gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

// ─── Character atlas ───────────────────────────────────────────────────────────
// Mirrors the atlas creation logic inside the Ascii shader definition.

const ATLAS_W = 2048;
const DISP_GRID = 128; // resolution of the CPU displacement field

interface AtlasResult {
  data: Uint8Array;
  atlasSize: number;
  uvScale: number;
}

function buildAtlas(
  characters: string,
  spacingRaw: number,
  fontFamily: string,
): AtlasResult {
  // Apply the same transform as the Ascii shader's spacing prop.
  const spacing = 0.1 + spacingRaw * 1.4;
  const n = characters.length;
  const atlasSize = Math.max(2, Math.ceil(Math.sqrt(n)));
  const spacingMul = Math.max(1, 2 / spacing);
  const cellPx = Math.min(128 * spacingMul, ATLAS_W / atlasSize);
  const fontSize = cellPx * 0.75;

  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_W;
  canvas.height = ATLAS_W;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  ctx.clearRect(0, 0, ATLAS_W, ATLAS_W);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${fontSize}px "${fontFamily}", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < n; i++) {
    const col = i % atlasSize;
    const row = Math.floor(i / atlasSize);
    ctx.fillText(
      characters[i],
      col * cellPx + cellPx / 2,
      row * cellPx + cellPx / 2,
    );
  }

  const data = new Uint8Array(
    ctx.getImageData(0, 0, ATLAS_W, ATLAS_W).data.buffer,
  );
  return { data, atlasSize, uvScale: (atlasSize * cellPx) / ATLAS_W };
}

// ─── Google Fonts loader ────────────────────────────────────────────────────────

const GOOGLE_FONTS: Record<string, string> = {
  'JetBrains Mono': 'JetBrains+Mono',
  'Fira Code': 'Fira+Code',
  'Source Code Pro': 'Source+Code+Pro',
  'IBM Plex Mono': 'IBM+Plex+Mono',
  'Space Mono': 'Space+Mono',
  'Roboto Mono': 'Roboto+Mono',
  'Courier Prime': 'Courier+Prime',
  'Geist Mono': 'Geist+Mono',
  VT323: 'VT323',
  'Press Start 2P': 'Press+Start+2P',
  Silkscreen: 'Silkscreen',
  'Major Mono Display': 'Major+Mono+Display',
  'Syne Mono': 'Syne+Mono',
  'Nova Mono': 'Nova+Mono',
  'Xanh Mono': 'Xanh+Mono',
  'Cutive Mono': 'Cutive+Mono',
  'Share Tech Mono': 'Share+Tech+Mono',
  'Martian Mono': 'Martian+Mono',
  'Azeret Mono': 'Azeret+Mono',
};

function loadGoogleFont(fontFamily: string, onLoaded: () => void) {
  const gfName = GOOGLE_FONTS[fontFamily];
  if (!gfName) return;
  if (!document.querySelector(`link[href*="${gfName}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${gfName}:wght@400&display=swap`;
    document.head.appendChild(link);
  }
  document.fonts
    ?.load?.(`400 12px "${fontFamily}"`)
    .then(onLoaded)
    .catch(() => {});
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props {
  style?: React.CSSProperties;
  className?: string;
  /** Explicit width in px — used by Framer's size controls. */
  width?: number;
  /** Explicit height in px — used by Framer's size controls. */
  height?: number;
  url?: string;
  characters?: string;
  cellSize?: number;
  fontFamily?: string;
  spacing?: number;
  gamma?: number;
  /** Radius of the cursor influence area, 0–1 (maps to 0–0.15 UV units). */
  dispRadius?: number;
  /** How far displaced letters travel, 0–1 (maps to 0–0.08 UV units). */
  dispStrength?: number;
  /** How long the displacement trail lingers, in seconds. */
  dispTrail?: number;
}

export default function ShaderAsciiImage({
  style = {},
  className,
  width,
  height,
  url = '/linkedin avatar mt.jpeg',
  characters = '@%#*+=-:.',
  cellSize = 30,
  fontFamily = 'JetBrains Mono',
  spacing = 1,
  gamma = 1,
  dispRadius = 0.8,
  dispStrength = 0.8,
  dispTrail = 1.0,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({
    url,
    characters,
    cellSize,
    fontFamily,
    spacing,
    gamma,
    dispRadius,
    dispStrength,
    dispTrail,
  });
  propsRef.current = {
    url,
    characters,
    cellSize,
    fontFamily,
    spacing,
    gamma,
    dispRadius,
    dispStrength,
    dispTrail,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glNullable = canvas.getContext('webgl2', { alpha: true });
    if (!glNullable) {
      console.warn('[ShaderAsciiImage] WebGL2 not available');
      return;
    }
    const gl: WebGL2RenderingContext = glNullable;

    const prog = buildProgram(gl, VERT, FRAG);
    if (!prog) return;

    // ── Full-screen quad ────────────────────────────────────────────────────
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

    // ── Uniform locations ───────────────────────────────────────────────────
    const u = {
      res: gl.getUniformLocation(prog, 'u_res')!,
      imageTex: gl.getUniformLocation(prog, 'u_imageTex')!,
      imageAspect: gl.getUniformLocation(prog, 'u_imageAspect')!,
      atlasTex: gl.getUniformLocation(prog, 'u_atlasTex')!,
      cellSize: gl.getUniformLocation(prog, 'u_cellSize')!,
      charCount: gl.getUniformLocation(prog, 'u_charCount')!,
      atlasSize: gl.getUniformLocation(prog, 'u_atlasSize')!,
      atlasScale: gl.getUniformLocation(prog, 'u_atlasScale')!,
      gamma: gl.getUniformLocation(prog, 'u_gamma')!,
      spacing: gl.getUniformLocation(prog, 'u_spacing')!,
      dispTex: gl.getUniformLocation(prog, 'u_dispTex')!,
    };

    // ── Image texture ───────────────────────────────────────────────────────
    const imgTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, imgTex);
    // Placeholder 1×1 black pixel until the image loads.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]),
    );
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let imageAspect = 1;
    let loadedUrl = '';

    function loadImage(nextUrl: string) {
      if (!nextUrl || nextUrl === loadedUrl) return;
      loadedUrl = nextUrl;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageAspect = img.naturalWidth / img.naturalHeight;
        gl.bindTexture(gl.TEXTURE_2D, imgTex);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img,
        );
        gl.generateMipmap(gl.TEXTURE_2D);
      };
      img.src = nextUrl;
    }

    loadImage(url);

    // ── Atlas texture ───────────────────────────────────────────────────────
    const atlasTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let lastAtlasKey = '';
    let atlasSize = 3;
    let uvScale = 1;
    let charCount = characters.length;

    function uploadAtlas() {
      const {
        characters: chars,
        spacing: sp,
        fontFamily: ff,
      } = propsRef.current;
      if (!chars || chars.length === 0) return;
      const result = buildAtlas(chars, sp, ff);
      atlasSize = result.atlasSize;
      uvScale = result.uvScale;
      charCount = chars.length;
      gl.bindTexture(gl.TEXTURE_2D, atlasTex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        ATLAS_W,
        ATLAS_W,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        result.data,
      );
      lastAtlasKey = `${chars}|${sp}|${ff}`;
    }

    function syncAtlas() {
      const {
        characters: chars,
        spacing: sp,
        fontFamily: ff,
      } = propsRef.current;
      const key = `${chars}|${sp}|${ff}`;
      if (key === lastAtlasKey) return;
      uploadAtlas();
      // Re-build once the custom font has actually loaded.
      loadGoogleFont(ff, () => {
        lastAtlasKey = ''; // invalidate so next frame triggers a rebuild
      });
    }

    syncAtlas();

    // ── Displacement field ──────────────────────────────────────────────────
    // Each cell stores: r=dx, g=dy (UV-space offset), b=hole intensity.
    gl.getExtension('OES_texture_float_linear');
    const dispData = new Float32Array(DISP_GRID * DISP_GRID * 4);

    const dispTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, dispTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA32F,
      DISP_GRID,
      DISP_GRID,
      0,
      gl.RGBA,
      gl.FLOAT,
      dispData,
    );

    // Mouse state in canvas UV space (−1 when outside).
    let mouseX = -1,
      mouseY = -1;
    let lastTime = performance.now();

    const onMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseX = (e.clientX - r.left) / r.width;
      mouseY = (e.clientY - r.top) / r.height;
    };
    const onMouseLeave = () => {
      mouseX = -1;
      mouseY = -1;
    };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    // ── ResizeObserver ──────────────────────────────────────────────────────
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

    // ── Render loop ─────────────────────────────────────────────────────────
    let rafId: number;

    const render = () => {
      const {
        url: nextUrl,
        cellSize: cs,
        gamma: g,
        spacing: sp,
        dispRadius: dr,
        dispStrength: ds,
        dispTrail: dl,
      } = propsRef.current;

      if (nextUrl !== loadedUrl) loadImage(nextUrl);
      syncAtlas();

      // ── Displacement simulation (CPU) ─────────────────────────────────────
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const radius = dr * 0.15; // UV influence radius
      const maxDisp = ds * 0.08; // max displacement magnitude (UV units)
      const trailLen = Math.max(0.05, dl);
      const decay = 1 - dt / trailLen;

      // Decay every cell toward rest.
      for (let k = 0; k < DISP_GRID * DISP_GRID * 4; k++) {
        dispData[k] *= decay;
      }

      // Add outward push from cursor.
      if (mouseX >= 0 && mouseY >= 0) {
        const aspect = canvas.offsetWidth / Math.max(1, canvas.offsetHeight);
        const ir = radius * 2.5; // outer edge of influence

        const minJ = Math.max(0, Math.floor((mouseX - ir) * DISP_GRID));
        const maxJ = Math.min(
          DISP_GRID - 1,
          Math.ceil((mouseX + ir) * DISP_GRID),
        );
        const minI = Math.max(
          0,
          Math.floor((mouseY - ir / aspect) * DISP_GRID),
        );
        const maxI = Math.min(
          DISP_GRID - 1,
          Math.ceil((mouseY + ir / aspect) * DISP_GRID),
        );

        for (let i = minI; i <= maxI; i++) {
          for (let j = minJ; j <= maxJ; j++) {
            const cx = (j + 0.5) / DISP_GRID;
            const cy = (i + 0.5) / DISP_GRID;
            // Aspect-corrected distance for a circular influence area.
            const ddx = (cx - mouseX) * aspect;
            const ddy = cy - mouseY;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist >= ir) continue;

            const inf = Math.exp((-dist * dist) / (radius * radius));
            // Push direction in raw UV space (keeps displacement proportional to canvas).
            const rawDx = cx - mouseX;
            const rawDy = cy - mouseY;
            const rawLen = Math.sqrt(rawDx * rawDx + rawDy * rawDy) || 1e-6;
            const nx = rawDx / rawLen;
            const ny = rawDy / rawLen;

            const idx = (i * DISP_GRID + j) * 4;
            const impulse = inf * maxDisp * dt * 10;
            dispData[idx] = Math.max(
              -maxDisp,
              Math.min(maxDisp, dispData[idx] + nx * impulse),
            );
            dispData[idx + 1] = Math.max(
              -maxDisp,
              Math.min(maxDisp, dispData[idx + 1] + ny * impulse),
            );
            dispData[idx + 2] = Math.min(
              1.0,
              dispData[idx + 2] + inf * dt * 10,
            );
          }
        }
      }

      // Upload updated displacement field.
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, dispTex);
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        DISP_GRID,
        DISP_GRID,
        gl.RGBA,
        gl.FLOAT,
        dispData,
      );

      const cw = canvas.width;
      const ch = canvas.height;

      gl.viewport(0, 0, cw, ch);
      // gl.clearColor(0, 0, 0, 1);
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);
      gl.uniform2f(u.res, cw, ch);
      gl.uniform1f(u.imageAspect, imageAspect);
      gl.uniform1f(u.cellSize, cs);
      gl.uniform1f(u.charCount, charCount);
      gl.uniform1f(u.atlasSize, atlasSize);
      gl.uniform1f(u.atlasScale, uvScale);
      gl.uniform1f(u.gamma, g);
      gl.uniform1f(u.spacing, 0.1 + sp * 1.4); // apply the Ascii shader's transform

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imgTex);
      gl.uniform1i(u.imageTex, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, atlasTex);
      gl.uniform1i(u.atlasTex, 1);

      gl.uniform1i(u.dispTex, 2); // already bound above

      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      gl.deleteProgram(prog);
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(vbo);
      gl.deleteTexture(imgTex);
      gl.deleteTexture(atlasTex);
      gl.deleteTexture(dispTex);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={className}
      style={{ overflow: 'hidden', background: '#fff', width, height, ...style }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

// ─── Framer property controls ─────────────────────────────────────────────────
// Uncomment when using inside Framer's code-component editor.

// addPropertyControls(ShaderAsciiImage, {
//   width: {
//     type: ControlType.Number,
//     title: 'Width',
//     defaultValue: 768,
//     min: 100,
//     max: 2000,
//     step: 1,
//     displayStepper: true,
//   },
//   height: {
//     type: ControlType.Number,
//     title: 'Height',
//     defaultValue: 256,
//     min: 50,
//     max: 2000,
//     step: 1,
//     displayStepper: true,
//   },
//   url: {
//     type: ControlType.String,
//     title: 'Image URL',
//     defaultValue: '/linkedin avatar mt.jpeg',
//   },
//   characters: {
//     type: ControlType.String,
//     title: 'Characters',
//     defaultValue: '@%#*+=-:.',
//   },
//   cellSize: {
//     type: ControlType.Number,
//     title: 'Cell Size',
//     defaultValue: 30,
//     min: 8,
//     max: 100,
//     step: 1,
//     displayStepper: true,
//   },
//   fontFamily: {
//     type: ControlType.Enum,
//     title: 'Font',
//     defaultValue: 'JetBrains Mono',
//     options: [
//       'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono',
//       'Space Mono', 'Roboto Mono', 'Courier Prime', 'Geist Mono',
//       'VT323', 'Press Start 2P', 'Silkscreen', 'Major Mono Display',
//       'Syne Mono', 'Nova Mono', 'Xanh Mono', 'Cutive Mono',
//       'Share Tech Mono', 'Martian Mono', 'Azeret Mono',
//     ],
//   },
//   spacing: {
//     type: ControlType.Number,
//     title: 'Character Size',
//     defaultValue: 1,
//     min: 0,
//     max: 1,
//     step: 0.05,
//     displayStepper: true,
//   },
//   gamma: {
//     type: ControlType.Number,
//     title: 'Gamma',
//     defaultValue: 1,
//     min: 0.25,
//     max: 3,
//     step: 0.05,
//     displayStepper: true,
//   },
//   dispRadius: {
//     type: ControlType.Number,
//     title: 'Cursor Radius',
//     defaultValue: 0.5,
//     min: 0.05,
//     max: 1,
//     step: 0.05,
//     displayStepper: true,
//   },
//   dispStrength: {
//     type: ControlType.Number,
//     title: 'Displacement',
//     defaultValue: 0.5,
//     min: 0,
//     max: 1,
//     step: 0.05,
//     displayStepper: true,
//   },
//   dispTrail: {
//     type: ControlType.Number,
//     title: 'Trail Duration',
//     defaultValue: 1.0,
//     min: 0.1,
//     max: 4,
//     step: 0.1,
//     displayStepper: true,
//   },
// });
