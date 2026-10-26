'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Avatar3DConfig, CharacterGender } from '@/types/story';

export const DEFAULT_3D_PRESETS: {
  id: Avatar3DConfig['presetId'];
  label: string;
  badge: string;
  genderMatch: CharacterGender;
  config: Avatar3DConfig;
}[] = [
  {
    id: 'female_3d',
    label: 'Nữ 3D Truyền Cảm',
    badge: 'Mắt long lanh • Nhép môi 3D',
    genderMatch: 'female',
    config: {
      enabled: true,
      presetId: 'female_3d',
      skinColor: '#FFDFC4',
      hairColor: '#3B234A',
      eyeColor: '#7C3AED',
      eyeStyle: 'anime',
      mouthStyle: 'natural_lips',
      accessory: 'headset',
      eyeTrackingMode: 'auto_blink_gaze',
      lipSyncSensitivity: 1.2,
      eyeOffsetY: 42,
      mouthOffsetY: 70,
    },
  },
  {
    id: 'male_3d',
    label: 'Nam 3D Lịch Lãm',
    badge: 'Đảo mắt 3D • Biểu cảm',
    genderMatch: 'male',
    config: {
      enabled: true,
      presetId: 'male_3d',
      skinColor: '#F3C6A5',
      hairColor: '#1E293B',
      eyeColor: '#2563EB',
      eyeStyle: 'natural',
      mouthStyle: 'smile_3d',
      accessory: 'glasses',
      eyeTrackingMode: 'auto_blink_gaze',
      lipSyncSensitivity: 1.15,
      eyeOffsetY: 42,
      mouthOffsetY: 70,
    },
  },
  {
    id: 'child_3d',
    label: 'Bé 3D Đáng Yêu',
    badge: 'Mắt to tròn • Hồn nhiên',
    genderMatch: 'female',
    config: {
      enabled: true,
      presetId: 'child_3d',
      skinColor: '#FFE5D0',
      hairColor: '#78350F',
      eyeColor: '#059669',
      eyeStyle: 'cute',
      mouthStyle: 'smile_3d',
      accessory: 'crown',
      eyeTrackingMode: 'lively',
      lipSyncSensitivity: 1.35,
      eyeOffsetY: 44,
      mouthOffsetY: 71,
    },
  },
  {
    id: 'elder_3d',
    label: 'Trưởng Lão 3D',
    badge: 'Điềm đạm • Kính thông thái',
    genderMatch: 'male',
    config: {
      enabled: true,
      presetId: 'elder_3d',
      skinColor: '#EBC09E',
      hairColor: '#CBD5E1',
      eyeColor: '#475569',
      eyeStyle: 'natural',
      mouthStyle: 'natural_lips',
      accessory: 'glasses',
      eyeTrackingMode: 'auto_blink_gaze',
      lipSyncSensitivity: 1.0,
      eyeOffsetY: 43,
      mouthOffsetY: 71,
    },
  },
  {
    id: 'robot_3d',
    label: 'CyberBot 3D',
    badge: 'Mắt LED • Sóng âm 3D',
    genderMatch: 'robot',
    config: {
      enabled: true,
      presetId: 'robot_3d',
      skinColor: '#1E293B',
      hairColor: '#06B6D4',
      eyeColor: '#22D3EE',
      eyeStyle: 'cyber_glow',
      mouthStyle: 'cyber_wave',
      accessory: 'halo',
      eyeTrackingMode: 'lively',
      lipSyncSensitivity: 1.4,
      eyeOffsetY: 42,
      mouthOffsetY: 70,
    },
  },
  {
    id: 'custom_logo_rig',
    label: 'Logo / Ảnh Máy + Rig 3D',
    badge: 'Gắn Mắt & Miệng 3D lên ảnh',
    genderMatch: 'female',
    config: {
      enabled: true,
      presetId: 'custom_logo_rig',
      skinColor: '#F8FAFC',
      hairColor: '#6366F1',
      eyeColor: '#8B5CF6',
      eyeStyle: 'anime',
      mouthStyle: 'natural_lips',
      accessory: 'none',
      eyeTrackingMode: 'follow_cursor',
      lipSyncSensitivity: 1.25,
      eyeOffsetY: 42,
      mouthOffsetY: 70,
    },
  },
];

