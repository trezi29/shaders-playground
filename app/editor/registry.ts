import React from 'react';
import {
  Aurora, Beam, Blob, Checkerboard, ConicGradient, DiamondGradient,
  DotGrid, FallingLines, FloatingParticles, FlowingGradient, Godrays,
  Grid, HexGrid, ImageTexture, LinearGradient, MultiPointGradient,
  Plasma, RadialGradient, Ripples, SimplexNoise, SineWave, SolidColor,
  Spiral, Strands, Stripes, StudioBackground, Swirl, Truchet,
  VideoTexture, Voronoi, Weave, WebcamTexture,
  Circle, Crescent, Cross, Ellipse, Flower, Polygon, Ring,
  RoundedRect, Star, Trapezoid, Vesica,
  Crystal, Emboss, Glass, Neon,
  Bulge, ConcentricSpin, FlowField, Form3D, GlassTiles, Kaleidoscope,
  Mirror, Perspective, PolarCoordinates, RectangularCoordinates,
  Spherize, Stretch, Twirl, WaveDistortion,
  BrightnessContrast, Duotone, Grayscale, HueShift, Invert,
  Posterize, Saturation, Sharpness, Solarize, Tint, Tritone, Vibrance,
  AngularBlur, Blur, ChannelBlur, DiffuseBlur, LinearBlur,
  ProgressiveBlur, TiltShift, ZoomBlur,
  Ascii, ChromaticAberration, ContourLines, CRTScreen, Dither,
  DropShadow, FilmGrain, Glitch, Glow, Halftone, LensFlare,
  Paper, Pixelate, Vignette,
  ChromaFlow, CursorRipples, CursorTrail, GridDistortion, Liquify, Shatter,
  DOMTexture, Fog, Smoke, SmokeFill, VHS,
} from 'shaders/react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type PropDef =
  | { kind: 'number'; min: number; max: number; step: number; default: number }
  | { kind: 'color'; default: string }
  | { kind: 'boolean'; default: boolean }
  | { kind: 'select'; options: string[]; default: string }
  | { kind: 'text'; default: string; placeholder?: string }
  | { kind: 'position'; defaultX: number; defaultY: number }
  | { kind: 'transform'; defaultScale: number; defaultOffsetX: number; defaultOffsetY: number };

export type ComponentDef = {
  label: string;
  category: string;
  schema: Record<string, PropDef>;
};

export type PropValue = number | string | boolean | { x: number; y: number } | { scale: number; offsetX: number; offsetY: number };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const num = (d: number, min: number, max: number, step = 0.01): PropDef =>
  ({ kind: 'number', default: d, min, max, step });
const col = (d: string): PropDef => ({ kind: 'color', default: d });
const bool = (d: boolean): PropDef => ({ kind: 'boolean', default: d });
const sel = (options: string[], d: string): PropDef => ({ kind: 'select', options, default: d });
const txt = (d: string, placeholder?: string): PropDef =>
  ({ kind: 'text', default: d, placeholder });
const pos = (dx: number, dy: number): PropDef =>
  ({ kind: 'position', defaultX: dx, defaultY: dy });
const trn = (scale: number, offsetX: number, offsetY: number): PropDef =>
  ({ kind: 'transform', defaultScale: scale, defaultOffsetX: offsetX, defaultOffsetY: offsetY });

// Common option sets
const BM = ['normal','multiply','screen','overlay','luminosity','color','linearDodge','colorDodge','colorBurn','linearBurn','difference','exclusion','darken','lighten'];
const CS = ['linear','oklch','oklab','hsl','hsv','lch'];
const ED = ['stretch','transparent','mirror','wrap'];
const SP = ['center','inside','outside'];
const OF = ['cover','contain','fill','none'];
const FONTS = ['Azeret','Courier','Cutive','Fira','Geist','IBM','JetBrains','Major','Martian','Nova','Press','Roboto','Share','Silkscreen','Source','Space','Syne','VT323','Xanh'];

// Base props available on every component
const BASE: Record<string, PropDef> = {
  opacity: num(1, 0, 1, 0.01),
  blendMode: sel(BM, 'normal'),
};

// Shape stroke props (shared by all shapes)
const STROKE: Record<string, PropDef> = {
  strokeThickness: num(0, 0, 0.5, 0.01),
  strokeColor: col('#000000'),
  strokePosition: sel(SP, 'center'),
};

// ─── Registry ────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  'Textures', 'Shapes', 'Shape Effects', 'Distortions',
  'Adjustments', 'Blurs', 'Stylize', 'Interactive',
] as const;

