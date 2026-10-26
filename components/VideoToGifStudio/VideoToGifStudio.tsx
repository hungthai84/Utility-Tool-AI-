'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Film,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Download,
  Trash2,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Crop,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  Volume2,
  VolumeX,
  X,
  Loader2,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import {
  type GifConversionConfig,
  type ConversionProgress,
  type GifConversionResult,
  type DitherAlgorithm,
  type LoopMode,
  type AspectRatioPreset,
  type GifTextOverlayItem,
  type GifStickerOverlayItem,
  GIF_STUDIO_PRESETS,
  estimateGifOutput,
  formatBytes,
  formatTimeMMSS,
  convertVideoFileToGif,
  generateSampleTestVideoFile,
} from '@/lib/gifEncoderEngine';

interface VideoMetadata {
  name: string;
  sizeBytes: number;
  type: string;
  duration: number;
  width: number;
  height: number;
  thumbnailUrl: string;
}

interface BatchVideoItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: GifConversionResult;
  errorMsg?: string;
}

const DEFAULT_CONFIG: GifConversionConfig = {
  startTime: 0,
  endTime: 3,
  fps: 12,
  width: 480,
  height: 270,
  lockAspectRatio: true,
  aspectRatioPreset: 'original',
  qualityMode: 'balanced',
  maxColors: 256,
  optimizePalette: true,
  ditherAlgorithm: 'floyd_steinberg',
  ditherStrength: 60,
  crop: {
    enabled: false,
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  },
  rotation: 0,
  flipH: false,
  flipV: false,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  loopMode: 'infinite',
  customLoopCount: 3,
  playbackSpeed: 1.0,
  textOverlays: [],
  stickerOverlays: [],
};

const FPS_OPTIONS = [5, 8, 10, 12, 15, 20, 24, 30];
const WIDTH_PRESETS = [160, 240, 320, 480, 640, 800];
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const STICKER_PRESETS = ['🔥', '😂', '✨', '❤️', '🚀', '🎬', '💯', '👑', '⚡', '🎉'];

