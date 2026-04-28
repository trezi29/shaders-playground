// /**
//  * ShaderGradientTrail — standalone Framer component
//  *
//  * Recreates the Shader + LinearGradient + CursorTrail stack from `shaders/react`
//  * using plain WebGL2. Zero npm dependencies — paste directly into Framer's
//  * code-component editor.
//  *
//  * Framer resolves "react" and "framer" internally; no install needed.
//  */

// import { useEffect, useRef } from 'react';
// import { addPropertyControls, ControlType } from 'framer';

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// // Decode one sRGB-encoded channel [0,1] to linear light.
// // Mirrors what the `shaders` library's transformColor does (color.to("srgb-linear")).
// function srgbToLinear(c: number): number {
//   return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
// }

// // Returns linear-light RGBA from a CSS hex string (#rrggbb).
// function hexToLinearVec4(hex: string): [number, number, number, number] {
//   const h = hex.replace('#', '');
//   return [
//     srgbToLinear(parseInt(h.slice(0, 2), 16) / 255),
//     srgbToLinear(parseInt(h.slice(2, 4), 16) / 255),
//     srgbToLinear(parseInt(h.slice(4, 6), 16) / 255),
//     1,
//   ];
// }

// function compileShader(gl: WebGL2RenderingContext, type: number, src: string) {
//   const s = gl.createShader(type)!;
//   gl.shaderSource(s, src);
//   gl.compileShader(s);
//   if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
//     console.error(
//       '[ShaderGradientTrail] shader error:',
//       gl.getShaderInfoLog(s),
//     );
//     gl.deleteShader(s);
//     return null;
//   }
//   return s;
// }

// function buildProgram(gl: WebGL2RenderingContext, vert: string, frag: string) {
//   const vs = compileShader(gl, gl.VERTEX_SHADER, vert);
//   const fs = compileShader(gl, gl.FRAGMENT_SHADER, frag);
//   if (!vs || !fs) return null;
//   const p = gl.createProgram()!;
//   gl.attachShader(p, vs);
//   gl.attachShader(p, fs);
//   gl.bindAttribLocation(p, 0, 'a_pos');
//   gl.linkProgram(p);
//   gl.deleteShader(vs);
//   gl.deleteShader(fs);
//   if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
//     console.error('[ShaderGradientTrail] link error:', gl.getProgramInfoLog(p));
//     return null;
//   }
//   return p;
// }

// // ─── GLSL ─────────────────────────────────────────────────────────────────────
// // Each shader is a fully self-contained string (no concatenation) to avoid
// // any bundler/minifier issues in Framer's published build.

// const VERT = `#version 300 es
// layout(location = 0) in vec2 a_pos;
// void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
// `;

// // Colors arrive as linear-light values (gamma-decoded in JS).
// // We mix in linear space (correct) then encode to sRGB for the framebuffer.
// const GRAD_FRAG = `#version 300 es
// precision highp float;
// uniform vec2 u_res;
// uniform vec4 u_colorA;
// uniform vec4 u_colorB;
// out vec4 outColor;

// vec3 linearToSRGB(vec3 c) {
//     vec3 hi = vec3(1.055) * pow(max(c, vec3(0.0)), vec3(0.41667)) - vec3(0.055);
//     vec3 lo = c * vec3(12.92);
//     return mix(hi, lo, step(c, vec3(0.0031308)));
// }

// void main() {
//     float t = gl_FragCoord.x / u_res.x;
//     vec4 lin = mix(u_colorA, u_colorB, t);
//     outColor = vec4(linearToSRGB(lin.rgb), lin.a);
// }
// `;

// const TRAIL_FRAG = `#version 300 es
// precision highp float;
// uniform vec2 u_res;
// uniform sampler2D u_trail;
// uniform vec4 u_colorA;
// uniform vec4 u_colorB;
// out vec4 outColor;

// vec3 linearToSRGB(vec3 c) {
//     vec3 hi = vec3(1.055) * pow(max(c, vec3(0.0)), vec3(0.41667)) - vec3(0.055);
//     vec3 lo = c * vec3(12.92);
//     return mix(hi, lo, step(c, vec3(0.0031308)));
// }

// void main() {
//     vec2 uv = vec2(gl_FragCoord.x / u_res.x, 1.0 - gl_FragCoord.y / u_res.y);
//     float ps = 1.0 / 128.0;

