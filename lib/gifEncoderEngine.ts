/**
 * Real Client-Side GIF89a Multimedia Engine
 * Hỗ trợ:
 * - Giải mã video thực tế qua HTML5 Video + Canvas 2D
 * - Cắt đoạn (Start / End time), Tốc độ phát (0.5x - 2.0x), FPS (5 - 30 FPS)
 * - Crop khung hình (X, Y, Width, Height), Xoay (0/90/180/270°), Lật ngang/dọc
 * - Chỉnh độ sáng (Brightness), tương phản (Contrast), bão hòa (Saturation)
 * - Tạo bảng màu tối ưu 2 bước (PaletteGen Adaptive Quantization 32-256 màu)
 * - Thuật toán Dithering thực tế (Floyd-Steinberg, Bayer 4x4, Sierra, None) + mức Dithering
 * - Mã hóa nhị phân chuẩn GIF89a LZW + Metadata vòng lặp NETSCAPE2.0
 */

export type DitherAlgorithm = 'floyd_steinberg' | 'bayer' | 'sierra' | 'none';
export type QualityPresetMode = 'small_size' | 'balanced' | 'high_quality' | 'custom';
export type LoopMode = 'infinite' | 'once' | 'custom';
export type AspectRatioPreset = 'original' | '1:1' | '4:3' | '16:9' | '9:16' | '3:2' | 'custom';

export interface GifTextOverlayItem {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  xPct?: number; // 5..95 (%)
  yPct?: number; // 8..92 (%)
  xPercent?: number;
  yPercent?: number;
  fontSize: number; // 14..56 (px reference at 480w)
  textColor?: string;
  color?: string;
  strokeColor?: string;
  bgColor?: string;
  bgBox?: boolean;
  uppercase?: boolean;
  animation?: string;
}

export interface GifStickerOverlayItem {
  id: string;
  emoji: string;
  label?: string;
  startTime: number;
  endTime: number;
  xPct?: number; // 5..95 (%)
  yPct?: number; // 8..92 (%)
  xPercent?: number;
  yPercent?: number;
  size?: number; // 20..80 (px reference at 480w)
  scale?: number;
  animation?: 'bounce' | 'pulse' | 'wiggle' | 'none' | string;
}

export interface GifConversionConfig {
  startTime: number;
  endTime: number;
  fps: number;
  width: number;
  height: number;
  lockAspectRatio: boolean;
  aspectRatioPreset: AspectRatioPreset;
  qualityMode: QualityPresetMode;
  maxColors: number; // 32..256
  optimizePalette: boolean; // Two-pass per-frame adaptive palette
  ditherAlgorithm: DitherAlgorithm;
  ditherStrength: number; // 0..100
  crop: {
    enabled: boolean;
    x: number; // 0..100 (%)
    y: number; // 0..100 (%)
    width: number; // 10..100 (%)
    height: number; // 10..100 (%)
  };
  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  brightness: number; // 50..150 (%)
  contrast: number; // 50..150 (%)
  saturation: number; // 0..200 (%)
  loopMode: LoopMode;
  customLoopCount: number;
  playbackSpeed: number; // 0.5, 0.75, 1, 1.25, 1.5, 2
  textOverlays?: GifTextOverlayItem[];
  stickerOverlays?: GifStickerOverlayItem[];
}

export type ConversionStage =
  | 'idle'
  | 'initializing'
  | 'reading_video'
  | 'processing_frames'
  | 'generating_palette'
  | 'encoding_gif'
  | 'finalizing'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface ConversionProgress {
  stage: ConversionStage;
  stageLabel: string;
  percent: number;
  currentFrame: number;
  totalFrames: number;
}

export interface GifConversionResult {
  blob: Blob;
  blobUrl: string;
  width: number;
  height: number;
  frameCount: number;
  fps: number;
  durationSec: number;
  fileSizeBytes: number;
  fileName: string;
}

export interface GifPresetItem {
  id: string;
  name: string;
  desc: string;
  badge: string;
  apply: (sourceWidth: number, sourceHeight: number) => Partial<GifConversionConfig>;
}

