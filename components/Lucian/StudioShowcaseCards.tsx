'use client';

// Lucian UX/UI Prompt #050 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#050
// Spotlight-tilt Studio Demo Cards for Home Page

import React, { useRef } from 'react';
import { useTheme } from '@/components/ThemeContext';
import {
  Mic,
  Film,
  Scissors,
  ScanEye,
  Code2,
  Sparkles,
  ArrowRight,
  Play,
  Volume2,
  Zap,
  CheckCircle2,
  Layers,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface StudioItem {
  navId: number;
  studioName: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  gradient: string;
  previewType: 'voice' | 'gif' | 'bg_remover' | 'img_prompt' | 'codepen';
}

const STUDIOS: StudioItem[] = [
  {
    navId: 2,
    studioName: 'Giọng nói & Câu chuyện',
    tagline: 'Kịch bản AI & Giọng đọc song ngữ VI / EN',
    badge: 'Voice AI Studio',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: <Mic size={18} className="text-purple-400" />,
    gradient: 'from-purple-600 via-fuchsia-600 to-pink-600',
    previewType: 'voice',
  },
  {
    navId: 3,
    studioName: 'Video to GIF Studio',
    tagline: 'Cắt timeline, lượng tử 256 màu PaletteGen',
    badge: 'GIF89a Engine',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    icon: <Film size={18} className="text-cyan-400" />,
    gradient: 'from-cyan-500 via-sky-500 to-blue-600',
    previewType: 'gif',
  },
  {
    navId: 4,
    studioName: 'Background Remover Studio',
    tagline: 'Tách nền AI, viền tóc tơ mượt, nền đa dạng',
    badge: 'Alpha Matting',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: <Scissors size={18} className="text-rose-400" />,
    gradient: 'from-rose-500 via-pink-500 to-red-500',
    previewType: 'bg_remover',
  },
  {
    navId: 5,
    studioName: 'Image-to-Prompt Studio',
    tagline: 'Phân tích thị giác chi tiết & tạo 5 prompt',
    badge: 'Vision Multimodal',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: <ScanEye size={18} className="text-emerald-400" />,
    gradient: 'from-emerald-500 via-teal-500 to-green-600',
    previewType: 'img_prompt',
  },
  {
    navId: 6,
    studioName: 'CodePen Analyzer Studio',
    tagline: 'Dịch ngược Pen, 21 mục UI/UX & Code React',
    badge: 'Reverse Engineer',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: <Code2 size={18} className="text-amber-400" />,
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    previewType: 'codepen',
  },
];

function SpotlightTiltCard({
  studio,
  onClick,
}: {
  studio: StudioItem;
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    card.classList.add('is-live');
    card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);

    const rx = ((0.5 - y) * 9).toFixed(2);
    const ry = ((x - 0.5) * 12).toFixed(2);
    card.style.setProperty('--rx', `${rx}deg`);
    card.style.setProperty('--ry', `${ry}deg`);
  };

  const handlePointerLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.classList.remove('is-live');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      className={`group relative rounded-2xl cursor-pointer select-none transition-all duration-300 transform-gpu ${
        isDark
          ? 'bg-gradient-to-b from-white/10 to-white/5 border border-white/15 hover:border-white/30 text-white shadow-[0_12px_30px_rgba(0,0,0,0.5)]'
          : 'bg-white/90 border border-slate-200/90 hover:border-indigo-400 text-slate-800 shadow-[0_12px_30px_rgba(80,60,140,0.12)]'
      }`}
      style={{
        perspective: '1000px',
        transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
        transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
      }}
    >
      {/* Glare reflection overlay */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        style={{
          background:
            'radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.18), transparent 60%)',
        }}
      />

      <div className="p-3.5 sm:p-4 flex flex-col h-full justify-between gap-3 relative z-20">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${studio.gradient} flex items-center justify-center text-white shadow-md flex-shrink-0`}
            >
              {studio.icon}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Studio Nav #{studio.navId}
              </span>
              <h3 className="text-xs sm:text-sm font-black truncate leading-tight">
                {studio.studioName}
              </h3>
            </div>
          </div>

          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${studio.badgeColor} whitespace-nowrap hidden sm:inline-block`}
          >
            {studio.badge}
          </span>
        </div>

        {/* DEMO VISUAL CANVAS / PREVIEW MOCKUP */}
        <div
          className={`w-full rounded-xl p-2.5 border overflow-hidden transition-colors ${
            isDark ? 'bg-black/30 border-white/10' : 'bg-slate-100/90 border-slate-200'
          }`}
        >
          {/* Demo 1: Voice Story Studio */}
          {studio.previewType === 'voice' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-purple-400 font-bold">
                  <Volume2 size={11} /> Waveform AI
                </span>
                <span>02:45 / 05:20</span>
              </div>

              {/* Dynamic Sound Waveform Bars */}
              <div className="h-8 flex items-center justify-center gap-1">
                {[40, 70, 95, 55, 80, 100, 60, 85, 45, 90, 65, 75, 50, 85, 60].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-1 rounded-full bg-gradient-to-t from-purple-500 to-pink-500 opacity-80"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[9px] pt-1 border-t border-white/5 font-semibold text-slate-300">
                <span className="truncate">MC Quỳnh Anh • Nữ Truyền Cảm</span>
                <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                  VI / EN
                </span>
              </div>
            </div>
          )}

          {/* Demo 2: Video to GIF Studio */}
          {studio.previewType === 'gif' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-cyan-400 font-bold">
                  <Film size={11} /> Timeline Scrubber
                </span>
                <span className="text-emerald-400 font-bold">30 FPS • -78%</span>
              </div>

              {/* Timeline frame scrubbing bar */}
              <div className="h-6 rounded-lg bg-black/40 border border-cyan-500/30 p-1 flex items-center justify-between relative overflow-hidden">
                <div className="absolute left-2 top-0 bottom-0 w-8 bg-cyan-500/25 border-x border-cyan-400 rounded-sm" />
                <div className="w-full flex items-center justify-between text-[8px] text-slate-400 px-1 font-mono">
                  <span>0.0s</span>
                  <span>1.2s</span>
                  <span>2.4s</span>
                  <span>3.5s</span>
                </div>
              </div>

              {/* PaletteGen 256 colors spectrum */}
              <div className="h-1.5 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 via-emerald-400 via-cyan-400 to-purple-600 opacity-90" />
            </div>
          )}

          {/* Demo 3: Background Remover Studio */}
          {studio.previewType === 'bg_remover' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <Scissors size={11} /> Before / After Split
                </span>
                <span className="text-rose-300">Alpha Matting</span>
              </div>

              {/* Split screen demo: Left solid vs Right Checkerboard */}
              <div className="h-8 rounded-lg overflow-hidden flex border border-white/10 relative">
                <div className="w-1/2 bg-slate-700 flex items-center justify-center text-[9px] text-slate-300 font-bold">
                  Ảnh Gốc
                </div>
                <div
                  className="w-1/2 flex items-center justify-center text-[9px] text-emerald-400 font-bold"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                  }}
                >
                  Tách Nền
                </div>
                <div className="absolute left-1/2 -top-1 -bottom-1 w-0.5 bg-amber-400 shadow-sm" />
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400">
                <span>Tóc tơ mềm mịn</span>
                <span className="text-slate-300">Độ chuẩn: 99.4%</span>
              </div>
            </div>
          )}

          {/* Demo 4: Image-to-Prompt Studio */}
          {studio.previewType === 'img_prompt' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ScanEye size={11} /> Visual AI Tags
                </span>
                <span className="text-emerald-300">5 Biến Thể</span>
              </div>

              {/* Detected color chips & tags */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/30 text-slate-300 border border-white/10">
                  Rim Light
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/30 text-slate-300 border border-white/10">
                  Golden 1/3
                </span>
                <div className="flex items-center -space-x-1 ml-auto">
                  {['#38bdf8', '#a855f7', '#f59e0b', '#10b981'].map((hex) => (
                    <div
                      key={hex}
                      className="w-3.5 h-3.5 rounded-full border border-white/30"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>

              <p className="text-[9px] font-mono text-slate-400 truncate">
                Prompt: &quot;Cinematic portrait, volumetric lighting...&quot;
              </p>
            </div>
          )}

          {/* Demo 5: CodePen Analyzer Studio */}
          {studio.previewType === 'codepen' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Code2 size={11} /> Pen Reverse Spec
                </span>
                <span className="text-amber-300">21 Items</span>
              </div>

              {/* Mini browser sandbox mockup */}
              <div className="h-8 rounded-lg bg-black/40 border border-amber-500/30 p-1 flex items-center justify-between font-mono text-[9px]">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span className="text-slate-400 text-[8px] truncate max-w-[90px] ml-1">
                    codepen.io/pen/...
                  </span>
                </div>
                <span className="text-[8px] font-bold text-amber-400">React 19</span>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400">
                <span>DOM & Keyframes</span>
                <span className="text-emerald-400 font-bold">Next.js JSX</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
            {studio.tagline}
          </p>
          <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-amber-500 group-hover:text-black flex items-center justify-center transition-all duration-300 flex-shrink-0">
            <ArrowRight size={13} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudioShowcaseCards() {
  const { setActiveNav, isDark } = useTheme();

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
          <h2
            className={`text-base sm:text-lg font-black tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Bộ Sưu Tập AI Studio Chuyên Nghiệp (Live Demo Previews)
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
            5 Studio Độc Quyền
          </span>
        </div>

        <span className="text-xs text-slate-400">
          Chạm hoặc rê chuột để kích hoạt hiệu ứng 3D Spotlight Tilt (Lucian UX/UI #050)
        </span>
      </div>

      {/* 5-Column Responsive Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {STUDIOS.map((studio) => (
          <SpotlightTiltCard
            key={studio.navId}
            studio={studio}
            onClick={() => setActiveNav(studio.navId)}
          />
        ))}
      </div>
    </div>
  );
}

export default StudioShowcaseCards;
