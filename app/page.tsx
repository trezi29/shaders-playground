'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Shader,
  // Textures
  Aurora,
  Beam,
  Blob,
  Checkerboard,
  ConicGradient,
  DiamondGradient,
  DotGrid,
  FallingLines,
  FloatingParticles,
  FlowingGradient,
  Godrays,
  Grid,
  HexGrid,
  ImageTexture,
  LinearGradient,
  MultiPointGradient,
  Plasma,
  RadialGradient,
  Ripples,
  SimplexNoise,
  SineWave,
  SolidColor,
  Spiral,
  Strands,
  Stripes,
  StudioBackground,
  Swirl,
  Truchet,
  VideoTexture,
  Voronoi,
  Weave,
  WebcamTexture,
  // Shapes
  Circle,
  Crescent,
  Cross,
  Ellipse,
  Flower,
  Polygon,
  Ring,
  RoundedRect,
  Star,
  Trapezoid,
  Vesica,
  // Shape Effects
  Crystal,
  Emboss,
  Glass,
  Neon,
  // Distortions
  Bulge,
  ConcentricSpin,
  FlowField,
  Form3D,
  GlassTiles,
  Kaleidoscope,
  Mirror,
  Perspective,
  PolarCoordinates,
  RectangularCoordinates,
  Spherize,
  Stretch,
  Twirl,
  WaveDistortion,
  // Adjustments
  BrightnessContrast,
  Duotone,
  Grayscale,
  HueShift,
  Invert,
  Posterize,
  Saturation,
  Sharpness,
  Solarize,
  Tint,
  Tritone,
  Vibrance,
  // Blurs
  AngularBlur,
  Blur,
  ChannelBlur,
  DiffuseBlur,
  LinearBlur,
  ProgressiveBlur,
  TiltShift,
  ZoomBlur,
  // Stylize
  Ascii,
  ChromaticAberration,
  ContourLines,
  CRTScreen,
  Dither,
  DropShadow,
  FilmGrain,
  Glitch,
  Glow,
  Halftone,
  LensFlare,
  Paper,
  Pixelate,
  Vignette,
  // Interactive
  ChromaFlow,
  CursorRipples,
  CursorTrail,
  GridDistortion,
  Liquify,
  Shatter,
} from 'shaders/react';
import { useDialKit } from 'dialkit';

const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'luminosity',
  'color',
  'linearDodge',
  'colorDodge',
  'colorBurn',
  'linearBurn',
  'difference',
  'exclusion',
  'darken',
  'lighten',
];
const COLOR_SPACES = ['linear', 'oklch', 'oklab', 'hsl', 'hsv', 'lch'];
const EDGES = ['stretch', 'transparent', 'mirror', 'wrap'];
const STROKE_POSITIONS = ['center', 'inside', 'outside'];
const OBJECT_FITS = ['cover', 'contain', 'fill', 'none'];