export const REGISTRY: Record<string, ComponentDef> = {
  // ── Textures ──────────────────────────────────────────────────────────────
  solidColor: { label: 'Solid Color', category: 'Textures', schema: {
    color: col('#5b18ca'), ...BASE,
  }},
  imageTexture: { label: 'Image', category: 'Textures', schema: {
    url: txt('/hands.jpg', 'Image URL'),
    objectFit: sel(OF, 'cover'),
    transform: trn(1, 0, 0),
    ...BASE,
  }},
  videoTexture: { label: 'Video', category: 'Textures', schema: {
    url: txt('/capitello-wb.mp4', 'Video URL'),
    objectFit: sel(OF, 'cover'),
    loop: bool(true),
    ...BASE,
  }},
  webcamTexture: { label: 'Webcam', category: 'Textures', schema: {
    objectFit: sel(OF, 'cover'),
    mirror: bool(true),
    ...BASE,
  }},
  domTexture: { label: 'DOM Texture', category: 'Textures', schema: {
    ...BASE,
  }},
  fog: { label: 'Fog', category: 'Textures', schema: {
    colorA: col('#e0e0e0'), colorB: col('#888888'),
    seed: num(0, 0, 999, 1), speed: num(1, 0.1, 3),
    turbulence: num(1, 0, 3), detail: num(15, 0, 50, 1),
    blending: num(0.3, 0, 1), mouseInfluence: num(0.1, 0, 2),
    mouseRadius: num(0.1, 0.02, 0.5), colorSpace: sel(CS, 'linear'),
    ...BASE,
  }},
  smoke: { label: 'Smoke', category: 'Textures', schema: {
    colorA: col('#fc83f9'), colorB: col('#c21c79'),
    emitFrom: pos(0.5, 1), direction: num(0, 0, 360, 1),
    speed: num(20, 0.1, 50), spread: num(60, 0, 180, 1),
    emitRadius: num(0.08, 0.01, 0.3), intensity: num(1, 0.1, 1),
    dissipation: num(0.2, 0.1, 3), detail: num(25, 0, 50, 1),
    gravity: num(0.5, -2, 2), colorDecay: num(0.4, 0, 3),
    mouseInfluence: num(0.1, 0, 2), mouseRadius: num(0.1, 0.02, 0.5),
    colorSpace: sel(CS, 'linear'),
    ...BASE,
  }},
  smokeFill: { label: 'Smoke Fill', category: 'Textures', schema: {
    colorA: col('#8cf3ff'), colorB: col('#04a0d6'),
    center: pos(0.5, 0.5), scale: num(1, 0.1, 3),
    emitFrom: pos(0.5, 0.5), direction: num(0, 0, 360, 1),
    speed: num(10, 0.1, 30), spread: num(60, 0, 180, 1),
    emitRadius: num(0.03, 0.01, 0.3), intensity: num(1, 0.1, 1),
    dissipation: num(0.3, 0.1, 5), detail: num(25, 0, 50, 1),
    gravity: num(0.5, -2, 2), colorDecay: num(0.4, 0, 3),
    mouseInfluence: num(0.1, 0, 2), mouseRadius: num(0.1, 0.02, 0.5),
    colorSpace: sel(CS, 'linear'),
    ...BASE,
  }},
  aurora: { label: 'Aurora', category: 'Textures', schema: {
    colorA: col('#a533f8'), colorB: col('#22ee88'), colorC: col('#1694e8'),
    colorSpace: sel(CS, 'linear'),
    balance: num(50, 0, 100, 1), intensity: num(80, 0, 200, 1),
    curtainCount: num(4, 1, 20, 1), speed: num(5, 0, 20, 0.1),
    waviness: num(50, 0, 100, 1), rayDensity: num(20, 1, 100, 1),
    height: num(120, 0, 300, 1), center: pos(0.5, 0), seed: num(0, 0, 100, 1),
    ...BASE,
  }},
  beam: { label: 'Beam', category: 'Textures', schema: {
    startPosition: pos(0.2, 0.5), endPosition: pos(0.8, 0.5),
    startThickness: num(0.2, 0, 1), endThickness: num(0.2, 0, 1),
    startSoftness: num(0.5, 0, 1), endSoftness: num(0.5, 0, 1),
    insideColor: col('#FF0000'), outsideColor: col('#0000FF'),
    colorSpace: sel(CS, 'linear'), ...BASE,
  }},
  blob: { label: 'Blob', category: 'Textures', schema: {
    colorA: col('#ff6b35'), colorB: col('#e91e63'),
    size: num(0.5, 0, 2), deformation: num(0.5, 0, 1), softness: num(0.5, 0, 1),
    highlightIntensity: num(0.5, 0, 1),
    highlightX: num(0.3, -1, 1), highlightY: num(-0.3, -1, 1), highlightZ: num(0.4, 0, 1),
    highlightColor: col('#ffe11a'),
    speed: num(0.5, 0, 5, 0.1), seed: num(1, 0, 100, 1),
    colorSpace: sel(CS, 'linear'), center: pos(0.5, 0.5), ...BASE,
  }},
  checkerboard: { label: 'Checkerboard', category: 'Textures', schema: {
    colorA: col('#cccccc'), colorB: col('#999999'),
    cells: num(8, 1, 50, 1), softness: num(0, 0, 1),
    colorSpace: sel(CS, 'linear'), ...BASE,
  }},
  conicGradient: { label: 'Conic Gradient', category: 'Textures', schema: {
    colorA: col('#FF0080'), colorB: col('#00BFFF'),
    center: pos(0.5, 0.5), rotation: num(0, 0, 360, 1), repeat: num(1, 1, 20, 1),
    colorSpace: sel(CS, 'oklch'), ...BASE,
  }},
  diamondGradient: { label: 'Diamond Gradient', category: 'Textures', schema: {
    colorA: col('#4ffb4a'), colorB: col('#4f1238'),
    center: pos(0.5, 0.5), size: num(0.7, 0.1, 3, 0.1),
    rotation: num(0, 0, 360, 1), repeat: num(1, 1, 20, 1), roundness: num(0, 0, 1),
    colorSpace: sel(CS, 'oklch'), ...BASE,
  }},
  dotGrid: { label: 'Dot Grid', category: 'Textures', schema: {
    color: col('#ffffff'), density: num(30, 1, 100, 1),
    dotSize: num(0.3, 0.01, 1), twinkle: num(0, 0, 1), ...BASE,
  }},
  fallingLines: { label: 'Falling Lines', category: 'Textures', schema: {
    colorA: col('#ffffff'), colorB: col('#ffffff00'),
    colorSpace: sel(CS, 'linear'), angle: num(90, 0, 360, 1),
    speed: num(0.5, 0, 3), speedVariance: num(0.3, 0, 1),
    density: num(15, 1, 60, 1), trailLength: num(0.35, 0, 1),
    balance: num(0.5, 0, 1), strokeWidth: num(0.15, 0, 1), rounding: num(1, 0, 1),
    ...BASE,
  }},
  floatingParticles: { label: 'Floating Particles', category: 'Textures', schema: {
    particleColor: col('#ffffff'),
    randomness: num(0.25, 0, 1), speed: num(0.25, 0, 5, 0.1),
    angle: num(90, 0, 360, 1), particleSize: num(1, 0.1, 10, 0.1),
    particleSoftness: num(0, 0, 1), twinkle: num(0.5, 0, 1),
    count: num(5, 1, 50, 1), speedVariance: num(0.3, 0, 1),
    angleVariance: num(30, 0, 180, 1), particleDensity: num(3, 1, 20, 1),
    ...BASE,
  }},
  flowingGradient: { label: 'Flowing Gradient', category: 'Textures', schema: {
    colorA: col('#0a0015'), colorB: col('#6b17e6'),
    colorC: col('#ff4d6a'), colorD: col('#ff6b35'),
    colorSpace: sel(CS, 'oklch'),
    speed: num(1, 0, 10, 0.1), distortion: num(0.5, 0, 2, 0.1), seed: num(0, 0, 100, 1),
    ...BASE,
  }},
  godrays: { label: 'Godrays', category: 'Textures', schema: {
    rayColor: col('#4283fb'), backgroundColor: col('#00000000'),
    center: pos(0, 0), density: num(0.3, 0, 1), intensity: num(0.8, 0, 3),
    spotty: num(1, 0, 3), speed: num(0.5, 0, 5, 0.1), ...BASE,
  }},
  grid: { label: 'Grid', category: 'Textures', schema: {
    color: col('#ffffff'), cells: num(10, 1, 100, 1),
    thickness: num(1, 0.5, 20, 0.5), rotation: num(0, 0, 360, 1), ...BASE,
  }},
  hexGrid: { label: 'Hex Grid', category: 'Textures', schema: {
    colorA: col('#000000'), colorB: col('#ffffff'),
    cells: num(8, 1, 50, 1), thickness: num(1, 0.5, 20, 0.5),
    colorSpace: sel(CS, 'linear'), ...BASE,
  }},
  linearGradient: { label: 'Linear Gradient', category: 'Textures', schema: {
    colorA: col('#1aff00'), colorB: col('#0000ff'),
    start: pos(0, 0.5), end: pos(1, 0.5), angle: num(0, 0, 360, 1),
    edges: sel(ED, 'stretch'), colorSpace: sel(CS, 'linear'), ...BASE,
  }},
  multiPointGradient: { label: 'Multi-Point Gradient', category: 'Textures', schema: {
    colorA: col('#4776E6'), positionA: pos(0.2, 0.2),
    colorB: col('#C44DFF'), positionB: pos(0.8, 0.2),
    colorC: col('#1ABC9C'), positionC: pos(0.2, 0.8),
    colorD: col('#F8BBD9'), positionD: pos(0.8, 0.8),
    colorE: col('#FF8C42'), positionE: pos(0.5, 0.5),
    smoothness: num(2, 0.1, 10, 0.1), ...BASE,
  }},
  plasma: { label: 'Plasma', category: 'Textures', schema: {
    colorA: col('#7018be'), colorB: col('#000000'),
    density: num(2, 0.1, 10, 0.1), speed: num(2, 0, 10, 0.1),
    intensity: num(1.5, 0, 5), warp: num(0.4, 0, 2), contrast: num(1, 0, 5),
    balance: num(50, 0, 100, 1), colorSpace: sel(CS, 'linear'), ...BASE,
  }},
  radialGradient: { label: 'Radial Gradient', category: 'Textures', schema: {
    colorA: col('#ff0000'), colorB: col('#0000ff'),
    center: pos(0.5, 0.5), radius: num(1, 0.1, 5),
    repeat: num(1, 1, 20, 1), aspect: num(1, 0.1, 5), skewAngle: num(0, 0, 360, 1),
    colorSpace: sel(CS, 'linear'), ...BASE,
  }},
  ripples: { label: 'Ripples', category: 'Textures', schema: {
    colorA: col('#ffffff'), colorB: col('#000000'),
    center: pos(0.5, 0.5), speed: num(1, 0, 10, 0.1), frequency: num(20, 1, 100, 1),
    softness: num(0, 0, 1), thickness: num(0.5, 0, 1), phase: num(0, 0, 6.28),
    ...BASE,
  }},
  simplexNoise: { label: 'Simplex Noise', category: 'Textures', schema: {
    colorA: col('#ffffff'), colorB: col('#000000'),
    scale: num(2, -2, 5, 0.1), balance: num(0, -1, 1, 0.1),
    contrast: num(0, -2, 5, 0.1), seed: num(0, 0, 100, 1), speed: num(1, 0, 5, 0.1),
    ...BASE,
  }},
  sineWave: { label: 'Sine Wave', category: 'Textures', schema: {
    color: col('#ffffff'), amplitude: num(0.15, 0, 1), frequency: num(1, 0.1, 20, 0.1),
    speed: num(1, 0, 10, 0.1), angle: num(0, 0, 360, 1),
    position: pos(0.5, 0.5), thickness: num(0.2, 0.01, 1), softness: num(0.4, 0, 1),
    ...BASE,
  }},
  spiral: { label: 'Spiral', category: 'Textures', schema: {
    colorA: col('#000000'), colorB: col('#ffffff'),
    strokeWidth: num(0.5, 0, 2), strokeFalloff: num(0, 0, 1), softness: num(0, 0, 1),
    speed: num(1, 0, 10, 0.1), center: pos(0.5, 0.5), scale: num(1, 0.1, 10, 0.1),
    colorSpace: sel(CS, 'linear'), ...BASE,
  }},
  strands: { label: 'Strands', category: 'Textures', schema: {
    waveColor: col('#f1c907'),
    speed: num(0.5, 0, 5), amplitude: num(1, 0, 5), frequency: num(1, 0.1, 10, 0.1),
    lineCount: num(12, 1, 50, 1), lineWidth: num(0.1, 0.01, 1), pinEdges: bool(true),
    start: pos(0, 0.5), end: pos(1, 0.5), ...BASE,
  }},
  stripes: { label: 'Stripes', category: 'Textures', schema: {
    colorA: col('#000000'), colorB: col('#ffffff'),
    angle: num(45, 0, 360, 1), density: num(5, 1, 50, 1), balance: num(0.5, 0, 1),
    softness: num(0, 0, 1), speed: num(0.2, 0, 5), offset: num(0, 0, 1),
    colorSpace: sel(CS, 'linear'), ...BASE,
  }},
  studioBackground: { label: 'Studio Background', category: 'Textures', schema: {
    color: col('#d8dbec'), brightness: num(20, 0, 100, 1),
    keyColor: col('#d5e4ea'), keyIntensity: num(40, 0, 100, 1), keySoftness: num(50, 0, 100, 1),
    fillColor: col('#d5e4ea'), fillIntensity: num(10, 0, 100, 1), fillSoftness: num(70, 0, 100, 1), fillAngle: num(70, 0, 360, 1),
    backColor: col('#c8d4e8'), backIntensity: num(20, 0, 100, 1), backSoftness: num(80, 0, 100, 1),
    center: pos(0.5, 0.8), lightTarget: num(100, 0, 300, 1), wallCurvature: num(10, 0, 100, 1),
    vignette: num(0, 0, 100, 1), ambientIntensity: num(50, 0, 100, 1), ambientSpeed: num(2, 0, 10, 0.1),
    seed: num(0, 0, 100, 1), ...BASE,
  }},
  swirl: { label: 'Swirl', category: 'Textures', schema: {
    colorA: col('#1275d8'), colorB: col('#e19136'),
    speed: num(1, 0, 10, 0.1), detail: num(1, 0.1, 10, 0.1), blend: num(50, 0, 100, 1),
    colorSpace: sel(CS, 'linear'), ...BASE,
  }},
  truchet: { label: 'Truchet', category: 'Textures', schema: {
    colorA: col('#000000'), colorB: col('#ffffff'),
    cells: num(10, 1, 50, 1), thickness: num(2, 0.5, 20, 0.5), seed: num(0, 0, 100, 1),
    colorSpace: sel(CS, 'linear'), ...BASE,
  }},
  voronoi: { label: 'Voronoi', category: 'Textures', schema: {
    colorA: col('#3186cf'), colorB: col('#fc02dd'), colorBorder: col('#000000'),
    scale: num(6, 1, 30, 0.5), speed: num(0.5, 0, 5), seed: num(0, 0, 100, 1),
    edgeIntensity: num(0.5, 0, 1), edgeSoftness: num(0.05, 0, 0.5),
    colorSpace: sel(CS, 'oklch'), ...BASE,
  }},
  weave: { label: 'Weave', category: 'Textures', schema: {
    colorA: col('#c4c4c4'), colorB: col('#4d4d4d'),
    cells: num(10, 1, 50, 1), gap: num(0.25, 0, 0.5), rotation: num(0, 0, 360, 1),
    ...BASE,
  }},

  // ── Shapes ───────────────────────────────────────────────────────────────
  circle: { label: 'Circle', category: 'Shapes', schema: {
    color: col('#ffffff'), radius: num(1, 0, 3), softness: num(0, 0, 1),
    center: pos(0.5, 0.5), colorSpace: sel(CS, 'linear'), ...STROKE, ...BASE,
  }},
  crescent: { label: 'Crescent', category: 'Shapes', schema: {
    color: col('#ffffff'), center: pos(0.5, 0.5),
    radius: num(0.3, 0, 1), innerRatio: num(0.8, 0, 1), offset: num(0.2, 0, 1),
    rotation: num(0, 0, 360, 1), softness: num(0, 0, 1),
    colorSpace: sel(CS, 'linear'), ...STROKE, ...BASE,
  }},
  cross: { label: 'Cross', category: 'Shapes', schema: {
    color: col('#ffffff'), center: pos(0.5, 0.5),
    radius: num(0.35, 0, 1), thickness: num(0.08, 0.01, 0.5), rounding: num(0, 0, 1),
    rotation: num(0, 0, 360, 1), softness: num(0, 0, 1),
    colorSpace: sel(CS, 'linear'), ...STROKE, ...BASE,
  }},
  ellipse: { label: 'Ellipse', category: 'Shapes', schema: {
    color: col('#ffffff'), center: pos(0.5, 0.5),
    radiusX: num(0.35, 0, 1), radiusY: num(0.2, 0, 1),
    rotation: num(0, 0, 360, 1), softness: num(0, 0, 1),
    colorSpace: sel(CS, 'linear'), ...STROKE, ...BASE,
  }},
  flower: { label: 'Flower', category: 'Shapes', schema: {
    color: col('#ffffff'), center: pos(0.5, 0.5),
    radius: num(0.4, 0, 1), sides: num(5, 3, 20, 1), innerRatio: num(0.4, 0, 1),
    rotation: num(0, 0, 360, 1), softness: num(0, 0, 1),
    colorSpace: sel(CS, 'linear'), ...STROKE, ...BASE,
  }},
  polygon: { label: 'Polygon', category: 'Shapes', schema: {
    color: col('#ffffff'), center: pos(0.5, 0.5),
    radius: num(0.4, 0, 1), sides: num(6, 3, 20, 1), rounding: num(0, 0, 1),
    rotation: num(0, 0, 360, 1), softness: num(0, 0, 1),
    colorSpace: sel(CS, 'linear'), ...STROKE, ...BASE,
  }},
  ring: { label: 'Ring', category: 'Shapes', schema: {
    color: col('#ffffff'), center: pos(0.5, 0.5),
    radius: num(0.3, 0, 1), thickness: num(0.07, 0.01, 0.5), softness: num(0, 0, 1),
    colorSpace: sel(CS, 'linear'), ...STROKE, ...BASE,
  }},
  roundedRect: { label: 'Rounded Rect', category: 'Shapes', schema: {
    color: col('#ffffff'), center: pos(0.5, 0.5),
    width: num(0.35, 0.01, 1), height: num(0.25, 0.01, 1), rounding: num(0.05, 0, 0.5),
    rotation: num(0, 0, 360, 1), softness: num(0, 0, 1),
    colorSpace: sel(CS, 'linear'), ...STROKE, ...BASE,
  }},
  star: { label: 'Star', category: 'Shapes', schema: {
    color: col('#ffffff'), center: pos(0.5, 0.5),
    radius: num(0.4, 0, 1), sides: num(5, 3, 20, 1), innerRatio: num(0.4, 0, 1),
    rotation: num(0, 0, 360, 1), softness: num(0, 0, 1),
    colorSpace: sel(CS, 'linear'), ...STROKE, ...BASE,
  }},
  trapezoid: { label: 'Trapezoid', category: 'Shapes', schema: {
    color: col('#ffffff'), center: pos(0.5, 0.5),
    bottomWidth: num(0.35, 0.01, 1), topWidth: num(0.2, 0.01, 1), height: num(0.25, 0.01, 1),
    rotation: num(0, 0, 360, 1), softness: num(0, 0, 1),
    colorSpace: sel(CS, 'linear'), ...STROKE, ...BASE,
  }},
  vesica: { label: 'Vesica', category: 'Shapes', schema: {
    color: col('#ffffff'), center: pos(0.5, 0.5),
    radius: num(0.35, 0, 1), spread: num(0.5, 0, 1), rotation: num(0, 0, 360, 1),
    softness: num(0, 0, 1), colorSpace: sel(CS, 'linear'), ...STROKE, ...BASE,
  }},

  // ── Shape Effects ────────────────────────────────────────────────────────
  crystal: { label: 'Crystal', category: 'Shape Effects', schema: {
    fresnelColor: col('#ffffff'),
    center: pos(0.5, 0.5), scale: num(1, 0.1, 5),
    refraction: num(0.5, 0, 3), dispersion: num(0.5, 0, 1),
    facets: num(5, 1, 20, 1), edgeSoftness: num(0, 0, 1), innerZoom: num(1.5, 0.1, 5),
    cutout: bool(false), lightAngle: num(270, 0, 360, 1),
    highlights: num(0.5, 0, 1), shadows: num(0.3, 0, 1), brightness: num(1.2, 0, 3),
    fresnel: num(0.05, 0, 1), fresnelSoftness: num(1, 0, 5), ...BASE,
  }},
  emboss: { label: 'Emboss', category: 'Shape Effects', schema: {
    center: pos(0.5, 0.5), scale: num(1, 0.1, 5),
    depth: num(-0.5, -2, 2), lightAngle: num(260, 0, 360, 1),
    lightIntensity: num(0.6, 0, 2), shadowIntensity: num(0.3, 0, 1), ...BASE,
  }},
  glass: { label: 'Glass', category: 'Shape Effects', schema: {
    highlightColor: col('#ffffff'), tintColor: col('#ffffff'),
    center: pos(0.5, 0.5), scale: num(1, 0.1, 5),
    refraction: num(1, 0, 5), edgeSoftness: num(0.1, 0, 1), blur: num(0, 0, 50, 1),
    thickness: num(0.2, 0, 1), aberration: num(0.5, 0, 2),
    cutout: bool(false), highlight: num(0.05, 0, 1), innerZoom: num(1, 0.1, 3),
    highlightSoftness: num(0.5, 0, 1), tintIntensity: num(0, 0, 1),
    tintPreserveLuminosity: bool(true), ...BASE,
  }},
  neon: { label: 'Neon', category: 'Shape Effects', schema: {
    color: col('#00ddff'), secondaryColor: col('#ff00aa'), glowColor: col('#00ddff'),
    center: pos(0.5, 0.5), scale: num(1, 0.1, 5),
    secondaryBlend: num(0.5, 0, 1), tubeThickness: num(0.2, 0.01, 1),
    intensity: num(1.5, 0, 5), hotCoreIntensity: num(0.6, 0, 1),
    glowIntensity: num(0.6, 0, 2), glowRadius: num(0.25, 0, 1),
    lightAngle: num(300, 0, 360, 1), specularIntensity: num(0.5, 0, 1),
    specularSize: num(0.5, 0, 1), cornerSmoothing: num(0.15, 0, 1), ...BASE,
  }},

  // ── Distortions ──────────────────────────────────────────────────────────
  bulge: { label: 'Bulge', category: 'Distortions', schema: {
    center: pos(0.5, 0.5), strength: num(1, -5, 5), radius: num(1, 0, 5),
    falloff: num(0.5, 0, 2), edges: sel(ED, 'stretch'), ...BASE,
  }},
  concentricSpin: { label: 'Concentric Spin', category: 'Distortions', schema: {
    center: pos(0.5, 0.5), intensity: num(20, 0, 100, 1), rings: num(8, 1, 30, 1),
    smoothness: num(0.03, 0, 0.5), seed: num(0, 0, 100, 1),
    speed: num(0.1, 0, 5), speedRandomness: num(0.5, 0, 1),
    edges: sel(ED, 'mirror'), ...BASE,
  }},
  flowField: { label: 'Flow Field', category: 'Distortions', schema: {
    strength: num(0.15, 0, 1), detail: num(2, 0.1, 10, 0.1),
    speed: num(0, 0, 5), evolutionSpeed: num(0, 0, 5),
    edges: sel(ED, 'mirror'), ...BASE,
  }},
  form3D: { label: 'Form 3D', category: 'Distortions', schema: {
    center: pos(0.5, 0.5), zoom: num(50, 1, 200, 1),
    glossiness: num(50, 0, 100, 1), lighting: num(50, 0, 100, 1),
    uvMode: sel(['stretch', 'tile', 'spherical'], 'stretch'),
    speed: num(1, 0, 10, 0.1), ...BASE,
  }},
  glassTiles: { label: 'Glass Tiles', category: 'Distortions', schema: {
    intensity: num(2, 0, 10, 0.1), tileCount: num(20, 1, 100, 1),
    rotation: num(0, 0, 360, 1), roundness: num(0, 0, 1), ...BASE,
  }},
  kaleidoscope: { label: 'Kaleidoscope', category: 'Distortions', schema: {
    center: pos(0.5, 0.5), segments: num(6, 2, 24, 1),
    angle: num(0, 0, 360, 1), edges: sel(ED, 'mirror'), ...BASE,
  }},
  mirror: { label: 'Mirror', category: 'Distortions', schema: {
    center: pos(0.5, 0.5), angle: num(0, 0, 360, 1), edges: sel(ED, 'mirror'), ...BASE,
  }},
  perspective: { label: 'Perspective', category: 'Distortions', schema: {
    center: pos(0.5, 0.5), pan: num(0, -180, 180, 1), tilt: num(0, -90, 90, 1),
    fov: num(60, 10, 150, 1), zoom: num(1, 0.1, 5), offset: pos(0.5, 0.5),
    edges: sel(ED, 'transparent'), ...BASE,
  }},
  polarCoordinates: { label: 'Polar Coordinates', category: 'Distortions', schema: {
    center: pos(0.5, 0.5), wrap: num(1, 0, 5), radius: num(1, 0.1, 5),
    intensity: num(1, 0, 3), edges: sel(ED, 'transparent'), ...BASE,
  }},
  rectangularCoordinates: { label: 'Rectangular Coordinates', category: 'Distortions', schema: {
    center: pos(0.5, 0.5), scale: num(1, 0.1, 5),
    intensity: num(1, 0, 3), edges: sel(ED, 'transparent'), ...BASE,
  }},
  spherize: { label: 'Spherize', category: 'Distortions', schema: {
    lightColor: col('#ffffff'),
    center: pos(0.5, 0.5), radius: num(1, 0.1, 3), depth: num(1, 0, 3),
    lightPosition: pos(0.3, 0.3), lightIntensity: num(0.5, 0, 2), lightSoftness: num(0.5, 0, 1),
    ...BASE,
  }},
  stretch: { label: 'Stretch', category: 'Distortions', schema: {
    center: pos(0.5, 0.5), strength: num(1, -5, 5), angle: num(0, 0, 360, 1),
    falloff: num(0, 0, 2), edges: sel(ED, 'stretch'), ...BASE,
  }},
  twirl: { label: 'Twirl', category: 'Distortions', schema: {
    center: pos(0.5, 0.5), intensity: num(1, -10, 10), edges: sel(ED, 'stretch'), ...BASE,
  }},
  waveDistortion: { label: 'Wave Distortion', category: 'Distortions', schema: {
    strength: num(0.3, 0, 2), frequency: num(1, 0.1, 20, 0.1), speed: num(1, 0, 10, 0.1),
    angle: num(0, 0, 360, 1), waveType: sel(['sine','triangle','square','sawtooth','bounce'], 'sine'),
    edges: sel(ED, 'stretch'), ...BASE,
  }},

  // ── Adjustments ──────────────────────────────────────────────────────────
  brightnessContrast: { label: 'Brightness/Contrast', category: 'Adjustments', schema: {
    brightness: num(0, -1, 1), contrast: num(0, -1, 1), ...BASE,
  }},
  duotone: { label: 'Duotone', category: 'Adjustments', schema: {
    colorA: col('#ff0000'), colorB: col('#023af4'),
    blend: num(0.5, 0, 1), colorSpace: sel(CS, 'linear'), ...BASE,
  }},
  grayscale: { label: 'Grayscale', category: 'Adjustments', schema: { ...BASE }},
  hueShift: { label: 'Hue Shift', category: 'Adjustments', schema: {
    shift: num(0, -180, 180, 1), ...BASE,
  }},
  invert: { label: 'Invert', category: 'Adjustments', schema: { ...BASE }},
  posterize: { label: 'Posterize', category: 'Adjustments', schema: {
    intensity: num(5, 2, 32, 1), ...BASE,
  }},
  saturation: { label: 'Saturation', category: 'Adjustments', schema: {
    intensity: num(1, 0, 3), ...BASE,
  }},
  sharpness: { label: 'Sharpness', category: 'Adjustments', schema: {
    sharpness: num(0, 0, 5), ...BASE,
  }},
  solarize: { label: 'Solarize', category: 'Adjustments', schema: {
    threshold: num(0.5, 0, 1), strength: num(1, 0, 2), ...BASE,
  }},
  tint: { label: 'Tint', category: 'Adjustments', schema: {
    color: col('#761225'), amount: num(1, 0, 1), preserveLuminosity: bool(false), ...BASE,
  }},
  tritone: { label: 'Tritone', category: 'Adjustments', schema: {
    colorA: col('#ce1bea'), colorB: col('#2fff00'), colorC: col('#ffff00'),
    blendMid: num(0.5, 0, 1), colorSpace: sel(CS, 'linear'), ...BASE,
  }},
  vibrance: { label: 'Vibrance', category: 'Adjustments', schema: {
    intensity: num(0, -2, 2), ...BASE,
  }},

  // ── Blurs ─────────────────────────────────────────────────────────────────
  angularBlur: { label: 'Angular Blur', category: 'Blurs', schema: {
    intensity: num(20, 0, 100, 1), center: pos(0.5, 0.5), ...BASE,
  }},
  blur: { label: 'Blur', category: 'Blurs', schema: {
    intensity: num(50, 0, 200, 1), ...BASE,
  }},
  channelBlur: { label: 'Channel Blur', category: 'Blurs', schema: {
    redIntensity: num(0, 0, 100, 1), greenIntensity: num(20, 0, 100, 1),
    blueIntensity: num(40, 0, 100, 1), ...BASE,
  }},
  diffuseBlur: { label: 'Diffuse Blur', category: 'Blurs', schema: {
    intensity: num(30, 0, 100, 1), edges: sel(ED, 'stretch'), ...BASE,
  }},
  linearBlur: { label: 'Linear Blur', category: 'Blurs', schema: {
    intensity: num(30, 0, 100, 1), angle: num(0, 0, 360, 1), ...BASE,
  }},
  progressiveBlur: { label: 'Progressive Blur', category: 'Blurs', schema: {
    intensity: num(50, 0, 200, 1), angle: num(0, 0, 360, 1),
    center: pos(0, 0.5), falloff: num(1, 0, 5), ...BASE,
  }},
  tiltShift: { label: 'Tilt Shift', category: 'Blurs', schema: {
    intensity: num(50, 0, 200, 1), width: num(0.3, 0, 1), falloff: num(0.3, 0, 1),
    angle: num(0, 0, 360, 1), center: pos(0.5, 0.5), ...BASE,
  }},
  zoomBlur: { label: 'Zoom Blur', category: 'Blurs', schema: {
    intensity: num(30, 0, 100, 1), center: pos(0.5, 0.5), ...BASE,
  }},

  // ── Stylize ───────────────────────────────────────────────────────────────
  ascii: { label: 'ASCII', category: 'Stylize', schema: {
    characters: txt(' .:-=+*#@', 'e.g. @#*+=-:.'),
    fontFamily: sel(FONTS, 'JetBrains'),
    cellSize: num(10, 1, 50, 1), gamma: num(1, 0, 3), spacing: num(1, 0, 2),
    alphaThreshold: num(0, 0, 1), preserveAlpha: bool(false), ...BASE,
  }},
  chromaticAberration: { label: 'Chromatic Aberration', category: 'Stylize', schema: {
    strength: num(0.2, 0, 2), angle: num(0, 0, 360, 1),
    redOffset: num(-1, -5, 5), greenOffset: num(0, -5, 5), blueOffset: num(1, -5, 5),
    ...BASE,
  }},
  contourLines: { label: 'Contour Lines', category: 'Stylize', schema: {
    lineColor: col('#000000'), backgroundColor: col('#00000000'),
    levels: num(5, 1, 30, 1), lineWidth: num(2, 0.5, 20, 0.5), softness: num(0, 0, 1),
    gamma: num(0.5, 0, 2), invert: bool(false),
    source: sel(['luminance','alpha'], 'luminance'),
    colorMode: sel(['source','custom'], 'source'), ...BASE,
  }},
  crtScreen: { label: 'CRT Screen', category: 'Stylize', schema: {
    pixelSize: num(128, 1, 512, 1), colorShift: num(1, 0, 10),
    scanlineIntensity: num(0.3, 0, 1), scanlineFrequency: num(200, 10, 1000, 1),
    brightness: num(1, 0, 3), contrast: num(1, 0, 3),
    vignetteIntensity: num(1, 0, 3), vignetteRadius: num(0.5, 0, 1), ...BASE,
  }},
  dither: { label: 'Dither', category: 'Stylize', schema: {
    colorA: col('#000000'), colorB: col('#ffffff'),
    pattern: sel(['bayer2','bayer4','bayer8','clusteredDot','blueNoise','whiteNoise'], 'bayer4'),
    pixelSize: num(4, 1, 20, 1), threshold: num(0.5, 0, 1), spread: num(1, 0, 1),
    colorMode: sel(['custom','source'], 'custom'), ...BASE,
  }},
  dropShadow: { label: 'Drop Shadow', category: 'Stylize', schema: {
    color: col('#000000'), distance: num(0.1, 0, 1), angle: num(135, 0, 360, 1),
    blur: num(5, 0, 50, 1), intensity: num(0.5, 0, 1), cutout: bool(false), ...BASE,
  }},
  filmGrain: { label: 'Film Grain', category: 'Stylize', schema: {
    strength: num(0.5, 0, 1), ...BASE,
  }},
  glitch: { label: 'Glitch', category: 'Stylize', schema: {
    intensity: num(0.5, 0, 1), speed: num(1, 0.1, 5, 0.1), rgbShift: num(5, 0, 20, 0.5),
    blockDensity: num(10, 2, 50, 1), colorBarIntensity: num(0.2, 0, 1),
    mirrorAmount: num(0.3, 0, 1), scanlineIntensity: num(0.2, 0, 1), ...BASE,
  }},
  glow: { label: 'Glow', category: 'Stylize', schema: {
    intensity: num(1, 0, 5), threshold: num(0.5, 0, 1), size: num(10, 1, 100, 1),
    ...BASE,
  }},
  halftone: { label: 'Halftone', category: 'Stylize', schema: {
    frequency: num(100, 1, 300, 1), angle: num(45, 0, 360, 1), smoothness: num(0.1, 0, 1),
    ...BASE,
  }},
  lensFlare: { label: 'Lens Flare', category: 'Stylize', schema: {
    lightPosition: pos(0.3, 0.3), intensity: num(0.5, 0, 2),
    ghostIntensity: num(0.4, 0, 2), ghostSpread: num(0.7, 0.1, 2), ghostChroma: num(0.3, 0, 1),
    haloIntensity: num(0.4, 0, 2), haloRadius: num(0.6, 0.1, 1), haloChroma: num(0.6, 0, 1),
    haloSoftness: num(0.8, 0, 1), starburstIntensity: num(0.3, 0, 2),
    starburstPoints: num(6, 3, 16, 1), streakIntensity: num(0.15, 0, 1),
    streakLength: num(0.5, 0, 1), glareIntensity: num(0.2, 0, 1), glareSize: num(0.5, 0, 2),
    edgeFade: num(0.2, 0, 1), speed: num(0.5, 0, 3), ...BASE,
  }},
  paper: { label: 'Paper', category: 'Stylize', schema: {
    roughness: num(0.3, 0, 1), grainScale: num(1, 0.1, 3, 0.1),
    displacement: num(0.15, 0, 1), seed: num(0, 0, 100, 1), ...BASE,
  }},
  pixelate: { label: 'Pixelate', category: 'Stylize', schema: {
    scale: num(50, 1, 200, 1), gap: num(0, 0, 0.95), roundness: num(0, 0, 1), ...BASE,
  }},
  vignette: { label: 'Vignette', category: 'Stylize', schema: {
    color: col('#000000'), center: pos(0.5, 0.5),
    radius: num(0.5, 0, 2), falloff: num(0.5, 0, 2), intensity: num(1, 0, 3), ...BASE,
  }},
  vhs: { label: 'VHS', category: 'Stylize', schema: {
    wobble: num(1, 0, 3), scanlineNoise: num(0.6, 0, 1),
    smear: num(0.2, 0, 1), speed: num(1, 0.1, 3),
    ...BASE,
  }},

  // ── Interactive ───────────────────────────────────────────────────────────
  chromaFlow: { label: 'Chroma Flow', category: 'Interactive', schema: {
    baseColor: col('#0066ff'), upColor: col('#00ff00'), downColor: col('#ff0000'),
    leftColor: col('#0000ff'), rightColor: col('#ffff00'),
    intensity: num(1, 0, 5), radius: num(3, 0.1, 20, 0.1), momentum: num(30, 1, 100, 1),
    ...BASE,
  }},
  cursorRipples: { label: 'Cursor Ripples', category: 'Interactive', schema: {
    intensity: num(10, 0, 50, 1), decay: num(10, 1, 50, 1), radius: num(0.5, 0.1, 3),
    chromaticSplit: num(1, 0, 10, 0.1), edges: sel(ED, 'stretch'), ...BASE,
  }},
  cursorTrail: { label: 'Cursor Trail', category: 'Interactive', schema: {
    colorA: col('#00aaff'), colorB: col('#ff00aa'),
    radius: num(0.5, 0.01, 3), length: num(0.5, 0, 1), shrink: num(1, 0, 3),
    colorSpace: sel(CS, 'linear'), ...BASE,
  }},
  gridDistortion: { label: 'Grid Distortion', category: 'Interactive', schema: {
    intensity: num(1, 0, 5), decay: num(3, 0.1, 20, 0.1), radius: num(1, 0.1, 5),
    gridSize: num(20, 2, 100, 1), edges: sel(ED, 'stretch'), ...BASE,
  }},
  liquify: { label: 'Liquify', category: 'Interactive', schema: {
    intensity: num(10, 0, 50, 1), stiffness: num(3, 0.1, 20, 0.1),
    damping: num(3, 0.1, 20, 0.1), radius: num(1, 0.1, 5), edges: sel(ED, 'stretch'),
    ...BASE,
  }},
  shatter: { label: 'Shatter', category: 'Interactive', schema: {
    crackWidth: num(1, 0.1, 10, 0.1), intensity: num(4, 0, 20, 0.1),
    radius: num(0.4, 0.01, 2), decay: num(1, 0.1, 10, 0.1), seed: num(2, 0, 100, 1),
    chromaticSplit: num(1, 0, 10, 0.1), refractionStrength: num(5, 0, 30, 0.1),
    shardLighting: num(0.1, 0, 1), edges: sel(ED, 'mirror'), ...BASE,
  }},
};