export const VideoToGifStudio: React.FC = () => {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  // Mode: 'single' | 'batch'
  const [studioMode, setStudioMode] = useState<'single' | 'batch'>('single');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [activePresetId, setActivePresetId] = useState<string>('balanced');
  const [activeConfigTab, setActiveConfigTab] = useState<
    'presets' | 'size' | 'crop' | 'color' | 'overlay' | 'all'
  >('presets');
  const [compareMode, setCompareMode] = useState<'gif_only' | 'split_slider'>('split_slider');
  const [compareSliderPos, setCompareSliderPos] = useState<number>(50);

  // Single Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Video Player Preview State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const batchInputRef = useRef<HTMLInputElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // GIF Configuration State
  const [config, setConfig] = useState<GifConversionConfig>(DEFAULT_CONFIG);
  const [outputFileName, setOutputFileName] = useState<string>('anh-dong-studio');

  // Conversion Execution State
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress>({
    stage: 'idle',
    stageLabel: 'Bộ máy GIF89a sẵn sàng',
    percent: 0,
    currentFrame: 0,
    totalFrames: 0,
  });
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [result, setResult] = useState<GifConversionResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Batch Mode State
  const [batchItems, setBatchItems] = useState<BatchVideoItem[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    };
  }, [videoObjectUrl, result]);

  // Estimate output metrics dynamically
  const estimation = useMemo(() => estimateGifOutput(config), [config]);

  // Load and validate a selected video file
  const handleSelectVideoFile = async (file: File) => {
    setFileError(null);
    setConversionError(null);
    setIsReadingFile(true);

    // Validate extension & basic MIME
    const validExt = /\.(mp4|mov|webm|mkv|avi|m4v|ogv)$/i.test(file.name);
    if (!file.type.startsWith('video/') && !validExt) {
      setIsReadingFile(false);
      setFileError(
        'Tệp không hợp lệ. Vui lòng chọn tệp video thực sự (MP4, WebM, MOV, MKV, AVI, M4V).'
      );
      return;
    }

    if (file.size > 350 * 1024 * 1024) {
      setIsReadingFile(false);
      setFileError(
        'Tệp video vượt quá giới hạn an toàn bộ nhớ trình duyệt (350 MB). Vui lòng chọn video ngắn hoặc nhẹ hơn.'
      );
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.muted = true;
    tempVideo.src = tempUrl;

    try {
      await new Promise<void>((resolve, reject) => {
        const onLoaded = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(
            new Error(
              'Không thể giải mã tệp video này. Tệp có thể bị hỏng hoặc sử dụng codec không được trình duyệt hỗ trợ.'
            )
          );
        };
        const cleanup = () => {
          tempVideo.removeEventListener('loadeddata', onLoaded);
          tempVideo.removeEventListener('error', onError);
        };
        tempVideo.addEventListener('loadeddata', onLoaded);
        tempVideo.addEventListener('error', onError);
      });

      const vw = tempVideo.videoWidth || 640;
      const vh = tempVideo.videoHeight || 360;
      const dur = Number.isFinite(tempVideo.duration) && tempVideo.duration > 0 ? tempVideo.duration : 4;

      // Generate thumbnail at 0.2s
      tempVideo.currentTime = Math.min(0.2, dur / 2);
      await new Promise<void>((r) => {
        const onSeek = () => {
          tempVideo.removeEventListener('seeked', onSeek);
          r();
        };
        tempVideo.addEventListener('seeked', onSeek);
      });

      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 240;
      thumbCanvas.height = Math.max(90, Math.round((240 * vh) / vw));
      const tCtx = thumbCanvas.getContext('2d');
      tCtx?.drawImage(tempVideo, 0, 0, thumbCanvas.width, thumbCanvas.height);
      const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);

      // Revoke old URLs
      if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
      setResult(null);

      const defaultWidth = Math.min(480, vw);
      const defaultHeight = Math.max(60, Math.round((defaultWidth * vh) / vw));
      const defaultEnd = Math.min(dur, 4.0);

      setVideoFile(file);
      setVideoObjectUrl(tempUrl);
      setMetadata({
        name: file.name,
        sizeBytes: file.size,
        type: file.type || 'video/mp4',
        duration: Number(dur.toFixed(2)),
        width: vw,
        height: vh,
        thumbnailUrl,
      });
      setOutputFileName(file.name.replace(/\.[^/.]+$/, ''));
      setConfig((prev) => ({
        ...prev,
        startTime: 0,
        endTime: Number(defaultEnd.toFixed(2)),
        width: defaultWidth,
        height: defaultHeight,
      }));
      setCurrentTime(0);
    } catch (err: any) {
      URL.revokeObjectURL(tempUrl);
      setFileError(
        err?.message ||
          'Tệp không phải là video hợp lệ hoặc không thể giải mã trên trình duyệt.'
      );
    } finally {
      setIsReadingFile(false);
    }
  };

  // Load 1-Click Sample Video for instant testing
  const handleLoadSampleVideo = async () => {
    setIsLoadingSample(true);
    setFileError(null);
    try {
      const sampleFile = await generateSampleTestVideoFile();
      await handleSelectVideoFile(sampleFile);
      showToast('Đã nạp video mẫu chuyển động thành công! Bạn có thể cắt và xuất GIF ngay.', 'success');
    } catch (err: any) {
      setFileError(err?.message || 'Không thể tạo video mẫu trên trình duyệt này.');
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleClearVideo = () => {
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setVideoFile(null);
    setVideoObjectUrl(null);
    setMetadata(null);
    setResult(null);
    setFileError(null);
    setConversionError(null);
    setIsPlayingPreview(false);
    setProgress({
      stage: 'idle',
      stageLabel: 'Bộ máy GIF89a sẵn sàng',
      percent: 0,
      currentFrame: 0,
      totalFrames: 0,
    });
  };

  const handleResetConfig = () => {
    const vw = metadata?.width || 480;
    const vh = metadata?.height || 270;
    const dur = metadata?.duration || 3;
    const w = Math.min(480, vw);
    const h = Math.max(60, Math.round((w * vh) / vw));

    setConfig({
      ...DEFAULT_CONFIG,
      startTime: 0,
      endTime: Number(Math.min(dur, 4).toFixed(2)),
      width: w,
      height: h,
    });
    setActivePresetId('balanced');
    showToast('Đã đặt lại toàn bộ cấu hình chuyển đổi GIF về mặc định.', 'info');
  };

  // Update Width / Height respecting aspect ratio
  const handleWidthChange = (newWidth: number) => {
    const clampedW = Math.max(40, Math.min(1280, newWidth));
    if (config.lockAspectRatio) {
      const ratio = metadata ? metadata.height / metadata.width : 9 / 16;
      setConfig({
        ...config,
        width: clampedW,
        height: Math.max(40, Math.round(clampedW * ratio)),
      });
    } else {
      setConfig({ ...config, width: clampedW });
    }
  };

  const handleHeightChange = (newHeight: number) => {
    const clampedH = Math.max(40, Math.min(1280, newHeight));
    if (config.lockAspectRatio) {
      const ratio = metadata ? metadata.width / metadata.height : 16 / 9;
      setConfig({
        ...config,
        height: clampedH,
        width: Math.max(40, Math.round(clampedH * ratio)),
      });
    } else {
      setConfig({ ...config, height: clampedH });
    }
  };

  const handleAspectRatioPresetChange = (preset: AspectRatioPreset) => {
    const baseW = config.width || 480;
    let newH = config.height;
    if (preset === 'original' && metadata) {
      newH = Math.round((baseW * metadata.height) / metadata.width);
    } else if (preset === '1:1') {
      newH = baseW;
    } else if (preset === '4:3') {
      newH = Math.round((baseW * 3) / 4);
    } else if (preset === '16:9') {
      newH = Math.round((baseW * 9) / 16);
    } else if (preset === '9:16') {
      newH = Math.round((baseW * 16) / 9);
    } else if (preset === '3:2') {
      newH = Math.round((baseW * 2) / 3);
    }

    setConfig({
      ...config,
      aspectRatioPreset: preset,
      lockAspectRatio: preset !== 'custom',
      height: Math.max(40, newH),
    });
  };

  const handleApplyPreset = (presetId: string) => {
    const found = GIF_STUDIO_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActivePresetId(presetId);
    const sw = metadata?.width || 640;
    const sh = metadata?.height || 360;
    const patch = found.apply(sw, sh);
    setConfig((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  // Preview video loop between startTime and endTime
  const toggleVideoPreview = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      if (v.currentTime < config.startTime || v.currentTime >= config.endTime) {
        v.currentTime = config.startTime;
      }
      v.playbackRate = config.playbackSpeed;
      v.play();
      setIsPlayingPreview(true);
    } else {
      v.pause();
      setIsPlayingPreview(false);
    }
  };

  const handleVideoTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.currentTime >= config.endTime) {
      v.currentTime = config.startTime;
      if (config.loopMode === 'once') {
        v.pause();
        setIsPlayingPreview(false);
      }
    }
  };

  // Start Real GIF Conversion
  const handleStartConversion = async () => {
    if (!videoFile) return;
    if (config.endTime <= config.startTime) {
      setConversionError('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
      return;
    }

    setConversionError(null);
    setIsConverting(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const gifRes = await convertVideoFileToGif({
        videoFile,
        config,
        outputFileName,
        signal: controller.signal,
        onProgress: (p) => setProgress(p),
      });

      if (result?.blobUrl) {
        URL.revokeObjectURL(result.blobUrl);
      }
      setResult(gifRes);
      showToast('Chuyển đổi Video sang GIF thành công!', 'success');
    } catch (err: any) {
      if (err?.message === 'CONVERT_ABORTED') {
        setProgress({
          stage: 'cancelled',
          stageLabel: 'Đã hủy tác vụ chuyển đổi.',
          percent: 0,
          currentFrame: 0,
          totalFrames: 0,
        });
        showToast('Đã hủy quá trình chuyển đổi GIF.', 'info');
      } else {
        setConversionError(err?.message || 'Đã xảy ra lỗi khi mã hóa ảnh động GIF.');
        setProgress({
          stage: 'error',
          stageLabel: 'Lỗi chuyển đổi GIF',
          percent: 0,
          currentFrame: 0,
          totalFrames: 0,
        });
      }
    } finally {
      setIsConverting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelConversion = () => {
    abortControllerRef.current?.abort();
  };

  const handleDownloadGif = (targetResult: GifConversionResult | null = result) => {
    if (!targetResult) return;
    const link = document.createElement('a');
    link.href = targetResult.blobUrl;
    const cleanName =
      (outputFileName || targetResult.fileName).replace(/\.gif$/i, '').trim() || 'video-to-gif';
    link.download = `${cleanName}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Batch Mode Handlers
  const handleAddBatchFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const validItems: BatchVideoItem[] = files
      .filter((f) => f.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(f.name))
      .map((file, idx) => ({
        id: `batch_${Date.now()}_${idx}`,
        file,
        status: 'pending',
        progress: 0,
      }));
    setBatchItems((prev) => [...prev, ...validItems]);
    e.target.value = '';
  };

  const handleRunBatchConversion = async () => {
    if (batchItems.length === 0 || isBatchRunning) return;
    setIsBatchRunning(true);

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      if (item.status === 'completed') continue;

      setBatchItems((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, status: 'processing', progress: 5 } : b))
      );

      try {
        const res = await convertVideoFileToGif({
          videoFile: item.file,
          config: {
            ...config,
            startTime: 0,
            endTime: 3,
          },
          outputFileName: item.file.name.replace(/\.[^/.]+$/, ''),
          onProgress: (p) => {
            setBatchItems((prev) =>
              prev.map((b) => (b.id === item.id ? { ...b, progress: p.percent } : b))
            );
          },
        });

        setBatchItems((prev) =>
          prev.map((b) =>
            b.id === item.id ? { ...b, status: 'completed', progress: 100, result: res } : b
          )
        );
      } catch (err: any) {
        setBatchItems((prev) =>
          prev.map((b) =>
            b.id === item.id
              ? { ...b, status: 'error', errorMsg: err?.message || 'Lỗi giải mã video' }
              : b
          )
        );
      }
    }

    setIsBatchRunning(false);
    showToast('Hoàn tất xử lý danh sách video hàng loạt!', 'success');
  };

  // Shared Theme Classes
  const panelClass = isDark
    ? 'bg-gray-900/80 border-white/10 text-white'
    : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-lg shadow-indigo-500/5';

  const subCardClass = isDark
    ? 'bg-white/5 border-white/10 text-gray-200'
    : 'bg-slate-50/90 border-slate-200/90 text-slate-800';

  const inputClass = isDark
    ? 'bg-white/5 border-white/15 text-white placeholder-gray-500 focus:border-purple-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-purple-600 shadow-sm';

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-8">
      {/* A. HEADER CÔNG CỤ */}
      <div
        className={`relative overflow-hidden rounded-[14px] border p-6 shadow-2xl backdrop-blur-xl transition-all ${
          isDark
            ? 'bg-gradient-to-r from-indigo-950/90 via-purple-950/85 to-slate-900 border-white/15'
            : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-cyan-50 border-indigo-200/80 shadow-indigo-500/10'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isDark
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Engine GIF89a LZW + PaletteGen Sẵn Sàng
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                  isDark
                    ? 'bg-white/10 border-white/15 text-purple-200'
                    : 'bg-white border-purple-200 text-purple-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Bảo mật 100% cục bộ trên trình duyệt
              </span>
            </div>

            <h1
              className={`text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <Film className={isDark ? 'text-cyan-400' : 'text-indigo-600'} />
              <span>Video to GIF Studio — Chuyển Video thành GIF động</span>
            </h1>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
              Cắt đoạn chính xác, tùy chỉnh FPS, kích thước, bảng màu tối ưu 256 màu (PaletteGen &
              Dithering), cắt vùng hình (Crop), bộ lọc màu và xuất tệp .GIF thực tế.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switcher: Single vs Batch */}
            <div
              className={`inline-flex p-1 rounded-[14px] border ${
                isDark ? 'bg-black/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <button
                type="button"
                onClick={() => setStudioMode('single')}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                  studioMode === 'single'
                    ? 'bg-indigo-600 text-white shadow'
                    : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 Video Chi Tiết
              </button>
              <button
                type="button"
                onClick={() => setStudioMode('batch')}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  studioMode === 'batch'
                    ? 'bg-indigo-600 text-white shadow'
                    : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Hàng Loạt ({batchItems.length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleLoadSampleVideo}
              disabled={isLoadingSample}
              className={`px-3.5 py-2 rounded-[14px] border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-200'
                  : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-800 shadow-sm'
              }`}
            >
              {isLoadingSample ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              <span>Video mẫu thử ngay</span>
            </button>

            <button
              type="button"
              onClick={handleResetConfig}
              className={`px-3 py-2 rounded-[14px] border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/10 hover:bg-white/15 border-white/15 text-gray-200'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
              }`}
              title="Đặt lại cấu hình mặc định"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className={`p-2 rounded-[14px] border transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/10 hover:bg-white/15 border-white/15 text-purple-300'
                  : 'bg-white hover:bg-purple-50 border-slate-200 text-purple-700 shadow-sm'
              }`}
              title="Hướng dẫn & Lưu ý kỹ thuật GIF"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CHẾ ĐỘ XỬ LÝ HÀNG LOẠT (BATCH CONVERSION MODE) */}
      {studioMode === 'batch' ? (
        <div className={`p-6 rounded-[14px] border space-y-5 ${panelClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-white/10">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>Chuyển Đổi Nhiều Video Hàng Loạt (Batch Conversion)</span>
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Xử lý tuần tự từng video với cấu hình hiện tại ({config.fps} FPS • {config.width}px •{' '}
                {config.maxColors} màu) để bảo toàn bộ nhớ RAM.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={batchInputRef}
                type="file"
                accept="video/*,.mp4,.mov,.webm,.mkv,.avi,.m4v"
                multiple
                onChange={handleAddBatchFiles}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => batchInputRef.current?.click()}
                className="px-4 py-2 rounded-[14px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" /> + Thêm nhiều video
              </button>
              {batchItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleRunBatchConversion}
                  disabled={isBatchRunning}
                  className="px-4 py-2 rounded-[14px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isBatchRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý tuần tự...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Bắt đầu chuyển đổi tất cả
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {batchItems.length === 0 ? (
            <div className={`p-10 text-center rounded-[14px] border border-dashed ${subCardClass}`}>
              <Film className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">Chưa có video nào trong danh sách hàng loạt</p>
              <p className="text-xs opacity-70 mt-1">
                Nhấn &ldquo;+ Thêm nhiều video&rdquo; để chọn nhiều tệp MP4/WebM/MOV cùng lúc.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {batchItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-[14px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${subCardClass}`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold truncate">{item.file.name}</span>
                      <span className="text-[11px] font-mono opacity-70">
                        ({formatBytes(item.file.size)})
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-200"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    {item.errorMsg && (
                      <p className="text-[11px] text-red-400">{item.errorMsg}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'completed' && item.result && (
                      <>
                        <span className="text-[11px] font-mono text-emerald-400">
                          {formatBytes(item.result.fileSizeBytes)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownloadGif(item.result!)}
                          className="px-3 py-1.5 rounded-[12px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Tải GIF
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (item.result?.blobUrl) URL.revokeObjectURL(item.result.blobUrl);
                        setBatchItems((prev) => prev.filter((b) => b.id !== item.id));
                      }}
                      className="p-2 rounded-[12px] bg-red-500/15 hover:bg-red-500/25 text-red-400 cursor-pointer"
                      title="Xóa khỏi danh sách"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* CHẾ ĐỘ 1 VIDEO CHI TIẾT (SINGLE VIDEO STUDIO) */
        <>
          {/* THANH TIẾN TRÌNH 4 BƯỚC TRỰC QUAN & CHỈ SỐ ƯỚC TÍNH NHANH */}
          <div className={`p-3.5 rounded-[14px] border backdrop-blur-xl ${panelClass}`}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                {
                  step: 1,
                  title: '1. Nguồn Video',
                  sub: videoFile && metadata ? metadata.name : 'Chọn tệp hoặc Video mẫu',
                  done: Boolean(videoFile),
                  active: !videoFile,
                },
                {
                  step: 2,
                  title: '2. Cắt Đoạn & Khung Hình',
                  sub: videoFile
                    ? `${config.startTime}s → ${config.endTime}s (${estimation.outputDuration.toFixed(1)}s)`
                    : 'Chờ tải video',
                  done: Boolean(videoFile),
                  active: Boolean(videoFile && !result),
                },
                {
                  step: 3,
                  title: '3. Tinh Chỉnh GIF',
                  sub: `${config.fps} FPS • ${config.width}×${config.height}px • ${config.maxColors} màu`,
                  done: Boolean(videoFile),
                  active: Boolean(videoFile && !result),
                },
                {
                  step: 4,
                  title: '4. Xuất & Tải GIF',
                  sub: result
                    ? `Đã tạo: ${formatBytes(result.fileSizeBytes)}`
                    : `Dự kiến ~${formatBytes(estimation.estimatedBytes)}`,
                  done: Boolean(result),
                  active: Boolean(result),
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`p-2.5 rounded-[12px] border flex items-center gap-2.5 transition-all ${
                    item.done
                      ? isDark
                        ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                        : 'bg-indigo-50/80 border-indigo-200 text-slate-900'
                      : isDark
                      ? 'bg-white/5 border-white/10 text-gray-400'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      item.done
                        ? 'bg-emerald-500 text-white'
                        : item.active
                        ? 'bg-indigo-600 text-white'
                        : isDark
                        ? 'bg-white/10 text-gray-400'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : item.step}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{item.title}</div>
                    <div className="text-[10px] opacity-75 truncate font-mono">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B. KHU VỰC NHẬP VIDEO (BƯỚC 1) */}
          <div className={`p-5 rounded-[14px] border space-y-4 ${panelClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-500" />
                <span>Bước 1: Nguồn Video Đầu Vào (MP4, WebM, MOV, MKV, AVI, M4V)</span>
              </h2>
              {videoFile && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-3 py-1.5 rounded-[12px] border text-xs font-semibold cursor-pointer ${
                      isDark
                        ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    }`}
                  >
                    Thay thế video
                  </button>
                  <button
                    type="button"
                    onClick={handleClearVideo}
                    className="px-3 py-1.5 rounded-[12px] bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa video
                  </button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.mp4,.mov,.webm,.mkv,.avi,.m4v"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleSelectVideoFile(f);
                e.target.value = '';
              }}
              className="hidden"
            />

            {fileError && (
              <div className="p-4 rounded-[14px] bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{fileError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFileError(null)}
                  className="p-1 hover:bg-white/10 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {!videoFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) handleSelectVideoFile(dropped);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-10 rounded-[14px] border-2 border-dashed text-center transition-all cursor-pointer space-y-3 ${
                  isDraggingOver
                    ? 'border-indigo-500 bg-indigo-500/15 scale-[1.01]'
                    : isDark
                    ? 'border-white/15 hover:border-purple-400/60 bg-white/[0.02] hover:bg-white/[0.05]'
                    : 'border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/80'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto shadow-lg">
                  {isReadingFile ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <Upload className="w-7 h-7" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-bold">
                    {isReadingFile
                      ? 'Đang kiểm tra và giải mã thông tin video...'
                      : 'Kéo thả tệp video vào đây hoặc nhấn để Chọn Video'}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    Hỗ trợ MP4, WebM, MOV, MKV, AVI, M4V • Xử lý trực tiếp trên thiết bị của bạn
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <span className="px-4 py-2 rounded-[14px] bg-indigo-600 text-white text-xs font-semibold shadow">
                    Chọn video từ thiết bị
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadSampleVideo();
                    }}
                    className={`px-4 py-2 rounded-[14px] border text-xs font-semibold cursor-pointer ${
                      isDark
                        ? 'bg-white/10 hover:bg-white/20 border-white/15 text-cyan-300'
                        : 'bg-white hover:bg-cyan-50 border-cyan-300 text-cyan-800'
                    }`}
                  >
                    Hoặc nạp Video Mẫu 1-Chạm
                  </button>
                </div>
              </div>
            ) : (
              /* Thông tin Metadata của Video đã chọn */
              metadata && (
                <div
                  className={`p-3.5 rounded-[14px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${subCardClass}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={metadata.thumbnailUrl}
                      alt={metadata.name}
                      className="w-20 h-14 rounded-[10px] object-cover border border-indigo-500/30 shrink-0"
                    />
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-bold truncate">{metadata.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {metadata.width} × {metadata.height} px
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Thời lượng: {formatTimeMMSS(metadata.duration)} ({metadata.duration}s)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {formatBytes(metadata.sizeBytes)}
                        </span>
                        <span className="opacity-70">{metadata.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* C. KHU VỰC CHỈNH SỬA 2 CỘT: XEM TRƯỚC / CẮT VIDEO (TRÁI) & BẢNG CẤU HÌNH / CHUYỂN ĐỔI (PHẢI) */}
          {videoFile && metadata && videoObjectUrl && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* CỘT TRÁI (7 CỘT): KẾT QUẢ GIF (NẾU CÓ), VIDEO PREVIEW & TIMELINE CẮT ĐOẠN */}
              <div className="lg:col-span-7 space-y-5">
                {/* D. BƯỚC 7: XEM TRƯỚC VÀ TẢI GIF KẾT QUẢ (HIỂN THỊ NỔI BẬT NGAY KHI TẠO XONG) */}
                {result && (
                  <div
                    className={`p-5 rounded-[14px] border-2 border-emerald-500/60 space-y-4 shadow-2xl ${panelClass}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-white/10">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-sm sm:text-base font-bold">
                          Kết Quả Ảnh Động GIF Đã Tạo Thành Công
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center rounded-[10px] p-0.5 bg-black/30 border border-white/15 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setCompareMode('split_slider')}
                            className={`px-2.5 py-1 rounded-[8px] font-bold cursor-pointer transition-colors ${
                              compareMode === 'split_slider'
                                ? 'bg-emerald-600 text-white'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            So sánh Video Gốc vs GIF (Before/After)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCompareMode('gif_only')}
                            className={`px-2.5 py-1 rounded-[8px] font-bold cursor-pointer transition-colors ${
                              compareMode === 'gif_only'
                                ? 'bg-emerald-600 text-white'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            Chỉ xem GIF
                          </button>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                          {formatBytes(result.fileSizeBytes)} • {result.width}×{result.height}px •{' '}
                          {result.frameCount} frames ({result.fps} FPS)
                        </span>
                      </div>
                    </div>

                    {compareMode === 'split_slider' && videoObjectUrl ? (
                      <div className="space-y-2">
                        <div className="relative rounded-[14px] bg-black/80 overflow-hidden border border-white/15 flex items-center justify-center min-h-[260px] max-h-[380px] select-none">
                          {/* Lớp nền: GIF 256 màu đầu ra */}
                          <img
                            src={result.blobUrl}
                            alt="GIF 256 Colors Output"
                            className="max-w-full max-h-[360px] object-contain"
                          />

                          {/* Lớp phủ cắt theo phần trăm: Video gốc */}
                          <div
                            className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
                            style={{ clipPath: `inset(0 ${100 - compareSliderPos}% 0 0)` }}
                          >
                            <video
                              src={videoObjectUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="max-w-full max-h-[360px] object-contain"
                            />
                          </div>

                          {/* Đường phân cách trực quan */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)] pointer-events-none"
                            style={{ left: `${compareSliderPos}%` }}
                          >
                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-lg border-2 border-white">
                              ⇄
                            </div>
                          </div>

                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-amber-300 text-[10px] font-bold border border-amber-400/40">
                            TRƯỚC: Video Gốc (TrueColor)
                          </span>
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 text-emerald-300 text-[10px] font-bold border border-emerald-400/40">
                            SAU: Ảnh GIF ({config.maxColors} màu • {config.ditherAlgorithm})
                          </span>
                        </div>

                        <div className="flex items-center gap-3 px-2">
                          <span className="text-[11px] font-semibold opacity-75">
                            Thanh kéo so sánh Before/After:
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={compareSliderPos}
                            onChange={(e) => setCompareSliderPos(Number(e.target.value))}
                            className="flex-1 accent-emerald-500 cursor-pointer"
                          />
                          <span className="text-xs font-mono font-bold text-emerald-400 w-10 text-right">
                            {compareSliderPos}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[14px] bg-black/60 p-4 flex items-center justify-center border border-white/10">
                        <img
                          src={result.blobUrl}
                          alt="Generated GIF Result"
                          className="max-w-full max-h-[360px] rounded-[10px] shadow-lg object-contain"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-6">
                        <label className="block text-xs font-semibold mb-1">
                          Tên tệp GIF tải xuống (.gif)
                        </label>
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={outputFileName}
                            onChange={(e) => setOutputFileName(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-l-[12px] text-xs font-mono focus:outline-none ${inputClass}`}
                          />
                          <span className="px-3 py-2 bg-purple-600 text-white text-xs font-mono font-bold rounded-r-[12px]">
                            .gif
                          </span>
                        </div>
                      </div>

                      <div className="sm:col-span-6 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadGif(result)}
                          className="flex-1 py-2.5 px-4 rounded-[12px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer"
                        >
                          <Download className="w-4 h-4" /> Tải GIF Xuống
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(result.blobUrl);
                            showToast('Đã sao chép đường dẫn Blob URL trong phiên hiện tại!', 'info');
                          }}
                          className={`p-2.5 rounded-[12px] border text-xs cursor-pointer ${
                            isDark
                              ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                          }`}
                          title="Sao chép đường dẫn Blob URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={handleStartConversion}
                          className={`p-2.5 rounded-[12px] border text-xs cursor-pointer ${
                            isDark
                              ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                          }`}
                          title="Chuyển đổi lại với cấu hình hiện tại"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bước 2: Xem trước & Cắt đoạn */}
                <div className={`p-5 rounded-[14px] border space-y-4 ${panelClass}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <Film className="w-4 h-4 text-purple-500" />
                      <span>Bước 2: Xem Trước Video, Cắt Đoạn & Vùng Khung Hình</span>
                    </h3>
                    <span className="text-xs font-mono text-purple-400">
                      Hiện tại: {formatTimeMMSS(currentTime)} / {formatTimeMMSS(metadata.duration)}
                    </span>
                  </div>

                  {/* Khung Video Preview với Hiệu ứng Xoay, Lật, Độ sáng & Khung Crop Trực Quan */}
                  <div className="relative w-full aspect-video rounded-[14px] bg-black overflow-hidden border border-white/15 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      src={videoObjectUrl}
                      muted={isMuted}
                      playsInline
                      onTimeUpdate={handleVideoTimeUpdate}
                      onEnded={() => setIsPlayingPreview(false)}
                      className="max-w-full max-h-full object-contain transition-transform duration-200"
                      style={{
                        transform: `rotate(${config.rotation}deg) scaleX(${
                          config.flipH ? -1 : 1
                        }) scaleY(${config.flipV ? -1 : 1})`,
                        filter: `brightness(${config.brightness}%) contrast(${config.contrast}%) saturate(${config.saturation}%)`,
                      }}
                    />

                    {/* Visual Crop Overlay Box */}
                    {config.crop.enabled && (
                      <div
                        className="absolute border-2 border-amber-400 bg-amber-400/10 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                        style={{
                          left: `${config.crop.x}%`,
                          top: `${config.crop.y}%`,
                          width: `${config.crop.width}%`,
                          height: `${config.crop.height}%`,
                        }}
                      >
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-400 text-black text-[9px] font-bold">
                          VÙNG CẮT CROP ({config.crop.width}% × {config.crop.height}%)
                        </span>
                      </div>
                    )}

                    {/* Live Preview cho Text Overlays & Stickers theo Timestamp */}
                    {(config.textOverlays || [])
                      .filter(
                        (t) =>
                          t.text.trim() &&
                          currentTime >= t.startTime &&
                          currentTime <= t.endTime
                      )
                      .map((t) => (
                        <div
                          key={t.id}
                          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded font-bold text-center whitespace-nowrap"
                          style={{
                            left: `${t.xPercent}%`,
                            top: `${t.yPercent}%`,
                            fontSize: `${Math.max(12, Math.round(t.fontSize * 0.75))}px`,
                            color: t.color,
                            backgroundColor: t.bgBox ? 'rgba(0,0,0,0.65)' : 'transparent',
                            textShadow: `0 2px 4px ${t.strokeColor || '#000000'}, 0 0 6px ${
                              t.strokeColor || '#000000'
                            }`,
                          }}
                        >
                          {t.text}
                        </div>
                      ))}

                    {(config.stickerOverlays || [])
                      .filter(
                        (st) => currentTime >= st.startTime && currentTime <= st.endTime
                      )
                      .map((st) => (
                        <div
                          key={st.id}
                          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 select-none animate-bounce"
                          style={{
                            left: `${st.xPercent ?? st.xPct ?? 50}%`,
                            top: `${st.yPercent ?? st.yPct ?? 50}%`,
                            fontSize: `${Math.max(18, Math.round((st.size ?? 36) * 0.8))}px`,
                          }}
                        >
                          {st.emoji}
                        </div>
                      ))}
                  </div>

                  {/* Điều khiển Phát / Tạm dừng / Âm lượng */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleVideoPreview}
                        className="px-4 py-2 rounded-[12px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        {isPlayingPreview ? (
                          <>
                            <Pause className="w-3.5 h-3.5" /> Tạm dừng
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" /> Phát đoạn đã chọn
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = config.startTime;
                            setCurrentTime(config.startTime);
                          }
                        }}
                        className={`px-3 py-2 rounded-[12px] border text-xs cursor-pointer ${
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                        }`}
                      >
                        Về đầu đoạn ({config.startTime}s)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-2 rounded-[12px] border cursor-pointer ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-gray-300'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                      title="Bật/Tắt tiếng khi xem trước"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* TIMELINE CẮT ĐOẠN (START & END TRIMMING) */}
                  <div className={`p-4 rounded-[14px] border space-y-3 ${subCardClass}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold">
                        Chọn Khoảng Thời Gian Chuyển Đổi (Độ dài:{' '}
                        <span className="text-emerald-400 font-mono">
                          {Math.max(0, config.endTime - config.startTime).toFixed(2)}s
                        </span>
                        )
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            startTime: 0,
                            endTime: Number(Math.min(metadata.duration, 5).toFixed(2)),
                          })
                        }
                        className="text-[11px] text-purple-400 hover:underline cursor-pointer"
                      >
                        Đặt lại vùng chọn
                      </button>
                    </div>

                    {/* Visual Range Bar */}
                    <div className="relative h-3 rounded-full bg-black/30 overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                        style={{
                          left: `${(config.startTime / metadata.duration) * 100}%`,
                          width: `${Math.max(
                            2,
                            ((config.endTime - config.startTime) / metadata.duration) * 100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1">
                          Bắt đầu (Giây: 0s → {config.endTime}s)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={Math.max(0.1, config.endTime - 0.1)}
                            step={0.1}
                            value={config.startTime}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setConfig({
                                ...config,
                                startTime: Math.min(val, config.endTime - 0.1),
                              });
                              if (videoRef.current) videoRef.current.currentTime = val;
                            }}
                            className="flex-1 accent-purple-500"
                          />
                          <input
                            type="number"
                            min={0}
                            max={config.endTime - 0.1}
                            step={0.1}
                            value={config.startTime}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              setConfig({
                                ...config,
                                startTime: Math.min(val, config.endTime - 0.1),
                              });
                            }}
                            className={`w-20 px-2 py-1 border rounded-[10px] text-xs font-mono ${inputClass}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold mb-1">
                          Kết thúc (Giây: {config.startTime}s → {metadata.duration}s)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={Math.min(metadata.duration, config.startTime + 0.1)}
                            max={metadata.duration}
                            step={0.1}
                            value={config.endTime}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setConfig({
                                ...config,
                                endTime: Math.max(val, config.startTime + 0.1),
                              });
                              if (videoRef.current) videoRef.current.currentTime = val;
                            }}
                            className="flex-1 accent-cyan-500"
                          />
                          <input
                            type="number"
                            min={config.startTime + 0.1}
                            max={metadata.duration}
                            step={0.1}
                            value={config.endTime}
                            onChange={(e) => {
                              const val = Math.min(metadata.duration, Number(e.target.value));
                              setConfig({
                                ...config,
                                endTime: Math.max(val, config.startTime + 0.1),
                              });
                            }}
                            className={`w-20 px-2 py-1 border rounded-[10px] text-xs font-mono ${inputClass}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI (5 CỘT - STICKY): TABS CẤU HÌNH GỌN GÀNG + DOCK CHUYỂN ĐỔI TỨC THÌ */}
              <div className="lg:col-span-5 lg:sticky lg:top-2 space-y-4">
                <div className={`p-4 sm:p-5 rounded-[14px] border space-y-4 ${panelClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-purple-400" />
                      <span>Bước 3: Bảng Tinh Chỉnh Thông Số GIF</span>
                    </h3>
                    <span className="text-[11px] font-mono text-indigo-400">
                      Preset: {GIF_STUDIO_PRESETS.find((p) => p.id === activePresetId)?.name || 'Tùy chỉnh'}
                    </span>
                  </div>

                  {/* Thanh 6 Tab Phân Nhóm Tính Năng Gọn Gàng */}
                  <div
                    className={`grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 rounded-[12px] border ${
                      isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    {[
                      { id: 'presets', label: 'Preset/FPS' },
                      { id: 'size', label: 'Kích Thước' },
                      { id: 'crop', label: 'Crop/Xoay' },
                      { id: 'color', label: 'Bảng Màu' },
                      { id: 'overlay', label: 'Chữ/Sticker' },
                      { id: 'all', label: 'Tất Cả' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                          setActiveConfigTab(
                            tab.id as
                              | 'presets'
                              | 'size'
                              | 'crop'
                              | 'color'
                              | 'overlay'
                              | 'all'
                          )
                        }
                        className={`py-1.5 px-1 rounded-[9px] text-[11px] font-bold transition-all cursor-pointer truncate ${
                          activeConfigTab === tab.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : isDark
                            ? 'text-gray-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* TAB 1: PRESETS, FPS, LOOP & SPEED */}
                  {(activeConfigTab === 'presets' || activeConfigTab === 'all') && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>8 Cấu Hình Preset Thông Minh (1-Chạm)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {GIF_STUDIO_PRESETS.map((preset) => {
                            const active = activePresetId === preset.id;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleApplyPreset(preset.id)}
                                className={`p-2 rounded-[10px] border text-left transition-all cursor-pointer ${
                                  active
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                                    : isDark
                                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200'
                                    : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-800'
                                }`}
                              >
                                <div className="text-xs font-bold truncate">{preset.name}</div>
                                <div
                                  className={`text-[10px] truncate ${
                                    active ? 'text-indigo-100' : 'opacity-70'
                                  }`}
                                >
                                  {preset.badge}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 7.1. Tốc độ khung hình (FPS) */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Tốc độ khung hình (FPS)</span>
                          <span className="font-mono text-purple-400">{config.fps} FPS</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {FPS_OPTIONS.map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setConfig({ ...config, fps: f })}
                              className={`py-1.5 rounded-[10px] border text-xs font-bold cursor-pointer ${
                                config.fps === f
                                  ? 'bg-purple-600 text-white border-purple-500'
                                  : isDark
                                  ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {f} FPS
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] opacity-70">
                          FPS thấp (8–10): giảm dung lượng • FPS cao (15–30): chuyển động mượt hơn.
                        </p>
                      </div>

                      {/* 7.6 & 7.7: Chế độ lặp & Tốc độ phát */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                        <div>
                          <label className="block text-xs font-semibold mb-1">
                            Chế độ lặp GIF (Loop)
                          </label>
                          <select
                            value={config.loopMode}
                            onChange={(e) =>
                              setConfig({ ...config, loopMode: e.target.value as LoopMode })
                            }
                            className={`w-full px-3 py-2 border rounded-[10px] text-xs ${inputClass}`}
                          >
                            <option value="infinite">Lặp vô hạn (Mặc định)</option>
                            <option value="once">Phát 1 lần rồi dừng</option>
                            <option value="custom">Lặp số lần tùy chỉnh</option>
                          </select>
                          {config.loopMode === 'custom' && (
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={config.customLoopCount}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  customLoopCount: Math.max(1, Number(e.target.value)),
                                })
                              }
                              className={`mt-1.5 w-full px-3 py-1 border rounded-[10px] text-xs font-mono ${inputClass}`}
                              placeholder="Số lần lặp"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1">
                            Tốc độ phát (Playback Speed)
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {SPEED_OPTIONS.map((sp) => (
                              <button
                                key={sp}
                                type="button"
                                onClick={() => setConfig({ ...config, playbackSpeed: sp })}
                                className={`py-1.5 rounded-[8px] border text-[11px] font-mono font-bold cursor-pointer ${
                                  config.playbackSpeed === sp
                                    ? 'bg-purple-600 text-white border-purple-500'
                                    : isDark
                                    ? 'bg-white/5 border-white/10 text-gray-300'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                {sp}x
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: KÍCH THƯỚC ĐẦU RA & TỶ LỆ KHUNG HÌNH */}
                  {(activeConfigTab === 'size' || activeConfigTab === 'all') && (
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Kích thước đầu ra (Chiều rộng nhanh)</span>
                        <label className="inline-flex items-center gap-1.5 text-[11px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.lockAspectRatio}
                            onChange={(e) =>
                              setConfig({ ...config, lockAspectRatio: e.target.checked })
                            }
                            className="accent-purple-600"
                          />
                          <span>Khóa tỷ lệ gốc</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {WIDTH_PRESETS.map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => handleWidthChange(w)}
                            className={`py-1.5 rounded-[10px] border text-xs font-semibold cursor-pointer ${
                              config.width === w
                                ? 'bg-indigo-600 text-white border-indigo-500'
                                : isDark
                                ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {w} px
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-semibold mb-1">
                            Chiều rộng (Width px)
                          </label>
                          <input
                            type="number"
                            min={40}
                            max={1280}
                            value={config.width}
                            onChange={(e) => handleWidthChange(Number(e.target.value))}
                            className={`w-full px-3 py-1.5 border rounded-[10px] text-xs font-mono ${inputClass}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold mb-1">
                            Chiều cao (Height px)
                          </label>
                          <input
                            type="number"
                            min={40}
                            max={1280}
                            value={config.height}
                            onChange={(e) => handleHeightChange(Number(e.target.value))}
                            className={`w-full px-3 py-1.5 border rounded-[10px] text-xs font-mono ${inputClass}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold mb-1">
                          Tỷ lệ khung hình chuẩn
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(
                            ['original', '1:1', '4:3', '16:9', '9:16', '3:2', 'custom'] as AspectRatioPreset[]
                          ).map((ar) => (
                            <button
                              key={ar}
                              type="button"
                              onClick={() => handleAspectRatioPresetChange(ar)}
                              className={`py-1.5 rounded-[8px] border text-[11px] font-semibold cursor-pointer ${
                                config.aspectRatioPreset === ar
                                  ? 'bg-cyan-600 text-white border-cyan-500'
                                  : isDark
                                  ? 'bg-white/5 border-white/10 text-gray-300'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              {ar === 'original' ? 'Gốc' : ar === 'custom' ? 'Tự do' : ar}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CẮT KHUNG HÌNH (CROP) & XOAY / LẬT */}
                  {(activeConfigTab === 'crop' || activeConfigTab === 'all') && (
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          <Crop className="w-3.5 h-3.5 text-amber-400" /> Cắt khung hình (Crop) & Xoay / Lật
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              crop: { ...config.crop, enabled: !config.crop.enabled },
                            })
                          }
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${
                            config.crop.enabled
                              ? 'bg-amber-500 text-black border-amber-400'
                              : isDark
                              ? 'bg-white/5 border-white/15 text-gray-300'
                              : 'bg-slate-100 border-slate-300 text-slate-700'
                          }`}
                        >
                          {config.crop.enabled ? 'Đang bật Crop' : 'Bật Crop'}
                        </button>
                      </div>

                      {config.crop.enabled && (
                        <div className={`p-3 rounded-[12px] border space-y-2 ${subCardClass}`}>
                          <div className="grid grid-cols-4 gap-2 text-[11px]">
                            <div>
                              <label className="block opacity-75">X (%)</label>
                              <input
                                type="number"
                                min={0}
                                max={85}
                                value={config.crop.x}
                                onChange={(e) =>
                                  setConfig({
                                    ...config,
                                    crop: { ...config.crop, x: Number(e.target.value) },
                                  })
                                }
                                className={`w-full px-2 py-1 border rounded text-xs font-mono ${inputClass}`}
                              />
                            </div>
                            <div>
                              <label className="block opacity-75">Y (%)</label>
                              <input
                                type="number"
                                min={0}
                                max={85}
                                value={config.crop.y}
                                onChange={(e) =>
                                  setConfig({
                                    ...config,
                                    crop: { ...config.crop, y: Number(e.target.value) },
                                  })
                                }
                                className={`w-full px-2 py-1 border rounded text-xs font-mono ${inputClass}`}
                              />
                            </div>
                            <div>
                              <label className="block opacity-75">Rộng (%)</label>
                              <input
                                type="number"
                                min={15}
                                max={100}
                                value={config.crop.width}
                                onChange={(e) =>
                                  setConfig({
                                    ...config,
                                    crop: { ...config.crop, width: Number(e.target.value) },
                                  })
                                }
                                className={`w-full px-2 py-1 border rounded text-xs font-mono ${inputClass}`}
                              />
                            </div>
                            <div>
                              <label className="block opacity-75">Cao (%)</label>
                              <input
                                type="number"
                                min={15}
                                max={100}
                                value={config.crop.height}
                                onChange={(e) =>
                                  setConfig({
                                    ...config,
                                    crop: { ...config.crop, height: Number(e.target.value) },
                                  })
                                }
                                className={`w-full px-2 py-1 border rounded text-xs font-mono ${inputClass}`}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setConfig({
                                  ...config,
                                  crop: {
                                    enabled: true,
                                    x: Math.round((100 - config.crop.width) / 2),
                                    y: Math.round((100 - config.crop.height) / 2),
                                    width: config.crop.width,
                                    height: config.crop.height,
                                  },
                                })
                              }
                              className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                            >
                              Căn giữa vùng cắt
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfig({
                                  ...config,
                                  crop: { enabled: false, x: 0, y: 0, width: 100, height: 100 },
                                })
                              }
                              className="text-[11px] text-gray-400 hover:underline cursor-pointer"
                            >
                              Đặt lại Crop
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Xoay & Lật */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              rotation: (((config.rotation + 90) % 360) as 0 | 90 | 180 | 270),
                            })
                          }
                          className={`py-2 px-3 rounded-[10px] border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                            config.rotation !== 0
                              ? 'bg-purple-600 text-white border-purple-500'
                              : isDark
                              ? 'bg-white/5 border-white/10 text-gray-300'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <RotateCw className="w-3.5 h-3.5" /> Xoay ({config.rotation}°)
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, flipH: !config.flipH })}
                          className={`py-2 px-3 rounded-[10px] border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                            config.flipH
                              ? 'bg-purple-600 text-white border-purple-500'
                              : isDark
                              ? 'bg-white/5 border-white/10 text-gray-300'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <FlipHorizontal className="w-3.5 h-3.5" /> Lật ngang
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, flipV: !config.flipV })}
                          className={`py-2 px-3 rounded-[10px] border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                            config.flipV
                              ? 'bg-purple-600 text-white border-purple-500'
                              : isDark
                              ? 'bg-white/5 border-white/10 text-gray-300'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <FlipVertical className="w-3.5 h-3.5" /> Lật dọc
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: BẢNG MÀU 256, DITHERING & BỘ LỌC MÀU */}
                  {(activeConfigTab === 'color' || activeConfigTab === 'all') && (
                    <div className="space-y-4 pt-2 border-t border-white/10">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            Số màu tối đa (Chuẩn GIF ≤ 256)
                          </label>
                          <select
                            value={config.maxColors}
                            onChange={(e) =>
                              setConfig({ ...config, maxColors: Number(e.target.value) })
                            }
                            className={`w-full px-2.5 py-1.5 border rounded-[10px] text-xs ${inputClass}`}
                          >
                            <option value={256}>256 màu (Chất lượng tối đa)</option>
                            <option value={128}>128 màu (Cân bằng)</option>
                            <option value={64}>64 màu (Dung lượng nhẹ)</option>
                            <option value={32}>32 màu (Siêu nhỏ)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            Thuật toán Dithering
                          </label>
                          <select
                            value={config.ditherAlgorithm}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                ditherAlgorithm: e.target.value as DitherAlgorithm,
                              })
                            }
                            className={`w-full px-2.5 py-1.5 border rounded-[10px] text-xs ${inputClass}`}
                          >
                            <option value="floyd_steinberg">Floyd-Steinberg (Mịn chuyển sắc)</option>
                            <option value="bayer">Bayer 4×4 (Họa tiết trật tự)</option>
                            <option value="sierra">Sierra (Cân bằng chi tiết)</option>
                            <option value="none">Không Dither (Màu phẳng UI)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold mb-1">
                          <span>Mức độ Dithering</span>
                          <span>{config.ditherStrength}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={config.ditherStrength}
                          onChange={(e) =>
                            setConfig({ ...config, ditherStrength: Number(e.target.value) })
                          }
                          className="w-full accent-indigo-500"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.optimizePalette}
                          onChange={(e) =>
                            setConfig({ ...config, optimizePalette: e.target.checked })
                          }
                          className="accent-purple-600"
                        />
                        <span>
                          Tạo bảng màu riêng cho từng khung hình (2-Pass Adaptive PaletteGen)
                        </span>
                      </label>

                      {/* Chỉnh Độ sáng, Tương phản, Bão hòa */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold">
                            Hiệu chỉnh màu sắc (Áp dụng thực khi xuất GIF)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setConfig({
                                ...config,
                                brightness: 100,
                                contrast: 100,
                                saturation: 100,
                                rotation: 0,
                                flipH: false,
                                flipV: false,
                              })
                            }
                            className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                          >
                            Đặt lại bộ lọc
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                          <div>
                            <label>Độ sáng: {config.brightness}%</label>
                            <input
                              type="range"
                              min={50}
                              max={150}
                              value={config.brightness}
                              onChange={(e) =>
                                setConfig({ ...config, brightness: Number(e.target.value) })
                              }
                              className="w-full accent-purple-500"
                            />
                          </div>
                          <div>
                            <label>Tương phản: {config.contrast}%</label>
                            <input
                              type="range"
                              min={50}
                              max={150}
                              value={config.contrast}
                              onChange={(e) =>
                                setConfig({ ...config, contrast: Number(e.target.value) })
                              }
                              className="w-full accent-purple-500"
                            />
                          </div>
                          <div>
                            <label>Bão hòa: {config.saturation}%</label>
                            <input
                              type="range"
                              min={0}
                              max={200}
                              value={config.saturation}
                              onChange={(e) =>
                                setConfig({ ...config, saturation: Number(e.target.value) })
                              }
                              className="w-full accent-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: CHÈN CHỮ MEME, WATERMARK & STICKER ĐỘNG THEO TIMESTAMP */}
                  {(activeConfigTab === 'overlay' || activeConfigTab === 'all') && (
                    <div className="space-y-4 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                          <span>Chèn Phụ đề Meme, Watermark & Sticker theo Timestamp</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newItem: GifTextOverlayItem = {
                              id: 'txt_' + Date.now(),
                              text: 'PHỤ ĐỀ GIF MỚI',
                              xPercent: 50,
                              yPercent: 85,
                              fontSize: 24,
                              color: '#ffffff',
                              strokeColor: '#000000',
                              bgBox: true,
                              startTime: config.startTime,
                              endTime: config.endTime,
                            };
                            setConfig({
                              ...config,
                              textOverlays: [...(config.textOverlays || []), newItem],
                            });
                          }}
                          className="px-2.5 py-1 rounded-[10px] bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          + Thêm dòng chữ
                        </button>
                      </div>

                      {/* Danh sách các dòng chữ */}
                      {(config.textOverlays || []).length === 0 ? (
                        <p className="text-[11px] opacity-70 italic">
                          Chưa có dòng chữ nào. Nhấn &ldquo;+ Thêm dòng chữ&rdquo; để gắn phụ đề meme hoặc watermark vào GIF.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                          {(config.textOverlays || []).map((t, idx) => (
                            <div
                              key={t.id}
                              className={`p-2.5 rounded-[12px] border space-y-2 text-[11px] ${subCardClass}`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={t.text}
                                  onChange={(e) => {
                                    const next = [...(config.textOverlays || [])];
                                    next[idx] = { ...t, text: e.target.value };
                                    setConfig({ ...config, textOverlays: next });
                                  }}
                                  placeholder="Nhập nội dung chữ..."
                                  className={`flex-1 px-2.5 py-1 rounded-[8px] border text-xs font-bold ${inputClass}`}
                                />
                                <input
                                  type="color"
                                  value={t.color}
                                  onChange={(e) => {
                                    const next = [...(config.textOverlays || [])];
                                    next[idx] = { ...t, color: e.target.value };
                                    setConfig({ ...config, textOverlays: next });
                                  }}
                                  className="w-7 h-7 rounded cursor-pointer border-0"
                                  title="Màu chữ"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfig({
                                      ...config,
                                      textOverlays: (config.textOverlays || []).filter(
                                        (item) => item.id !== t.id
                                      ),
                                    });
                                  }}
                                  className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer"
                                  title="Xóa dòng chữ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-4 gap-1.5">
                                <div>
                                  <label className="block opacity-70 text-[10px]">Từ (giây)</label>
                                  <input
                                    type="number"
                                    step={0.1}
                                    min={0}
                                    value={t.startTime}
                                    onChange={(e) => {
                                      const next = [...(config.textOverlays || [])];
                                      next[idx] = { ...t, startTime: Number(e.target.value) };
                                      setConfig({ ...config, textOverlays: next });
                                    }}
                                    className={`w-full px-1.5 py-1 rounded border font-mono text-[10px] ${inputClass}`}
                                  />
                                </div>
                                <div>
                                  <label className="block opacity-70 text-[10px]">Đến (giây)</label>
                                  <input
                                    type="number"
                                    step={0.1}
                                    min={0}
                                    value={t.endTime}
                                    onChange={(e) => {
                                      const next = [...(config.textOverlays || [])];
                                      next[idx] = { ...t, endTime: Number(e.target.value) };
                                      setConfig({ ...config, textOverlays: next });
                                    }}
                                    className={`w-full px-1.5 py-1 rounded border font-mono text-[10px] ${inputClass}`}
                                  />
                                </div>
                                <div>
                                  <label className="block opacity-70 text-[10px]">Vị trí Y (%)</label>
                                  <input
                                    type="number"
                                    min={5}
                                    max={95}
                                    value={t.yPercent}
                                    onChange={(e) => {
                                      const next = [...(config.textOverlays || [])];
                                      next[idx] = { ...t, yPercent: Number(e.target.value) };
                                      setConfig({ ...config, textOverlays: next });
                                    }}
                                    className={`w-full px-1.5 py-1 rounded border font-mono text-[10px] ${inputClass}`}
                                  />
                                </div>
                                <div>
                                  <label className="block opacity-70 text-[10px]">Cỡ chữ (px)</label>
                                  <input
                                    type="number"
                                    min={12}
                                    max={64}
                                    value={t.fontSize}
                                    onChange={(e) => {
                                      const next = [...(config.textOverlays || [])];
                                      next[idx] = { ...t, fontSize: Number(e.target.value) };
                                      setConfig({ ...config, textOverlays: next });
                                    }}
                                    className={`w-full px-1.5 py-1 rounded border font-mono text-[10px] ${inputClass}`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Nhãn dán Sticker động */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold">
                            Thêm Nhãn dán Sticker động (Nhấp để chèn vào GIF):
                          </span>
                          {(config.stickerOverlays || []).length > 0 && (
                            <button
                              type="button"
                              onClick={() => setConfig({ ...config, stickerOverlays: [] })}
                              className="text-[10px] text-red-400 hover:underline cursor-pointer"
                            >
                              Xóa hết Sticker ({config.stickerOverlays?.length})
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {STICKER_PRESETS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                const newSticker: GifStickerOverlayItem = {
                                  id: 'stk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
                                  emoji,
                                  xPercent: 20 + Math.round(Math.random() * 60),
                                  yPercent: 20 + Math.round(Math.random() * 50),
                                  size: 36,
                                  startTime: config.startTime,
                                  endTime: config.endTime,
                                };
                                setConfig({
                                  ...config,
                                  stickerOverlays: [...(config.stickerOverlays || []), newSticker],
                                });
                              }}
                              className={`w-8 h-8 rounded-[10px] border text-base flex items-center justify-center hover:scale-110 transition-transform cursor-pointer ${
                                isDark
                                  ? 'bg-white/5 border-white/10 hover:bg-white/15'
                                  : 'bg-white border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* DOCK CHUYỂN ĐỔI & ƯỚC TÍNH KẾT QUẢ (LUÔN HIỂN THỊ TRONG CỘT PHẢI ĐỂ THAO TÁC NGAY) */}
                <div className={`p-4 sm:p-5 rounded-[14px] border space-y-3.5 ${panelClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Bước 4: Ước Tính & Xuất GIF Thực Tế</span>
                    </h3>
                    <span className="text-[10px] font-mono opacity-75">GIF89a Local Engine</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className={`p-2.5 rounded-[10px] border ${subCardClass}`}>
                      <div className="text-[10px] opacity-70">Thời lượng</div>
                      <div className="text-xs font-bold font-mono text-purple-400">
                        {estimation.outputDuration.toFixed(2)}s
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-[10px] border ${subCardClass}`}>
                      <div className="text-[10px] opacity-70">Tổng Frames</div>
                      <div className="text-xs font-bold font-mono text-cyan-400">
                        {estimation.estimatedFrames} ({config.fps}fps)
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-[10px] border ${subCardClass}`}>
                      <div className="text-[10px] opacity-70">Kích thước</div>
                      <div className="text-xs font-bold font-mono text-indigo-400">
                        {config.width}×{config.height}
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-[10px] border ${subCardClass}`}>
                      <div className="text-[10px] opacity-70">Dự kiến</div>
                      <div className="text-xs font-bold font-mono text-emerald-400">
                        ~{formatBytes(estimation.estimatedBytes)}
                      </div>
                    </div>
                  </div>

                  {estimation.isHeavyWarning && (
                    <div className="p-2.5 rounded-[10px] bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        Cấu hình tạo nhiều frame hoặc độ phân giải lớn. Giảm FPS (10–12) hoặc chiều
                        rộng (480px) để GIF nhẹ hơn.
                      </span>
                    </div>
                  )}

                  {/* Tiến trình chuyển đổi thực tế */}
                  {(isConverting || progress.stage !== 'idle') && (
                    <div className={`p-3 rounded-[12px] border space-y-1.5 ${subCardClass}`}>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-2">
                          {isConverting && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />}
                          {progress.stageLabel}
                        </span>
                        <span className="font-mono text-purple-400">{progress.percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-200"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {conversionError && (
                    <div className="p-3 rounded-[12px] bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{conversionError}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleStartConversion}
                      disabled={isConverting}
                      className="flex-1 py-3 px-4 rounded-[14px] bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isConverting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang chuyển đổi ({progress.percent}%)...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Chuyển Đổi Video Sang GIF Ngay</span>
                        </>
                      )}
                    </button>

                    {isConverting && (
                      <button
                        type="button"
                        onClick={handleCancelConversion}
                        className="px-3.5 py-3 rounded-[14px] bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL TRỢ GIÚP & LƯU Ý KỸ THUẬT */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div
            className={`w-full max-w-lg rounded-[14px] border p-6 space-y-4 shadow-2xl ${panelClass}`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-white/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                <span>Hướng Dẫn Sử Dụng & Lưu Ý Kỹ Thuật Chuẩn GIF89a</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs leading-relaxed">
              <p>
                <strong>1. Giới hạn 256 màu của định dạng GIF:</strong> Theo chuẩn GIF89a quốc tế,
                mỗi khung hình GIF lưu tối đa 256 màu. Công cụ này sử dụng thuật toán{' '}
                <em>Adaptive PaletteGen</em> kết hợp <em>Floyd-Steinberg / Bayer Dithering</em> để
                tái tạo màu sắc gần với video gốc nhất.
              </p>
              <p>
                <strong>2. Mẹo giảm dung lượng tệp GIF:</strong> Chọn đoạn cắt ngắn (2–6 giây),
                FPS từ 10–12, và chiều rộng 320px–480px.
              </p>
              <p>
                <strong>3. Quyền riêng tư & Bảo mật:</strong> Toàn bộ quá trình giải mã video, cắt
                khung hình và mã hóa LZW GIF diễn ra trực tiếp trên trình duyệt của bạn, không tải
                video lên bất kỳ máy chủ nào.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-[12px] bg-purple-600 text-white text-xs font-bold cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