export default function Home() {
  const p = useDialKit('Controls', {
    textures: {
      solidColor: {
        enabled: false,
        color: { type: 'color' as const, default: '#5b18ca' },
      },
      imageTexture: {
        enabled: false,
        url: {
          type: 'text' as const,
          default: '/hands.jpg',
          placeholder: 'Image URL',
        },
        objectFit: {
          type: 'select' as const,
          options: OBJECT_FITS,
          default: 'cover',
        },
      },
      videoTexture: {
        enabled: false,
        url: {
          type: 'text' as const,
          default: '/capitello-wb.mp4',
          placeholder: 'Video URL',
        },
        objectFit: {
          type: 'select' as const,
          options: OBJECT_FITS,
          default: 'cover',
        },
        loop: true,
      },
      aurora: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#a533f8' },
        colorB: { type: 'color' as const, default: '#22ee88' },
        colorC: { type: 'color' as const, default: '#1694e8' },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
        balance: [50, 0, 100, 1],
        intensity: [80, 0, 200, 1],
        curtainCount: [4, 1, 20, 1],
        speed: [5, 0, 20, 0.1],
        waviness: [50, 0, 100, 1],
        rayDensity: [20, 1, 100, 1],
        height: [120, 0, 300, 1],
        center: { x: [0.5, 0, 1, 0.01], y: [0, 0, 1, 0.01] },
        seed: [0, 0, 100, 1],
      },
      beam: {
        enabled: false,
        startPosition: { x: [0.2, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        endPosition: { x: [0.8, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        startThickness: [0.2, 0, 1, 0.01],
        endThickness: [0.2, 0, 1, 0.01],
        startSoftness: [0.5, 0, 1, 0.01],
        endSoftness: [0.5, 0, 1, 0.01],
        insideColor: { type: 'color' as const, default: '#FF0000' },
        outsideColor: { type: 'color' as const, default: '#0000FF' },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      blob: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#ff6b35' },
        colorB: { type: 'color' as const, default: '#e91e63' },
        size: [0.5, 0, 2, 0.01],
        deformation: [0.5, 0, 1, 0.01],
        softness: [0.5, 0, 1, 0.01],
        highlightIntensity: [0.5, 0, 1, 0.01],
        highlightX: [0.3, -1, 1, 0.01],
        highlightY: [-0.3, -1, 1, 0.01],
        highlightZ: [0.4, 0, 1, 0.01],
        highlightColor: { type: 'color' as const, default: '#ffe11a' },
        speed: [0.5, 0, 5, 0.01],
        seed: [1, 0, 100, 1],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
      },
      checkerboard: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#cccccc' },
        colorB: { type: 'color' as const, default: '#999999' },
        cells: [8, 1, 50, 1],
        softness: [0, 0, 1, 0.01],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      conicGradient: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#FF0080' },
        colorB: { type: 'color' as const, default: '#00BFFF' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        rotation: [0, 0, 360, 1],
        repeat: [1, 1, 20, 1],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'oklch',
        },
      },
      diamondGradient: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#4ffb4a' },
        colorB: { type: 'color' as const, default: '#4f1238' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        size: [0.7, 0.1, 3, 0.01],
        rotation: [0, 0, 360, 1],
        repeat: [1, 1, 20, 1],
        roundness: [0, 0, 1, 0.01],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'oklch',
        },
      },
      dotGrid: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        density: [30, 1, 100, 1],
        dotSize: [0.3, 0.01, 1, 0.01],
        twinkle: [0, 0, 1, 0.01],
      },
      fallingLines: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#ffffff' },
        colorB: { type: 'color' as const, default: '#ffffff00' },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
        angle: [90, 0, 360, 1],
        speed: [0.5, 0, 3, 0.01],
        speedVariance: [0.3, 0, 1, 0.01],
        density: [15, 1, 60, 1],
        trailLength: [0.35, 0, 1, 0.01],
        balance: [0.5, 0, 1, 0.01],
        strokeWidth: [0.15, 0, 1, 0.01],
        rounding: [1, 0, 1, 0.01],
      },
      floatingParticles: {
        enabled: false,
        randomness: [0.25, 0, 1, 0.01],
        speed: [0.25, 0, 5, 0.01],
        angle: [90, 0, 360, 1],
        particleSize: [1, 0.1, 10, 0.1],
        particleSoftness: [0, 0, 1, 0.01],
        twinkle: [0.5, 0, 1, 0.01],
        count: [5, 1, 50, 1],
        particleColor: { type: 'color' as const, default: '#ffffff' },
        speedVariance: [0.3, 0, 1, 0.01],
        angleVariance: [30, 0, 180, 1],
        particleDensity: [3, 1, 20, 1],
      },
      flowingGradient: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#0a0015' },
        colorB: { type: 'color' as const, default: '#6b17e6' },
        colorC: { type: 'color' as const, default: '#ff4d6a' },
        colorD: { type: 'color' as const, default: '#ff6b35' },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'oklch',
        },
        speed: [1, 0, 10, 0.1],
        distortion: [0.5, 0, 2, 0.1],
        seed: [0, 0, 100, 1],
        blendMode: {
          type: 'select' as const,
          options: BLEND_MODES,
          default: 'overlay',
        },
      },
      godrays: {
        enabled: false,
        center: { x: [0, 0, 1, 0.01], y: [0, 0, 1, 0.01] },
        density: [0.3, 0, 1, 0.01],
        intensity: [0.8, 0, 3, 0.01],
        spotty: [1, 0, 3, 0.01],
        speed: [0.5, 0, 5, 0.01],
        rayColor: { type: 'color' as const, default: '#4283fb' },
        backgroundColor: { type: 'color' as const, default: '#00000000' },
      },
      grid: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        cells: [10, 1, 100, 1],
        thickness: [1, 0.5, 20, 0.5],
        rotation: [0, 0, 360, 1],
      },
      hexGrid: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#000000' },
        colorB: { type: 'color' as const, default: '#ffffff' },
        cells: [8, 1, 50, 1],
        thickness: [1, 0.5, 20, 0.5],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      linearGradient: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#1aff00' },
        colorB: { type: 'color' as const, default: '#0000ff' },
        start: { x: [0, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        end: { x: [1, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        angle: [0, 0, 360, 1],
        edges: { type: 'select' as const, options: EDGES, default: 'stretch' },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      multiPointGradient: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#4776E6' },
        positionA: { x: [0.2, 0, 1, 0.01], y: [0.2, 0, 1, 0.01] },
        colorB: { type: 'color' as const, default: '#C44DFF' },
        positionB: { x: [0.8, 0, 1, 0.01], y: [0.2, 0, 1, 0.01] },
        colorC: { type: 'color' as const, default: '#1ABC9C' },
        positionC: { x: [0.2, 0, 1, 0.01], y: [0.8, 0, 1, 0.01] },
        colorD: { type: 'color' as const, default: '#F8BBD9' },
        positionD: { x: [0.8, 0, 1, 0.01], y: [0.8, 0, 1, 0.01] },
        colorE: { type: 'color' as const, default: '#FF8C42' },
        positionE: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        smoothness: [2, 0.1, 10, 0.1],
      },
      plasma: {
        enabled: false,
        density: [2, 0.1, 10, 0.1],
        speed: [2, 0, 10, 0.1],
        intensity: [1.5, 0, 5, 0.01],
        warp: [0.4, 0, 2, 0.01],
        contrast: [1, 0, 5, 0.01],
        balance: [50, 0, 100, 1],
        colorA: { type: 'color' as const, default: '#7018be' },
        colorB: { type: 'color' as const, default: '#000000' },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      radialGradient: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#ff0000' },
        colorB: { type: 'color' as const, default: '#0000ff' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        radius: [1, 0.1, 5, 0.01],
        repeat: [1, 1, 20, 1],
        aspect: [1, 0.1, 5, 0.01],
        skewAngle: [0, 0, 360, 1],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      ripples: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        colorA: { type: 'color' as const, default: '#ffffff' },
        colorB: { type: 'color' as const, default: '#000000' },
        speed: [1, 0, 10, 0.1],
        frequency: [20, 1, 100, 1],
        softness: [0, 0, 1, 0.01],
        thickness: [0.5, 0, 1, 0.01],
        phase: [0, 0, 6.28, 0.01],
      },
      simplexNoise: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#ffffff' },
        colorB: { type: 'color' as const, default: '#000000' },
        blendMode: {
          type: 'select' as const,
          options: BLEND_MODES,
          default: 'overlay',
        },
        scale: [2, -2, 5, 0.1],
        balance: [0, -1, 1, 0.1],
        contrast: [0, -2, 5, 0.1],
        seed: [0, 0, 100, 1],
        speed: [1, 0, 5, 0.1],
      },
      sineWave: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        amplitude: [0.15, 0, 1, 0.01],
        frequency: [1, 0.1, 20, 0.1],
        speed: [1, 0, 10, 0.1],
        angle: [0, 0, 360, 1],
        position: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        thickness: [0.2, 0.01, 1, 0.01],
        softness: [0.4, 0, 1, 0.01],
      },
      spiral: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#000000' },
        colorB: { type: 'color' as const, default: '#ffffff' },
        strokeWidth: [0.5, 0, 2, 0.01],
        strokeFalloff: [0, 0, 1, 0.01],
        softness: [0, 0, 1, 0.01],
        speed: [1, 0, 10, 0.1],
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        scale: [1, 0.1, 10, 0.1],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      strands: {
        enabled: false,
        speed: [0.5, 0, 5, 0.01],
        amplitude: [1, 0, 5, 0.01],
        frequency: [1, 0.1, 10, 0.1],
        lineCount: [12, 1, 50, 1],
        lineWidth: [0.1, 0.01, 1, 0.01],
        waveColor: { type: 'color' as const, default: '#f1c907' },
        pinEdges: true,
        start: { x: [0, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        end: { x: [1, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
      },
      stripes: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#000000' },
        colorB: { type: 'color' as const, default: '#ffffff' },
        angle: [45, 0, 360, 1],
        density: [5, 1, 50, 1],
        balance: [0.5, 0, 1, 0.01],
        softness: [0, 0, 1, 0.01],
        speed: [0.2, 0, 5, 0.01],
        offset: [0, 0, 1, 0.01],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      studioBackground: {
        enabled: false,
        color: { type: 'color' as const, default: '#d8dbec' },
        brightness: [20, 0, 100, 1],
        keyColor: { type: 'color' as const, default: '#d5e4ea' },
        keyIntensity: [40, 0, 100, 1],
        keySoftness: [50, 0, 100, 1],
        fillColor: { type: 'color' as const, default: '#d5e4ea' },
        fillIntensity: [10, 0, 100, 1],
        fillSoftness: [70, 0, 100, 1],
        fillAngle: [70, 0, 360, 1],
        backColor: { type: 'color' as const, default: '#c8d4e8' },
        backIntensity: [20, 0, 100, 1],
        backSoftness: [80, 0, 100, 1],
        center: { x: [0.5, 0, 1, 0.01], y: [0.8, 0, 1, 0.01] },
        lightTarget: [100, 0, 300, 1],
        wallCurvature: [10, 0, 100, 1],
        vignette: [0, 0, 100, 1],
        ambientIntensity: [50, 0, 100, 1],
        ambientSpeed: [2, 0, 10, 0.1],
        seed: [0, 0, 100, 1],
      },
      swirl: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#1275d8' },
        colorB: { type: 'color' as const, default: '#e19136' },
        speed: [1, 0, 10, 0.1],
        detail: [1, 0.1, 10, 0.1],
        blend: [50, 0, 100, 1],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      truchet: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#000000' },
        colorB: { type: 'color' as const, default: '#ffffff' },
        cells: [10, 1, 50, 1],
        thickness: [2, 0.5, 20, 0.5],
        seed: [0, 0, 100, 1],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      voronoi: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#3186cf' },
        colorB: { type: 'color' as const, default: '#fc02dd' },
        colorBorder: { type: 'color' as const, default: '#000000' },
        scale: [6, 1, 30, 0.5],
        speed: [0.5, 0, 5, 0.01],
        seed: [0, 0, 100, 1],
        edgeIntensity: [0.5, 0, 1, 0.01],
        edgeSoftness: [0.05, 0, 0.5, 0.01],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'oklch',
        },
      },
      weave: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#c4c4c4' },
        colorB: { type: 'color' as const, default: '#4d4d4d' },
        cells: [10, 1, 50, 1],
        gap: [0.25, 0, 0.5, 0.01],
        rotation: [0, 0, 360, 1],
      },
      webcamTexture: {
        enabled: false,
        objectFit: {
          type: 'select' as const,
          options: OBJECT_FITS,
          default: 'cover',
        },
        mirror: true,
      },
    },

    shapes: {
      circle: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        radius: [1, 0, 3, 0.01],
        softness: [0, 0, 1, 0.01],
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        strokeThickness: [0, 0, 0.5, 0.01],
        strokeColor: { type: 'color' as const, default: '#000000' },
        strokePosition: {
          type: 'select' as const,
          options: STROKE_POSITIONS,
          default: 'center',
        },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      crescent: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        radius: [0.3, 0, 1, 0.01],
        innerRatio: [0.8, 0, 1, 0.01],
        offset: [0.2, 0, 1, 0.01],
        rotation: [0, 0, 360, 1],
        softness: [0, 0, 1, 0.01],
        strokeThickness: [0, 0, 0.5, 0.01],
        strokeColor: { type: 'color' as const, default: '#000000' },
        strokePosition: {
          type: 'select' as const,
          options: STROKE_POSITIONS,
          default: 'center',
        },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      cross: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        radius: [0.35, 0, 1, 0.01],
        thickness: [0.08, 0.01, 0.5, 0.01],
        rounding: [0, 0, 1, 0.01],
        rotation: [0, 0, 360, 1],
        softness: [0, 0, 1, 0.01],
        strokeThickness: [0, 0, 0.5, 0.01],
        strokeColor: { type: 'color' as const, default: '#000000' },
        strokePosition: {
          type: 'select' as const,
          options: STROKE_POSITIONS,
          default: 'center',
        },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      ellipse: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        radiusX: [0.35, 0, 1, 0.01],
        radiusY: [0.2, 0, 1, 0.01],
        rotation: [0, 0, 360, 1],
        softness: [0, 0, 1, 0.01],
        strokeThickness: [0, 0, 0.5, 0.01],
        strokeColor: { type: 'color' as const, default: '#000000' },
        strokePosition: {
          type: 'select' as const,
          options: STROKE_POSITIONS,
          default: 'center',
        },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      flower: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        radius: [0.4, 0, 1, 0.01],
        sides: [5, 3, 20, 1],
        innerRatio: [0.4, 0, 1, 0.01],
        rotation: [0, 0, 360, 1],
        softness: [0, 0, 1, 0.01],
        strokeThickness: [0, 0, 0.5, 0.01],
        strokeColor: { type: 'color' as const, default: '#000000' },
        strokePosition: {
          type: 'select' as const,
          options: STROKE_POSITIONS,
          default: 'center',
        },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      polygon: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        radius: [0.4, 0, 1, 0.01],
        sides: [6, 3, 20, 1],
        rounding: [0, 0, 1, 0.01],
        rotation: [0, 0, 360, 1],
        softness: [0, 0, 1, 0.01],
        strokeThickness: [0, 0, 0.5, 0.01],
        strokeColor: { type: 'color' as const, default: '#000000' },
        strokePosition: {
          type: 'select' as const,
          options: STROKE_POSITIONS,
          default: 'center',
        },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      ring: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        radius: [0.3, 0, 1, 0.01],
        thickness: [0.07, 0.01, 0.5, 0.01],
        softness: [0, 0, 1, 0.01],
        strokeThickness: [0, 0, 0.5, 0.01],
        strokeColor: { type: 'color' as const, default: '#000000' },
        strokePosition: {
          type: 'select' as const,
          options: STROKE_POSITIONS,
          default: 'center',
        },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      roundedRect: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        width: [0.35, 0.01, 1, 0.01],
        height: [0.25, 0.01, 1, 0.01],
        rounding: [0.05, 0, 0.5, 0.01],
        rotation: [0, 0, 360, 1],
        softness: [0, 0, 1, 0.01],
        strokeThickness: [0, 0, 0.5, 0.01],
        strokeColor: { type: 'color' as const, default: '#000000' },
        strokePosition: {
          type: 'select' as const,
          options: STROKE_POSITIONS,
          default: 'center',
        },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      star: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        radius: [0.4, 0, 1, 0.01],
        sides: [5, 3, 20, 1],
        innerRatio: [0.4, 0, 1, 0.01],
        rotation: [0, 0, 360, 1],
        softness: [0, 0, 1, 0.01],
        strokeThickness: [0, 0, 0.5, 0.01],
        strokeColor: { type: 'color' as const, default: '#000000' },
        strokePosition: {
          type: 'select' as const,
          options: STROKE_POSITIONS,
          default: 'center',
        },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      trapezoid: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        bottomWidth: [0.35, 0.01, 1, 0.01],
        topWidth: [0.2, 0.01, 1, 0.01],
        height: [0.25, 0.01, 1, 0.01],
        rotation: [0, 0, 360, 1],
        softness: [0, 0, 1, 0.01],
        strokeThickness: [0, 0, 0.5, 0.01],
        strokeColor: { type: 'color' as const, default: '#000000' },
        strokePosition: {
          type: 'select' as const,
          options: STROKE_POSITIONS,
          default: 'center',
        },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      vesica: {
        enabled: false,
        color: { type: 'color' as const, default: '#ffffff' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        radius: [0.35, 0, 1, 0.01],
        spread: [0.5, 0, 1, 0.01],
        rotation: [0, 0, 360, 1],
        softness: [0, 0, 1, 0.01],
        strokeThickness: [0, 0, 0.5, 0.01],
        strokeColor: { type: 'color' as const, default: '#000000' },
        strokePosition: {
          type: 'select' as const,
          options: STROKE_POSITIONS,
          default: 'center',
        },
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
    },

    shapeEffects: {
      crystal: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        scale: [1, 0.1, 5, 0.01],
        refraction: [0.5, 0, 3, 0.01],
        dispersion: [0.5, 0, 1, 0.01],
        facets: [5, 1, 20, 1],
        edgeSoftness: [0, 0, 1, 0.01],
        innerZoom: [1.5, 0.1, 5, 0.01],
        cutout: false,
        lightAngle: [270, 0, 360, 1],
        highlights: [0.5, 0, 1, 0.01],
        shadows: [0.3, 0, 1, 0.01],
        brightness: [1.2, 0, 3, 0.01],
        fresnel: [0.05, 0, 1, 0.01],
        fresnelSoftness: [1, 0, 5, 0.01],
        fresnelColor: { type: 'color' as const, default: '#ffffff' },
      },
      emboss: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        scale: [1, 0.1, 5, 0.01],
        depth: [-0.5, -2, 2, 0.01],
        lightAngle: [260, 0, 360, 1],
        lightIntensity: [0.6, 0, 2, 0.01],
        shadowIntensity: [0.3, 0, 1, 0.01],
      },
      glass: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        scale: [1, 0.1, 5, 0.01],
        refraction: [1, 0, 5, 0.01],
        edgeSoftness: [0.1, 0, 1, 0.01],
        blur: [0, 0, 50, 1],
        thickness: [0.2, 0, 1, 0.01],
        aberration: [0.5, 0, 2, 0.01],
        cutout: false,
        highlight: [0.05, 0, 1, 0.01],
        innerZoom: [1, 0.1, 3, 0.01],
        highlightColor: { type: 'color' as const, default: '#ffffff' },
        highlightSoftness: [0.5, 0, 1, 0.01],
        tintColor: { type: 'color' as const, default: '#ffffff' },
        tintIntensity: [0, 0, 1, 0.01],
        tintPreserveLuminosity: true,
      },
      neon: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        scale: [1, 0.1, 5, 0.01],
        color: { type: 'color' as const, default: '#00ddff' },
        secondaryColor: { type: 'color' as const, default: '#ff00aa' },
        secondaryBlend: [0.5, 0, 1, 0.01],
        glowColor: { type: 'color' as const, default: '#00ddff' },
        tubeThickness: [0.2, 0.01, 1, 0.01],
        intensity: [1.5, 0, 5, 0.01],
        hotCoreIntensity: [0.6, 0, 1, 0.01],
        glowIntensity: [0.6, 0, 2, 0.01],
        glowRadius: [0.25, 0, 1, 0.01],
        lightAngle: [300, 0, 360, 1],
        specularIntensity: [0.5, 0, 1, 0.01],
        specularSize: [0.5, 0, 1, 0.01],
        cornerSmoothing: [0.15, 0, 1, 0.01],
      },
    },

    distortions: {
      bulge: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        strength: [1, -5, 5, 0.01],
        radius: [1, 0, 5, 0.01],
        falloff: [0.5, 0, 2, 0.01],
        edges: { type: 'select' as const, options: EDGES, default: 'stretch' },
      },
      concentricSpin: {
        enabled: false,
        intensity: [20, 0, 100, 1],
        rings: [8, 1, 30, 1],
        smoothness: [0.03, 0, 0.5, 0.01],
        seed: [0, 0, 100, 1],
        speed: [0.1, 0, 5, 0.01],
        speedRandomness: [0.5, 0, 1, 0.01],
        edges: { type: 'select' as const, options: EDGES, default: 'mirror' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
      },
      flowField: {
        enabled: false,
        strength: [0.15, 0, 1, 0.01],
        detail: [2, 0.1, 10, 0.1],
        speed: [0, 0, 5, 0.01],
        evolutionSpeed: [0, 0, 5, 0.01],
        edges: { type: 'select' as const, options: EDGES, default: 'mirror' },
      },
      form3D: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        zoom: [50, 1, 200, 1],
        glossiness: [50, 0, 100, 1],
        lighting: [50, 0, 100, 1],
        uvMode: {
          type: 'select' as const,
          options: ['stretch', 'tile', 'spherical'],
          default: 'stretch',
        },
        speed: [1, 0, 10, 0.1],
      },
      glassTiles: {
        enabled: false,
        intensity: [2, 0, 10, 0.1],
        tileCount: [20, 1, 100, 1],
        rotation: [0, 0, 360, 1],
        roundness: [0, 0, 1, 0.01],
      },
      kaleidoscope: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        segments: [6, 2, 24, 1],
        angle: [0, 0, 360, 1],
        edges: { type: 'select' as const, options: EDGES, default: 'mirror' },
      },
      mirror: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        angle: [0, 0, 360, 1],
        edges: { type: 'select' as const, options: EDGES, default: 'mirror' },
      },
      perspective: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        pan: [0, -180, 180, 1],
        tilt: [0, -90, 90, 1],
        fov: [60, 10, 150, 1],
        zoom: [1, 0.1, 5, 0.01],
        offset: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        edges: {
          type: 'select' as const,
          options: EDGES,
          default: 'transparent',
        },
      },
      polarCoordinates: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        wrap: [1, 0, 5, 0.01],
        radius: [1, 0.1, 5, 0.01],
        intensity: [1, 0, 3, 0.01],
        edges: {
          type: 'select' as const,
          options: EDGES,
          default: 'transparent',
        },
      },
      rectangularCoordinates: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        scale: [1, 0.1, 5, 0.01],
        intensity: [1, 0, 3, 0.01],
        edges: {
          type: 'select' as const,
          options: EDGES,
          default: 'transparent',
        },
      },
      spherize: {
        enabled: false,
        radius: [1, 0.1, 3, 0.01],
        depth: [1, 0, 3, 0.01],
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        lightPosition: { x: [0.3, 0, 1, 0.01], y: [0.3, 0, 1, 0.01] },
        lightIntensity: [0.5, 0, 2, 0.01],
        lightSoftness: [0.5, 0, 1, 0.01],
        lightColor: { type: 'color' as const, default: '#ffffff' },
      },
      stretch: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        strength: [1, -5, 5, 0.01],
        angle: [0, 0, 360, 1],
        falloff: [0, 0, 2, 0.01],
        edges: { type: 'select' as const, options: EDGES, default: 'stretch' },
      },
      twirl: {
        enabled: false,
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        intensity: [1, -10, 10, 0.01],
        edges: { type: 'select' as const, options: EDGES, default: 'stretch' },
      },
      waveDistortion: {
        enabled: false,
        strength: [0.3, 0, 2, 0.01],
        frequency: [1, 0.1, 20, 0.1],
        speed: [1, 0, 10, 0.1],
        angle: [0, 0, 360, 1],
        waveType: {
          type: 'select' as const,
          options: ['sine', 'triangle', 'square', 'sawtooth', 'bounce'],
          default: 'sine',
        },
        edges: { type: 'select' as const, options: EDGES, default: 'stretch' },
      },
    },

    adjustments: {
      brightnessContrast: {
        enabled: false,
        brightness: [0, -1, 1, 0.01],
        contrast: [0, -1, 1, 0.01],
      },
      duotone: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#ff0000' },
        colorB: { type: 'color' as const, default: '#023af4' },
        blend: [0.5, 0, 1, 0.01],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      grayscale: {
        enabled: false,
      },
      hueShift: {
        enabled: false,
        shift: [0, -180, 180, 1],
      },
      invert: {
        enabled: false,
      },
      posterize: {
        enabled: false,
        intensity: [5, 2, 32, 1],
      },
      saturation: {
        enabled: false,
        intensity: [1, 0, 3, 0.01],
      },
      sharpness: {
        enabled: false,
        sharpness: [0, 0, 5, 0.01],
      },
      solarize: {
        enabled: false,
        threshold: [0.5, 0, 1, 0.01],
        strength: [1, 0, 2, 0.01],
      },
      tint: {
        enabled: false,
        color: { type: 'color' as const, default: '#761225' },
        amount: [1, 0, 1, 0.01],
        preserveLuminosity: false,
        blendMode: {
          type: 'select' as const,
          options: BLEND_MODES,
          default: 'normal',
        },
      },
      tritone: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#ce1bea' },
        colorB: { type: 'color' as const, default: '#2fff00' },
        colorC: { type: 'color' as const, default: '#ffff00' },
        blendMid: [0.5, 0, 1, 0.01],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      vibrance: {
        enabled: false,
        intensity: [0, -2, 2, 0.01],
      },
    },

    blurs: {
      angularBlur: {
        enabled: false,
        intensity: [20, 0, 100, 1],
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
      },
      blur: {
        enabled: false,
        intensity: [50, 0, 200, 1],
      },
      channelBlur: {
        enabled: false,
        redIntensity: [0, 0, 100, 1],
        greenIntensity: [20, 0, 100, 1],
        blueIntensity: [40, 0, 100, 1],
      },
      diffuseBlur: {
        enabled: false,
        intensity: [30, 0, 100, 1],
        edges: { type: 'select' as const, options: EDGES, default: 'stretch' },
      },
      linearBlur: {
        enabled: false,
        intensity: [30, 0, 100, 1],
        angle: [0, 0, 360, 1],
      },
      progressiveBlur: {
        enabled: false,
        intensity: [50, 0, 200, 1],
        angle: [0, 0, 360, 1],
        center: { x: [0, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        falloff: [1, 0, 5, 0.01],
      },
      tiltShift: {
        enabled: false,
        intensity: [50, 0, 200, 1],
        width: [0.3, 0, 1, 0.01],
        falloff: [0.3, 0, 1, 0.01],
        angle: [0, 0, 360, 1],
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
      },
      zoomBlur: {
        enabled: false,
        intensity: [30, 0, 100, 1],
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
      },
    },

    stylize: {
      ascii: {
        enabled: false,
        characters: {
          type: 'text' as const,
          default: ' .:-=+*#@',
          placeholder: 'e.g. @#*+=-:.',
        },
        // .,·-─~+:;=*π┐┌┘╔╝║╚!?1742&35$690#@8$▀▄■░▒▓
        fontFamily: {
          type: 'select' as const,
          options: [
            'Azeret',
            'Courier',
            'Cutive',
            'Fira',
            'Geist',
            'IBM',
            'JetBrains',
            'Major',
            'Martian',
            'Nova',
            'Press',
            'Roboto',
            'Share',
            'Silkscreen',
            'Source',
            'Space',
            'Syne',
            'VT323',
            'Xanh',
          ],
          default: 'JetBrains',
        },
        cellSize: [10, 1, 50, 1],
        gamma: [1, 0, 3, 0.01],
        spacing: [1, 0, 2, 0.01],
        alphaThreshold: [0, 0, 1, 0.01],
        preserveAlpha: false,
      },
      chromaticAberration: {
        enabled: false,
        strength: [0.2, 0, 2, 0.01],
        angle: [0, 0, 360, 1],
        redOffset: [-1, -5, 5, 0.01],
        greenOffset: [0, -5, 5, 0.01],
        blueOffset: [1, -5, 5, 0.01],
      },
      contourLines: {
        enabled: false,
        levels: [5, 1, 30, 1],
        lineWidth: [2, 0.5, 20, 0.5],
        softness: [0, 0, 1, 0.01],
        gamma: [0.5, 0, 2, 0.01],
        invert: false,
        source: {
          type: 'select' as const,
          options: ['luminance', 'alpha'],
          default: 'luminance',
        },
        colorMode: {
          type: 'select' as const,
          options: ['source', 'custom'],
          default: 'source',
        },
        lineColor: { type: 'color' as const, default: '#000000' },
        backgroundColor: { type: 'color' as const, default: '#00000000' },
      },
      crtScreen: {
        enabled: false,
        pixelSize: [128, 1, 512, 1],
        colorShift: [1, 0, 10, 0.01],
        scanlineIntensity: [0.3, 0, 1, 0.01],
        scanlineFrequency: [200, 10, 1000, 1],
        brightness: [1, 0, 3, 0.01],
        contrast: [1, 0, 3, 0.01],
        vignetteIntensity: [1, 0, 3, 0.01],
        vignetteRadius: [0.5, 0, 1, 0.01],
      },
      dither: {
        enabled: false,
        pattern: {
          type: 'select' as const,
          options: [
            'bayer2',
            'bayer4',
            'bayer8',
            'clusteredDot',
            'blueNoise',
            'whiteNoise',
          ],
          default: 'bayer4',
        },
        pixelSize: [4, 1, 20, 1],
        threshold: [0.5, 0, 1, 0.01],
        spread: [1, 0, 1, 0.01],
        colorMode: {
          type: 'select' as const,
          options: ['custom', 'source'],
          default: 'custom',
        },
        colorA: { type: 'color' as const, default: '#000000' },
        colorB: { type: 'color' as const, default: '#ffffff' },
      },
      dropShadow: {
        enabled: false,
        color: { type: 'color' as const, default: '#000000' },
        distance: [0.1, 0, 1, 0.01],
        angle: [135, 0, 360, 1],
        blur: [5, 0, 50, 1],
        intensity: [0.5, 0, 1, 0.01],
        cutout: false,
      },
      filmGrain: {
        enabled: false,
        strength: [0.5, 0, 1, 0.01],
      },
      glitch: {
        enabled: false,
        alwaysOn: false,
        onDuration: [1, 0.1, 10, 0.1],
        offDuration: [5, 0.1, 30, 0.1],
        intensity: [0.5, 0, 1, 0.01],
        speed: [1, 0.1, 5, 0.1],
        rgbShift: [5, 0, 20, 0.5],
        blockDensity: [10, 2, 50, 1],
        colorBarIntensity: [0.2, 0, 1, 0.01],
        mirrorAmount: [0.3, 0, 1, 0.01],
        scanlineIntensity: [0.2, 0, 1, 0.01],
      },
      glow: {
        enabled: false,
        intensity: [1, 0, 5, 0.01],
        threshold: [0.5, 0, 1, 0.01],
        size: [10, 1, 100, 1],
      },
      halftone: {
        enabled: false,
        frequency: [100, 1, 300, 1],
        angle: [45, 0, 360, 1],
        smoothness: [0.1, 0, 1, 0.01],
      },
      lensFlare: {
        enabled: false,
        lightPosition: { x: [0.3, 0, 1, 0.01], y: [0.3, 0, 1, 0.01] },
        intensity: [0.5, 0, 2, 0.01],
        ghostIntensity: [0.4, 0, 2, 0.01],
        ghostSpread: [0.7, 0.1, 2, 0.01],
        ghostChroma: [0.3, 0, 1, 0.01],
        haloIntensity: [0.4, 0, 2, 0.01],
        haloRadius: [0.6, 0.1, 1, 0.01],
        haloChroma: [0.6, 0, 1, 0.01],
        haloSoftness: [0.8, 0, 1, 0.01],
        starburstIntensity: [0.3, 0, 2, 0.01],
        starburstPoints: [6, 3, 16, 1],
        streakIntensity: [0.15, 0, 1, 0.01],
        streakLength: [0.5, 0, 1, 0.01],
        glareIntensity: [0.2, 0, 1, 0.01],
        glareSize: [0.5, 0, 2, 0.01],
        edgeFade: [0.2, 0, 1, 0.01],
        speed: [0.5, 0, 3, 0.01],
      },
      paper: {
        enabled: false,
        roughness: [0.3, 0, 1, 0.01],
        grainScale: [1, 0.1, 3, 0.01],
        displacement: [0.15, 0, 1, 0.01],
        seed: [0, 0, 100, 1],
      },
      pixelate: {
        enabled: false,
        scale: [50, 1, 200, 1],
        gap: [0, 0, 0.95, 0.01],
        roundness: [0, 0, 1, 0.01],
      },
      vignette: {
        enabled: false,
        color: { type: 'color' as const, default: '#000000' },
        center: { x: [0.5, 0, 1, 0.01], y: [0.5, 0, 1, 0.01] },
        radius: [0.5, 0, 2, 0.01],
        falloff: [0.5, 0, 2, 0.01],
        intensity: [1, 0, 3, 0.01],
      },
    },

    interactive: {
      chromaFlow: {
        enabled: false,
        baseColor: { type: 'color' as const, default: '#0066ff' },
        upColor: { type: 'color' as const, default: '#00ff00' },
        downColor: { type: 'color' as const, default: '#ff0000' },
        leftColor: { type: 'color' as const, default: '#0000ff' },
        rightColor: { type: 'color' as const, default: '#ffff00' },
        intensity: [1, 0, 5, 0.01],
        radius: [3, 0.1, 20, 0.1],
        momentum: [30, 1, 100, 1],
      },
      cursorRipples: {
        enabled: false,
        intensity: [10, 0, 50, 1],
        decay: [10, 1, 50, 1],
        radius: [0.5, 0.1, 3, 0.01],
        chromaticSplit: [1, 0, 10, 0.1],
        edges: { type: 'select' as const, options: EDGES, default: 'stretch' },
      },
      cursorTrail: {
        enabled: false,
        colorA: { type: 'color' as const, default: '#00aaff' },
        colorB: { type: 'color' as const, default: '#ff00aa' },
        radius: [0.5, 0.01, 3, 0.01],
        length: [0.5, 0, 1, 0.01],
        shrink: [1, 0, 3, 0.01],
        colorSpace: {
          type: 'select' as const,
          options: COLOR_SPACES,
          default: 'linear',
        },
      },
      gridDistortion: {
        enabled: false,
        intensity: [1, 0, 5, 0.01],
        decay: [3, 0.1, 20, 0.1],
        radius: [1, 0.1, 5, 0.01],
        gridSize: [20, 2, 100, 1],
        edges: { type: 'select' as const, options: EDGES, default: 'stretch' },
      },
      liquify: {
        enabled: false,
        intensity: [10, 0, 50, 1],
        stiffness: [3, 0.1, 20, 0.1],
        damping: [3, 0.1, 20, 0.1],
        radius: [1, 0.1, 5, 0.01],
        edges: { type: 'select' as const, options: EDGES, default: 'stretch' },
      },
      shatter: {
        enabled: false,
        crackWidth: [1, 0.1, 10, 0.1],
        intensity: [4, 0, 20, 0.1],
        radius: [0.4, 0.01, 2, 0.01],
        decay: [1, 0.1, 10, 0.1],
        seed: [2, 0, 100, 1],
        chromaticSplit: [1, 0, 10, 0.1],
        refractionStrength: [5, 0, 30, 0.1],
        shardLighting: [0.1, 0, 1, 0.01],
        edges: { type: 'select' as const, options: EDGES, default: 'mirror' },
      },
    },
  });

  const [glitchCycleActive, setGlitchCycleActive] = useState(true);
  const glitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (p.stylize.glitch.alwaysOn) return;
    const schedule = (isOn: boolean) => {
      setGlitchCycleActive(isOn);
      glitchTimerRef.current = setTimeout(
        () => schedule(!isOn),
        (isOn ? p.stylize.glitch.onDuration : p.stylize.glitch.offDuration) *
          1000,
      );
    };
    schedule(true);
    return () => {
      if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current);
    };
  }, [
    p.stylize.glitch.alwaysOn,
    p.stylize.glitch.onDuration,
    p.stylize.glitch.offDuration,
  ]);

  const glitchIntensity =
    p.stylize.glitch.alwaysOn || glitchCycleActive
      ? p.stylize.glitch.intensity
      : 0;

  const t = p.textures;
  const sh = p.shapes;
  const se = p.shapeEffects;
  const d = p.distortions;
  const a = p.adjustments;
  const b = p.blurs;
  const st = p.stylize;
  const i = p.interactive;

  return (
    <Shader className="w-full h-screen">
      {/* ── TEXTURES ── */}
      <SolidColor visible={t.solidColor.enabled} color={t.solidColor.color} />
      <ImageTexture
        visible={t.imageTexture.enabled}
        url={t.imageTexture.url}
        objectFit={t.imageTexture.objectFit}
      />
      <VideoTexture
        visible={t.videoTexture.enabled}
        url={t.videoTexture.url}
        objectFit={t.videoTexture.objectFit}
        loop={t.videoTexture.loop}
      />
      <WebcamTexture
        visible={t.webcamTexture.enabled}
        objectFit={t.webcamTexture.objectFit}
        mirror={t.webcamTexture.mirror}
      />
      <Aurora
        visible={t.aurora.enabled}
        colorA={t.aurora.colorA}
        colorB={t.aurora.colorB}
        colorC={t.aurora.colorC}
        colorSpace={t.aurora.colorSpace}
        balance={t.aurora.balance}
        intensity={t.aurora.intensity}
        curtainCount={t.aurora.curtainCount}
        speed={t.aurora.speed}
        waviness={t.aurora.waviness}
        rayDensity={t.aurora.rayDensity}
        height={t.aurora.height}
        center={{ x: t.aurora.center.x, y: t.aurora.center.y }}
        seed={t.aurora.seed}
      />
      <Beam
        visible={t.beam.enabled}
        startPosition={{ x: t.beam.startPosition.x, y: t.beam.startPosition.y }}
        endPosition={{ x: t.beam.endPosition.x, y: t.beam.endPosition.y }}
        startThickness={t.beam.startThickness}
        endThickness={t.beam.endThickness}
        startSoftness={t.beam.startSoftness}
        endSoftness={t.beam.endSoftness}
        insideColor={t.beam.insideColor}
        outsideColor={t.beam.outsideColor}
        colorSpace={t.beam.colorSpace}
      />
      <Blob
        visible={t.blob.enabled}
        colorA={t.blob.colorA}
        colorB={t.blob.colorB}
        size={t.blob.size}
        deformation={t.blob.deformation}
        softness={t.blob.softness}
        highlightIntensity={t.blob.highlightIntensity}
        highlightX={t.blob.highlightX}
        highlightY={t.blob.highlightY}
        highlightZ={t.blob.highlightZ}
        highlightColor={t.blob.highlightColor}
        speed={t.blob.speed}
        seed={t.blob.seed}
        colorSpace={t.blob.colorSpace}
        center={{ x: t.blob.center.x, y: t.blob.center.y }}
      />
      <Checkerboard
        visible={t.checkerboard.enabled}
        colorA={t.checkerboard.colorA}
        colorB={t.checkerboard.colorB}
        cells={t.checkerboard.cells}
        softness={t.checkerboard.softness}
        colorSpace={t.checkerboard.colorSpace}
      />
      <ConicGradient
        visible={t.conicGradient.enabled}
        colorA={t.conicGradient.colorA}
        colorB={t.conicGradient.colorB}
        center={{ x: t.conicGradient.center.x, y: t.conicGradient.center.y }}
        rotation={t.conicGradient.rotation}
        repeat={t.conicGradient.repeat}
        colorSpace={t.conicGradient.colorSpace}
      />
      <DiamondGradient
        visible={t.diamondGradient.enabled}
        colorA={t.diamondGradient.colorA}
        colorB={t.diamondGradient.colorB}
        center={{
          x: t.diamondGradient.center.x,
          y: t.diamondGradient.center.y,
        }}
        size={t.diamondGradient.size}
        rotation={t.diamondGradient.rotation}
        repeat={t.diamondGradient.repeat}
        roundness={t.diamondGradient.roundness}
        colorSpace={t.diamondGradient.colorSpace}
      />
      <DotGrid
        visible={t.dotGrid.enabled}
        color={t.dotGrid.color}
        density={t.dotGrid.density}
        dotSize={t.dotGrid.dotSize}
        twinkle={t.dotGrid.twinkle}
      />
      <FallingLines
        visible={t.fallingLines.enabled}
        colorA={t.fallingLines.colorA}
        colorB={t.fallingLines.colorB}
        colorSpace={t.fallingLines.colorSpace}
        angle={t.fallingLines.angle}
        speed={t.fallingLines.speed}
        speedVariance={t.fallingLines.speedVariance}
        density={t.fallingLines.density}
        trailLength={t.fallingLines.trailLength}
        balance={t.fallingLines.balance}
        strokeWidth={t.fallingLines.strokeWidth}
        rounding={t.fallingLines.rounding}
      />
      <FloatingParticles
        visible={t.floatingParticles.enabled}
        randomness={t.floatingParticles.randomness}
        speed={t.floatingParticles.speed}
        angle={t.floatingParticles.angle}
        particleSize={t.floatingParticles.particleSize}
        particleSoftness={t.floatingParticles.particleSoftness}
        twinkle={t.floatingParticles.twinkle}
        count={t.floatingParticles.count}
        particleColor={t.floatingParticles.particleColor}
        speedVariance={t.floatingParticles.speedVariance}
        angleVariance={t.floatingParticles.angleVariance}
        particleDensity={t.floatingParticles.particleDensity}
      />
      <FlowingGradient
        visible={t.flowingGradient.enabled}
        colorA={t.flowingGradient.colorA}
        colorB={t.flowingGradient.colorB}
        colorC={t.flowingGradient.colorC}
        colorD={t.flowingGradient.colorD}
        colorSpace={t.flowingGradient.colorSpace}
        speed={t.flowingGradient.speed}
        distortion={t.flowingGradient.distortion}
        seed={t.flowingGradient.seed}
        blendMode={t.flowingGradient.blendMode as any}
      />
      <Godrays
        visible={t.godrays.enabled}
        center={{ x: t.godrays.center.x, y: t.godrays.center.y }}
        density={t.godrays.density}
        intensity={t.godrays.intensity}
        spotty={t.godrays.spotty}
        speed={t.godrays.speed}
        rayColor={t.godrays.rayColor}
        backgroundColor={t.godrays.backgroundColor}
      />
      <Grid
        visible={t.grid.enabled}
        color={t.grid.color}
        cells={t.grid.cells}
        thickness={t.grid.thickness}
        rotation={t.grid.rotation}
      />
      <HexGrid
        visible={t.hexGrid.enabled}
        colorA={t.hexGrid.colorA}
        colorB={t.hexGrid.colorB}
        cells={t.hexGrid.cells}
        thickness={t.hexGrid.thickness}
        colorSpace={t.hexGrid.colorSpace}
      />
      <LinearGradient
        visible={t.linearGradient.enabled}
        colorA={t.linearGradient.colorA}
        colorB={t.linearGradient.colorB}
        start={{ x: t.linearGradient.start.x, y: t.linearGradient.start.y }}
        end={{ x: t.linearGradient.end.x, y: t.linearGradient.end.y }}
        angle={t.linearGradient.angle}
        edges={t.linearGradient.edges}
        colorSpace={t.linearGradient.colorSpace}
      />
      <MultiPointGradient
        visible={t.multiPointGradient.enabled}
        colorA={t.multiPointGradient.colorA}
        positionA={{
          x: t.multiPointGradient.positionA.x,
          y: t.multiPointGradient.positionA.y,
        }}
        colorB={t.multiPointGradient.colorB}
        positionB={{
          x: t.multiPointGradient.positionB.x,
          y: t.multiPointGradient.positionB.y,
        }}
        colorC={t.multiPointGradient.colorC}
        positionC={{
          x: t.multiPointGradient.positionC.x,
          y: t.multiPointGradient.positionC.y,
        }}
        colorD={t.multiPointGradient.colorD}
        positionD={{
          x: t.multiPointGradient.positionD.x,
          y: t.multiPointGradient.positionD.y,
        }}
        colorE={t.multiPointGradient.colorE}
        positionE={{
          x: t.multiPointGradient.positionE.x,
          y: t.multiPointGradient.positionE.y,
        }}
        smoothness={t.multiPointGradient.smoothness}
      />
      <Plasma
        visible={t.plasma.enabled}
        density={t.plasma.density}
        speed={t.plasma.speed}
        intensity={t.plasma.intensity}
        warp={t.plasma.warp}
        contrast={t.plasma.contrast}
        balance={t.plasma.balance}
        colorA={t.plasma.colorA}
        colorB={t.plasma.colorB}
        colorSpace={t.plasma.colorSpace}
      />
      <RadialGradient
        visible={t.radialGradient.enabled}
        colorA={t.radialGradient.colorA}
        colorB={t.radialGradient.colorB}
        center={{ x: t.radialGradient.center.x, y: t.radialGradient.center.y }}
        radius={t.radialGradient.radius}
        repeat={t.radialGradient.repeat}
        aspect={t.radialGradient.aspect}
        skewAngle={t.radialGradient.skewAngle}
        colorSpace={t.radialGradient.colorSpace}
      />
      <Ripples
        visible={t.ripples.enabled}
        center={{ x: t.ripples.center.x, y: t.ripples.center.y }}
        colorA={t.ripples.colorA}
        colorB={t.ripples.colorB}
        speed={t.ripples.speed}
        frequency={t.ripples.frequency}
        softness={t.ripples.softness}
        thickness={t.ripples.thickness}
        phase={t.ripples.phase}
      />
      <SimplexNoise
        visible={t.simplexNoise.enabled}
        colorA={t.simplexNoise.colorA}
        colorB={t.simplexNoise.colorB}
        blendMode={t.simplexNoise.blendMode as any}
        scale={t.simplexNoise.scale}
        balance={t.simplexNoise.balance}
        contrast={t.simplexNoise.contrast}
        seed={t.simplexNoise.seed}
        speed={t.simplexNoise.speed}
      />
      <SineWave
        visible={t.sineWave.enabled}
        color={t.sineWave.color}
        amplitude={t.sineWave.amplitude}
        frequency={t.sineWave.frequency}
        speed={t.sineWave.speed}
        angle={t.sineWave.angle}
        position={{ x: t.sineWave.position.x, y: t.sineWave.position.y }}
        thickness={t.sineWave.thickness}
        softness={t.sineWave.softness}
      />
      <Spiral
        visible={t.spiral.enabled}
        colorA={t.spiral.colorA}
        colorB={t.spiral.colorB}
        strokeWidth={t.spiral.strokeWidth}
        strokeFalloff={t.spiral.strokeFalloff}
        softness={t.spiral.softness}
        speed={t.spiral.speed}
        center={{ x: t.spiral.center.x, y: t.spiral.center.y }}
        scale={t.spiral.scale}
        colorSpace={t.spiral.colorSpace}
      />
      <Strands
        visible={t.strands.enabled}
        speed={t.strands.speed}
        amplitude={t.strands.amplitude}
        frequency={t.strands.frequency}
        lineCount={t.strands.lineCount}
        lineWidth={t.strands.lineWidth}
        waveColor={t.strands.waveColor}
        pinEdges={t.strands.pinEdges}
        start={{ x: t.strands.start.x, y: t.strands.start.y }}
        end={{ x: t.strands.end.x, y: t.strands.end.y }}
      />
      <Stripes
        visible={t.stripes.enabled}
        colorA={t.stripes.colorA}
        colorB={t.stripes.colorB}
        angle={t.stripes.angle}
        density={t.stripes.density}
        balance={t.stripes.balance}
        softness={t.stripes.softness}
        speed={t.stripes.speed}
        offset={t.stripes.offset}
        colorSpace={t.stripes.colorSpace}
      />
      <StudioBackground
        visible={t.studioBackground.enabled}
        color={t.studioBackground.color}
        brightness={t.studioBackground.brightness}
        keyColor={t.studioBackground.keyColor}
        keyIntensity={t.studioBackground.keyIntensity}
        keySoftness={t.studioBackground.keySoftness}
        fillColor={t.studioBackground.fillColor}
        fillIntensity={t.studioBackground.fillIntensity}
        fillSoftness={t.studioBackground.fillSoftness}
        fillAngle={t.studioBackground.fillAngle}
        backColor={t.studioBackground.backColor}
        backIntensity={t.studioBackground.backIntensity}
        backSoftness={t.studioBackground.backSoftness}
        center={{
          x: t.studioBackground.center.x,
          y: t.studioBackground.center.y,
        }}
        lightTarget={t.studioBackground.lightTarget}
        wallCurvature={t.studioBackground.wallCurvature}
        vignette={t.studioBackground.vignette}
        ambientIntensity={t.studioBackground.ambientIntensity}
        ambientSpeed={t.studioBackground.ambientSpeed}
        seed={t.studioBackground.seed}
      />
      <Swirl
        visible={t.swirl.enabled}
        colorA={t.swirl.colorA}
        colorB={t.swirl.colorB}
        speed={t.swirl.speed}
        detail={t.swirl.detail}
        blend={t.swirl.blend}
        colorSpace={t.swirl.colorSpace}
      />
      <Truchet
        visible={t.truchet.enabled}
        colorA={t.truchet.colorA}
        colorB={t.truchet.colorB}
        cells={t.truchet.cells}
        thickness={t.truchet.thickness}
        seed={t.truchet.seed}
        colorSpace={t.truchet.colorSpace}
      />
      <Voronoi
        visible={t.voronoi.enabled}
        colorA={t.voronoi.colorA}
        colorB={t.voronoi.colorB}
        colorBorder={t.voronoi.colorBorder}
        scale={t.voronoi.scale}
        speed={t.voronoi.speed}
        seed={t.voronoi.seed}
        edgeIntensity={t.voronoi.edgeIntensity}
        edgeSoftness={t.voronoi.edgeSoftness}
        colorSpace={t.voronoi.colorSpace}
      />
      <Weave
        visible={t.weave.enabled}
        colorA={t.weave.colorA}
        colorB={t.weave.colorB}
        cells={t.weave.cells}
        gap={t.weave.gap}
        rotation={t.weave.rotation}
      />

      {/* ── SHAPES ── */}
      <Circle
        visible={sh.circle.enabled}
        color={sh.circle.color}
        radius={sh.circle.radius}
        softness={sh.circle.softness}
        center={{ x: sh.circle.center.x, y: sh.circle.center.y }}
        strokeThickness={sh.circle.strokeThickness}
        strokeColor={sh.circle.strokeColor}
        strokePosition={sh.circle.strokePosition}
        colorSpace={sh.circle.colorSpace}
      />
      <Crescent
        visible={sh.crescent.enabled}
        color={sh.crescent.color}
        center={{ x: sh.crescent.center.x, y: sh.crescent.center.y }}
        radius={sh.crescent.radius}
        innerRatio={sh.crescent.innerRatio}
        offset={sh.crescent.offset}
        rotation={sh.crescent.rotation}
        softness={sh.crescent.softness}
        strokeThickness={sh.crescent.strokeThickness}
        strokeColor={sh.crescent.strokeColor}
        strokePosition={sh.crescent.strokePosition}
        colorSpace={sh.crescent.colorSpace}
      />
      <Cross
        visible={sh.cross.enabled}
        color={sh.cross.color}
        center={{ x: sh.cross.center.x, y: sh.cross.center.y }}
        radius={sh.cross.radius}
        thickness={sh.cross.thickness}
        rounding={sh.cross.rounding}
        rotation={sh.cross.rotation}
        softness={sh.cross.softness}
        strokeThickness={sh.cross.strokeThickness}
        strokeColor={sh.cross.strokeColor}
        strokePosition={sh.cross.strokePosition}
        colorSpace={sh.cross.colorSpace}
      />
      <Ellipse
        visible={sh.ellipse.enabled}
        color={sh.ellipse.color}
        center={{ x: sh.ellipse.center.x, y: sh.ellipse.center.y }}
        radiusX={sh.ellipse.radiusX}
        radiusY={sh.ellipse.radiusY}
        rotation={sh.ellipse.rotation}
        softness={sh.ellipse.softness}
        strokeThickness={sh.ellipse.strokeThickness}
        strokeColor={sh.ellipse.strokeColor}
        strokePosition={sh.ellipse.strokePosition}
        colorSpace={sh.ellipse.colorSpace}
      />
      <Flower
        visible={sh.flower.enabled}
        color={sh.flower.color}
        center={{ x: sh.flower.center.x, y: sh.flower.center.y }}
        radius={sh.flower.radius}
        sides={sh.flower.sides}
        innerRatio={sh.flower.innerRatio}
        rotation={sh.flower.rotation}
        softness={sh.flower.softness}
        strokeThickness={sh.flower.strokeThickness}
        strokeColor={sh.flower.strokeColor}
        strokePosition={sh.flower.strokePosition}
        colorSpace={sh.flower.colorSpace}
      />
      <Polygon
        visible={sh.polygon.enabled}
        color={sh.polygon.color}
        center={{ x: sh.polygon.center.x, y: sh.polygon.center.y }}
        radius={sh.polygon.radius}
        sides={sh.polygon.sides}
        rounding={sh.polygon.rounding}
        rotation={sh.polygon.rotation}
        softness={sh.polygon.softness}
        strokeThickness={sh.polygon.strokeThickness}
        strokeColor={sh.polygon.strokeColor}
        strokePosition={sh.polygon.strokePosition}
        colorSpace={sh.polygon.colorSpace}
      />
      <Ring
        visible={sh.ring.enabled}
        color={sh.ring.color}
        center={{ x: sh.ring.center.x, y: sh.ring.center.y }}
        radius={sh.ring.radius}
        thickness={sh.ring.thickness}
        softness={sh.ring.softness}
        strokeThickness={sh.ring.strokeThickness}
        strokeColor={sh.ring.strokeColor}
        strokePosition={sh.ring.strokePosition}
        colorSpace={sh.ring.colorSpace}
      />
      <RoundedRect
        visible={sh.roundedRect.enabled}
        color={sh.roundedRect.color}
        center={{ x: sh.roundedRect.center.x, y: sh.roundedRect.center.y }}
        width={sh.roundedRect.width}
        height={sh.roundedRect.height}
        rounding={sh.roundedRect.rounding}
        rotation={sh.roundedRect.rotation}
        softness={sh.roundedRect.softness}
        strokeThickness={sh.roundedRect.strokeThickness}
        strokeColor={sh.roundedRect.strokeColor}
        strokePosition={sh.roundedRect.strokePosition}
        colorSpace={sh.roundedRect.colorSpace}
      />
      <Star
        visible={sh.star.enabled}
        color={sh.star.color}
        center={{ x: sh.star.center.x, y: sh.star.center.y }}
        radius={sh.star.radius}
        sides={sh.star.sides}
        innerRatio={sh.star.innerRatio}
        rotation={sh.star.rotation}
        softness={sh.star.softness}
        strokeThickness={sh.star.strokeThickness}
        strokeColor={sh.star.strokeColor}
        strokePosition={sh.star.strokePosition}
        colorSpace={sh.star.colorSpace}
      />
      <Trapezoid
        visible={sh.trapezoid.enabled}
        color={sh.trapezoid.color}
        center={{ x: sh.trapezoid.center.x, y: sh.trapezoid.center.y }}
        bottomWidth={sh.trapezoid.bottomWidth}
        topWidth={sh.trapezoid.topWidth}
        height={sh.trapezoid.height}
        rotation={sh.trapezoid.rotation}
        softness={sh.trapezoid.softness}
        strokeThickness={sh.trapezoid.strokeThickness}
        strokeColor={sh.trapezoid.strokeColor}
        strokePosition={sh.trapezoid.strokePosition}
        colorSpace={sh.trapezoid.colorSpace}
      />
      <Vesica
        visible={sh.vesica.enabled}
        color={sh.vesica.color}
        center={{ x: sh.vesica.center.x, y: sh.vesica.center.y }}
        radius={sh.vesica.radius}
        spread={sh.vesica.spread}
        rotation={sh.vesica.rotation}
        softness={sh.vesica.softness}
        strokeThickness={sh.vesica.strokeThickness}
        strokeColor={sh.vesica.strokeColor}
        strokePosition={sh.vesica.strokePosition}
        colorSpace={sh.vesica.colorSpace}
      />

      {/* ── SHAPE EFFECTS ── */}
      <Crystal
        visible={se.crystal.enabled}
        center={{ x: se.crystal.center.x, y: se.crystal.center.y }}
        scale={se.crystal.scale}
        refraction={se.crystal.refraction}
        dispersion={se.crystal.dispersion}
        facets={se.crystal.facets}
        edgeSoftness={se.crystal.edgeSoftness}
        innerZoom={se.crystal.innerZoom}
        cutout={se.crystal.cutout}
        lightAngle={se.crystal.lightAngle}
        highlights={se.crystal.highlights}
        shadows={se.crystal.shadows}
        brightness={se.crystal.brightness}
        fresnel={se.crystal.fresnel}
        fresnelSoftness={se.crystal.fresnelSoftness}
        fresnelColor={se.crystal.fresnelColor}
      />
      <Emboss
        visible={se.emboss.enabled}
        center={{ x: se.emboss.center.x, y: se.emboss.center.y }}
        scale={se.emboss.scale}
        depth={se.emboss.depth}
        lightAngle={se.emboss.lightAngle}
        lightIntensity={se.emboss.lightIntensity}
        shadowIntensity={se.emboss.shadowIntensity}
      />
      <Glass
        visible={se.glass.enabled}
        center={{ x: se.glass.center.x, y: se.glass.center.y }}
        scale={se.glass.scale}
        refraction={se.glass.refraction}
        edgeSoftness={se.glass.edgeSoftness}
        blur={se.glass.blur}
        thickness={se.glass.thickness}
        aberration={se.glass.aberration}
        cutout={se.glass.cutout}
        highlight={se.glass.highlight}
        innerZoom={se.glass.innerZoom}
        highlightColor={se.glass.highlightColor}
        highlightSoftness={se.glass.highlightSoftness}
        tintColor={se.glass.tintColor}
        tintIntensity={se.glass.tintIntensity}
        tintPreserveLuminosity={se.glass.tintPreserveLuminosity}
      />
      <Neon
        visible={se.neon.enabled}
        center={{ x: se.neon.center.x, y: se.neon.center.y }}
        scale={se.neon.scale}
        color={se.neon.color}
        secondaryColor={se.neon.secondaryColor}
        secondaryBlend={se.neon.secondaryBlend}
        glowColor={se.neon.glowColor}
        tubeThickness={se.neon.tubeThickness}
        intensity={se.neon.intensity}
        hotCoreIntensity={se.neon.hotCoreIntensity}
        glowIntensity={se.neon.glowIntensity}
        glowRadius={se.neon.glowRadius}
        lightAngle={se.neon.lightAngle}
        specularIntensity={se.neon.specularIntensity}
        specularSize={se.neon.specularSize}
        cornerSmoothing={se.neon.cornerSmoothing}
      />

      {/* ── DISTORTIONS ── */}
      <Bulge
        visible={d.bulge.enabled}
        center={{ x: d.bulge.center.x, y: d.bulge.center.y }}
        strength={d.bulge.strength}
        radius={d.bulge.radius}
        falloff={d.bulge.falloff}
        edges={d.bulge.edges}
      />
      <ConcentricSpin
        visible={d.concentricSpin.enabled}
        intensity={d.concentricSpin.intensity}
        rings={d.concentricSpin.rings}
        smoothness={d.concentricSpin.smoothness}
        seed={d.concentricSpin.seed}
        speed={d.concentricSpin.speed}
        speedRandomness={d.concentricSpin.speedRandomness}
        edges={d.concentricSpin.edges}
        center={{ x: d.concentricSpin.center.x, y: d.concentricSpin.center.y }}
      />
      <FlowField
        visible={d.flowField.enabled}
        strength={d.flowField.strength}
        detail={d.flowField.detail}
        speed={d.flowField.speed}
        evolutionSpeed={d.flowField.evolutionSpeed}
        edges={d.flowField.edges as any}
      />
      <Form3D
        visible={d.form3D.enabled}
        center={{ x: d.form3D.center.x, y: d.form3D.center.y }}
        zoom={d.form3D.zoom}
        glossiness={d.form3D.glossiness}
        lighting={d.form3D.lighting}
        uvMode={d.form3D.uvMode}
        speed={d.form3D.speed}
      />
      <GlassTiles
        visible={d.glassTiles.enabled}
        intensity={d.glassTiles.intensity}
        tileCount={d.glassTiles.tileCount}
        rotation={d.glassTiles.rotation}
        roundness={d.glassTiles.roundness}
      />
      <Kaleidoscope
        visible={d.kaleidoscope.enabled}
        center={{ x: d.kaleidoscope.center.x, y: d.kaleidoscope.center.y }}
        segments={d.kaleidoscope.segments}
        angle={d.kaleidoscope.angle}
        edges={d.kaleidoscope.edges as any}
      />
      <Mirror
        visible={d.mirror.enabled}
        center={{ x: d.mirror.center.x, y: d.mirror.center.y }}
        angle={d.mirror.angle}
        edges={d.mirror.edges as any}
      />
      <Perspective
        visible={d.perspective.enabled}
        center={{ x: d.perspective.center.x, y: d.perspective.center.y }}
        pan={d.perspective.pan}
        tilt={d.perspective.tilt}
        fov={d.perspective.fov}
        zoom={d.perspective.zoom}
        offset={{ x: d.perspective.offset.x, y: d.perspective.offset.y }}
        edges={d.perspective.edges}
      />
      <PolarCoordinates
        visible={d.polarCoordinates.enabled}
        center={{
          x: d.polarCoordinates.center.x,
          y: d.polarCoordinates.center.y,
        }}
        wrap={d.polarCoordinates.wrap}
        radius={d.polarCoordinates.radius}
        intensity={d.polarCoordinates.intensity}
        edges={d.polarCoordinates.edges}
      />
      <RectangularCoordinates
        visible={d.rectangularCoordinates.enabled}
        center={{
          x: d.rectangularCoordinates.center.x,
          y: d.rectangularCoordinates.center.y,
        }}
        scale={d.rectangularCoordinates.scale}
        intensity={d.rectangularCoordinates.intensity}
        edges={d.rectangularCoordinates.edges}
      />
      <Spherize
        visible={d.spherize.enabled}
        radius={d.spherize.radius}
        depth={d.spherize.depth}
        center={{ x: d.spherize.center.x, y: d.spherize.center.y }}
        lightPosition={{
          x: d.spherize.lightPosition.x,
          y: d.spherize.lightPosition.y,
        }}
        lightIntensity={d.spherize.lightIntensity}
        lightSoftness={d.spherize.lightSoftness}
        lightColor={d.spherize.lightColor}
      />
      <Stretch
        visible={d.stretch.enabled}
        center={{ x: d.stretch.center.x, y: d.stretch.center.y }}
        strength={d.stretch.strength}
        angle={d.stretch.angle}
        falloff={d.stretch.falloff}
        edges={d.stretch.edges}
      />
      <Twirl
        visible={d.twirl.enabled}
        center={{ x: d.twirl.center.x, y: d.twirl.center.y }}
        intensity={d.twirl.intensity}
        edges={d.twirl.edges}
      />
      <WaveDistortion
        visible={d.waveDistortion.enabled}
        strength={d.waveDistortion.strength}
        frequency={d.waveDistortion.frequency}
        speed={d.waveDistortion.speed}
        angle={d.waveDistortion.angle}
        waveType={d.waveDistortion.waveType}
        edges={d.waveDistortion.edges}
      />

      {/* ── ADJUSTMENTS ── */}
      <BrightnessContrast
        visible={a.brightnessContrast.enabled}
        brightness={a.brightnessContrast.brightness}
        contrast={a.brightnessContrast.contrast}
      />
      <Duotone
        visible={a.duotone.enabled}
        colorA={a.duotone.colorA}
        colorB={a.duotone.colorB}
        blend={a.duotone.blend}
        colorSpace={a.duotone.colorSpace}
      />
      <Grayscale visible={a.grayscale.enabled} />
      <HueShift visible={a.hueShift.enabled} shift={a.hueShift.shift} />
      <Invert visible={a.invert.enabled} />
      <Posterize
        visible={a.posterize.enabled}
        intensity={a.posterize.intensity}
      />
      <Saturation
        visible={a.saturation.enabled}
        intensity={a.saturation.intensity}
      />
      <Sharpness
        visible={a.sharpness.enabled}
        sharpness={a.sharpness.sharpness}
      />
      <Solarize
        visible={a.solarize.enabled}
        threshold={a.solarize.threshold}
        strength={a.solarize.strength}
      />
      <Tint
        visible={a.tint.enabled}
        color={a.tint.color}
        amount={a.tint.amount}
        preserveLuminosity={a.tint.preserveLuminosity}
        blendMode={a.tint.blendMode as any}
      />
      <Tritone
        visible={a.tritone.enabled}
        colorA={a.tritone.colorA}
        colorB={a.tritone.colorB}
        colorC={a.tritone.colorC}
        blendMid={a.tritone.blendMid}
        colorSpace={a.tritone.colorSpace}
      />
      <Vibrance visible={a.vibrance.enabled} intensity={a.vibrance.intensity} />

      {/* ── BLURS ── */}
      <AngularBlur
        visible={b.angularBlur.enabled}
        intensity={b.angularBlur.intensity}
        center={{ x: b.angularBlur.center.x, y: b.angularBlur.center.y }}
      />
      <Blur visible={b.blur.enabled} intensity={b.blur.intensity} />
      <ChannelBlur
        visible={b.channelBlur.enabled}
        redIntensity={b.channelBlur.redIntensity}
        greenIntensity={b.channelBlur.greenIntensity}
        blueIntensity={b.channelBlur.blueIntensity}
      />
      <DiffuseBlur
        visible={b.diffuseBlur.enabled}
        intensity={b.diffuseBlur.intensity}
        edges={b.diffuseBlur.edges}
      />
      <LinearBlur
        visible={b.linearBlur.enabled}
        intensity={b.linearBlur.intensity}
        angle={b.linearBlur.angle}
      />
      <ProgressiveBlur
        visible={b.progressiveBlur.enabled}
        intensity={b.progressiveBlur.intensity}
        angle={b.progressiveBlur.angle}
        center={{
          x: b.progressiveBlur.center.x,
          y: b.progressiveBlur.center.y,
        }}
        falloff={b.progressiveBlur.falloff}
      />
      <TiltShift
        visible={b.tiltShift.enabled}
        intensity={b.tiltShift.intensity}
        width={b.tiltShift.width}
        falloff={b.tiltShift.falloff}
        angle={b.tiltShift.angle}
        center={{ x: b.tiltShift.center.x, y: b.tiltShift.center.y }}
      />
      <ZoomBlur
        visible={b.zoomBlur.enabled}
        intensity={b.zoomBlur.intensity}
        center={{ x: b.zoomBlur.center.x, y: b.zoomBlur.center.y }}
      />

      {/* ── STYLIZE ── */}
      <Ascii
        visible={st.ascii.enabled}
        characters={st.ascii.characters}
        fontFamily={st.ascii.fontFamily}
        cellSize={st.ascii.cellSize}
        gamma={st.ascii.gamma}
        spacing={st.ascii.spacing}
        alphaThreshold={st.ascii.alphaThreshold}
        preserveAlpha={st.ascii.preserveAlpha}
      />
      <ChromaticAberration
        visible={st.chromaticAberration.enabled}
        strength={st.chromaticAberration.strength}
        angle={st.chromaticAberration.angle}
        redOffset={st.chromaticAberration.redOffset}
        greenOffset={st.chromaticAberration.greenOffset}
        blueOffset={st.chromaticAberration.blueOffset}
      />
      <ContourLines
        visible={st.contourLines.enabled}
        levels={st.contourLines.levels}
        lineWidth={st.contourLines.lineWidth}
        softness={st.contourLines.softness}
        gamma={st.contourLines.gamma}
        invert={st.contourLines.invert}
        source={st.contourLines.source as any}
        colorMode={st.contourLines.colorMode as any}
        lineColor={st.contourLines.lineColor}
        backgroundColor={st.contourLines.backgroundColor}
      />
      <CRTScreen
        visible={st.crtScreen.enabled}
        pixelSize={st.crtScreen.pixelSize}
        colorShift={st.crtScreen.colorShift}
        scanlineIntensity={st.crtScreen.scanlineIntensity}
        scanlineFrequency={st.crtScreen.scanlineFrequency}
        brightness={st.crtScreen.brightness}
        contrast={st.crtScreen.contrast}
        vignetteIntensity={st.crtScreen.vignetteIntensity}
        vignetteRadius={st.crtScreen.vignetteRadius}
      />
      <Dither
        visible={st.dither.enabled}
        pattern={st.dither.pattern}
        pixelSize={st.dither.pixelSize}
        threshold={st.dither.threshold}
        spread={st.dither.spread}
        colorMode={st.dither.colorMode}
        colorA={st.dither.colorA}
        colorB={st.dither.colorB}
      />
      <DropShadow
        visible={st.dropShadow.enabled}
        color={st.dropShadow.color}
        distance={st.dropShadow.distance}
        angle={st.dropShadow.angle}
        blur={st.dropShadow.blur}
        intensity={st.dropShadow.intensity}
        cutout={st.dropShadow.cutout}
      />
      <FilmGrain
        visible={st.filmGrain.enabled}
        strength={st.filmGrain.strength}
      />
      <Glitch
        visible={st.glitch.enabled}
        intensity={glitchIntensity}
        speed={st.glitch.speed}
        rgbShift={st.glitch.rgbShift}
        blockDensity={st.glitch.blockDensity}
        colorBarIntensity={st.glitch.colorBarIntensity}
        mirrorAmount={st.glitch.mirrorAmount}
        scanlineIntensity={st.glitch.scanlineIntensity}
      />
      <Glow
        visible={st.glow.enabled}
        intensity={st.glow.intensity}
        threshold={st.glow.threshold}
        size={st.glow.size}
      />
      <Halftone
        visible={st.halftone.enabled}
        frequency={st.halftone.frequency}
        angle={st.halftone.angle}
        smoothness={st.halftone.smoothness}
      />
      <LensFlare
        visible={st.lensFlare.enabled}
        lightPosition={{
          x: st.lensFlare.lightPosition.x,
          y: st.lensFlare.lightPosition.y,
        }}
        intensity={st.lensFlare.intensity}
        ghostIntensity={st.lensFlare.ghostIntensity}
        ghostSpread={st.lensFlare.ghostSpread}
        ghostChroma={st.lensFlare.ghostChroma}
        haloIntensity={st.lensFlare.haloIntensity}
        haloRadius={st.lensFlare.haloRadius}
        haloChroma={st.lensFlare.haloChroma}
        haloSoftness={st.lensFlare.haloSoftness}
        starburstIntensity={st.lensFlare.starburstIntensity}
        starburstPoints={st.lensFlare.starburstPoints}
        streakIntensity={st.lensFlare.streakIntensity}
        streakLength={st.lensFlare.streakLength}
        glareIntensity={st.lensFlare.glareIntensity}
        glareSize={st.lensFlare.glareSize}
        edgeFade={st.lensFlare.edgeFade}
        speed={st.lensFlare.speed}
      />
      <Paper
        visible={st.paper.enabled}
        roughness={st.paper.roughness}
        grainScale={st.paper.grainScale}
        displacement={st.paper.displacement}
        seed={st.paper.seed}
      />
      <Pixelate
        visible={st.pixelate.enabled}
        scale={st.pixelate.scale}
        gap={st.pixelate.gap}
        roundness={st.pixelate.roundness}
      />
      <Vignette
        visible={st.vignette.enabled}
        color={st.vignette.color}
        center={{ x: st.vignette.center.x, y: st.vignette.center.y }}
        radius={st.vignette.radius}
        falloff={st.vignette.falloff}
        intensity={st.vignette.intensity}
      />

      {/* ── INTERACTIVE ── */}
      <ChromaFlow
        visible={i.chromaFlow.enabled}
        baseColor={i.chromaFlow.baseColor}
        upColor={i.chromaFlow.upColor}
        downColor={i.chromaFlow.downColor}
        leftColor={i.chromaFlow.leftColor}
        rightColor={i.chromaFlow.rightColor}
        intensity={i.chromaFlow.intensity}
        radius={i.chromaFlow.radius}
        momentum={i.chromaFlow.momentum}
      />
      <CursorRipples
        visible={i.cursorRipples.enabled}
        intensity={i.cursorRipples.intensity}
        decay={i.cursorRipples.decay}
        radius={i.cursorRipples.radius}
        chromaticSplit={i.cursorRipples.chromaticSplit}
        edges={i.cursorRipples.edges}
      />
      <CursorTrail
        visible={i.cursorTrail.enabled}
        colorA={i.cursorTrail.colorA}
        colorB={i.cursorTrail.colorB}
        radius={i.cursorTrail.radius}
        length={i.cursorTrail.length}
        shrink={i.cursorTrail.shrink}
        colorSpace={i.cursorTrail.colorSpace}
      />
      <GridDistortion
        visible={i.gridDistortion.enabled}
        intensity={i.gridDistortion.intensity}
        decay={i.gridDistortion.decay}
        radius={i.gridDistortion.radius}
        gridSize={i.gridDistortion.gridSize}
        edges={i.gridDistortion.edges}
      />
      <Liquify
        visible={i.liquify.enabled}
        intensity={i.liquify.intensity}
        stiffness={i.liquify.stiffness}
        damping={i.liquify.damping}
        radius={i.liquify.radius}
        edges={i.liquify.edges}
      />
      <Shatter
        visible={i.shatter.enabled}
        crackWidth={i.shatter.crackWidth}
        intensity={i.shatter.intensity}
        radius={i.shatter.radius}
        decay={i.shatter.decay}
        seed={i.shatter.seed}
        chromaticSplit={i.shatter.chromaticSplit}
        refractionStrength={i.shatter.refractionStrength}
        shardLighting={i.shatter.shardLighting}
        edges={i.shatter.edges}
      />
    </Shader>
  );
}