//     float ci = texture(u_trail, uv                    ).x;
//     float s1 = texture(u_trail, uv + vec2( ps,  0.0)).x;
//     float s2 = texture(u_trail, uv + vec2( 0.0,  ps)).x;
//     float s3 = texture(u_trail, uv + vec2(-ps,  0.0)).x;
//     float s4 = texture(u_trail, uv + vec2( 0.0, -ps)).x;

//     float az = texture(u_trail, uv                    ).z;
//     float a1 = texture(u_trail, uv + vec2( ps,  0.0)).z;
//     float a2 = texture(u_trail, uv + vec2( 0.0,  ps)).z;
//     float a3 = texture(u_trail, uv + vec2(-ps,  0.0)).z;
//     float a4 = texture(u_trail, uv + vec2( 0.0, -ps)).z;

//     float intensity = ci * 0.5 + (s1 + s2 + s3 + s4) * 0.125;
//     float age       = az * 0.5 + (a1 + a2 + a3 + a4) * 0.125;

//     float mask = step(0.01, intensity);
//     vec4 lin = mix(u_colorA, u_colorB, clamp(age, 0.0, 1.0));
//     outColor = vec4(linearToSRGB(lin.rgb), lin.a * mask);
// }
// `;

// // ─── Component ────────────────────────────────────────────────────────────────

// const GRID = 128;

// interface Props {
//   style?: React.CSSProperties;
//   gradColorA?: string;
//   gradColorB?: string;
//   trailColorA?: string;
//   trailColorB?: string;
//   trailRadius?: number;
//   trailLength?: number;
//   trailShrink?: number;
// }

// export default function ShaderGradientTrail({
//   style = {},
//   gradColorA = '#0f172a',
//   gradColorB = '#7c3aed',
//   trailColorA = '#00aaff',
//   trailColorB = '#ff00aa',
//   trailRadius = 0.5,
//   trailLength = 0.5,
//   trailShrink = 1,
// }: Props) {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const propsRef = useRef({
//     gradColorA,
//     gradColorB,
//     trailColorA,
//     trailColorB,
//     trailRadius,
//     trailLength,
//     trailShrink,
//   });
//   propsRef.current = {
//     gradColorA,
//     gradColorB,
//     trailColorA,
//     trailColorB,
//     trailRadius,
//     trailLength,
//     trailShrink,
//   };

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const gl = canvas.getContext('webgl2', { alpha: false });
//     if (!gl) {
//       console.warn('[ShaderGradientTrail] WebGL2 not available');
//       return;
//     }

//     gl.getExtension('OES_texture_float_linear');

//     // ── Programs ──────────────────────────────────────────────────────────
//     const gradProg = buildProgram(gl, VERT, GRAD_FRAG);
//     const trailProg = buildProgram(gl, VERT, TRAIL_FRAG);
//     if (!gradProg || !trailProg) return;

//     // ── Full-screen quad ──────────────────────────────────────────────────
//     const vao = gl.createVertexArray()!;
//     gl.bindVertexArray(vao);
//     const vbo = gl.createBuffer()!;
//     gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
//     gl.bufferData(
//       gl.ARRAY_BUFFER,
//       new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
//       gl.STATIC_DRAW,
//     );
//     gl.enableVertexAttribArray(0);
//     gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
//     gl.bindVertexArray(null);

//     // ── Cached uniform locations ──────────────────────────────────────────
//     const gU = {
//       res: gl.getUniformLocation(gradProg, 'u_res')!,
//       colorA: gl.getUniformLocation(gradProg, 'u_colorA')!,
//       colorB: gl.getUniformLocation(gradProg, 'u_colorB')!,
//     };
//     const tU = {
//       res: gl.getUniformLocation(trailProg, 'u_res')!,
//       trail: gl.getUniformLocation(trailProg, 'u_trail')!,
//       colorA: gl.getUniformLocation(trailProg, 'u_colorA')!,
//       colorB: gl.getUniformLocation(trailProg, 'u_colorB')!,
//     };

