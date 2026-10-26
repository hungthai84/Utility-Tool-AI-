'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
} from 'lucide-react';
import type { DialogueLine } from '@/types/story';
import { speakWithBrowserFallback } from '@/lib/bilingualVoiceEngine';
import { useTheme } from '@/components/ThemeContext';

interface AudioPlayerProps {
  lines: DialogueLine[];
  onActiveLineChange?: (lineId: string) => void;
  title?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  lines,
  onActiveLineChange,
  title = 'Trình phát âm thanh câu chuyện',
}) => {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('00:00');
  const [durationStr, setDurationStr] = useState('00:05');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  // All lines can be played (either via Cloud WAV or Bilingual Browser Fallback)
  const playableLines = lines.length > 0 ? lines : [];
  const currentLine = playableLines[currentIndex];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const handleEnded = () => {
      if (currentIndex < playableLines.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setProgress(100);
      }
    };

    const handleTimeUpdate = () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        setProgress(pct);
        setCurrentTimeStr(formatTime(audio.currentTime));
        setDurationStr(formatTime(audio.duration));
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentIndex, playableLines.length]);

  useEffect(() => {
    if (!currentLine) return;

    if (onActiveLineChange) {
      onActiveLineChange(currentLine.id);
    }

    if (!isPlayingRef.current) return;

    if (currentLine.audioUrl && currentLine.audioUrl.startsWith('data:audio') && audioRef.current) {
      audioRef.current.src = currentLine.audioUrl;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.play().catch((e) => console.warn('Audio play interrupted:', e));
    } else {
      // Bilingual Browser Fallback
      setProgress(50);
      speakWithBrowserFallback({
        text: currentLine.text,
        rate: playbackSpeed,
        onEnd: () => {
          if (!isPlayingRef.current) return;
          if (currentIndex < playableLines.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            setIsPlaying(false);
            isPlayingRef.current = false;
            setProgress(100);
          }
        },
      });
    }
  }, [currentIndex, currentLine, onActiveLineChange, playbackSpeed, isMuted, volume, playableLines.length]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!currentLine) return;

    if (isPlaying) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      audioRef.current?.pause();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      if (currentLine.audioUrl && currentLine.audioUrl.startsWith('data:audio') && audioRef.current) {
        audioRef.current.src = currentLine.audioUrl;
        audioRef.current.play().catch((e) => console.warn(e));
      } else {
        speakWithBrowserFallback({
          text: currentLine.text,
          rate: playbackSpeed,
          onEnd: () => {
            if (!isPlayingRef.current) return;
            if (currentIndex < playableLines.length - 1) {
              setCurrentIndex((prev) => prev + 1);
            } else {
              setIsPlaying(false);
              isPlayingRef.current = false;
              setProgress(100);
            }
          },
        });
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < playableLines.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (playableLines.length === 0) {
    return (
      <div
        className={`p-6 rounded-[14px] border text-center transition-colors ${
          isDark
            ? 'bg-white/5 border-white/10 text-gray-400'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        <ListMusic
          className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}
        />
        <p className="text-sm font-medium">Chưa có câu thoại nào trong kịch bản.</p>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
          Hãy nạp kịch bản mẫu 1-chạm hoặc phân cảnh ở Bước 4 để thưởng thức.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-5 rounded-[14px] border shadow-xl space-y-4 transition-colors ${
        isDark
          ? 'bg-gradient-to-br from-gray-900/90 to-purple-950/40 border-white/15 text-white'
          : 'bg-gradient-to-br from-white via-purple-50/60 to-indigo-50/50 border-purple-200/80 text-slate-900 shadow-purple-500/5'
      }`}
    >
      {/* Title & Line Info */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4
            className={`text-sm font-semibold ${
              isDark ? 'text-purple-300' : 'text-purple-700'
            }`}
          >
            {title}
          </h4>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Đang phát câu {currentIndex + 1} / {playableLines.length}:{' '}
            <span
              className={`font-semibold ${
                isDark ? 'text-purple-400' : 'text-purple-700'
              }`}
            >
              {currentLine?.characterName}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => setPlaybackSpeed(s)}
              className={`px-2 py-0.5 rounded-[14px] text-[11px] font-mono transition-colors cursor-pointer ${
                playbackSpeed === s
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : isDark
                  ? 'bg-white/5 hover:bg-white/10 text-gray-400'
                  : 'bg-white hover:bg-purple-100 text-slate-600 border border-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Active Dialogue Text Display */}
      <div
        className={`p-4 rounded-[14px] border backdrop-blur-sm min-h-[70px] flex flex-col justify-center transition-colors ${
          isDark
            ? 'bg-black/40 border-purple-500/20'
            : 'bg-white/90 border-purple-200 shadow-inner'
        }`}
      >
        <p
          className={`text-sm italic leading-relaxed break-words ${
            isDark ? 'text-gray-200' : 'text-slate-800'
          }`}
        >
          &ldquo;{currentLine?.text}&rdquo;
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div
          className={`h-1.5 w-full rounded-full overflow-hidden cursor-pointer ${
            isDark ? 'bg-white/10' : 'bg-purple-100'
          }`}
        >
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className={`flex justify-between text-[10px] font-mono ${
            isDark ? 'text-gray-400' : 'text-slate-500'
          }`}
        >
          <span>{currentTimeStr}</span>
          <span>{durationStr}</span>
        </div>
      </div>

      {/* Playback Controls & Volume */}
      <div className="flex items-center justify-between pt-1">
        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`transition-colors cursor-pointer ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-500" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              setIsMuted(false);
            }}
            className={`w-16 accent-purple-600 h-1 rounded-lg cursor-pointer ${
              isDark ? 'bg-white/10' : 'bg-purple-200'
            }`}
          />
        </div>

        {/* Center Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`p-2 rounded-[14px] disabled:opacity-30 transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                : 'bg-white hover:bg-purple-50 text-slate-700 border border-slate-200 shadow-sm'
            }`}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="p-3.5 rounded-[14px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/30 transition-all scale-100 hover:scale-105 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex >= playableLines.length - 1}
            className={`p-2 rounded-[14px] disabled:opacity-30 transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                : 'bg-white hover:bg-purple-50 text-slate-700 border border-slate-200 shadow-sm'
            }`}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1">
          {isPlaying && (
            <div className="flex items-end gap-0.5 h-4">
              <span
                className="w-1 bg-purple-500 animate-bounce h-full rounded-full"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1 bg-purple-500 animate-bounce h-full rounded-full"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1 bg-purple-500 animate-bounce h-full rounded-full"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
