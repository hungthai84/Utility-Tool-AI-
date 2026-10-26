'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Eye,
  EyeOff,
  Sparkles,
  Bot,
  Volume2,
  Radio,
  Tv,
  Coffee,
  Cpu,
  Maximize2,
  Minimize2,
  Music,
  Film,
  Download,
  Loader2,
  X,
  CheckCircle2,
} from 'lucide-react';
import type { StoryCharacter, DialogueLine } from '@/types/story';
import {
  normalizeBilingualLang,
  normalizePitchMultiplier,
  speakWithBrowserFallback,
  getRegionalDialectMeta,
  resolveRegionalDialectFromText,
  HUMAN_AVATARS,
  REGIONAL_SOUNDSCAPE_PRESETS,
  type RegionalSoundscapeId,
  resolveSoundscapeForDialect,
  regionalAmbientController,
} from '@/lib/bilingualVoiceEngine';
import {
  encodeRgbaFramesToGif89a,
  formatBytes,
  type GifConversionResult,
} from '@/lib/gifEncoderEngine';
import { Interactive3DAvatar } from './Avatar3DStudio';
import { useTheme } from '@/components/ThemeContext';

export type StageEnvironment = 'studio' | 'cyberpunk' | 'cafe' | 'cyberspace';

interface InteractiveCharacterStageProps {
  characters: StoryCharacter[];
  lines: DialogueLine[];
  activeLineId?: string | null;
  onSelectLine?: (lineId: string) => void;
  projectTitle?: string;
}

const STAGE_ENVIRONMENTS: {
  id: StageEnvironment;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  darkBgClass: string;
  lightBgClass: string;
  darkFloorClass: string;
  lightFloorClass: string;
  accentColor: string;
}[] = [
  {
    id: 'studio',
    label: 'Phòng thu',
    icon: Radio,
    darkBgClass:
      'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/90 via-slate-950 to-black',
    lightBgClass:
      'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100/90 via-indigo-50/70 to-slate-100',
    darkFloorClass: 'from-purple-900/30 via-indigo-950/40 to-black border-purple-500/20',
    lightFloorClass: 'from-purple-200/70 via-indigo-200/60 to-slate-200 border-purple-300',
    accentColor: 'purple',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    icon: Tv,
    darkBgClass:
      'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-950/90 via-cyan-950/70 to-slate-950',
    lightBgClass:
      'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-100/85 via-cyan-50/80 to-slate-100',
    darkFloorClass: 'from-cyan-500/25 via-fuchsia-900/30 to-black border-cyan-400/30',
    lightFloorClass: 'from-cyan-200/70 via-fuchsia-200/60 to-slate-200 border-cyan-300',
    accentColor: 'cyan',
  },
  {
    id: 'cafe',
    label: 'Quán Cafe',
    icon: Coffee,
    darkBgClass:
      'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/90 via-stone-900 to-neutral-950',
    lightBgClass:
      'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100/85 via-orange-50/70 to-stone-100',
    darkFloorClass: 'from-amber-700/25 via-stone-900/50 to-black border-amber-500/25',
    lightFloorClass: 'from-amber-200/70 via-orange-200/50 to-stone-200 border-amber-300',
    accentColor: 'amber',
  },
  {
    id: 'cyberspace',
    label: 'Không gian mạng',
    icon: Cpu,
    darkBgClass:
      'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/90 via-teal-950/60 to-black',
    lightBgClass:
      'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/85 via-teal-50/75 to-slate-100',
    darkFloorClass: 'from-emerald-500/25 via-teal-950/40 to-black border-emerald-400/30',
    lightFloorClass: 'from-emerald-200/70 via-teal-200/60 to-slate-200 border-emerald-300',
    accentColor: 'emerald',
  },
];