// ─── Component Map ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  solidColor: SolidColor, imageTexture: ImageTexture, videoTexture: VideoTexture,
  webcamTexture: WebcamTexture, aurora: Aurora, beam: Beam, blob: Blob,
  checkerboard: Checkerboard, conicGradient: ConicGradient, diamondGradient: DiamondGradient,
  dotGrid: DotGrid, fallingLines: FallingLines, floatingParticles: FloatingParticles,
  flowingGradient: FlowingGradient, godrays: Godrays, grid: Grid, hexGrid: HexGrid,
  linearGradient: LinearGradient, multiPointGradient: MultiPointGradient, plasma: Plasma,
  radialGradient: RadialGradient, ripples: Ripples, simplexNoise: SimplexNoise,
  sineWave: SineWave, spiral: Spiral, strands: Strands, stripes: Stripes,
  studioBackground: StudioBackground, swirl: Swirl, truchet: Truchet,
  voronoi: Voronoi, weave: Weave,
  circle: Circle, crescent: Crescent, cross: Cross, ellipse: Ellipse, flower: Flower,
  polygon: Polygon, ring: Ring, roundedRect: RoundedRect, star: Star,
  trapezoid: Trapezoid, vesica: Vesica,
  crystal: Crystal, emboss: Emboss, glass: Glass, neon: Neon,
  bulge: Bulge, concentricSpin: ConcentricSpin, flowField: FlowField, form3D: Form3D,
  glassTiles: GlassTiles, kaleidoscope: Kaleidoscope, mirror: Mirror,
  perspective: Perspective, polarCoordinates: PolarCoordinates,
  rectangularCoordinates: RectangularCoordinates, spherize: Spherize, stretch: Stretch,
  twirl: Twirl, waveDistortion: WaveDistortion,
  brightnessContrast: BrightnessContrast, duotone: Duotone, grayscale: Grayscale,
  hueShift: HueShift, invert: Invert, posterize: Posterize, saturation: Saturation,
  sharpness: Sharpness, solarize: Solarize, tint: Tint, tritone: Tritone, vibrance: Vibrance,
  angularBlur: AngularBlur, blur: Blur, channelBlur: ChannelBlur, diffuseBlur: DiffuseBlur,
  linearBlur: LinearBlur, progressiveBlur: ProgressiveBlur, tiltShift: TiltShift, zoomBlur: ZoomBlur,
  ascii: Ascii, chromaticAberration: ChromaticAberration, contourLines: ContourLines,
  crtScreen: CRTScreen, dither: Dither, dropShadow: DropShadow, filmGrain: FilmGrain,
  glitch: Glitch, glow: Glow, halftone: Halftone, lensFlare: LensFlare,
  paper: Paper, pixelate: Pixelate, vignette: Vignette,
  chromaFlow: ChromaFlow, cursorRipples: CursorRipples, cursorTrail: CursorTrail,
  gridDistortion: GridDistortion, liquify: Liquify, shatter: Shatter,
  domTexture: DOMTexture, fog: Fog, smoke: Smoke, smokeFill: SmokeFill, vhs: VHS,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function defaultProps(type: string): Record<string, PropValue> {
  const def = REGISTRY[type];
  if (!def) return {};
  const out: Record<string, PropValue> = {};
  for (const [key, schema] of Object.entries(def.schema)) {
    if (schema.kind === 'position') {
      out[key] = { x: schema.defaultX, y: schema.defaultY };
    } else if (schema.kind === 'transform') {
      out[key] = { scale: schema.defaultScale, offsetX: schema.defaultOffsetX, offsetY: schema.defaultOffsetY };
    } else {
      out[key] = schema.default;
    }
  }
  return out;
}