//     // ── Trail texture (128×128 RGBA float) ───────────────────────────────
//     // r=intensity, g=scale, b=age
//     const trailData = new Float32Array(GRID * GRID * 4);
//     const tex = gl.createTexture()!;
//     gl.bindTexture(gl.TEXTURE_2D, tex);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//     // Allocate texture storage once; update with texSubImage2D in the loop.
//     gl.texImage2D(
//       gl.TEXTURE_2D,
//       0,
//       gl.RGBA32F,
//       GRID,
//       GRID,
//       0,
//       gl.RGBA,
//       gl.FLOAT,
//       trailData,
//     );

//     // ── Canvas sizing via ResizeObserver ──────────────────────────────────
//     // This fires immediately and on every layout change, so the canvas is
//     // always the right size regardless of when the effect mounts relative
//     // to the browser's layout pass (preview vs published can differ).
//     const resize = () => {
//       const dpr = Math.min(window.devicePixelRatio, 2);
//       const w = Math.round(canvas.offsetWidth * dpr) || 1;
//       const h = Math.round(canvas.offsetHeight * dpr) || 1;
//       if (canvas.width !== w || canvas.height !== h) {
//         canvas.width = w;
//         canvas.height = h;
//       }
//       gl.viewport(0, 0, canvas.width, canvas.height);
//     };
//     resize();
//     const ro = new ResizeObserver(resize);
//     ro.observe(canvas);

//     // ── Mouse state ───────────────────────────────────────────────────────
//     let mouseX = 0.5,
//       mouseY = 0.5;
//     let prevX = 0.5,
//       prevY = 0.5;
//     let lastTime = performance.now();

//     const onMouseMove = (e: MouseEvent) => {
//       const rect = canvas.getBoundingClientRect();
//       mouseX = (e.clientX - rect.left) / rect.width;
//       mouseY = (e.clientY - rect.top) / rect.height;
//     };
//     window.addEventListener('mousemove', onMouseMove);

//     // ── Render loop ───────────────────────────────────────────────────────
//     let rafId: number;

//     const render = () => {
//       const cw = canvas.width;
//       const ch = canvas.height;

//       // ── CPU trail simulation ────────────────────────────────────────
//       const now = performance.now();
//       const dt = Math.min((now - lastTime) / 1000, 0.05);
//       lastTime = now;

//       const {
//         trailRadius: radius,
//         trailLength: length,
//         trailShrink: shrink,
//       } = propsRef.current;
//       const r = radius * 0.1;
//       const aspect = cw / Math.max(1, ch);
//       const dx = mouseX - prevX;
//       const dy = mouseY - prevY;
//       const speed = Math.sqrt(dx * dx + dy * dy);

//       const fadeRate = 1 - dt / Math.max(0.1, length);
//       const ageRate = dt / Math.max(0.1, length);

//       for (let i = 0; i < GRID * GRID * 4; i += 4) {
//         trailData[i] *= fadeRate;
//         trailData[i + 1] = 1 - (1 - trailData[i]) * shrink;
//         trailData[i + 2] = Math.min(1, trailData[i + 2] + ageRate);
//       }

//       if (speed > 0.001) {
//         const ir = r * 3;
//         const stepSz = Math.max(0.005, r * 0.5);
//         const nSteps = Math.min(20, Math.max(1, Math.ceil(speed / stepSz)));
//         const amount = (speed / nSteps) * 50 * dt;

//         for (let s = 0; s < nSteps; s++) {
//           const t = (s + 0.5) / nSteps;
//           const px = prevX + dx * t;
//           const py = prevY + dy * t;

//           const minJ = Math.max(0, Math.floor((px - ir) * GRID));
//           const maxJ = Math.min(GRID - 1, Math.ceil((px + ir) * GRID));
//           const minI = Math.max(0, Math.floor((py - ir) * GRID));
//           const maxI = Math.min(GRID - 1, Math.ceil((py + ir) * GRID));

//           for (let i = minI; i <= maxI; i++) {
//             for (let j = minJ; j <= maxJ; j++) {
//               const idx = (i * GRID + j) * 4;
//               const cx = (j + 0.5) / GRID;
//               const cy = (i + 0.5) / GRID;
//               const ddx = aspect >= 1 ? (cx - px) * aspect : cx - px;
//               const ddy = aspect >= 1 ? cy - py : (cy - py) / aspect;
//               const dist = Math.sqrt(ddx * ddx + ddy * ddy);
//               if (dist < ir) {
//                 const inf = Math.exp((-dist * dist) / (r * r));
//                 trailData[idx] = Math.min(1, trailData[idx] + inf * amount);
//                 trailData[idx + 1] = 1;
//                 trailData[idx + 2] = 0;
//               }
//             }
//           }
//         }
//       }