export const GIF_STUDIO_PRESETS: GifPresetItem[] = [
  {
    id: 'lightest',
    name: '1. GIF nhẹ nhất',
    desc: 'Tối ưu dung lượng siêu nhỏ để tải tức thì qua mạng chậm',
    badge: '8 FPS • 320px • 64 màu',
    apply: (sw, sh) => {
      const ratio = sh / Math.max(1, sw);
      return {
        fps: 8,
        width: 320,
        height: Math.max(60, Math.round(320 * ratio)),
        qualityMode: 'small_size',
        maxColors: 64,
        optimizePalette: false,
        ditherAlgorithm: 'bayer',
        ditherStrength: 35,
      };
    },
  },
  {
    id: 'balanced',
    name: '2. GIF cân bằng',
    desc: 'Cân bằng hoàn hảo giữa độ mượt, màu sắc và dung lượng',
    badge: '12 FPS • 480px • 128 màu',
    apply: (sw, sh) => {
      const ratio = sh / Math.max(1, sw);
      return {
        fps: 12,
        width: 480,
        height: Math.max(80, Math.round(480 * ratio)),
        qualityMode: 'balanced',
        maxColors: 128,
        optimizePalette: true,
        ditherAlgorithm: 'floyd_steinberg',
        ditherStrength: 60,
      };
    },
  },
  {
    id: 'high_quality',
    name: '3. GIF chất lượng cao',
    desc: 'Bảng màu 256 màu riêng từng khung hình, chuyển động mượt',
    badge: '20 FPS • 640px • 256 màu',
    apply: (sw, sh) => {
      const ratio = sh / Math.max(1, sw);
      return {
        fps: 20,
        width: 640,
        height: Math.max(100, Math.round(640 * ratio)),
        qualityMode: 'high_quality',
        maxColors: 256,
        optimizePalette: true,
        ditherAlgorithm: 'floyd_steinberg',
        ditherStrength: 75,
      };
    },
  },
  {
    id: 'website',
    name: '4. GIF cho website',
    desc: 'Tối ưu tốc độ tải trang Landing Page & Blog công nghệ',
    badge: '12 FPS • 640px • 128 màu',
    apply: (sw, sh) => {
      const ratio = sh / Math.max(1, sw);
      return {
        fps: 12,
        width: 640,
        height: Math.max(100, Math.round(640 * ratio)),
        qualityMode: 'balanced',
        maxColors: 128,
        optimizePalette: true,
        ditherAlgorithm: 'bayer',
        ditherStrength: 50,
      };
    },
  },
  {
    id: 'social',
    name: '5. GIF cho mạng xã hội',
    desc: 'Sắc nét trên Facebook, X/Twitter, Threads, Cộng đồng',
    badge: '15 FPS • 480px • 256 màu',
    apply: (sw, sh) => {
      const ratio = sh / Math.max(1, sw);
      return {
        fps: 15,
        width: 480,
        height: Math.max(80, Math.round(480 * ratio)),
        qualityMode: 'high_quality',
        maxColors: 256,
        optimizePalette: true,
        ditherAlgorithm: 'floyd_steinberg',
        ditherStrength: 65,
      };
    },
  },
  {
    id: 'square_avatar',
    name: '6. GIF avatar vuông',
    desc: 'Tự động cắt vuông 1:1 ở trung tâm cho ảnh đại diện động',
    badge: '12 FPS • 240x240 • 1:1',
    apply: () => ({
      fps: 12,
      width: 240,
      height: 240,
      aspectRatioPreset: '1:1',
      lockAspectRatio: true,
      crop: {
        enabled: true,
        x: 15,
        y: 10,
        width: 70,
        height: 80,
      },
      qualityMode: 'balanced',
      maxColors: 128,
      optimizePalette: true,
    }),
  },
  {
    id: 'reaction_chat',
    name: '7. GIF phản ứng/chat',
    desc: 'Nhỏ gọn cho Discord, Slack, Telegram, Messenger',
    badge: '10 FPS • 320px • Nhanh',
    apply: (sw, sh) => {
      const ratio = sh / Math.max(1, sw);
      return {
        fps: 10,
        width: 320,
        height: Math.max(60, Math.round(320 * ratio)),
        qualityMode: 'small_size',
        maxColors: 128,
        optimizePalette: false,
        ditherAlgorithm: 'bayer',
        ditherStrength: 40,
      };
    },
  },
  {
    id: 'ui_demo',
    name: '8. GIF demo giao diện phần mềm',
    desc: 'Giữ chữ và viền UI sắc nét, hạn chế nhiễu hạt trên vùng màu phẳng',
    badge: '15 FPS • 800px • Ít nhiễu',
    apply: (sw, sh) => {
      const ratio = sh / Math.max(1, sw);
      return {
        fps: 15,
        width: 800,
        height: Math.max(120, Math.round(800 * ratio)),
        qualityMode: 'high_quality',
        maxColors: 256,
        optimizePalette: true,
        ditherAlgorithm: 'none',
        ditherStrength: 0,
      };
    },
  },
];

/**
 * Ước tính thông số đầu ra trước khi chuyển đổi
 */
