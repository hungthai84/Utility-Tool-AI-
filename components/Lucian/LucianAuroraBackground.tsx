'use client';

// Lucian UX/UI Prompt #319 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#319
// Ported for Utility Hub Multi-Theme Ambient Background System

import React, { useEffect, useRef } from 'react';
import { useTheme, ThemeType } from '@/components/ThemeContext';

interface ThemeColorSet {
  bg: [number, number, number];
  colors: [number, number, number][];
}

const THEME_PALETTES: Record<ThemeType, ThemeColorSet> = {
  dark: {
    bg: [15, 12, 31], // #0f0c1f
    colors: [
      [124, 58, 237], // Purple
      [236, 72, 153], // Pink
      [79, 70, 229],  // Indigo
      [168, 85, 247], // Violet
      [59, 130, 246], // Blue
    ],
  },
  light: {
    bg: [238, 242, 255], // Soft iridescent light
    colors: [
      [199, 210, 254], // Soft indigo
      [244, 114, 182], // Soft rose
      [167, 139, 250], // Lavender
      [147, 197, 253], // Sky
      [165, 243, 209], // Mint
    ],
  },
  cyber: {
    bg: [9, 0, 20], // Deep cyber
    colors: [
      [0, 240, 255],  // Cyan
      [255, 0, 128],  // Neon Pink
      [120, 0, 255],  // Electric Purple
      [0, 255, 150],  // Neon Green
      [255, 230, 0],  // Yellow
    ],
  },
  clay: {
    bg: [240, 230, 255], // Soft clay
    colors: [
      [216, 180, 254], // Lilac
      [253, 164, 175], // Pastel Rose
      [187, 222, 251], // Pastel Blue
      [254, 215, 170], // Peach
      [167, 243, 208], // Pastel Mint
    ],
  },
  emerald: {
    bg: [6, 32, 27], // Deep Forest
    colors: [
      [52, 211, 153],  // Emerald 400
      [16, 185, 129],  // Emerald 500
      [5, 150, 105],   // Emerald 600
      [45, 212, 191],  // Teal 400
      [110, 231, 183], // Mint
    ],
  },
};

export function LucianAuroraBackground() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number | null = null;
    let isVisible = true;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const S = 64; // Low-res buffer for ultra-fast canvas drawing + hardware blur
    canvas.width = S;
    canvas.height = S;

    const targetPalette = THEME_PALETTES[theme] || THEME_PALETTES.dark;
    let curBg = [...targetPalette.bg] as [number, number, number];
    let curColors = targetPalette.colors.map((c) => [...c] as [number, number, number]);

    // 5 drifting aurora light pools (Lucian #319 mechanics)
    const orbs = [0, 1, 2, 3, 4].map((i) => ({
      bx: 0.2 + ((i * 0.37) % 0.65),
      by: 0.25 + ((i * 0.53) % 0.55),
      x: 0.5,
      y: 0.5,
      r: 0.38 + (i % 3) * 0.1,
      ph: i * 1.7,
      sp: 0.16 + i * 0.03,
    }));

    let ptr: { x: number; y: number } | null = null;
    let follow = { x: 0.5, y: 0.5 };
    let lastTime = performance.now();

    const draw = (t: number) => {
      // Smooth color transitions between theme switches
      const tPalette = THEME_PALETTES[theme] || THEME_PALETTES.dark;
      curBg[0] += (tPalette.bg[0] - curBg[0]) * 0.08;
      curBg[1] += (tPalette.bg[1] - curBg[1]) * 0.08;
      curBg[2] += (tPalette.bg[2] - curBg[2]) * 0.08;

      for (let i = 0; i < curColors.length; i++) {
        curColors[i][0] += (tPalette.colors[i][0] - curColors[i][0]) * 0.08;
        curColors[i][1] += (tPalette.colors[i][1] - curColors[i][1]) * 0.08;
        curColors[i][2] += (tPalette.colors[i][2] - curColors[i][2]) * 0.08;
      }

      ctx.fillStyle = `rgb(${curBg[0] | 0},${curBg[1] | 0},${curBg[2] | 0})`;
      ctx.fillRect(0, 0, S, S);

      // Render 5 light orbs
      for (let i = 0; i < orbs.length; i++) {
        const b = orbs[i];
        if (i === 0) {
          b.x = follow.x;
          b.y = follow.y;
        } else {
          const osc = Math.sin(t * b.sp + b.ph);
          const osc2 = Math.cos(t * b.sp * 0.8 + b.ph);
          b.x = b.bx + osc * 0.18 + (follow.x - 0.5) * 0.15;
          b.y = b.by + osc2 * 0.16 + (follow.y - 0.5) * 0.15;
        }

        const rad = b.r * S;
        const grad = ctx.createRadialGradient(b.x * S, b.y * S, 0, b.x * S, b.y * S, Math.max(1, rad));
        const c = curColors[i];
        grad.addColorStop(0, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0}, 0.85)`);
        grad.addColorStop(0.55, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0}, 0.35)`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x * S, b.y * S, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const onPointerMove = (e: PointerEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ptr = { x: Math.max(0, Math.min(1, e.clientX / w)), y: Math.max(0, Math.min(1, e.clientY / h)) };
      if (isReducedMotion) draw(2);
    };

    const onPointerLeave = () => {
      ptr = null;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const t = now * 0.001;

      const aim = ptr || {
        x: 0.5 + Math.sin(t * 0.3) * 0.22,
        y: 0.45 + Math.cos(t * 0.25) * 0.18,
      };

      follow.x += (aim.x - follow.x) * (1 - Math.pow(0.12, dt));
      follow.y += (aim.y - follow.y) * (1 - Math.pow(0.12, dt));

      draw(t);
      if (isVisible) {
        rafId = requestAnimationFrame(frame);
      }
    };

    if (isReducedMotion) {
      draw(2);
    } else {
      rafId = requestAnimationFrame(frame);
    }

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-700"
    >
      <canvas
        ref={canvasRef}
        className="w-[120vw] h-[120vh] -left-[10vw] -top-[10vh] absolute object-cover filter blur-[80px] sm:blur-[110px] scale-110 saturate-150 opacity-45 dark:opacity-55"
      />
    </div>
  );
}
export default LucianAuroraBackground;