//       prevX = mouseX;
//       prevY = mouseY;

//       // Reuse existing texture storage (faster than texImage2D every frame).
//       gl.activeTexture(gl.TEXTURE0);
//       gl.bindTexture(gl.TEXTURE_2D, tex);
//       gl.texSubImage2D(
//         gl.TEXTURE_2D,
//         0,
//         0,
//         0,
//         GRID,
//         GRID,
//         gl.RGBA,
//         gl.FLOAT,
//         trailData,
//       );

//       gl.bindVertexArray(vao);

//       // ── Pass 1: gradient ────────────────────────────────────────────
//       gl.disable(gl.BLEND);
//       gl.useProgram(gradProg);
//       gl.uniform2f(gU.res, cw, ch);
//       const [r1, g1, b1, a1] = hexToLinearVec4(propsRef.current.gradColorA);
//       const [r2, g2, b2, a2] = hexToLinearVec4(propsRef.current.gradColorB);
//       gl.uniform4f(gU.colorA, r1, g1, b1, a1);
//       gl.uniform4f(gU.colorB, r2, g2, b2, a2);
//       gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

//       // ── Pass 2: cursor trail ────────────────────────────────────────
//       gl.enable(gl.BLEND);
//       gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
//       gl.useProgram(trailProg);
//       gl.uniform2f(tU.res, cw, ch);
//       gl.uniform1i(tU.trail, 0);
//       const [tr1, tg1, tb1, ta1] = hexToLinearVec4(
//         propsRef.current.trailColorA,
//       );
//       const [tr2, tg2, tb2, ta2] = hexToLinearVec4(
//         propsRef.current.trailColorB,
//       );
//       gl.uniform4f(tU.colorA, tr1, tg1, tb1, ta1);
//       gl.uniform4f(tU.colorB, tr2, tg2, tb2, ta2);
//       gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

//       rafId = requestAnimationFrame(render);
//     };

//     rafId = requestAnimationFrame(render);

//     return () => {
//       cancelAnimationFrame(rafId);
//       ro.disconnect();
//       window.removeEventListener('mousemove', onMouseMove);
//       gl.deleteProgram(gradProg);
//       gl.deleteProgram(trailProg);
//       gl.deleteVertexArray(vao);
//       gl.deleteBuffer(vbo);
//       gl.deleteTexture(tex);
//     };
//   }, []);

//   return (
//     <div
//       style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}
//     >
//       <canvas
//         ref={canvasRef}
//         style={{ width: '100%', height: '100%', display: 'block' }}
//       />
//     </div>
//   );
// }

// // ─── Framer property controls ─────────────────────────────────────────────────

// addPropertyControls(ShaderGradientTrail, {
//   gradColorA: {
//     type: ControlType.Color,
//     title: 'Gradient A',
//     defaultValue: '#0f172a',
//   },
//   gradColorB: {
//     type: ControlType.Color,
//     title: 'Gradient B',
//     defaultValue: '#7c3aed',
//   },
//   trailColorA: {
//     type: ControlType.Color,
//     title: 'Trail Color A',
//     defaultValue: '#00aaff',
//   },
//   trailColorB: {
//     type: ControlType.Color,
//     title: 'Trail Color B',
//     defaultValue: '#ff00aa',
//   },
//   trailRadius: {
//     type: ControlType.Number,
//     title: 'Trail Radius',
//     defaultValue: 0.5,
//     min: 0.1,
//     max: 2,
//     step: 0.1,
//     displayStepper: true,
//   },
//   trailLength: {
//     type: ControlType.Number,
//     title: 'Trail Length',
//     defaultValue: 0.5,
//     min: 0.1,
//     max: 2,
//     step: 0.1,
//     displayStepper: true,
//   },
//   trailShrink: {
//     type: ControlType.Number,
//     title: 'Trail Shrink',
//     defaultValue: 1,
//     min: 0,
//     max: 1,
//     step: 0.1,
//     displayStepper: true,
//   },
// });