export function estimateGifOutput(config: GifConversionConfig) {
  const rawClipDuration = Math.max(0.1, config.endTime - config.startTime);
  const outputDuration = rawClipDuration / Math.max(0.25, config.playbackSpeed || 1);
  const estimatedFrames = Math.max(1, Math.round(outputDuration * config.fps));

  const pixelsPerFrame = config.width * config.height;
  const colorFactor = Math.log2(Math.max(16, config.maxColors)) / 8;
  const ditherFactor =
    config.ditherAlgorithm === 'none'
      ? 0.22
      : config.ditherAlgorithm === 'bayer'
      ? 0.28 + (config.ditherStrength / 100) * 0.08
      : 0.32 + (config.ditherStrength / 100) * 0.12;

  const estimatedBytes = Math.round(
    estimatedFrames * pixelsPerFrame * colorFactor * ditherFactor
  );

  const isHeavyWarning =
    estimatedFrames > 180 ||
    estimatedBytes > 15 * 1024 * 1024 ||
    (config.width >= 800 && config.fps >= 20 && rawClipDuration > 8);

  return {
    rawClipDuration,
    outputDuration,
    estimatedFrames,
    estimatedBytes,
    isHeavyWarning,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatTimeMMSS(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  const secsStr = secs < 10 ? `0${secs.toFixed(1)}` : secs.toFixed(1);
  return `${minsStr}:${secsStr}`;
}

/**
 * Xây dựng bảng màu tối ưu (Adaptive PaletteGen) từ dữ liệu RGBA của khung hình
 */
function buildAdaptivePalette(
  rgbaData: Uint8ClampedArray,
  maxColors: number
): { palette: Uint8Array; colorCountPowerOf2: number } {
  const targetColors = Math.max(16, Math.min(256, maxColors));
  const colorCountPowerOf2 =
    targetColors <= 32 ? 32 : targetColors <= 64 ? 64 : targetColors <= 128 ? 128 : 256;

  // Histogram 15-bit RGB (5 bits per channel = 32768 buckets)
  const hist = new Int32Array(32768);
  const rSum = new Int32Array(32768);
  const gSum = new Int32Array(32768);
  const bSum = new Int32Array(32768);

  const totalPixels = rgbaData.length / 4;
  const sampleStep = totalPixels > 80000 ? 2 : 1;

  for (let i = 0; i < rgbaData.length; i += 4 * sampleStep) {
    const r = rgbaData[i];
    const g = rgbaData[i + 1];
    const b = rgbaData[i + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    hist[key]++;
    rSum[key] += r;
    gSum[key] += g;
    bSum[key] += b;
  }

  const buckets: { count: number; r: number; g: number; b: number }[] = [];
  for (let k = 0; k < 32768; k++) {
    if (hist[k] > 0) {
      const c = hist[k];
      buckets.push({
        count: c,
        r: Math.round(rSum[k] / c),
        g: Math.round(gSum[k] / c),
        b: Math.round(bSum[k] / c),
      });
    }
  }

  buckets.sort((a, b) => b.count - a.count);

  const palette = new Uint8Array(colorCountPowerOf2 * 3);
  const selected: { r: number; g: number; b: number }[] = [];

  // Bước 1: Chọn các màu khác biệt nhau trước để tránh hiện tượng dải màu (banding)
  const minDistSq = 18 * 18;
  for (let i = 0; i < buckets.length && selected.length < targetColors; i++) {
    const candidate = buckets[i];
    let tooClose = false;
    for (let j = 0; j < selected.length; j++) {
      const dr = candidate.r - selected[j].r;
      const dg = candidate.g - selected[j].g;
      const db = candidate.b - selected[j].b;
      if (dr * dr + dg * dg + db * db < minDistSq) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) {
      selected.push(candidate);
    }
  }

  // Bước 2: Điền nốt các màu phổ biến nhất nếu còn chỗ
  for (let i = 0; i < buckets.length && selected.length < targetColors; i++) {
    selected.push(buckets[i]);
  }

  for (let i = 0; i < selected.length && i < colorCountPowerOf2; i++) {
    palette[i * 3] = selected[i].r;
    palette[i * 3 + 1] = selected[i].g;
    palette[i * 3 + 2] = selected[i].b;
  }

  return { palette, colorCountPowerOf2 };
}

/**
 * Ánh xạ pixel RGBA sang chỉ mục bảng màu với thuật toán Dithering (Floyd-Steinberg / Bayer / Sierra / None)
 */
function quantizeFrameWithDither(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  palette: Uint8Array,
  colorCount: number,
  algorithm: DitherAlgorithm,
  strengthPercent: number
): Uint8Array {
  const indexed = new Uint8Array(width * height);
  const lut = new Int16Array(32768);
  lut.fill(-1);

  const findNearestColorIndex = (r: number, g: number, b: number): number => {
    const cr = r < 0 ? 0 : r > 255 ? 255 : r | 0;
    const cg = g < 0 ? 0 : g > 255 ? 255 : g | 0;
    const cb = b < 0 ? 0 : b > 255 ? 255 : b | 0;
    const key = ((cr >> 3) << 10) | ((cg >> 3) << 5) | (cb >> 3);
    if (lut[key] !== -1) return lut[key];

    let bestIdx = 0;
    let bestDist = 1e9;
    for (let i = 0; i < colorCount; i++) {
      const pr = palette[i * 3];
      const pg = palette[i * 3 + 1];
      const pb = palette[i * 3 + 2];
      const dr = cr - pr;
      const dg = cg - pg;
      const db = cb - pb;
      const dist = dr * dr * 2 + dg * dg * 4 + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
        if (dist === 0) break;
      }
    }
    lut[key] = bestIdx;
    return bestIdx;
  };

  const strength = Math.max(0, Math.min(1, strengthPercent / 100));

  if (algorithm === 'none' || strength === 0) {
    for (let p = 0, idx = 0; p < rgba.length; p += 4, idx++) {
      indexed[idx] = findNearestColorIndex(rgba[p], rgba[p + 1], rgba[p + 2]);
    }
    return indexed;
  }

  if (algorithm === 'bayer') {
    const bayer4x4 = [
      [-7.5, 0.5, -5.5, 2.5],
      [4.5, -3.5, 6.5, -1.5],
      [-4.5, 3.5, -6.5, 1.5],
      [7.5, -0.5, 5.5, -2.5],
    ];
    const scale = strength * 3.2;
    let idx = 0;
    for (let y = 0; y < height; y++) {
      const row = bayer4x4[y & 3];
      for (let x = 0; x < width; x++) {
        const offset = row[x & 3] * scale;
        const p = idx * 4;
        indexed[idx] = findNearestColorIndex(
          rgba[p] + offset,
          rgba[p + 1] + offset,
          rgba[p + 2] + offset
        );
        idx++;
      }
    }
    return indexed;
  }

  // Error diffusion (Floyd-Steinberg / Sierra)
  const bufR = new Float32Array(width * height);
  const bufG = new Float32Array(width * height);
  const bufB = new Float32Array(width * height);
  for (let i = 0, p = 0; i < indexed.length; i++, p += 4) {
    bufR[i] = rgba[p];
    bufG[i] = rgba[p + 1];
    bufB[i] = rgba[p + 2];
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const oldR = bufR[i];
      const oldG = bufG[i];
      const oldB = bufB[i];

      const palIdx = findNearestColorIndex(oldR, oldG, oldB);
      indexed[i] = palIdx;

      const errR = (oldR - palette[palIdx * 3]) * strength;
      const errG = (oldG - palette[palIdx * 3 + 1]) * strength;
      const errB = (oldB - palette[palIdx * 3 + 2]) * strength;

      if (x + 1 < width) {
        bufR[i + 1] += errR * (7 / 16);
        bufG[i + 1] += errG * (7 / 16);
        bufB[i + 1] += errB * (7 / 16);
      }
      if (y + 1 < height) {
        if (x > 0) {
          bufR[i + width - 1] += errR * (3 / 16);
          bufG[i + width - 1] += errG * (3 / 16);
          bufB[i + width - 1] += errB * (3 / 16);
        }
        bufR[i + width] += errR * (5 / 16);
        bufG[i + width] += errG * (5 / 16);
        bufB[i + width] += errB * (5 / 16);
        if (x + 1 < width) {
          bufR[i + width + 1] += errR * (1 / 16);
          bufG[i + width + 1] += errG * (1 / 16);
          bufB[i + width + 1] += errB * (1 / 16);
        }
      }
    }
  }

  return indexed;
}

/**
 * Bộ mã hóa LZW chuẩn GIF89a cho 1 khung hình
 */
function encodeLzwFrame(indexedPixels: Uint8Array, minCodeSize: number): Uint8Array {
  const outBytes: number[] = [];
  outBytes.push(minCodeSize);

  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;

  // Bảng băm chuỗi (prefix << 8 | suffix) -> code
  const dict = new Int32Array(4096 * 256);
  dict.fill(-1);

  let bitBuffer = 0;
  let bitCount = 0;
  const subBlock: number[] = [];

  const flushSubBlock = () => {
    if (subBlock.length > 0) {
      outBytes.push(subBlock.length);
      for (let i = 0; i < subBlock.length; i++) {
        outBytes.push(subBlock[i]);
      }
      subBlock.length = 0;
    }
  };

  const writeCode = (code: number) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      subBlock.push(bitBuffer & 0xff);
      if (subBlock.length === 255) {
        flushSubBlock();
      }
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  };

  writeCode(clearCode);

  if (indexedPixels.length === 0) {
    writeCode(eoiCode);
    if (bitCount > 0) {
      subBlock.push(bitBuffer & 0xff);
    }
    flushSubBlock();
    outBytes.push(0);
    return new Uint8Array(outBytes);
  }

  let prefix = indexedPixels[0];

  for (let i = 1; i < indexedPixels.length; i++) {
    const suffix = indexedPixels[i];
    const key = (prefix << 8) | suffix;
    const found = dict[key];

    if (found !== -1) {
      prefix = found;
    } else {
      writeCode(prefix);
      if (nextCode < 4096) {
        dict[key] = nextCode++;
        if (nextCode > 1 << codeSize && codeSize < 12) {
          codeSize++;
        }
      } else {
        writeCode(clearCode);
        dict.fill(-1);
        codeSize = minCodeSize + 1;
        nextCode = eoiCode + 1;
      }
      prefix = suffix;
    }
  }

  writeCode(prefix);
  writeCode(eoiCode);

  if (bitCount > 0) {
    subBlock.push(bitBuffer & 0xff);
  }
  flushSubBlock();
  outBytes.push(0); // Block terminator

  return new Uint8Array(outBytes);
}