export const SKIN_COLOR_PALETTE = [
  { label: 'Hồng phấn 3D', value: '#FFE5D0' },
  { label: 'Châu Á ấm', value: '#FFDFC4' },
  { label: 'Nắng mật ong', value: '#F3C6A5' },
  { label: 'Ngăm khỏe khoắn', value: '#D2996C' },
  { label: 'Titan Cyber', value: '#1E293B' },
  { label: 'Bạch kim AI', value: '#E2E8F0' },
];

export const HAIR_COLOR_PALETTE = [
  { label: 'Đen huyền', value: '#1E293B' },
  { label: 'Tím Violet', value: '#4C1D95' },
  { label: 'Nâu hạt dẻ', value: '#78350F' },
  { label: 'Bạch kim', value: '#CBD5E1' },
  { label: 'Đỏ Ruby', value: '#991B1B' },
  { label: 'Neon Cyan', value: '#06B6D4' },
];

export const EYE_COLOR_PALETTE = [
  { label: 'Tím Amethyst', value: '#7C3AED' },
  { label: 'Xanh đại dương', value: '#2563EB' },
  { label: 'Xanh ngọc lục bảo', value: '#059669' },
  { label: 'Nâu hổ phách', value: '#B45309' },
  { label: 'Cyan Hologram', value: '#22D3EE' },
  { label: 'Hồng Rose', value: '#E11D48' },
];

/**
 * Tạo chuỗi Data URL SVG tĩnh đại diện cho Avatar 3D để tương thích ngược với mọi thẻ <img>
 */