export const InteractiveCharacterStage: React.FC<InteractiveCharacterStageProps> = ({
  characters,
  lines,
  activeLineId,
  onSelectLine,
  projectTitle = 'Sân Khấu Biểu Diễn Đa Nhân Vật',
}) => {
  const { isDark } = useTheme();
  const [environment, setEnvironment] = useState<StageEnvironment>('cyberpunk');
  const [cleanStageView, setCleanStageView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Stage performance playback state
  const [isPlayingStage, setIsPlayingStage] = useState(false);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [manualSpotlightCharId, setManualSpotlightCharId] = useState<string | null>(null);
  const [mouthFrame, setMouthFrame] = useState(0);

  const stageAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  // Regional Ambient Soundscape State
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const [autoRegionAmbient, setAutoRegionAmbient] = useState(true);
  const [selectedSoundscape, setSelectedSoundscape] =
    useState<RegionalSoundscapeId>('bac_danbau');
  const [ambientVolume, setAmbientVolume] = useState(0.35);
  const [showSoundscapeBar, setShowSoundscapeBar] = useState(false);

  // Stage to GIF / MP4 Export State
  const [showExportDrawer, setShowExportDrawer] = useState(false);
  const [isExportingStage, setIsExportingStage] = useState(false);
  const [exportFormat, setExportFormat] = useState<'gif' | 'video'>('gif');
  const [exportProgressPct, setExportProgressPct] = useState(0);
  const [exportProgressLabel, setExportProgressLabel] = useState('');
  const [exportedGifResult, setExportedGifResult] = useState<GifConversionResult | null>(null);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedVideoSize, setExportedVideoSize] = useState<number>(0);

  // Sync external activeLineId if provided
  const [prevActiveLineId, setPrevActiveLineId] = useState<string | null | undefined>(null);
  if (activeLineId !== prevActiveLineId) {
    setPrevActiveLineId(activeLineId);
    if (activeLineId) {
      const foundIdx = lines.findIndex((l) => l.id === activeLineId);
      if (foundIdx >= 0) {
        setCurrentTurnIdx(foundIdx);
      }
    }
  }

  const currentLine = lines[currentTurnIdx] || null;

  // Determine which character is currently in the spotlight
  const activeSpeakerChar = React.useMemo(() => {
    if (manualSpotlightCharId) {
      return characters.find((c) => c.id === manualSpotlightCharId) || null;
    }
    if (!currentLine) return characters[0] || null;
    return (
      characters.find(
        (c) =>
          c.id === currentLine.characterId ||
          c.name.toLowerCase() === (currentLine.characterName || '').toLowerCase()
      ) ||
      characters[0] ||
      null
    );
  }, [manualSpotlightCharId, currentLine, characters]);

  // Auto-sync regional ambient soundscape when active speaker changes
  useEffect(() => {
    if (!ambientEnabled) {
      regionalAmbientController.stop();
      return;
    }
    let targetPreset = selectedSoundscape;
    if (autoRegionAmbient && activeSpeakerChar) {
      const charLang = normalizeBilingualLang(activeSpeakerChar.voiceProfile?.language);
      const dialect =
        activeSpeakerChar.voiceProfile?.vnDialect ||
        resolveRegionalDialectFromText(
          `${activeSpeakerChar.voiceProfile?.style || ''} ${activeSpeakerChar.description || ''} ${activeSpeakerChar.name || ''}`,
          charLang
        );
      targetPreset = resolveSoundscapeForDialect(dialect);
    }
    regionalAmbientController.start(targetPreset, ambientVolume);
    return () => {
      regionalAmbientController.stop();
    };
  }, [ambientEnabled, autoRegionAmbient, selectedSoundscape, activeSpeakerChar]);

  const handleAmbientVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
    regionalAmbientController.setVolume(newVol);
  };

  // Real-time Lip-sync mouth animation ticker when speaking
  useEffect(() => {
    if (!isPlayingStage && !manualSpotlightCharId) {
      return;
    }
    const interval = setInterval(() => {
      setMouthFrame((prev) => (prev + 1) % 4);
    }, 130);
    return () => clearInterval(interval);
  }, [isPlayingStage, manualSpotlightCharId]);

  // Cleanup audio/speech on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      regionalAmbientController.stop();
      if (stageAudioRef.current) {
        stageAudioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /**
   * Vẽ 1 khung hình Sân khấu 3D/2D Nhân vật Nhép Miệng lên Canvas 2D để xuất GIF89a hoặc Video MP4
   */
  const drawStageFrameToCanvas = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    frameIdx: number,
    totalFrames: number
  ) => {
    const speaker = activeSpeakerChar || characters[0];
    const lineText =
      currentLine?.text ||
      speaker?.sampleDialogue ||
      'Xin chào! Đang trình diễn trên sân khấu 3D/2D Lip-sync.';
    const speakerName = currentLine?.characterName || speaker?.name || 'Nhân vật AI';
    const isRobot =
      speaker?.gender === 'robot' ||
      speaker?.ageGroup === 'ai_robot' ||
      speaker?.role === 'ai_robot';
    const dialect =
      speaker?.voiceProfile?.vnDialect ||
      resolveRegionalDialectFromText(speaker?.description, speaker?.voiceProfile?.language);
    const dialectMeta = getRegionalDialectMeta(dialect);

    // 1. Background Stage Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (environment === 'cyberpunk') {
      bgGrad.addColorStop(0, '#2e1065');
      bgGrad.addColorStop(0.55, '#083344');
      bgGrad.addColorStop(1, '#020617');
    } else if (environment === 'cafe') {
      bgGrad.addColorStop(0, '#451a03');
      bgGrad.addColorStop(0.6, '#1c1917');
      bgGrad.addColorStop(1, '#0a0a0a');
    } else if (environment === 'cyberspace') {
      bgGrad.addColorStop(0, '#022c22');
      bgGrad.addColorStop(0.6, '#134e4a');
      bgGrad.addColorStop(1, '#020617');
    } else {
      bgGrad.addColorStop(0, '#3b0764');
      bgGrad.addColorStop(0.6, '#1e1b4b');
      bgGrad.addColorStop(1, '#030712');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Cyber grid lines
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. Overhead Volumetric Spotlight Cone
    const cx = w / 2;
    const spotGrad = ctx.createLinearGradient(cx, 0, cx, h * 0.72);
    spotGrad.addColorStop(0, isRobot ? 'rgba(34, 211, 238, 0.35)' : 'rgba(168, 85, 247, 0.35)');
    spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 35, 0);
    ctx.lineTo(cx + 35, 0);
    ctx.lineTo(cx + 125, h * 0.72);
    ctx.lineTo(cx - 125, h * 0.72);
    ctx.closePath();
    ctx.fill();

    // 3. Stage Floor Deck
    const floorGrad = ctx.createLinearGradient(0, h * 0.68, 0, h * 0.76);
    floorGrad.addColorStop(0, isRobot ? 'rgba(6, 182, 212, 0.35)' : 'rgba(147, 51, 234, 0.35)');
    floorGrad.addColorStop(1, 'rgba(15, 23, 42, 0.9)');
    ctx.fillStyle = floorGrad;
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.71, w * 0.42, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Animated 3D/2D Character Head & Lip-Sync on Stage
    const bounceY = Math.sin((frameIdx / totalFrames) * Math.PI * 4) * 4;
    const headX = cx;
    const headY = h * 0.39 + bounceY;
    const headR = 54;

    // Aura pulse ring
    const pulseR = headR + 8 + ((frameIdx * 3) % 14);
    ctx.strokeStyle = isRobot ? 'rgba(34, 211, 238, 0.45)' : 'rgba(192, 132, 252, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(headX, headY, pulseR, 0, Math.PI * 2);
    ctx.stroke();

    // Head sphere with 3D shading
    const skinColor =
      speaker?.avatar3DConfig?.skinColor || (isRobot ? '#38bdf8' : '#fcd34d');
    const hairColor =
      speaker?.avatar3DConfig?.hairColor || (isRobot ? '#0284c7' : '#312e81');
    const eyeColor =
      speaker?.avatar3DConfig?.eyeColor || (isRobot ? '#22d3ee' : '#6366f1');

    // Hair / Helmet dome
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(headX, headY - 6, headR + 4, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();

    // Face circle
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = isRobot ? '#22d3ee' : '#a855f7';
    ctx.stroke();

    // Blinking & Gazing 3D Eyes
    const isBlinking = frameIdx % 14 === 7;
    const gazeShiftX = Math.sin((frameIdx / totalFrames) * Math.PI * 2) * 3.5;
    [-20, 20].forEach((offsetX) => {
      const ex = headX + offsetX;
      const ey = headY - 8;
      if (isBlinking) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ex - 9, ey);
        ctx.lineTo(ex + 9, ey);
        ctx.stroke();
      } else {
        // Sclera
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(ex, ey, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Iris
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(ex + gazeShiftX, ey, 5.5, 0, Math.PI * 2);
        ctx.fill();
        // Pupil & specular highlight
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(ex + gazeShiftX, ey, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex + gazeShiftX - 2, ey - 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Animated Lip-Sync Mouth (Multi-viseme open/close)
    const visemeOpen = [4, 13, 8, 16, 6][frameIdx % 5];
    const my = headY + 20;
    if (isRobot) {
      // Cyber LED Equalizer Mouth
      for (let b = -2; b <= 2; b++) {
        const barH = Math.max(4, visemeOpen - Math.abs(b) * 2.5);
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(headX + b * 8 - 2.5, my - barH / 2, 5, barH);
      }
    } else {
      // 3D Lips, Teeth & Tongue
      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.ellipse(headX, my, 15, visemeOpen * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f43f5e';
      ctx.stroke();

      if (visemeOpen > 7) {
        // Upper teeth
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(headX - 9, my - visemeOpen * 0.45, 18, 3.5);
      }
    }

    // 5. Floating Regional Dialect & Character Badge
    const badgeText = `${speakerName} • ${dialectMeta.shortBadge}`;
    ctx.font = 'bold 12px "Play", sans-serif';
    ctx.textAlign = 'center';
    const badgeW = Math.min(w - 30, ctx.measureText(badgeText).width + 24);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(cx - badgeW / 2, headY - headR - 34, badgeW, 22, 11);
    ctx.fill();
    ctx.strokeStyle = isRobot ? '#22d3ee' : '#c084fc';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(badgeText, cx, headY - headR - 19);

    // 6. Subtitle Teleprompter Box at Bottom
    const subBoxX = 20;
    const subBoxY = h * 0.75;
    const subBoxW = w - 40;
    const subBoxH = h * 0.21;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
    ctx.beginPath();
    ctx.roundRect(subBoxX, subBoxY, subBoxW, subBoxH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Word-wrap subtitle
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 13px "Play", sans-serif';
    const words = `"${lineText}"`.split(/\s+/);
    const wrapped: string[] = [];
    let cur = '';
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word;
      if (ctx.measureText(test).width > subBoxW - 28 && cur) {
        wrapped.push(cur);
        cur = word;
      } else {
        cur = test;
      }
    }
    if (cur) wrapped.push(cur);
    const displayLines = wrapped.slice(0, 2);
    displayLines.forEach((l, i) => {
      ctx.fillText(l, cx, subBoxY + 24 + i * 18);
    });
  };

  /**
   * Xuất hoạt cảnh biểu diễn Sân khấu 3D/2D sang GIF89a hoặc Video MP4/WebM
   */
  const handleExportStagePerformance = async (format: 'gif' | 'video') => {
    setIsExportingStage(true);
    setExportFormat(format);
    setExportProgressPct(5);
    setExportProgressLabel(
      format === 'gif'
        ? 'Đang dựng khung hình Sân khấu 3D/2D Lip-sync...'
        : 'Đang quay luồng Video Sân khấu 3D/2D...'
    );

    const outW = 480;
    const outH = 300;
    const fps = 12;
    const totalFrames = 30; // ~2.5s seamless loop

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      setIsExportingStage(false);
      return;
    }

    try {
      if (format === 'gif') {
        const rgbaFrames: Uint8ClampedArray[] = [];
        for (let f = 0; f < totalFrames; f++) {
          drawStageFrameToCanvas(ctx, outW, outH, f, totalFrames);
          rgbaFrames.push(ctx.getImageData(0, 0, outW, outH).data);
          setExportProgressPct(Math.round(((f + 1) / totalFrames) * 45));
          if (f % 3 === 0) await new Promise((r) => setTimeout(r, 0));
        }

        const gifRes = await encodeRgbaFramesToGif89a({
          frames: rgbaFrames,
          width: outW,
          height: outH,
          fps,
          maxColors: 256,
          ditherAlgorithm: 'floyd_steinberg',
          ditherStrength: 60,
          fileName: `${(projectTitle || 'san-khau-3d').replace(/\s+/g, '-')}.gif`,
          onProgress: (pct, label) => {
            setExportProgressPct(pct);
            setExportProgressLabel(label);
          },
        });

        if (exportedGifResult?.blobUrl) {
          URL.revokeObjectURL(exportedGifResult.blobUrl);
        }
        setExportedGifResult(gifRes);
      } else {
        // Record video via MediaRecorder
        const stream = canvas.captureStream(fps);
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4';
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.start();

        for (let f = 0; f < totalFrames; f++) {
          drawStageFrameToCanvas(ctx, outW, outH, f, totalFrames);
          setExportProgressPct(Math.round(((f + 1) / totalFrames) * 95));
          setExportProgressLabel(`Đang ghi hình khung ${f + 1}/${totalFrames}...`);
          await new Promise((r) => setTimeout(r, Math.round(1000 / fps)));
        }

        await new Promise<void>((resolve) => {
          recorder.onstop = () => resolve();
          recorder.stop();
        });

        const videoBlob = new Blob(chunks, { type: mimeType });
        if (exportedVideoUrl) URL.revokeObjectURL(exportedVideoUrl);
        setExportedVideoUrl(URL.createObjectURL(videoBlob));
        setExportedVideoSize(videoBlob.size);
        setExportProgressPct(100);
        setExportProgressLabel('Hoàn tất xuất Video biểu diễn sân khấu!');
      }
    } catch (e) {
      console.error('Lỗi xuất Sân khấu:', e);
      setExportProgressLabel('Đã xảy ra lỗi khi xuất hoạt cảnh sân khấu.');
    } finally {
      setIsExportingStage(false);
    }
  };

  const playTurnAtIndex = (index: number) => {
    if (index < 0 || index >= lines.length) {
      setIsPlayingStage(false);
      isPlayingRef.current = false;
      return;
    }

    const line = lines[index];
    setCurrentTurnIdx(index);
    setManualSpotlightCharId(null);
    onSelectLine?.(line.id);

    const char = characters.find(
      (c) =>
        c.id === line.characterId ||
        c.name.toLowerCase() === (line.characterName || '').toLowerCase()
    );

    const advanceNext = () => {
      if (!isPlayingRef.current) return;
      if (index + 1 < lines.length) {
        setTimeout(() => {
          if (isPlayingRef.current) {
            playTurnAtIndex(index + 1);
          }
        }, line.pauseAfterMs || 350);
      } else {
        setIsPlayingStage(false);
        isPlayingRef.current = false;
      }
    };

    // If line has pre-synthesized audioUrl from Gemini Cloud TTS, play it
    if (line.audioUrl && line.audioUrl.startsWith('data:audio')) {
      if (!stageAudioRef.current) {
        stageAudioRef.current = new Audio();
      }
      const audio = stageAudioRef.current;
      audio.src = line.audioUrl;
      audio.playbackRate = char?.voiceProfile?.speed ?? 1.0;
      audio.onended = advanceNext;
      audio.onerror = () => {
        // Fallback to browser speech synthesis if audio fails
        speakWithBrowserFallback({
          text: line.text,
          language: char?.voiceProfile?.language,
          pitchMultiplier: normalizePitchMultiplier(
            char?.voiceProfile?.pitch,
            char?.voiceProfile?.pitchMultiplier
          ),
          rate: char?.voiceProfile?.speed ?? 1.0,
          isRobot: char?.gender === 'robot' || char?.role === 'ai_robot',
          onEnd: advanceNext,
        });
      };
      audio.play().catch(() => {
        speakWithBrowserFallback({
          text: line.text,
          language: char?.voiceProfile?.language,
          pitchMultiplier: normalizePitchMultiplier(
            char?.voiceProfile?.pitch,
            char?.voiceProfile?.pitchMultiplier
          ),
          rate: char?.voiceProfile?.speed ?? 1.0,
          isRobot: char?.gender === 'robot' || char?.role === 'ai_robot',
          onEnd: advanceNext,
        });
      });
    } else {
      // Immediate Bilingual Voice Engine playback (vi-VN / en-US)
      speakWithBrowserFallback({
        text: line.text,
        language: char?.voiceProfile?.language,
        pitchMultiplier: normalizePitchMultiplier(
          char?.voiceProfile?.pitch,
          char?.voiceProfile?.pitchMultiplier
        ),
        rate: char?.voiceProfile?.speed ?? 1.0,
        isRobot: char?.gender === 'robot' || char?.role === 'ai_robot',
        onEnd: advanceNext,
      });
    }
  };

  const toggleStagePlayback = () => {
    if (lines.length === 0) return;
    if (isPlayingStage) {
      isPlayingRef.current = false;
      setIsPlayingStage(false);
      stageAudioRef.current?.pause();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      isPlayingRef.current = true;
      setIsPlayingStage(true);
      playTurnAtIndex(currentTurnIdx);
    }
  };

  const handleCharacterClick = (char: StoryCharacter) => {
    isPlayingRef.current = false;
    setIsPlayingStage(false);
    stageAudioRef.current?.pause();
    setManualSpotlightCharId(char.id);

    const sample =
      char.sampleDialogue ||
      (normalizeBilingualLang(char.voiceProfile?.language) === 'en-US'
        ? `Hello! I am ${char.name} on the interactive stage.`
        : `Xin chào! Tôi là ${char.name} đang biểu diễn trên sân khấu.`);

    speakWithBrowserFallback({
      text: sample,
      language: char.voiceProfile?.language,
      pitchMultiplier: normalizePitchMultiplier(
        char.voiceProfile?.pitch,
        char.voiceProfile?.pitchMultiplier
      ),
      rate: char.voiceProfile?.speed ?? 1.0,
      isRobot: char.gender === 'robot' || char.role === 'ai_robot',
      onEnd: () => setManualSpotlightCharId(null),
    });
  };

  const envConfig =
    STAGE_ENVIRONMENTS.find((e) => e.id === environment) || STAGE_ENVIRONMENTS[1];

  return (
    <div
      className={`relative rounded-[14px] overflow-hidden border shadow-2xl transition-all duration-500 ${
        isDark
          ? `${envConfig.darkBgClass} border-white/15`
          : `${envConfig.lightBgClass} border-slate-200/90 shadow-indigo-500/10`
      } ${isFullscreen ? 'fixed inset-3 z-50 flex flex-col justify-between' : 'min-h-[460px]'}`}
    >
      {/* Background Stage Grid / Atmospheric Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ambient Ceiling Stage Lights */}
        <div
          className={`absolute -top-24 left-1/4 w-96 h-96 rounded-full blur-3xl ${
            isDark ? 'bg-purple-500/15' : 'bg-purple-400/20'
          }`}
        />
        <div
          className={`absolute -top-24 right-1/4 w-96 h-96 rounded-full blur-3xl ${
            isDark ? 'bg-cyan-500/15' : 'bg-cyan-400/20'
          }`}
        />

        {/* Cyber Grid Pattern for Cyberpunk / Cyberspace */}
        {(environment === 'cyberpunk' || environment === 'cyberspace') && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: isDark
                ? 'linear-gradient(to right, rgba(34,211,238,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,211,238,0.2) 1px, transparent 1px)'
                : 'linear-gradient(to right, rgba(79,70,229,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(79,70,229,0.18) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        )}
      </div>

      {/* Top Overlay Controls (Hidden in Clean Stage View) */}
      {!cleanStageView ? (
        <div
          className={`relative z-20 flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 backdrop-blur-md border-b transition-colors ${
            isDark
              ? 'bg-black/45 border-white/10'
              : 'bg-white/85 border-slate-200/80 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h4
                className={`text-xs sm:text-sm font-bold flex flex-wrap items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <span>{projectTitle}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isDark
                      ? 'bg-white/10 text-purple-300'
                      : 'bg-purple-100 text-purple-700 border border-purple-200'
                  }`}
                >
                  3D/2D Lip-Sync & Spotlight
                </span>
              </h4>
            </div>
          </div>

          {/* Environment Switcher & Clean View Toggle */}
          <div className="flex flex-wrap items-center gap-1.5">
            {STAGE_ENVIRONMENTS.map((env) => {
              const Icon = env.icon;
              const active = environment === env.id;
              return (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => setEnvironment(env.id)}
                  className={`px-2.5 py-1.5 rounded-[14px] text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : isDark
                      ? 'bg-white/5 hover:bg-white/15 text-gray-300'
                      : 'bg-slate-100 hover:bg-purple-50 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{env.label}</span>
                </button>
              );
            })}

            <div className={`h-4 w-px mx-1 ${isDark ? 'bg-white/15' : 'bg-slate-300'}`} />

            {/* Regional Ambient Soundscape Toggle Button */}
            <button
              type="button"
              onClick={() => {
                const nextState = !showSoundscapeBar;
                setShowSoundscapeBar(nextState);
                if (!ambientEnabled && nextState) {
                  setAmbientEnabled(true);
                }
              }}
              className={`px-2.5 py-1.5 rounded-[14px] border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                ambientEnabled
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                  : isDark
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
              }`}
              title="Hiệu ứng Âm thanh Bối cảnh Tự động theo Vùng Miền (Đàn bầu, Mưa Huế, Sóng nước Miền Tây, Cồng chiêng)"
            >
              <Music className="w-3.5 h-3.5" />
              <span>{ambientEnabled ? 'Nhạc nền Vùng miền: BẬT' : 'Nhạc bối cảnh Vùng'}</span>
            </button>

            {/* Export 3D/2D Stage to GIF or MP4 Button */}
            <button
              type="button"
              onClick={() => setShowExportDrawer((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-[14px] border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                showExportDrawer
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-md'
                  : isDark
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/35 text-cyan-300'
                  : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-800'
              }`}
              title="Xuất Video Biểu Diễn Sân Khấu 3D/2D sang GIF động hoặc MP4"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Xuất GIF / MP4</span>
            </button>

            <button
              type="button"
              onClick={() => setCleanStageView(true)}
              className={`px-2.5 py-1.5 rounded-[14px] border text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700'
              }`}
              title="Ẩn giao diện để quay màn hình (Clean Stage View)"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Clean View</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-[14px] transition-colors cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
              title="Phóng to / Thu nhỏ sân khấu"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ) : (
        /* Floating Restore Button in Clean Stage View */
        <button
          type="button"
          onClick={() => setCleanStageView(false)}
          className={`absolute top-4 right-4 z-30 px-3 py-1.5 rounded-[14px] text-xs border backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer ${
            isDark
              ? 'bg-black/60 hover:bg-black/80 text-white/80 hover:text-white border-white/20'
              : 'bg-white/90 hover:bg-white text-slate-800 border-slate-300 shadow-md'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-emerald-500" /> Hiện điều khiển
        </button>
      )}

      {/* DRAWER 1: HIỆU ỨNG ÂM THANH BỐI CẢNH TỰ ĐỘNG THEO VÙNG MIỀN (REGIONAL AMBIENT SOUNDSCAPE) */}
      {!cleanStageView && showSoundscapeBar && (
        <div
          className={`relative z-20 mx-5 mt-3 p-3.5 rounded-[14px] backdrop-blur-xl border space-y-2.5 transition-all ${
            isDark
              ? 'bg-black/65 border-amber-500/35 text-white'
              : 'bg-white/95 border-amber-300 text-slate-900 shadow-lg'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">
                Hiệu Ứng Âm Thanh Bối Cảnh Tự Động Theo Vùng Miền (Web Audio Synthesizer)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRegionAmbient}
                  onChange={(e) => setAutoRegionAmbient(e.target.checked)}
                  className="accent-amber-500"
                />
                <span>Tự động đổi theo vùng nhân vật đang nói</span>
              </label>
              <button
                type="button"
                onClick={() => setAmbientEnabled(!ambientEnabled)}
                className={`px-2.5 py-1 rounded-[10px] text-[11px] font-bold cursor-pointer ${
                  ambientEnabled
                    ? 'bg-emerald-500 text-black'
                    : isDark
                    ? 'bg-white/10 text-gray-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {ambientEnabled ? 'Đang phát nền' : 'Tắt'}
              </button>
              <button
                type="button"
                onClick={() => setShowSoundscapeBar(false)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5">
            {REGIONAL_SOUNDSCAPE_PRESETS.map((preset) => {
              const isSelected = selectedSoundscape === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setAutoRegionAmbient(false);
                    setSelectedSoundscape(preset.id);
                    setAmbientEnabled(true);
                  }}
                  className={`p-2 rounded-[12px] border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow'
                      : isDark
                      ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50'
                  }`}
                >
                  <div className="text-[11px] font-bold truncate">{preset.label}</div>
                  <div className="text-[9px] opacity-75 truncate">{preset.regionBadge}</div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="text-[11px] font-medium shrink-0">
              Âm lượng nhạc nền bối cảnh: {Math.round(ambientVolume * 100)}%
            </span>
            <input
              type="range"
              min={0.05}
              max={0.9}
              step={0.05}
              value={ambientVolume}
              onChange={(e) => handleAmbientVolumeChange(parseFloat(e.target.value))}
              className="w-40 accent-amber-500"
            />
          </div>
        </div>
      )}

      {/* DRAWER 2: XUẤT BIỂU DIỄN SÂN KHẤU 3D/2D SANG GIF89A HOẶC MP4/WEBM */}
      {!cleanStageView && showExportDrawer && (
        <div
          className={`relative z-20 mx-5 mt-3 p-4 rounded-[14px] backdrop-blur-xl border space-y-3 transition-all ${
            isDark
              ? 'bg-black/75 border-cyan-500/40 text-white'
              : 'bg-white/95 border-cyan-300 text-slate-900 shadow-lg'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold">
                Xuất Hoạt Cảnh Biểu Diễn Sân Khấu 3D/2D Sang Ảnh Động .GIF Hoặc Video .MP4
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowExportDrawer(false)}
              className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isExportingStage}
              onClick={() => handleExportStagePerformance('gif')}
              className="px-4 py-2 rounded-[14px] bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isExportingStage && exportFormat === 'gif' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Kết xuất Ảnh Động .GIF (GIF89a 256 màu)</span>
            </button>

            <button
              type="button"
              disabled={isExportingStage}
              onClick={() => handleExportStagePerformance('video')}
              className={`px-4 py-2 rounded-[14px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-purple-600/30 hover:bg-purple-600/50 border-purple-400/50 text-purple-200'
                  : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-800'
              }`}
            >
              {isExportingStage && exportFormat === 'video' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Film className="w-3.5 h-3.5" />
              )}
              <span>Quay & Xuất Video (.WebM / .MP4)</span>
            </button>
          </div>

          {(isExportingStage || exportProgressPct > 0) && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span>{exportProgressLabel}</span>
                <span>{exportProgressPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-200"
                  style={{ width: `${exportProgressPct}%` }}
                />
              </div>
            </div>
          )}

          {exportedGifResult && (
            <div className="p-3 rounded-[12px] border border-emerald-500/40 bg-emerald-950/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={exportedGifResult.blobUrl}
                  alt="Stage GIF Preview"
                  className="w-24 h-16 rounded-[8px] object-cover border border-emerald-400/50"
                />
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ảnh GIF Sân Khấu Đã Sẵn Sàng!
                  </div>
                  <div className="text-[11px] font-mono opacity-80">
                    {exportedGifResult.width}×{exportedGifResult.height}px •{' '}
                    {exportedGifResult.frameCount} frames •{' '}
                    {formatBytes(exportedGifResult.fileSizeBytes)}
                  </div>
                </div>
              </div>
              <a
                href={exportedGifResult.blobUrl}
                download={exportedGifResult.fileName}
                className="px-4 py-2 rounded-[12px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Tải GIF Sân Khấu
              </a>
            </div>
          )}

          {exportedVideoUrl && (
            <div className="p-3 rounded-[12px] border border-purple-500/40 bg-purple-950/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <video
                  src={exportedVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-24 h-16 rounded-[8px] object-cover border border-purple-400/50"
                />
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-purple-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Video Biểu Diễn Sân Khấu Đã Sẵn Sàng!
                  </div>
                  <div className="text-[11px] font-mono opacity-80">
                    480×300px • {formatBytes(exportedVideoSize)}
                  </div>
                </div>
              </div>
              <a
                href={exportedVideoUrl}
                download={`${(projectTitle || 'san-khau-3d').replace(/\s+/g, '-')}.webm`}
                className="px-4 py-2 rounded-[12px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Tải Video Sân Khấu
              </a>
            </div>
          )}
        </div>
      )}

      {/* MAIN 3D/2D CHARACTER STAGE AREA */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pt-12 pb-6 min-h-[320px]">
        {/* Characters Standing Row */}
        <div className="relative z-20 flex flex-wrap items-end justify-center gap-6 sm:gap-10 md:gap-14 pb-6">
          {characters.map((char) => {
            const isSpeaking =
              (isPlayingStage || manualSpotlightCharId !== null) &&
              activeSpeakerChar?.id === char.id;
            const isFocused = activeSpeakerChar?.id === char.id;
            const isRobot =
              char.gender === 'robot' ||
              char.ageGroup === 'ai_robot' ||
              char.role === 'ai_robot';
            const langCode = normalizeBilingualLang(char.voiceProfile?.language);
            const charDialect =
              char.voiceProfile?.vnDialect ||
              resolveRegionalDialectFromText(
                `${char.voiceProfile?.style || ''} ${char.description || ''} ${char.name || ''}`,
                langCode
              );
            const charDialectMeta = getRegionalDialectMeta(charDialect);

            return (
              <div
                key={char.id}
                onClick={() => handleCharacterClick(char)}
                className={`group relative flex flex-col items-center cursor-pointer transition-all duration-500 ${
                  isSpeaking
                    ? 'scale-110 -translate-y-4 z-30'
                    : isFocused
                    ? 'scale-105 -translate-y-2 z-20'
                    : 'scale-95 opacity-75 hover:opacity-100 z-10'
                }`}
              >
                {/* Volumetric Overhead Spotlight Cone */}
                {isFocused && (
                  <div
                    className="absolute -top-28 left-1/2 -translate-x-1/2 w-44 h-64 pointer-events-none -z-10 transition-opacity duration-500"
                    style={{
                      background: isRobot
                        ? 'conic-gradient(from 165deg at 50% 0%, transparent 0deg, rgba(34,211,238,0.28) 15deg, transparent 30deg)'
                        : 'conic-gradient(from 165deg at 50% 0%, transparent 0deg, rgba(168,85,247,0.30) 15deg, transparent 30deg)',
                      filter: 'blur(8px)',
                    }}
                  />
                )}

                {/* Emotion / Language / Regional Dialect Floating Tag */}
                <div
                  className={`mb-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 border backdrop-blur-md transition-all ${
                    isSpeaking
                      ? isRobot
                        ? isDark
                          ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/30'
                          : 'bg-cyan-600 border-cyan-500 text-white shadow-md'
                        : isDark
                        ? 'bg-purple-500/30 border-purple-400 text-purple-200 shadow-lg shadow-purple-500/30'
                        : 'bg-purple-600 border-purple-500 text-white shadow-md'
                      : isDark
                      ? 'bg-black/50 border-white/10 text-gray-300'
                      : 'bg-white/90 border-slate-200 text-slate-700 shadow-sm'
                  }`}
                >
                  {isRobot && (
                    <Bot
                      className={`w-3 h-3 ${
                        isSpeaking && !isDark ? 'text-white' : 'text-cyan-400'
                      }`}
                    />
                  )}
                  <span>{charDialectMeta.shortBadge}</span>
                  <span className="opacity-60">•</span>
                  <span className="font-mono">{langCode}</span>
                  {isSpeaking && (
                    <span className="ml-1 inline-flex items-end gap-0.5 h-2.5">
                      <span className="w-0.5 bg-emerald-400 animate-pulse h-full" />
                      <span className="w-0.5 bg-emerald-400 animate-bounce h-2" />
                      <span className="w-0.5 bg-emerald-400 animate-pulse h-1.5" />
                    </span>
                  )}
                </div>

                {/* 3D/2D Character Avatar Frame with Lip-Sync Overlay */}
                <div className="relative">
                  {/* Soundwave Aura Ring when speaking */}
                  {isSpeaking && (
                    <div
                      className={`absolute -inset-2 rounded-[14px] animate-ping opacity-30 ${
                        isRobot ? 'bg-cyan-400' : 'bg-purple-500'
                      }`}
                    />
                  )}

                  <div
                    className={`relative w-24 h-28 sm:w-28 sm:h-32 rounded-[14px] overflow-hidden border-2 transition-all shadow-2xl ${
                      isSpeaking
                        ? isRobot
                          ? 'border-cyan-400 shadow-cyan-500/50'
                          : 'border-purple-500 shadow-purple-500/50'
                        : isDark
                        ? 'border-white/20'
                        : 'border-white shadow-md'
                    }`}
                  >
                    <Interactive3DAvatar
                      avatarUrl={char.avatarUrl || HUMAN_AVATARS[0]}
                      avatar3DConfig={char.avatar3DConfig}
                      name={char.name}
                      isSpeaking={isSpeaking}
                      isRobot={isRobot}
                      size="stage"
                      className="w-full h-full"
                    />

                    {/* Subtle HUD scanline for AI Robot */}
                    {isRobot && (
                      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-cyan-500/20 pointer-events-none" />
                    )}

                    {/* Real-time Animated Lip-Sync Visualizer Overlay at lower face / chin for 2D avatars */}
                    {!char.avatar3DConfig?.enabled && (
                      <div className="absolute bottom-2 inset-x-0 flex flex-col items-center justify-center pointer-events-none">
                        {isSpeaking ? (
                          <div
                            className={`px-2.5 py-1 rounded-full backdrop-blur-md border flex items-center gap-1 ${
                              isRobot
                                ? 'bg-cyan-950/80 border-cyan-400/60'
                                : 'bg-purple-950/80 border-purple-400/60'
                            }`}
                          >
                            {/* Animated Lip / Voice Wave */}
                            <span
                              className={`w-1 rounded-full transition-all duration-100 ${
                                isRobot ? 'bg-cyan-300' : 'bg-pink-300'
                              }`}
                              style={{ height: mouthFrame % 2 === 0 ? '10px' : '4px' }}
                            />
                            <span
                              className={`w-1.5 rounded-full transition-all duration-100 ${
                                isRobot ? 'bg-cyan-400' : 'bg-rose-400'
                              }`}
                              style={{
                                height:
                                  mouthFrame === 0
                                    ? '14px'
                                    : mouthFrame === 1
                                    ? '6px'
                                    : mouthFrame === 2
                                    ? '12px'
                                    : '4px',
                              }}
                            />
                            <span
                              className={`w-1.5 rounded-full transition-all duration-100 ${
                                isRobot ? 'bg-cyan-400' : 'bg-rose-400'
                              }`}
                              style={{
                                height:
                                  mouthFrame === 1
                                    ? '14px'
                                    : mouthFrame === 3
                                    ? '11px'
                                    : '5px',
                              }}
                            />
                            <span
                              className={`w-1 rounded-full transition-all duration-100 ${
                                isRobot ? 'bg-cyan-300' : 'bg-pink-300'
                              }`}
                              style={{ height: mouthFrame % 2 === 1 ? '10px' : '4px' }}
                            />
                          </div>
                        ) : (
                          <div className="w-4 h-1 rounded-full bg-black/40 border border-white/20" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Character Pedestal & Nameplate */}
                <div className="mt-2.5 text-center">
                  <div
                    className={`text-xs font-bold px-3 py-1 rounded-[14px] border transition-all ${
                      isFocused
                        ? isDark
                          ? 'bg-white text-gray-900 border-white shadow-md'
                          : 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : isDark
                        ? 'bg-black/60 text-gray-200 border-white/10'
                        : 'bg-white/90 text-slate-800 border-slate-200 shadow-sm'
                    }`}
                  >
                    {char.name}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 font-mono ${
                      isDark ? 'text-gray-400' : 'text-slate-600'
                    }`}
                  >
                    Pitch{' '}
                    {normalizePitchMultiplier(
                      char.voiceProfile?.pitch,
                      char.voiceProfile?.pitchMultiplier
                    )}
                    x • {char.voiceProfile?.speed ?? 1.0}x
                  </div>
                </div>

                {/* 3D Floor Shadow under character */}
                <div
                  className={`mt-1.5 rounded-full blur-md transition-all duration-500 ${
                    isSpeaking
                      ? isRobot
                        ? 'w-24 h-3 bg-cyan-400/50'
                        : 'w-24 h-3 bg-purple-400/50'
                      : isDark
                      ? 'w-16 h-2 bg-black/70'
                      : 'w-16 h-2 bg-slate-400/50'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* 3D Perspective Stage Floor Deck */}
        <div
          className={`w-full h-8 rounded-full bg-gradient-to-r border-t shadow-inner ${
            isDark ? envConfig.darkFloorClass : envConfig.lightFloorClass
          }`}
        />

        {/* Active Dialogue Subtitle Teleprompter on Stage */}
        <div
          className={`mt-4 mx-auto w-full max-w-3xl p-4 rounded-[14px] backdrop-blur-xl border text-center space-y-1.5 shadow-2xl transition-colors ${
            isDark
              ? 'bg-black/65 border-white/15'
              : 'bg-white/95 border-purple-200/90 shadow-purple-500/10'
          }`}
        >
          {currentLine ? (
            <>
              <div
                className={`flex items-center justify-center gap-2 text-xs font-semibold ${
                  isDark ? 'text-purple-300' : 'text-purple-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentLine.characterName}</span>
                {currentLine.emotionStyle && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-normal ${
                      isDark
                        ? 'bg-white/10 text-gray-300'
                        : 'bg-purple-100 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {currentLine.emotionStyle}
                  </span>
                )}
              </div>
              <p
                className={`text-sm sm:text-base font-medium leading-relaxed break-words ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                &ldquo;{currentLine.text}&rdquo;
              </p>
            </>
          ) : (
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Nhấn vào nhân vật bất kỳ trên sân khấu để nghe thử giọng hoặc nạp kịch bản để trình diễn.
            </p>
          )}
        </div>
      </div>

      {/* Bottom Stage Playback Bar (Hidden in Clean Stage View) */}
      {!cleanStageView && (
        <div
          className={`relative z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-3 backdrop-blur-md border-t transition-colors ${
            isDark
              ? 'bg-black/60 border-white/10'
              : 'bg-white/90 border-slate-200/80'
          }`}
        >
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Lượt thoại:{' '}
            <span
              className={`font-mono font-semibold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {lines.length > 0 ? `${currentTurnIdx + 1} / ${lines.length}` : '0 / 0'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={lines.length === 0 || currentTurnIdx <= 0}
              onClick={() => {
                const prev = Math.max(0, currentTurnIdx - 1);
                setCurrentTurnIdx(prev);
                if (isPlayingStage) playTurnAtIndex(prev);
              }}
              className={`p-2 rounded-[14px] disabled:opacity-30 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 text-gray-300'
                  : 'bg-slate-100 hover:bg-purple-50 text-slate-700 border border-slate-200'
              }`}
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleStagePlayback}
              disabled={lines.length === 0}
              className="px-5 py-2 rounded-[14px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              {isPlayingStage ? (
                <>
                  <Pause className="w-4 h-4" /> Tạm dừng biểu diễn
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Biểu diễn trên sân khấu
                </>
              )}
            </button>

            <button
              type="button"
              disabled={lines.length === 0 || currentTurnIdx >= lines.length - 1}
              onClick={() => {
                const next = Math.min(lines.length - 1, currentTurnIdx + 1);
                setCurrentTurnIdx(next);
                if (isPlayingStage) playTurnAtIndex(next);
              }}
              className={`p-2 rounded-[14px] disabled:opacity-30 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 text-gray-300'
                  : 'bg-slate-100 hover:bg-purple-50 text-slate-700 border border-slate-200'
              }`}
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div
            className={`text-[11px] hidden sm:flex items-center gap-1.5 ${
              isDark ? 'text-gray-400' : 'text-slate-600'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-purple-500" />
            <span>Chạm vào từng nhân vật để nghe giọng mẫu</span>
          </div>
        </div>
      )}
    </div>
  );
};