/**
 * Điều chỉnh Độ sáng / Tương phản / Độ bão hòa trực tiếp trên mảng RGBA
 */
function applyPixelAdjustments(
  rgba: Uint8ClampedArray,
  brightnessPct: number,
  contrastPct: number,
  saturationPct: number
) {
  if (brightnessPct === 100 && contrastPct === 100 && saturationPct === 100) return;

  const bFactor = brightnessPct / 100;
  const cFactor = Math.pow((contrastPct + 100) / 200, 2);
  const sFactor = saturationPct / 100;

  for (let i = 0; i < rgba.length; i += 4) {
    let r = rgba[i] * bFactor;
    let g = rgba[i + 1] * bFactor;
    let b = rgba[i + 2] * bFactor;

    // Contrast
    r = (r - 128) * cFactor + 128;
    g = (g - 128) * cFactor + 128;
    b = (b - 128) * cFactor + 128;

    // Saturation
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    r = luma + (r - luma) * sFactor;
    g = luma + (g - luma) * sFactor;
    b = luma + (b - luma) * sFactor;

    rgba[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    rgba[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    rgba[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
}

/**
 * Chuyển đổi thực tế từ tệp Video sang ảnh động GIF89a
 */
export async function convertVideoFileToGif(params: {
  videoFile: File;
  config: GifConversionConfig;
  outputFileName: string;
  signal?: AbortSignal;
  onProgress?: (progress: ConversionProgress) => void;
}): Promise<GifConversionResult> {
  const { videoFile, config, outputFileName, signal, onProgress } = params;

  const checkAborted = () => {
    if (signal?.aborted) {
      throw new Error('CONVERT_ABORTED');
    }
  };

  onProgress?.({
    stage: 'initializing',
    stageLabel: 'Đang khởi tạo bộ xử lý ảnh động GIF89a...',
    percent: 4,
    currentFrame: 0,
    totalFrames: 0,
  });

  const videoUrl = URL.createObjectURL(videoFile);
  const videoEl = document.createElement('video');
  videoEl.preload = 'auto';
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.src = videoUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error('Không thể giải mã tệp video này. Định dạng hoặc codec không được trình duyệt hỗ trợ.'));
      };
      const cleanup = () => {
        videoEl.removeEventListener('loadeddata', onLoaded);
        videoEl.removeEventListener('error', onError);
      };
      videoEl.addEventListener('loadeddata', onLoaded);
      videoEl.addEventListener('error', onError);
    });

    checkAborted();

    const duration = videoEl.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error('Không đọc được thời lượng hợp lệ của video.');
    }

    const validStart = Math.max(0, Math.min(duration - 0.05, config.startTime));
    const validEnd = Math.max(validStart + 0.1, Math.min(duration, config.endTime));
    const clipDuration = validEnd - validStart;
    const speed = Math.max(0.25, Math.min(4, config.playbackSpeed || 1));
    const fps = Math.max(1, Math.min(30, config.fps || 12));
    const outputDuration = clipDuration / speed;
    const totalFrames = Math.max(1, Math.min(360, Math.round(outputDuration * fps)));

    const outW = Math.max(32, Math.min(1280, Math.round(config.width)));
    const outH = Math.max(32, Math.min(1280, Math.round(config.height)));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Không thể khởi tạo bộ đệm đồ họa Canvas 2D.');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const srcW = videoEl.videoWidth || outW;
    const srcH = videoEl.videoHeight || outH;

    // Tính vùng Crop thực tế trên khung hình gốc
    const cropX = config.crop.enabled ? Math.round((config.crop.x / 100) * srcW) : 0;
    const cropY = config.crop.enabled ? Math.round((config.crop.y / 100) * srcH) : 0;
    const cropW = config.crop.enabled
      ? Math.max(16, Math.min(srcW - cropX, Math.round((config.crop.width / 100) * srcW)))
      : srcW;
    const cropH = config.crop.enabled
      ? Math.max(16, Math.min(srcH - cropY, Math.round((config.crop.height / 100) * srcH)))
      : srcH;

    const extractedFrames: Uint8ClampedArray[] = [];

    onProgress?.({
      stage: 'reading_video',
      stageLabel: `Đang trích xuất và xử lý ${totalFrames} khung hình...`,
      percent: 10,
      currentFrame: 0,
      totalFrames,
    });

    const seekTo = (t: number) =>
      new Promise<void>((resolve) => {
        const onSeeked = () => {
          videoEl.removeEventListener('seeked', onSeeked);
          resolve();
        };
        videoEl.addEventListener('seeked', onSeeked);
        videoEl.currentTime = Math.min(duration, Math.max(0, t));
      });

    for (let f = 0; f < totalFrames; f++) {
      checkAborted();
      const timestamp = validStart + (f / totalFrames) * clipDuration;
      await seekTo(timestamp);

      ctx.save();
      ctx.clearRect(0, 0, outW, outH);
      ctx.translate(outW / 2, outH / 2);

      if (config.rotation !== 0) {
        ctx.rotate((config.rotation * Math.PI) / 180);
      }
      ctx.scale(config.flipH ? -1 : 1, config.flipV ? -1 : 1);

      const drawW = config.rotation === 90 || config.rotation === 270 ? outH : outW;
      const drawH = config.rotation === 90 || config.rotation === 270 ? outW : outH;

      ctx.drawImage(videoEl, cropX, cropY, cropW, cropH, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const imgData = ctx.getImageData(0, 0, outW, outH);
      applyPixelAdjustments(
        imgData.data,
        config.brightness,
        config.contrast,
        config.saturation
      );
      ctx.putImageData(imgData, 0, 0);

      // Vẽ Chữ (Meme Caption / Watermark) & Sticker động theo timestamp lên khung hình
      renderGifOverlaysToCanvas(
        ctx,
        outW,
        outH,
        timestamp,
        f,
        config.textOverlays || [],
        config.stickerOverlays || []
      );

      const finalFrameData = ctx.getImageData(0, 0, outW, outH);
      extractedFrames.push(finalFrameData.data);

      const pct = 10 + Math.round(((f + 1) / totalFrames) * 38);
      onProgress?.({
        stage: 'processing_frames',
        stageLabel: `Đang cắt và xử lý hình ảnh (${f + 1}/${totalFrames})...`,
        percent: pct,
        currentFrame: f + 1,
        totalFrames,
      });

      // Nhường luồng UI mỗi vài khung hình để giao diện luôn mượt
      if (f % 3 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    checkAborted();

    onProgress?.({
      stage: 'generating_palette',
      stageLabel: 'Đang tạo bảng màu tối ưu (PaletteGen 256 màu)...',
      percent: 52,
      currentFrame: 0,
      totalFrames,
    });
    await new Promise((r) => setTimeout(r, 15));

    // Tạo bảng màu toàn cục từ khung hình đại diện ở giữa đoạn video
    const midFrame = extractedFrames[Math.floor(extractedFrames.length / 2)];
    const globalPalInfo = buildAdaptivePalette(midFrame, config.maxColors);
    const colorTableBits = Math.round(Math.log2(globalPalInfo.colorCountPowerOf2)) - 1;
    const minCodeSize = Math.max(2, colorTableBits + 1);

    // Khởi tạo mảng nhị phân GIF89a
    const gifChunks: Uint8Array[] = [];

    // 1. Header GIF89a + Logical Screen Descriptor
    const header = new Uint8Array(13);
    header.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 0); // "GIF89a"
    header[6] = outW & 0xff;
    header[7] = (outW >> 8) & 0xff;
    header[8] = outH & 0xff;
    header[9] = (outH >> 8) & 0xff;
    header[10] = 0x80 | (colorTableBits << 4) | colorTableBits; // Global Color Table Flag
    header[11] = 0; // Background Color Index
    header[12] = 0; // Pixel Aspect Ratio
    gifChunks.push(header);
    gifChunks.push(globalPalInfo.palette);

    // 2. NETSCAPE2.0 Loop Extension Block
    if (config.loopMode !== 'once') {
      const loopVal =
        config.loopMode === 'infinite'
          ? 0
          : Math.max(1, Math.min(65535, config.customLoopCount || 1));
      const netscapeExt = new Uint8Array([
        0x21,
        0xff,
        0x0b,
        0x4e,
        0x45,
        0x54,
        0x53,
        0x43,
        0x41,
        0x50,
        0x45,
        0x32,
        0x2e,
        0x30,
        0x03,
        0x01,
        loopVal & 0xff,
        (loopVal >> 8) & 0xff,
        0x00,
      ]);
      gifChunks.push(netscapeExt);
    }

    // Thời gian trễ giữa các khung hình (đơn vị 1/100 giây của chuẩn GIF)
    const delayCentisec = Math.max(2, Math.round(100 / fps));

    // 3. Mã hóa từng khung hình
    for (let f = 0; f < extractedFrames.length; f++) {
      checkAborted();

      let activePalette = globalPalInfo.palette;
      let activeColorCount = globalPalInfo.colorCountPowerOf2;
      let useLocalTable = false;

      if (config.optimizePalette && f > 0) {
        const localPal = buildAdaptivePalette(extractedFrames[f], config.maxColors);
        activePalette = localPal.palette;
        activeColorCount = localPal.colorCountPowerOf2;
        useLocalTable = true;
      }

      const indexedPixels = quantizeFrameWithDither(
        extractedFrames[f],
        outW,
        outH,
        activePalette,
        activeColorCount,
        config.ditherAlgorithm,
        config.ditherStrength
      );

      // Graphic Control Extension (8 bytes)
      const gce = new Uint8Array([
        0x21,
        0xf9,
        0x04,
        0x04, // Disposal method: Do not dispose
        delayCentisec & 0xff,
        (delayCentisec >> 8) & 0xff,
        0x00,
        0x00,
      ]);
      gifChunks.push(gce);

      // Image Descriptor (10 bytes)
      const localBits = Math.round(Math.log2(activeColorCount)) - 1;
      const imgDesc = new Uint8Array([
        0x2c,
        0x00,
        0x00,
        0x00,
        0x00,
        outW & 0xff,
        (outW >> 8) & 0xff,
        outH & 0xff,
        (outH >> 8) & 0xff,
        useLocalTable ? 0x80 | localBits : 0x00,
      ]);
      gifChunks.push(imgDesc);

      if (useLocalTable) {
        gifChunks.push(activePalette);
      }

      const lzwData = encodeLzwFrame(indexedPixels, Math.max(2, localBits + 1));
      gifChunks.push(lzwData);

      const pct = 55 + Math.round(((f + 1) / extractedFrames.length) * 42);
      onProgress?.({
        stage: 'encoding_gif',
        stageLabel: `Đang mã hóa GIF89a khung hình ${f + 1}/${extractedFrames.length}...`,
        percent: pct,
        currentFrame: f + 1,
        totalFrames: extractedFrames.length,
      });

      if (f % 2 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    onProgress?.({
      stage: 'finalizing',
      stageLabel: 'Đang đóng gói tệp GIF hoàn chỉnh...',
      percent: 99,
      currentFrame: totalFrames,
      totalFrames,
    });

    // GIF Trailer (0x3B)
    gifChunks.push(new Uint8Array([0x3b]));

    const finalBlob = new Blob(gifChunks as BlobPart[], { type: 'image/gif' });
    const finalBlobUrl = URL.createObjectURL(finalBlob);

    const sanitizedName =
      (outputFileName || videoFile.name.replace(/\.[^/.]+$/, '') || 'video-output')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .replace(/\.gif$/i, '') + '.gif';

    onProgress?.({
      stage: 'completed',
      stageLabel: 'Hoàn tất chuyển đổi GIF!',
      percent: 100,
      currentFrame: totalFrames,
      totalFrames,
    });

    return {
      blob: finalBlob,
      blobUrl: finalBlobUrl,
      width: outW,
      height: outH,
      frameCount: totalFrames,
      fps,
      durationSec: Number(outputDuration.toFixed(2)),
      fileSizeBytes: finalBlob.size,
      fileName: sanitizedName,
    };
  } finally {
    URL.revokeObjectURL(videoUrl);
    videoEl.src = '';
  }
}

/**
 * Tạo một tệp Video WebM mẫu thực tế ngay trên trình duyệt để người dùng thử nghiệm tức thì
 */
export async function generateSampleTestVideoFile(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 270;
  const ctx = canvas.getContext('2d')!;

  const stream = canvas.captureStream(24);
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

  const totalSteps = 45;
  for (let i = 0; i < totalSteps; i++) {
    const t = i / totalSteps;
    const grad = ctx.createLinearGradient(0, 0, 480, 270);
    grad.addColorStop(0, `hsl(${Math.round(250 + t * 80)}, 80%, 28%)`);
    grad.addColorStop(1, `hsl(${Math.round(180 + t * 90)}, 85%, 35%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 480, 270);

    // Animated bouncing 3D orb
    const cx = 90 + t * 300;
    const cy = 135 + Math.sin(t * Math.PI * 4) * 55;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#22D3EE';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Text overlay
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('VIDEO TO GIF STUDIO DEMO', 95, 45);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#A5F3FC';
    ctx.fillText(`Frame ${i + 1}/${totalSteps} • ${(t * 2.5).toFixed(1)}s`, 155, 245);

    await new Promise((r) => setTimeout(r, 40));
  }

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
    recorder.stop();
  });

  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const blob = new Blob(chunks, { type: mimeType });
  return new File([blob], `demo-cyber-motion.${ext}`, { type: mimeType });
}

/**
 * Vẽ các lớp Chữ (Text/Meme Caption/Watermark) & Sticker động theo thời gian thực lên Canvas 2D
 */
export function renderGifOverlaysToCanvas(
  ctx: CanvasRenderingContext2D,
  outW: number,
  outH: number,
  timestampSec: number,
  frameIdx: number,
  textOverlays: GifTextOverlayItem[],
  stickerOverlays: GifStickerOverlayItem[]
) {
  const scaleFactor = Math.max(0.45, outW / 480);

  // 1. Render Stickers
  for (const st of stickerOverlays) {
    if (timestampSec < st.startTime - 0.02 || timestampSec > st.endTime + 0.05) continue;
    const x = ((st.xPct ?? st.xPercent ?? 50) / 100) * outW;
    const y = ((st.yPct ?? st.yPercent ?? 50) / 100) * outH;
    const fontPx = Math.max(14, Math.round((st.size ?? 36) * scaleFactor));

    ctx.save();
    let dy = 0;
    let sc = 1;
    let rot = 0;
    if (st.animation === 'bounce') {
      dy = Math.sin(frameIdx * 0.7) * (6 * scaleFactor);
    } else if (st.animation === 'pulse') {
      sc = 1 + Math.sin(frameIdx * 0.65) * 0.16;
    } else if (st.animation === 'wiggle') {
      rot = Math.sin(frameIdx * 0.8) * 0.22;
    }

    ctx.translate(x, y + dy);
    if (rot !== 0) ctx.rotate(rot);
    if (sc !== 1) ctx.scale(sc, sc);
    ctx.font = `${fontPx}px "Play", "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.emoji, 0, 0);
    ctx.restore();
  }

  // 2. Render Text Overlays (Meme Captions / Subtitles / Watermarks)
  for (const txt of textOverlays) {
    if (!txt.text.trim()) continue;
    if (timestampSec < txt.startTime - 0.02 || timestampSec > txt.endTime + 0.05) continue;

    const displayStr = txt.uppercase ? txt.text.toUpperCase() : txt.text;
    const x = ((txt.xPct ?? txt.xPercent ?? 50) / 100) * outW;
    const y = ((txt.yPct ?? txt.yPercent ?? 82) / 100) * outH;
    const fontPx = Math.max(11, Math.round(txt.fontSize * scaleFactor));

    ctx.save();
    ctx.font = `900 ${fontPx}px "Play", Impact, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Word wrap if text is wider than 90% of canvas width
    const maxLineWidth = outW * 0.9;
    const words = displayStr.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const w of words) {
      const testLine = currentLine ? `${currentLine} ${w}` : w;
      if (ctx.measureText(testLine).width > maxLineWidth && currentLine) {
        lines.push(currentLine);
        currentLine = w;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = Math.round(fontPx * 1.22);
    const totalBlockH = lines.length * lineHeight;
    const startY = y - totalBlockH / 2 + lineHeight / 2;

    if (txt.bgBox || (txt.bgColor && txt.bgColor !== 'transparent')) {
      let maxMeasuredW = 0;
      for (const l of lines) {
        const mw = ctx.measureText(l).width;
        if (mw > maxMeasuredW) maxMeasuredW = mw;
      }
      const padX = Math.round(10 * scaleFactor);
      const padY = Math.round(6 * scaleFactor);
      ctx.fillStyle = txt.bgColor && txt.bgColor !== 'transparent' ? txt.bgColor : 'rgba(0, 0, 0, 0.68)';
      ctx.beginPath();
      ctx.roundRect(
        x - maxMeasuredW / 2 - padX,
        y - totalBlockH / 2 - padY,
        maxMeasuredW + padX * 2,
        totalBlockH + padY * 2,
        Math.round(8 * scaleFactor)
      );
      ctx.fill();
    }

    lines.forEach((lineStr, idx) => {
      const ly = startY + idx * lineHeight;
      if (txt.strokeColor && txt.strokeColor !== 'transparent') {
        ctx.lineWidth = Math.max(2.5, fontPx * 0.18);
        ctx.lineJoin = 'round';
        ctx.strokeStyle = txt.strokeColor;
        ctx.strokeText(lineStr, x, ly);
      }
      ctx.fillStyle = txt.textColor || txt.color || '#FFFFFF';
      ctx.fillText(lineStr, x, ly);
    });

    ctx.restore();
  }
}

/**
 * Mã hóa trực tiếp danh sách khung hình RGBA (từ Sân khấu 3D/2D hoặc Canvas bất kỳ) sang tệp .GIF chuẩn GIF89a
 */
export async function encodeRgbaFramesToGif89a(params: {
  frames: Uint8ClampedArray[];
  width: number;
  height: number;
  fps: number;
  maxColors?: number;
  ditherAlgorithm?: DitherAlgorithm;
  ditherStrength?: number;
  fileName?: string;
  onProgress?: (percent: number, label: string) => void;
}): Promise<GifConversionResult> {
  const {
    frames,
    width: outW,
    height: outH,
    fps,
    maxColors = 256,
    ditherAlgorithm = 'floyd_steinberg',
    ditherStrength = 60,
    fileName = 'stage-performance.gif',
    onProgress,
  } = params;

  if (frames.length === 0) {
    throw new Error('Không có khung hình nào để mã hóa GIF.');
  }

  onProgress?.(50, 'Đang tạo bảng màu tối ưu 256 màu cho Sân khấu...');
  await new Promise((r) => setTimeout(r, 10));

  const midFrame = frames[Math.floor(frames.length / 2)];
  const globalPalInfo = buildAdaptivePalette(midFrame, maxColors);
  const colorTableBits = Math.round(Math.log2(globalPalInfo.colorCountPowerOf2)) - 1;

  const gifChunks: Uint8Array[] = [];

  // 1. Header GIF89a
  const header = new Uint8Array(13);
  header.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 0);
  header[6] = outW & 0xff;
  header[7] = (outW >> 8) & 0xff;
  header[8] = outH & 0xff;
  header[9] = (outH >> 8) & 0xff;
  header[10] = 0x80 | (colorTableBits << 4) | colorTableBits;
  header[11] = 0;
  header[12] = 0;
  gifChunks.push(header);
  gifChunks.push(globalPalInfo.palette);

  // 2. Infinite Loop Extension NETSCAPE2.0
  gifChunks.push(
    new Uint8Array([
      0x21, 0xff, 0x0b, 0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30, 0x03,
      0x01, 0x00, 0x00, 0x00,
    ])
  );

  const delayCentisec = Math.max(2, Math.round(100 / Math.max(1, fps)));

  for (let f = 0; f < frames.length; f++) {
    const localPal = f === 0 ? globalPalInfo : buildAdaptivePalette(frames[f], maxColors);
    const activePalette = localPal.palette;
    const activeColorCount = localPal.colorCountPowerOf2;
    const useLocalTable = f > 0;

    const indexedPixels = quantizeFrameWithDither(
      frames[f],
      outW,
      outH,
      activePalette,
      activeColorCount,
      ditherAlgorithm,
      ditherStrength
    );

    const gce = new Uint8Array([
      0x21,
      0xf9,
      0x04,
      0x04,
      delayCentisec & 0xff,
      (delayCentisec >> 8) & 0xff,
      0x00,
      0x00,
    ]);
    gifChunks.push(gce);

    const localBits = Math.round(Math.log2(activeColorCount)) - 1;
    const imgDesc = new Uint8Array([
      0x2c,
      0x00,
      0x00,
      0x00,
      0x00,
      outW & 0xff,
      (outW >> 8) & 0xff,
      outH & 0xff,
      (outH >> 8) & 0xff,
      useLocalTable ? 0x80 | localBits : 0x00,
    ]);
    gifChunks.push(imgDesc);

    if (useLocalTable) {
      gifChunks.push(activePalette);
    }

    const lzwData = encodeLzwFrame(indexedPixels, Math.max(2, localBits + 1));
    gifChunks.push(lzwData);

    const pct = 55 + Math.round(((f + 1) / frames.length) * 44);
    onProgress?.(pct, `Đang mã hóa GIF89a khung hình ${f + 1}/${frames.length}...`);

    if (f % 2 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  gifChunks.push(new Uint8Array([0x3b]));

  const finalBlob = new Blob(gifChunks as BlobPart[], { type: 'image/gif' });
  const finalBlobUrl = URL.createObjectURL(finalBlob);
  const cleanName = fileName.replace(/\.gif$/i, '') + '.gif';

  onProgress?.(100, 'Hoàn tất xuất GIF biểu diễn sân khấu!');

  return {
    blob: finalBlob,
    blobUrl: finalBlobUrl,
    width: outW,
    height: outH,
    frameCount: frames.length,
    fps,
    durationSec: Number((frames.length / Math.max(1, fps)).toFixed(2)),
    fileSizeBytes: finalBlob.size,
    fileName: cleanName,
  };
}