export function build3DAvatarSvgDataUrl(config: Avatar3DConfig): string {
  if (config.presetId === 'custom_logo_rig' && config.customLogoUrl) {
    return config.customLogoUrl;
  }
  const isRobot = config.presetId === 'robot_3d';
  const bgStart = isRobot ? '#0F172A' : '#312E81';
  const bgEnd = isRobot ? '#083344' : '#581C87';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <radialGradient id="bg" cx="50%" cy="35%" r="70%">
        <stop offset="0%" stop-color="${bgEnd}" />
        <stop offset="100%" stop-color="${bgStart}" />
      </radialGradient>
      <radialGradient id="face3d" cx="38%" cy="32%" r="65%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
        <stop offset="35%" stop-color="${config.skinColor}" stop-opacity="1" />
        <stop offset="100%" stop-color="${config.skinColor}" stop-opacity="0.88" />
      </radialGradient>
    </defs>
    <rect width="120" height="120" rx="24" fill="url(#bg)" />
    <path d="M26 52 C26 20, 94 20, 94 52 Z" fill="${config.hairColor}" />
    <rect x="30" y="34" width="60" height="62" rx="${isRobot ? 16 : 30}" fill="${config.skinColor}" />
    <rect x="30" y="34" width="60" height="62" rx="${isRobot ? 16 : 30}" fill="url(#face3d)" />
    <circle cx="46" cy="58" r="6.5" fill="#FFFFFF" />
    <circle cx="74" cy="58" r="6.5" fill="#FFFFFF" />
    <circle cx="46" cy="58" r="4" fill="${config.eyeColor}" />
    <circle cx="74" cy="58" r="4" fill="${config.eyeColor}" />
    <circle cx="44.5" cy="56.5" r="1.5" fill="#FFFFFF" />
    <circle cx="72.5" cy="56.5" r="1.5" fill="#FFFFFF" />
    <path d="M48 78 Q60 85 72 78" stroke="${isRobot ? '#22D3EE' : '#E11D48'}" stroke-width="3.5" stroke-linecap="round" fill="none" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface Interactive3DAvatarProps {
  avatarUrl?: string;
  avatar3DConfig?: Avatar3DConfig;
  name?: string;
  isSpeaking?: boolean;
  isRobot?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'stage';
  className?: string;
}

/**
 * Component hiển thị Avatar 3D có khả năng chuyển động mắt (chớp mắt + đảo mắt / theo chuột)
 * và nhép miệng đa khẩu hình (Viseme Lip-Sync) theo thời gian thực.
 */
export const Interactive3DAvatar: React.FC<Interactive3DAvatarProps> = ({
  avatarUrl,
  avatar3DConfig,
  name = 'Character',
  isSpeaking = false,
  isRobot = false,
  size = 'md',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Eye Blink & Gaze State
  const [isBlinking, setIsBlinking] = useState(false);
  const [gaze, setGaze] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [headTilt, setHeadTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });

  // Mouth Viseme State (0: closed smile, 1: small O, 2: open AH, 3: wide EE, 4: medium talk)
  const [viseme, setViseme] = useState<number>(0);

  const is3DEnabled = Boolean(avatar3DConfig?.enabled);
  const cfg: Avatar3DConfig = avatar3DConfig || DEFAULT_3D_PRESETS[0].config;

  // Natural Eye Blinking Loop
  useEffect(() => {
    if (!is3DEnabled) return;
    let blinkTimeout: ReturnType<typeof setTimeout>;
    let reopenTimeout: ReturnType<typeof setTimeout>;

    const scheduleBlink = () => {
      const nextDelay = 2000 + Math.random() * 2400;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        reopenTimeout = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 150);
      }, nextDelay);
    };

    scheduleBlink();
    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(reopenTimeout);
    };
  }, [is3DEnabled]);

  // Autonomous Eye Saccade / Gaze & 3D Head Motion Loop
  useEffect(() => {
    if (!is3DEnabled) return;
    const interval = setInterval(
      () => {
        const range = cfg.eyeTrackingMode === 'lively' || isSpeaking ? 3.4 : 2.2;
        const gx = (Math.random() - 0.5) * 2 * range;
        const gy = (Math.random() - 0.5) * 1.6 * range;
        setGaze({ x: gx, y: gy });

        if (isSpeaking) {
          setHeadTilt({
            rx: (Math.random() - 0.5) * 8,
            ry: (Math.random() - 0.5) * 12,
          });
        } else {
          setHeadTilt({
            rx: (Math.random() - 0.5) * 3,
            ry: (Math.random() - 0.5) * 5,
          });
        }
      },
      isSpeaking ? 420 : 1600
    );

    return () => clearInterval(interval);
  }, [is3DEnabled, cfg.eyeTrackingMode, isSpeaking]);

  // Real-time Mouth Lip-Sync Viseme Loop when speaking
  useEffect(() => {
    if (!isSpeaking) {
      return;
    }
    const sequence = [2, 4, 1, 3, 2, 0, 4, 1, 2, 3];
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % sequence.length;
      setViseme(sequence[step]);
    }, 115);

    return () => {
      clearInterval(interval);
    };
  }, [isSpeaking]);

  const activeViseme = isSpeaking ? viseme : 0;

  // Interactive Mouse Tracking for Eyes & 3D Head Perspective
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!is3DEnabled || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)));
    const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)));

    setGaze({ x: dx * 3.8, y: dy * 2.6 });
    setHeadTilt({ rx: -dy * 10, ry: dx * 14 });
  };

  const handleMouseLeave = () => {
    if (!is3DEnabled) return;
    setGaze({ x: 0, y: 0 });
    setHeadTilt({ rx: 0, ry: 0 });
  };

  const sizeDims =
    size === 'sm'
      ? 'w-10 h-10'
      : size === 'md'
      ? 'w-14 h-14'
      : size === 'lg'
      ? 'w-24 h-24'
      : 'w-24 h-28 sm:w-28 sm:h-32';

  // Fallback to 2D image if 3D is not enabled
  if (!is3DEnabled) {
    return (
      <div className={`relative overflow-hidden ${sizeDims} ${className}`}>
        <img
          src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const isCustomLogoRig =
    cfg.presetId === 'custom_logo_rig' && Boolean(cfg.customLogoUrl || avatarUrl);
  const customBgImage = cfg.customLogoUrl || avatarUrl;
  const isRobotPreset = cfg.presetId === 'robot_3d' || isRobot || cfg.eyeStyle === 'cyber_glow';
  const eyeY = cfg.eyeOffsetY ?? 42;
  const mouthY = cfg.mouthOffsetY ?? 70;
  const sensitivity = cfg.lipSyncSensitivity || 1.15;

  // Compute dynamic mouth opening dimensions from activeViseme
  const mouthOpenHeight =
    activeViseme === 0
      ? 3
      : activeViseme === 1
      ? 9 * sensitivity
      : activeViseme === 2
      ? 14 * sensitivity
      : activeViseme === 3
      ? 8 * sensitivity
      : 11 * sensitivity;

  const mouthWidth =
    activeViseme === 0
      ? 22
      : activeViseme === 1
      ? 13
      : activeViseme === 2
      ? 22
      : activeViseme === 3
      ? 26
      : 19;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative select-none overflow-hidden ${sizeDims} ${className}`}
      style={{
        perspective: '500px',
      }}
    >
      {/* 3D Ambient Backdrop */}
      <div
        className={`absolute inset-0 ${
          isRobotPreset
            ? 'bg-gradient-to-br from-slate-900 via-cyan-950 to-indigo-950'
            : 'bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-fuchsia-900/80'
        }`}
      />

      {/* 3D Tilting Head Container */}
      <div
        className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${headTilt.rx.toFixed(1)}deg) rotateY(${headTilt.ry.toFixed(
            1
          )}deg) translateY(${isSpeaking ? (activeViseme % 2 === 0 ? '-2px' : '1px') : '0px'})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {isCustomLogoRig && customBgImage ? (
          /* MODE A: Custom Uploaded Logo / Image with 3D Eye & Mouth Rig Overlay */
          <div className="relative w-full h-full">
            <img
              src={customBgImage}
              alt={name}
              className="w-full h-full object-cover"
            />

            {/* 3D Animated Eyes Rig Overlay on Custom Image */}
            <div
              className="absolute inset-x-0 flex items-center justify-center gap-[18%] pointer-events-none"
              style={{ top: `${eyeY}%`, transform: 'translateY(-50%)' }}
            >
              {[0, 1].map((eyeIdx) => (
                <div
                  key={eyeIdx}
                  className="relative w-[22%] aspect-square max-w-[26px] rounded-full bg-white shadow-md border border-slate-800/40 flex items-center justify-center overflow-hidden transition-transform duration-100"
                  style={{
                    transform: isBlinking ? 'scaleY(0.08)' : 'scaleY(1)',
                  }}
                >
                  {/* Iris & Pupil */}
                  <div
                    className="w-[64%] h-[64%] rounded-full flex items-center justify-center relative transition-transform duration-150"
                    style={{
                      backgroundColor: cfg.eyeColor,
                      transform: `translate(${gaze.x}px, ${gaze.y}px)`,
                      boxShadow:
                        cfg.eyeStyle === 'cyber_glow' ? `0 0 8px ${cfg.eyeColor}` : 'inset 0 1px 3px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div className="w-[48%] h-[48%] rounded-full bg-slate-950" />
                    <div className="absolute top-[14%] left-[18%] w-[26%] h-[26%] rounded-full bg-white opacity-90" />
                  </div>
                </div>
              ))}
            </div>

            {/* 3D Animated Lip-Sync Mouth Overlay on Custom Image */}
            <div
              className="absolute inset-x-0 flex items-center justify-center pointer-events-none"
              style={{ top: `${mouthY}%`, transform: 'translateY(-50%)' }}
            >
              {cfg.mouthStyle === 'cyber_wave' ? (
                <div className="px-2 py-0.5 rounded-full bg-slate-950/85 border border-cyan-400/70 flex items-center gap-0.5 shadow-lg">
                  {[0, 1, 2, 3].map((bar) => (
                    <span
                      key={bar}
                      className="w-1 rounded-full bg-cyan-400 transition-all duration-100"
                      style={{
                        height: isSpeaking
                          ? `${4 + ((activeViseme + bar) % 4) * 3.5}px`
                          : '3px',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="relative overflow-hidden transition-all duration-100 flex flex-col items-center justify-between border-2 border-rose-500 shadow-md"
                  style={{
                    width: `${Math.max(14, mouthWidth * 0.85)}px`,
                    height: `${Math.max(4, Math.min(20, mouthOpenHeight))}px`,
                    borderRadius: activeViseme === 1 ? '999px' : '4px 4px 14px 14px',
                    backgroundColor: activeViseme === 0 ? '#F43F5E' : '#4C0519',
                  }}
                >
                  {activeViseme > 0 && (
                    <>
                      {/* Upper 3D Teeth */}
                      <div className="w-[80%] h-[3px] bg-white rounded-b-sm shrink-0" />
                      {/* 3D Tongue */}
                      <div className="w-[65%] h-[50%] bg-rose-400 rounded-t-full mt-auto" />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* MODE B: Full Procedural 3D Stylized Character Avatar SVG with Real-time Rig */
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]"
          >
            <defs>
              <radialGradient id={`skinGrad_${cfg.presetId}`} cx="36%" cy="30%" r="68%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
                <stop offset="32%" stopColor={cfg.skinColor} stopOpacity="1" />
                <stop offset="100%" stopColor={cfg.skinColor} stopOpacity="0.85" />
              </radialGradient>
              <linearGradient id={`hairGrad_${cfg.presetId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={cfg.hairColor} />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>

            {/* Accessory: Halo / Cyber Ring */}
            {cfg.accessory === 'halo' && (
              <ellipse
                cx="60"
                cy="14"
                rx="26"
                ry="5"
                fill="none"
                stroke="#22D3EE"
                strokeWidth="3"
                strokeDasharray="6 3"
              />
            )}

            {/* Back Hair / Robot Chassis Dome */}
            {!isRobotPreset ? (
              <path
                d={
                  cfg.presetId === 'female_3d'
                    ? 'M22 56 C20 16, 100 16, 98 56 L102 98 C102 104, 88 104, 86 94 L34 94 C32 104, 18 104, 18 98 Z'
                    : 'M25 54 C24 18, 96 18, 95 54 Z'
                }
                fill={`url(#hairGrad_${cfg.presetId})`}
              />
            ) : (
              /* Robot Antennae */
              <g>
                <line x1="60" y1="12" x2="60" y2="26" stroke="#22D3EE" strokeWidth="3" />
                <circle
                  cx="60"
                  cy="11"
                  r="4.5"
                  fill={isSpeaking ? '#F43F5E' : '#22D3EE'}
                />
                <rect x="20" y="50" width="8" height="22" rx="4" fill="#06B6D4" />
                <rect x="92" y="50" width="8" height="22" rx="4" fill="#06B6D4" />
              </g>
            )}

            {/* 3D Neck & Shoulders */}
            <path
              d="M32 108 C32 92, 88 92, 88 108 L96 120 L24 120 Z"
              fill={isRobotPreset ? '#334155' : '#4F46E5'}
            />
            <rect
              x="49"
              y="88"
              width="22"
              height="16"
              rx="6"
              fill={cfg.skinColor}
            />

            {/* 3D Ears */}
            {!isRobotPreset && (
              <>
                <circle cx="27" cy="62" r="7" fill={cfg.skinColor} />
                <circle cx="93" cy="62" r="7" fill={cfg.skinColor} />
              </>
            )}

            {/* 3D Main Head / Face Sphere */}
            <rect
              x="28"
              y="26"
              width="64"
              height="68"
              rx={isRobotPreset ? 18 : 32}
              fill={cfg.skinColor}
            />
            <rect
              x="28"
              y="26"
              width="64"
              height="68"
              rx={isRobotPreset ? 18 : 32}
              fill={`url(#skinGrad_${cfg.presetId})`}
              stroke={isRobotPreset ? '#22D3EE' : 'rgba(255,255,255,0.35)'}
              strokeWidth={isRobotPreset ? '2' : '1'}
            />

            {/* Soft 3D Cheek Blush */}
            {!isRobotPreset && (
              <>
                <ellipse cx="39" cy="68" rx="6" ry="3.5" fill="#FB7185" opacity="0.35" />
                <ellipse cx="81" cy="68" rx="6" ry="3.5" fill="#FB7185" opacity="0.35" />
              </>
            )}

            {/* Front Hair Bangs */}
            {!isRobotPreset && (
              <path
                d={
                  cfg.presetId === 'female_3d' || cfg.presetId === 'child_3d'
                    ? 'M27 48 C32 22, 88 22, 93 48 C82 36, 68 38, 60 43 C48 36, 36 38, 27 48 Z'
                    : 'M28 45 C34 22, 86 22, 92 45 C78 34, 44 34, 28 45 Z'
                }
                fill={`url(#hairGrad_${cfg.presetId})`}
              />
            )}

            {/* Accessory: Crown */}
            {cfg.accessory === 'crown' && (
              <polygon
                points="42,27 48,14 60,22 72,14 78,27"
                fill="#FBBF24"
                stroke="#F59E0B"
                strokeWidth="1.5"
              />
            )}

            {/* Dynamic 3D Eyebrows (lift when speaking) */}
            <g
              transform={`translate(0, ${isSpeaking && activeViseme > 1 ? -2.5 : 0})`}
              className="transition-transform duration-150"
            >
              <path
                d="M37 46 Q45 43 52 46"
                stroke={isRobotPreset ? '#22D3EE' : cfg.hairColor}
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M68 46 Q75 43 83 46"
                stroke={isRobotPreset ? '#22D3EE' : cfg.hairColor}
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            {/* 3D ANIMATED EYES (Blink + Gaze Tracking) */}
            {[
              { cx: 45, id: 'left' },
              { cx: 75, id: 'right' },
            ].map((eye) => {
              const eyeRadius = cfg.eyeStyle === 'cute' || cfg.eyeStyle === 'anime' ? 8.2 : 7;
              return (
                <g key={eye.id} transform={`translate(${eye.cx}, 56)`}>
                  {isBlinking ? (
                    /* Closed Blinking Eyelid Line */
                    <path
                      d="M-8 0 Q0 3 8 0"
                      stroke={isRobotPreset ? '#22D3EE' : '#1E293B'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  ) : (
                    <>
                      {/* Sclera (White of eye or Robot Visor) */}
                      <circle
                        cx="0"
                        cy="0"
                        r={eyeRadius}
                        fill={isRobotPreset ? '#083344' : '#FFFFFF'}
                        stroke={isRobotPreset ? '#06B6D4' : '#334155'}
                        strokeWidth="1.2"
                      />
                      {/* Moving Iris & Pupil */}
                      <g
                        transform={`translate(${gaze.x.toFixed(1)}, ${gaze.y.toFixed(1)})`}
                      >
                        <circle
                          cx="0"
                          cy="0"
                          r={eyeRadius * 0.66}
                          fill={cfg.eyeColor}
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r={eyeRadius * 0.34}
                          fill={isRobotPreset ? '#ECFEFF' : '#0F172A'}
                        />
                        {/* 3D Corneal Specular Highlights */}
                        <circle
                          cx={-eyeRadius * 0.24}
                          cy={-eyeRadius * 0.24}
                          r={eyeRadius * 0.22}
                          fill="#FFFFFF"
                        />
                        <circle
                          cx={eyeRadius * 0.2}
                          cy={eyeRadius * 0.2}
                          r={eyeRadius * 0.1}
                          fill="#FFFFFF"
                          opacity="0.8"
                        />
                      </g>
                    </>
                  )}
                </g>
              );
            })}

            {/* Cute 3D Nose */}
            {!isRobotPreset && (
              <path
                d="M59 62 Q62 66 58 67"
                stroke="rgba(0,0,0,0.28)"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Accessory: Smart Glasses */}
            {cfg.accessory === 'glasses' && (
              <g stroke="#38BDF8" strokeWidth="2" fill="rgba(56,189,248,0.12)">
                <rect x="34" y="48" width="22" height="15" rx="4" />
                <rect x="64" y="48" width="22" height="15" rx="4" />
                <line x1="56" y1="55" x2="64" y2="55" />
              </g>
            )}

            {/* Accessory: Studio Headset */}
            {cfg.accessory === 'headset' && (
              <g>
                <path
                  d="M24 60 C24 20, 96 20, 96 60"
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="4"
                />
                <rect x="19" y="52" width="9" height="18" rx="4" fill="#9333EA" />
                <rect x="92" y="52" width="9" height="18" rx="4" fill="#9333EA" />
                <path
                  d="M95 66 Q84 82 68 82"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* 3D LIP-SYNC MOUTH (Multi-Viseme Real-Time Animation) */}
            <g transform="translate(60, 77)">
              {cfg.mouthStyle === 'cyber_wave' || isRobotPreset ? (
                /* Cyber Equalizer Mouth for AI Robot */
                <g>
                  <rect
                    x="-16"
                    y="-6"
                    width="32"
                    height="12"
                    rx="5"
                    fill="#083344"
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                  />
                  {[-10, -5, 0, 5, 10].map((bx, i) => {
                    const barH = isSpeaking
                      ? 3 + ((activeViseme + i) % 4) * 2.4
                      : 2.5;
                    return (
                      <rect
                        key={i}
                        x={bx - 1.5}
                        y={-barH / 2}
                        width="3"
                        height={barH}
                        rx="1.5"
                        fill="#22D3EE"
                      />
                    );
                  })}
                </g>
              ) : activeViseme === 0 ? (
                /* Closed Natural 3D Smile */
                <path
                  d="M-10 -1 Q0 6 10 -1"
                  stroke="#E11D48"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : (
                /* Open Talking 3D Mouth with Teeth & Tongue */
                <g>
                  <rect
                    x={-mouthWidth / 2}
                    y={-mouthOpenHeight / 2}
                    width={mouthWidth}
                    height={Math.min(18, mouthOpenHeight)}
                    rx={activeViseme === 1 ? mouthWidth / 2 : 6}
                    fill="#881337"
                    stroke="#F43F5E"
                    strokeWidth="2"
                  />
                  {/* Upper Teeth */}
                  <rect
                    x={-mouthWidth * 0.36}
                    y={-mouthOpenHeight / 2 + 1}
                    width={mouthWidth * 0.72}
                    height="3.2"
                    rx="1"
                    fill="#FFFFFF"
                  />
                  {/* Tongue */}
                  <ellipse
                    cx="0"
                    cy={mouthOpenHeight / 2 - 2.5}
                    rx={mouthWidth * 0.28}
                    ry="3.2"
                    fill="#FB7185"
                  />
                </g>
              )}
            </g>
          </svg>
        )}
      </div>

      {/* 3D Badge Indicator */}
      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-purple-600/90 text-white text-[8px] font-bold tracking-wider shadow pointer-events-none">
        3D LIVE
      </span>
    </div>
  );
};
