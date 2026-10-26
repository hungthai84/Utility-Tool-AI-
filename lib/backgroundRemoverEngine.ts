// Engine xử lý xóa nền AI & Alpha Matting đa định dạng chạy trực tiếp trên trình duyệt
// Hỗ trợ: Phân tích chủ thể nổi bật (Salient Subject Segmentation), Trimap Geodesic Matting,
// Tinh chỉnh tóc/viền (Hair & Edge Refinement), Khử ám màu viền (Defringe & Color Decontamination),
// Bút xóa/khôi phục không phá hủy (Non-destructive Brush Erase/Restore), Ghép nền & Đóng gói ZIP chuẩn PKZIP.

export type AIQualityMode = 'fast' | 'balanced' | 'high_quality';

export type OutputImageFormat = 'png' | 'webp' | 'jpeg' | 'bmp' | 'avif';

export type BackgroundMode = 'transparent' | 'solid' | 'gradient' | 'image';

export type CropAspectPreset = 'original' | '1:1' | '4:3' | '3:2' | '16:9' | '9:16' | 'custom';

export type BatchItemStatus =
  | 'waiting'
  | 'loading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface EdgeRefinementConfig {
  enabled: boolean;
  feather: number; // 0..15 px
  smooth: number; // 0..10 px
  expandContract: number; // -15..+15 px
  edgeCleanup: boolean;
  defringe: number; // 0..100 %
  decontaminateColors: boolean;
  hairRefinement: number; // 0..100 %
}

export interface SubjectShadowConfig {
  enabled: boolean;
  color: string;
  blur: number; // 0..50 px
  offsetX: number; // -40..40 px
  offsetY: number; // -40..40 px
  opacity: number; // 0..100 %
}

export interface BackgroundReplacementConfig {
  mode: BackgroundMode;
  solidColor: string;
  gradientType: 'linear' | 'radial';
  gradientStart: string;
  gradientEnd: string;
  gradientMid?: string;
  gradientAngle: number; // 0..360 deg
  bgImageUrl: string | null;
  bgFit: 'cover' | 'contain';
  bgScale: number; // 50..200 %
  bgOffsetX: number; // -50..50 %
  bgOffsetY: number; // -50..50 %
  bgBlur: number; // 0..30 px
  bgOpacity: number; // 0..100 %
  bgBrightness: number; // 50..150 %
  bgContrast: number; // 50..150 %
  shadow: SubjectShadowConfig;
  subjectScale: number; // 50..150 %
  subjectOffsetX: number; // -50..50 %
  subjectOffsetY: number; // -50..50 %
  autoCenterSubject: boolean;
}

export interface PostProcessAdjustmentConfig {
  cropPreset: CropAspectPreset;
  customCropWidthPercent: number; // 20..100
  customCropHeightPercent: number; // 20..100
  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  brightness: number; // 50..150 %
  contrast: number; // 50..150 %
  saturation: number; // 0..200 %
  sharpness: number; // 0..100 %
  resizeMode: 'original' | 'custom' | 'preset';
  targetWidth: number;
  targetHeight: number;
  lockAspectRatio: boolean;
}

export interface OutputExportConfig {
  format: OutputImageFormat;
  quality: number; // 10..100 %
  namingRule: 'keep_original' | 'suffix_nobg' | 'custom_suffix' | 'pattern_seq';
  customSuffix: string;
  patternPrefix: string;
}

export interface BackgroundRemoverStudioConfig {
  qualityMode: AIQualityMode;
  edge: EdgeRefinementConfig;
  background: BackgroundReplacementConfig;
  postProcess: PostProcessAdjustmentConfig;
  exportConfig: OutputExportConfig;
  concurrency: number; // 1..4
  duplicatePolicy: 'skip' | 'allow_rename';
}

export interface SubjectBoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  coveragePercent: number;
}

export interface DecodedImageInfo {
  width: number;
  height: number;
  detectedFormat: string;
  mimeType: string;
  isAnimatedGif: boolean;
  frameCount: number;
  imageData: ImageData;
  thumbnailUrl: string;
  warnings: string[];
}

export interface SegmentationResultData {
  width: number;
  height: number;
  originalImageData: ImageData;
  aiBaseAlphaMask: Uint8Array; // Mask gốc từ AI (0..255)
  workingAlphaMask: Uint8Array; // Mask sau khi vẽ bút xóa/khôi phục
   refinedAlphaMask: Uint8Array; // Mask sau khi áp dụng Edge/Hair refinement
  subjectBounds: SubjectBoundingBox;
  processingTimeMs: number;
  detectedCategory: string;
}

export interface BackgroundRemoverPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  apply: (current: BackgroundRemoverStudioConfig) => BackgroundRemoverStudioConfig;
}

export const DEFAULT_STUDIO_CONFIG: BackgroundRemoverStudioConfig = {
  qualityMode: 'balanced',
  edge: {
    enabled: true,
    feather: 1.5,
    smooth: 1,
    expandContract: 0,
    edgeCleanup: true,
    defringe: 45,
    decontaminateColors: true,
    hairRefinement: 65,
  },
  background: {
    mode: 'transparent',
    solidColor: '#FFFFFF',
    gradientType: 'linear',
    gradientStart: '#6366F1',
    gradientEnd: '#EC4899',
    gradientAngle: 135,
    bgImageUrl: null,
    bgFit: 'cover',
    bgScale: 100,
    bgOffsetX: 0,
    bgOffsetY: 0,
    bgBlur: 0,
    bgOpacity: 100,
    bgBrightness: 100,
    bgContrast: 100,
    shadow: {
      enabled: false,
      color: '#000000',
      blur: 18,
      offsetX: 0,
      offsetY: 10,
      opacity: 35,
    },
    subjectScale: 100,
    subjectOffsetX: 0,
    subjectOffsetY: 0,
    autoCenterSubject: false,
  },
  postProcess: {
    cropPreset: 'original',
    customCropWidthPercent: 100,
    customCropHeightPercent: 100,
    rotation: 0,
    flipH: false,
    flipV: false,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sharpness: 0,
    resizeMode: 'original',
    targetWidth: 1080,
    targetHeight: 1080,
    lockAspectRatio: true,
  },
  exportConfig: {
    format: 'png',
    quality: 92,
    namingRule: 'suffix_nobg',
    customSuffix: '_no-bg',
    patternPrefix: 'product',
  },
  concurrency: 2,
  duplicatePolicy: 'skip',
};

// 10 Preset chuẩn thương mại theo Mục 16
export const BG_REMOVER_PRESETS: BackgroundRemoverPreset[] = [
  {
    id: 'transparent_standard',
    name: '1. Nền Trong Suốt Tiêu Chuẩn',
    category: 'Thiết kế & Web',
    description: 'PNG trong suốt Alpha 100%, giữ nguyên kích thước gốc, khử viền màu tự động.',
    badge: 'PNG Alpha',
    apply: (cfg) => ({
      ...cfg,
      qualityMode: 'balanced',
      background: {
        ...cfg.background,
        mode: 'transparent',
        shadow: { ...cfg.background.shadow, enabled: false },
        autoCenterSubject: false,
      },
      postProcess: { ...cfg.postProcess, cropPreset: 'original', resizeMode: 'original' },
      exportConfig: { ...cfg.exportConfig, format: 'png' },
    }),
  },
  {
    id: 'white_standard',
    name: '2. Nền Trắng Tiêu Chuẩn (#FFFFFF)',
    category: 'Thương mại',
    description: 'Nền trắng tinh khiết chuẩn studio, bóng đổ nhẹ tự nhiên, phù hợp in ấn & hồ sơ.',
    badge: 'Pure White',
    apply: (cfg) => ({
      ...cfg,
      background: {
        ...cfg.background,
        mode: 'solid',
        solidColor: '#FFFFFF',
        shadow: { ...cfg.background.shadow, enabled: true, opacity: 22, blur: 16, offsetY: 8 },
      },
      exportConfig: { ...cfg.exportConfig, format: 'jpeg', quality: 95 },
    }),
  },
  {
    id: 'ecommerce_product',
    name: '3. Sản Phẩm TMĐT (Shopee / Amazon)',
    category: 'E-Commerce',
    description: 'Cắt vuông 1:1 (1000×1000px), căn giữa chủ thể, nền trắng #FFFFFF + bóng đổ sản phẩm.',
    badge: '1:1 • 1000px',
    apply: (cfg) => ({
      ...cfg,
      qualityMode: 'high_quality',
      edge: { ...cfg.edge, enabled: true, edgeCleanup: true, defringe: 60, hairRefinement: 40 },
      background: {
        ...cfg.background,
        mode: 'solid',
        solidColor: '#FFFFFF',
        autoCenterSubject: true,
        subjectScale: 90,
        shadow: { ...cfg.background.shadow, enabled: true, opacity: 28, blur: 20, offsetY: 12 },
      },
      postProcess: {
        ...cfg.postProcess,
        cropPreset: '1:1',
        resizeMode: 'preset',
        targetWidth: 1000,
        targetHeight: 1000,
      },
      exportConfig: { ...cfg.exportConfig, format: 'jpeg', quality: 95 },
    }),
  },
  {
    id: 'fashion_lookbook',
    name: '4. Ảnh Thời Trang & Lookbook',
    category: 'Fashion',
    description: 'Tỷ lệ 3:2, ưu tiên giữ chi tiết sợi tóc & vải mảnh ở chế độ High Quality.',
    badge: '3:2 • Hair HQ',
    apply: (cfg) => ({
      ...cfg,
      qualityMode: 'high_quality',
      edge: {
        ...cfg.edge,
        enabled: true,
        hairRefinement: 85,
        feather: 1.5,
        decontaminateColors: true,
      },
      background: {
        ...cfg.background,
        mode: 'solid',
        solidColor: '#F8FAFC',
        shadow: { ...cfg.background.shadow, enabled: true, opacity: 20, blur: 24, offsetY: 10 },
      },
      postProcess: { ...cfg.postProcess, cropPreset: '3:2', resizeMode: 'original' },
      exportConfig: { ...cfg.exportConfig, format: 'png' },
    }),
  },
  {
    id: 'portrait_avatar',
    name: '5. Chân Dung & Ảnh Đại Diện',
    category: 'Avatar',
    description: 'Khung 1:1 (800×800px), giữ chi tiết tóc tối đa, nền trong suốt hoặc màu pastel.',
    badge: '1:1 • 800px',
    apply: (cfg) => ({
      ...cfg,
      qualityMode: 'high_quality',
      edge: { ...cfg.edge, enabled: true, hairRefinement: 90, feather: 2, defringe: 55 },
      background: {
        ...cfg.background,
        mode: 'transparent',
        autoCenterSubject: true,
      },
      postProcess: {
        ...cfg.postProcess,
        cropPreset: '1:1',
        resizeMode: 'preset',
        targetWidth: 800,
        targetHeight: 800,
      },
      exportConfig: { ...cfg.exportConfig, format: 'png' },
    }),
  },
  {
    id: 'professional_profile',
    name: '6. Hồ Sơ Chuyên Nghiệp (CV / LinkedIn)',
    category: 'Profile',
    description: 'Nền Gradient xanh chàm công sở lịch lãm, đổ bóng mềm, tỷ lệ 1:1 chuẩn LinkedIn.',
    badge: 'CV Studio',
    apply: (cfg) => ({
      ...cfg,
      qualityMode: 'high_quality',
      edge: { ...cfg.edge, enabled: true, hairRefinement: 85, feather: 2 },
      background: {
        ...cfg.background,
        mode: 'gradient',
        gradientType: 'linear',
        gradientStart: '#1E293B',
        gradientEnd: '#334155',
        gradientAngle: 145,
        autoCenterSubject: true,
        shadow: { ...cfg.background.shadow, enabled: true, opacity: 35, blur: 22, offsetY: 8 },
      },
      postProcess: {
        ...cfg.postProcess,
        cropPreset: '1:1',
        resizeMode: 'preset',
        targetWidth: 800,
        targetHeight: 800,
      },
      exportConfig: { ...cfg.exportConfig, format: 'png' },
    }),
  },
  {
    id: 'logo_illustration',
    name: '7. Logo & Hình Minh Họa',
    category: 'Branding',
    description: 'Viền sắc nét (Feather thấp), khử nhiễu biên mạnh, xuất PNG trong suốt.',
    badge: 'Sharp Edge',
    apply: (cfg) => ({
      ...cfg,
      qualityMode: 'high_quality',
      edge: {
        ...cfg.edge,
        enabled: true,
        feather: 0.5,
        smooth: 1,
        edgeCleanup: true,
        defringe: 75,
        hairRefinement: 20,
      },
      background: {
        ...cfg.background,
        mode: 'transparent',
        shadow: { ...cfg.background.shadow, enabled: false },
      },
      postProcess: { ...cfg.postProcess, cropPreset: 'original', resizeMode: 'original' },
      exportConfig: { ...cfg.exportConfig, format: 'png' },
    }),
  },
  {
    id: 'website_webp',
    name: '8. Ảnh Đăng Website (WebP Alpha)',
    category: 'Web Optimization',
    description: 'Xuất WebP có nền trong suốt, giảm 65% dung lượng giúp tăng tốc độ tải trang.',
    badge: 'WebP Alpha',
    apply: (cfg) => ({
      ...cfg,
      qualityMode: 'balanced',
      background: { ...cfg.background, mode: 'transparent' },
      postProcess: {
        ...cfg.postProcess,
        cropPreset: 'original',
        resizeMode: 'preset',
        targetWidth: 1200,
        targetHeight: 900,
      },
      exportConfig: { ...cfg.exportConfig, format: 'webp', quality: 88 },
    }),
  },
  {
    id: 'social_story',
    name: '9. Ảnh Mạng Xã Hội (9:16 Story/Reels)',
    category: 'Social Media',
    description: 'Khung dọc 9:16 (1080×1920px), nền Gradient rực rỡ và bóng đổ nổi bật.',
    badge: '9:16 • 1080p',
    apply: (cfg) => ({
      ...cfg,
      background: {
        ...cfg.background,
        mode: 'gradient',
        gradientStart: '#4F46E5',
        gradientEnd: '#EC4899',
        gradientAngle: 135,
        autoCenterSubject: true,
        shadow: { ...cfg.background.shadow, enabled: true, opacity: 40, blur: 25, offsetY: 14 },
      },
      postProcess: {
        ...cfg.postProcess,
        cropPreset: '9:16',
        resizeMode: 'preset',
        targetWidth: 1080,
        targetHeight: 1920,
      },
      exportConfig: { ...cfg.exportConfig, format: 'jpeg', quality: 92 },
    }),
  },
  {
    id: 'catalogue_print',
    name: '10. Ảnh Catalogue Độ Phân Giải Cao',
    category: 'Catalogue',
    description: 'Giữ 100% độ phân giải gốc, tỷ lệ 4:3, nền xám studio dịu mắt (#F1F5F9).',
    badge: '4:3 • Full Res',
    apply: (cfg) => ({
      ...cfg,
      qualityMode: 'high_quality',
      background: {
        ...cfg.background,
        mode: 'solid',
        solidColor: '#F1F5F9',
        autoCenterSubject: true,
        shadow: { ...cfg.background.shadow, enabled: true, opacity: 25, blur: 20, offsetY: 10 },
      },
      postProcess: { ...cfg.postProcess, cropPreset: '4:3', resizeMode: 'original' },
      exportConfig: { ...cfg.exportConfig, format: 'png' },
    }),
  },
];

export const STUDIO_BACKDROP_PRESETS = [
  {
    id: 'studio_loft',
    name: 'Phòng Studio Ánh Sáng Tự Nhiên',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80',
  },
  {
    id: 'minimal_podium',
    name: 'Bục Trưng Bày Sản Phẩm Tối Giản',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80',
  },
  {
    id: 'modern_office',
    name: 'Văn Phòng Hiện Đại (Hồ Sơ / CV)',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
  },
  {
    id: 'nature_bokeh',
    name: 'Thiên Nhiên Xóa Phông Bokeh',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80',
  },
  {
    id: 'cyber_neon',
    name: 'Ánh Sáng Neon Cyberpunk',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80',
  },
];

export const GRADIENT_PRESETS = [
  { name: 'Indigo Sunset', start: '#4F46E5', end: '#EC4899', angle: 135 },
  { name: 'Emerald Breeze', start: '#059669', end: '#06B6D4', angle: 120 },
  { name: 'Executive Slate', start: '#0F172A', end: '#334155', angle: 145 },
  { name: 'Soft Peach', start: '#FFEDD5', end: '#FECDD3', angle: 135 },
  { name: 'Royal Gold', start: '#F59E0B', end: '#EF4444', angle: 135 },
  { name: 'Arctic Mist', start: '#E0F2FE', end: '#E0E7FF', angle: 160 },
  { name: 'Midnight Violet', start: '#1E1B4B', end: '#581C87', angle: 135 },
  { name: 'Pure Studio Gray', start: '#F8FAFC', end: '#CBD5E1', angle: 180 },
];

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Kiểm tra chữ ký byte thực tế của tệp ảnh (Magic Bytes)
export async function inspectImageFileSignature(file: File): Promise<{
  isValidImage: boolean;
  detectedFormat: string;
  mimeType: string;
  isAnimatedGif: boolean;
  frameCount: number;
  errorReason?: string;
}> {
  if (!file || file.size === 0) {
    return {
      isValidImage: false,
      detectedFormat: 'UNKNOWN',
      mimeType: '',
      isAnimatedGif: false,
      frameCount: 0,
      errorReason: 'Tệp rỗng (0 byte).',
    };
  }

  const sliceSize = Math.min(file.size, 65536);
  const buffer = await file.slice(0, sliceSize).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // 1. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return {
      isValidImage: true,
      detectedFormat: 'PNG',
      mimeType: 'image/png',
      isAnimatedGif: false,
      frameCount: 1,
    };
  }

  // 2. JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return {
      isValidImage: true,
      detectedFormat: 'JPEG',
      mimeType: 'image/jpeg',
      isAnimatedGif: false,
      frameCount: 1,
    };
  }

  // 3. WebP: RIFF .... WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return {
      isValidImage: true,
      detectedFormat: 'WEBP',
      mimeType: 'image/webp',
      isAnimatedGif: false,
      frameCount: 1,
    };
  }

  // 4. GIF: GIF87a hoặc GIF89a
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    // Đếm số Image Descriptor (0x2C) hoặc Graphic Control Extension (0x21 0xF9) để phát hiện GIF động
    let gceCount = 0;
    for (let i = 6; i < bytes.length - 2; i++) {
      if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9) {
        gceCount++;
      }
    }
    const frameCount = Math.max(1, gceCount);
    return {
      isValidImage: true,
      detectedFormat: 'GIF',
      mimeType: 'image/gif',
      isAnimatedGif: frameCount > 1,
      frameCount,
    };
  }

  // 5. BMP: 42 4D ('BM')
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return {
      isValidImage: true,
      detectedFormat: 'BMP',
      mimeType: 'image/bmp',
      isAnimatedGif: false,
      frameCount: 1,
    };
  }

  // 6. TIFF: 49 49 2A 00 (Little Endian) hoặc 4D 4D 00 2A (Big Endian)
  if (
    bytes.length >= 4 &&
    ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
      (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a))
  ) {
    return {
      isValidImage: true,
      detectedFormat: 'TIFF',
      mimeType: 'image/tiff',
      isAnimatedGif: false,
      frameCount: 1,
    };
  }

  // 7. ISO Base Media File Format (AVIF / HEIC / HEIF): byte 4..7 == 'ftyp'
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    if (brand.startsWith('avif') || brand.startsWith('avis')) {
      return {
        isValidImage: true,
        detectedFormat: 'AVIF',
        mimeType: 'image/avif',
        isAnimatedGif: false,
        frameCount: 1,
      };
    }
    if (
      brand.startsWith('heic') ||
      brand.startsWith('heix') ||
      brand.startsWith('hevc') ||
      brand.startsWith('mif1') ||
      brand.startsWith('msf1')
    ) {
      return {
        isValidImage: true,
        detectedFormat: 'HEIC/HEIF',
        mimeType: 'image/heic',
        isAnimatedGif: false,
        frameCount: 1,
      };
    }
  }

  // 8. SVG: Kiểm tra chuỗi văn bản XML/SVG đầu tệp
  const headText = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.slice(0, 1024))
    .trim()
    .toLowerCase();
  if (headText.includes('<svg') || (headText.startsWith('<?xml') && headText.includes('svg'))) {
    return {
      isValidImage: true,
      detectedFormat: 'SVG',
      mimeType: 'image/svg+xml',
      isAnimatedGif: false,
      frameCount: 1,
    };
  }

  return {
    isValidImage: false,
    detectedFormat: 'INVALID',
    mimeType: '',
    isAnimatedGif: false,
    frameCount: 0,
    errorReason:
      'Tệp không phải là định dạng hình ảnh hợp lệ (chữ ký byte không khớp PNG, JPG, WebP, GIF, BMP, SVG, AVIF, HEIC, TIFF).',
  };
}

// Giải mã tệp ảnh sang ImageData + bảo toàn hướng xoay EXIF
export async function decodeImageFile(file: File): Promise<DecodedImageInfo> {
  const sig = await inspectImageFileSignature(file);
  if (!sig.isValidImage) {
    throw new Error(sig.errorReason || 'Định dạng tệp không hợp lệ.');
  }

  const warnings: string[] = [];
  if (sig.isAnimatedGif) {
    warnings.push(
      `Phát hiện ảnh GIF động (${sig.frameCount} khung hình). Bộ máy AI sẽ tách nền khung hình chính để đảm bảo độ chính xác biên.`
    );
  }

  const MAX_DIMENSION = 4096;

  // Xử lý riêng cho SVG để raster hóa sắc nét
  if (sig.detectedFormat === 'SVG') {
    const svgText = await file.text();
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    try {
      const img = await loadImageElement(url);
      let w = img.naturalWidth || img.width || 1024;
      let h = img.naturalHeight || img.height || 1024;
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        warnings.push(`Ảnh có độ phân giải rất lớn, đã chuẩn hóa về ${w}×${h}px để tối ưu bộ nhớ.`);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Không thể khởi tạo Canvas 2D.');
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const thumbnailUrl = createThumbnailDataUrl(canvas, 240);
      return {
        width: w,
        height: h,
        detectedFormat: sig.detectedFormat,
        mimeType: sig.mimeType,
        isAnimatedGif: false,
        frameCount: 1,
        imageData,
        thumbnailUrl,
        warnings,
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // Sử dụng createImageBitmap với imageOrientation: 'from-image' để bảo toàn hướng xoay EXIF
  try {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      bitmap = await createImageBitmap(file);
    }

    let w = bitmap.width;
    let h = bitmap.height;
    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      warnings.push(
        `Ảnh gốc (${bitmap.width}×${bitmap.height}px) vượt ngưỡng an toàn bộ nhớ, đã chuẩn hóa về ${w}×${h}px.`
      );
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      throw new Error('Không thể khởi tạo Canvas 2D.');
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const imageData = ctx.getImageData(0, 0, w, h);
    const thumbnailUrl = createThumbnailDataUrl(canvas, 240);

    return {
      width: w,
      height: h,
      detectedFormat: sig.detectedFormat,
      mimeType: sig.mimeType,
      isAnimatedGif: sig.isAnimatedGif,
      frameCount: sig.frameCount,
      imageData,
      thumbnailUrl,
      warnings,
    };
  } catch {
    // Fallback qua HTMLImageElement
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImageElement(url);
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (!w || !h) {
        throw new Error('Ảnh bị hỏng hoặc không có kích thước hợp lệ.');
      }
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Không thể khởi tạo Canvas 2D.');
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const thumbnailUrl = createThumbnailDataUrl(canvas, 240);
      return {
        width: w,
        height: h,
        detectedFormat: sig.detectedFormat,
        mimeType: sig.mimeType,
        isAnimatedGif: sig.isAnimatedGif,
        frameCount: sig.frameCount,
        imageData,
        thumbnailUrl,
        warnings,
      };
    } catch {
      if (sig.detectedFormat === 'HEIC/HEIF' || sig.detectedFormat === 'TIFF') {
        throw new Error(
          `Trình duyệt hiện tại không có bộ giải mã trực tiếp cho định dạng ${sig.detectedFormat}. Vui lòng chuyển sang PNG, JPG hoặc WebP.`
        );
      }
      throw new Error(
        `Không thể giải mã tệp ảnh (${sig.detectedFormat}). Tệp có thể bị hỏng hoặc định dạng nén không được trình duyệt hỗ trợ.`
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load error'));
    img.src = url;
  });
}

function createThumbnailDataUrl(sourceCanvas: HTMLCanvasElement, maxSize: number): string {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = tw;
  thumbCanvas.height = th;
  const ctx = thumbCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(sourceCanvas, 0, 0, tw, th);
  }
  return thumbCanvas.toDataURL('image/webp', 0.8);
}

// Chuyển đổi không gian màu RGB sang CIE LAB để tính khoảng cách màu thị giác chính xác
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  let rn = r / 255;
  let gn = g / 255;
  let bn = b / 255;

  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

  const x = (rn * 0.4124 + gn * 0.3576 + bn * 0.1805) / 0.95047;
  const y = (rn * 0.2126 + gn * 0.7152 + bn * 0.0722) / 1.0;
  const z = (rn * 0.0193 + gn * 0.1192 + bn * 0.9505) / 1.08883;

  const fx = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
  const fy = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
  const fz = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116;

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

interface ColorCluster {
  l: number;
  a: number;
  b: number;
  r: number;
  g: number;
  bl: number;
  variance: number;
  weight: number;
}

// BỘ MÁY PHÂN ĐOẠN CHỦ THỂ AI & ALPHA MATTING (SALIENT SUBJECT SEGMENTATION + TRIMAP MATTING)
export async function runAISubjectSegmentation(
  sourceImageData: ImageData,
  qualityMode: AIQualityMode,
  onStageProgress?: (stageText: string, percent: number) => void
): Promise<SegmentationResultData> {
  const startTime = performance.now();
  const origW = sourceImageData.width;
  const origH = sourceImageData.height;

  onStageProgress?.('Đang chuẩn bị tensor ảnh & không gian màu CIE LAB...', 12);
  await yieldToMainThread();

  // Xác định độ phân giải suy luận theo chế độ chất lượng
  const maxWorkDim =
    qualityMode === 'fast' ? 560 : qualityMode === 'balanced' ? 960 : 1440;
  const scale = Math.min(1, maxWorkDim / Math.max(origW, origH));
  const workW = Math.max(16, Math.round(origW * scale));
  const workH = Math.max(16, Math.round(origH * scale));

  // Tạo bản làm việc (Working ImageData) nếu ảnh lớn
  let workImageData = sourceImageData;
  if (workW !== origW || workH !== origH) {
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = origW;
    tmpCanvas.height = origH;
    const tmpCtx = tmpCanvas.getContext('2d')!;
    tmpCtx.putImageData(sourceImageData, 0, 0);

    const wCanvas = document.createElement('canvas');
    wCanvas.width = workW;
    wCanvas.height = workH;
    const wCtx = wCanvas.getContext('2d')!;
    wCtx.drawImage(tmpCanvas, 0, 0, workW, workH);
    workImageData = wCtx.getImageData(0, 0, workW, workH);
  }

  const numPixels = workW * workH;
  const rgba = workImageData.data;

  // Kiểm tra nếu ảnh đầu vào đã có sẵn kênh Alpha trong suốt một phần
  let transparentCount = 0;
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i] < 240) transparentCount++;
  }
  const hasExistingAlpha =
    transparentCount > numPixels * 0.04 && transparentCount < numPixels * 0.96;

  // Chuyển sang không gian màu LAB
  const labL = new Float32Array(numPixels);
  const labA = new Float32Array(numPixels);
  const labB = new Float32Array(numPixels);

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const [l, a, b] = rgbToLab(rgba[idx], rgba[idx + 1], rgba[idx + 2]);
    labL[i] = l;
    labA[i] = a;
    labB[i] = b;
  }

  onStageProgress?.('Đang phân tích phân bố màu nền biên & cụm K-Means...', 28);
  await yieldToMainThread();

  // Bước 1: Thu thập mẫu pixel dọc theo 4 cạnh biên để xây dựng mô hình nền đa cụm (GMM/K-Means)
  const borderThickness = Math.max(2, Math.round(Math.min(workW, workH) * 0.035));
  const borderSamples: number[] = [];

  for (let y = 0; y < workH; y++) {
    for (let x = 0; x < workW; x++) {
      const isTopOrBottom = y < borderThickness || y >= workH - borderThickness;
      const isLeftOrRight = x < borderThickness || x >= workW - borderThickness;
      // Ưu tiên góc và cạnh trên/trái/phải (cạnh dưới giữa có thể chạm thân người trong ảnh chân dung)
      const isBottomCenter =
        y >= workH - borderThickness && x > workW * 0.22 && x < workW * 0.78;
      if ((isTopOrBottom || isLeftOrRight) && !isBottomCenter) {
        borderSamples.push(y * workW + x);
      }
    }
  }

  const numClusters = qualityMode === 'fast' ? 5 : qualityMode === 'balanced' ? 8 : 12;
  const bgClusters = buildBorderColorClusters(
    borderSamples,
    labL,
    labA,
    labB,
    rgba,
    numClusters
  );

  onStageProgress?.('Đang tính bản đồ độ nổi bật (Saliency) & biên gradient Sobel...', 46);
  await yieldToMainThread();

  // Bước 2: Tính Gradient biên Sobel để ngăn lan truyền nền vượt qua viền chủ thể
  const edgeGrad = computeSobelGradientMagnitude(labL, labA, labB, workW, workH);

  // Bước 3: Tính khoảng cách màu của mỗi pixel tới mô hình nền biên
  const bgDistMap = new Float32Array(numPixels);
  let skinPixelCount = 0;

  for (let i = 0; i < numPixels; i++) {
    const l = labL[i];
    const a = labA[i];
    const b = labB[i];

    let minDist = Infinity;
    for (let c = 0; c < bgClusters.length; c++) {
      const cl = bgClusters[c];
      const dl = (l - cl.l) * 0.85;
      const da = a - cl.a;
      const db = b - cl.b;
      const d = Math.sqrt(dl * dl + da * da + db * db) / Math.max(8, cl.variance * 0.65);
      if (d < minDist) minDist = d;
    }
    bgDistMap[i] = minDist;

    // Nhận diện sắc độ da người / chủ thể ấm ở vùng trung tâm
    const idx = i * 4;
    const r = rgba[idx];
    const g = rgba[idx + 1];
    const bl = rgba[idx + 2];
    if (r > 95 && g > 40 && bl > 20 && r > g && r > bl && Math.abs(r - g) > 15) {
      skinPixelCount++;
    }
  }

  onStageProgress?.('Đang lan truyền Geodesic Flood-Fill & tạo Trimap chủ thể...', 64);
  await yieldToMainThread();

  // Bước 4: Lan truyền Geodesic từ biên vào trong để xác định vùng nền liên thông
  const bgConnectedProb = computeBorderGeodesicBackgroundProbability(
    bgDistMap,
    edgeGrad,
    workW,
    workH
  );

  // Bước 5: Kết hợp Saliency trung tâm, khoảng cách màu nền, và lan truyền biên để tạo Alpha Mask
  const rawAlpha = new Uint8Array(numPixels);
  for (let y = 0; y < workH; y++) {
    const ny = (y / workH - 0.52) * 2;
    for (let x = 0; x < workW; x++) {
      const nx = (x / workW - 0.5) * 2;
      const idx = y * workW + x;

      if (hasExistingAlpha) {
        rawAlpha[idx] = rgba[idx * 4 + 3];
        continue;
      }

      const centerDist = Math.sqrt(nx * nx * 0.85 + ny * ny * 0.75);
      const centerPrior = Math.max(0, 1 - Math.pow(centerDist / 1.35, 2.2));

      const colorDiffScore = Math.min(1, Math.max(0, (bgDistMap[idx] - 0.72) / 1.45));
      const notBorderConnected = 1 - bgConnectedProb[idx];
      const gradBoost = Math.min(0.25, edgeGrad[idx] / 140);

      // Điểm hội tụ xác suất thuộc chủ thể (Foreground Probability)
      let fgScore =
        notBorderConnected * 0.56 +
        colorDiffScore * 0.32 +
        centerPrior * 0.12 +
        gradBoost * (colorDiffScore > 0.35 ? 0.5 : 0);

      // Tăng cường bảo vệ vùng da hoặc vùng trung tâm đặc
      const pIdx = idx * 4;
      const r = rgba[pIdx];
      const g = rgba[pIdx + 1];
      const bl = rgba[pIdx + 2];
      const isSkinTone =
        r > 95 &&
        g > 45 &&
        bl > 25 &&
        r > g &&
        g > bl * 0.85 &&
        r - Math.min(g, bl) > 18 &&
        centerDist < 0.95;
      if (isSkinTone && bgDistMap[idx] > 0.65) {
        fgScore = Math.max(fgScore, 0.82);
      }

      // Chuyển thành giá trị Alpha liên tục (0..255) với đường cong S-curve mượt ở vùng biên
      const normalized = Math.min(1, Math.max(0, (fgScore - 0.34) / 0.34));
      const smoothStep = normalized * normalized * (3 - 2 * normalized);
      rawAlpha[idx] = Math.round(smoothStep * 255);
    }
  }

  onStageProgress?.('Đang chạy Alpha Matting giữ chi tiết viền & sợi tóc...', 82);
  await yieldToMainThread();

  // Bước 6: Làm sạch hình thái học (lấp lỗ thủng bên trong chủ thể & xóa đốm nhiễu nền)
  const cleanedWorkAlpha = cleanMorphologicalMask(rawAlpha, workW, workH);

  // Bước 7: Tinh chỉnh Alpha Matting theo màu cục bộ tại vùng biên (Guided Color Matting)
  const mattedWorkAlpha =
    qualityMode === 'fast'
      ? cleanedWorkAlpha
      : refineBoundaryAlphaMatting(cleanedWorkAlpha, labL, labA, labB, bgClusters, workW, workH);

  // Bước 8: Nâng độ phân giải Mask về kích thước ảnh gốc (Bilinear Upsampling)
  const fullResAlpha =
    workW === origW && workH === origH
      ? mattedWorkAlpha
      : upsampleAlphaMaskBilinear(mattedWorkAlpha, workW, workH, origW, origH);

  const subjectBounds = computeSubjectBoundingBox(fullResAlpha, origW, origH);
  const detectedCategory =
    skinPixelCount > numPixels * 0.06
      ? 'Chân dung / Người'
      : subjectBounds.coveragePercent < 35
      ? 'Logo / Vật thể nhỏ'
      : 'Sản phẩm / Đồ vật';

  onStageProgress?.('Hoàn tất tách nền AI!', 100);

  return {
    width: origW,
    height: origH,
    originalImageData: sourceImageData,
    aiBaseAlphaMask: new Uint8Array(fullResAlpha),
    workingAlphaMask: new Uint8Array(fullResAlpha),
    refinedAlphaMask: new Uint8Array(fullResAlpha),
    subjectBounds,
    processingTimeMs: Math.round(performance.now() - startTime),
    detectedCategory,
  };
}

function buildBorderColorClusters(
  borderIndices: number[],
  labL: Float32Array,
  labA: Float32Array,
  labB: Float32Array,
  rgba: Uint8ClampedArray,
  k: number
): ColorCluster[] {
  if (borderIndices.length === 0) {
    return [{ l: 95, a: 0, b: 0, r: 245, g: 245, bl: 245, variance: 12, weight: 1 }];
  }

  const step = Math.max(1, Math.floor(borderIndices.length / 600));
  const sampled: number[] = [];
  for (let i = 0; i < borderIndices.length; i += step) {
    sampled.push(borderIndices[i]);
  }

  const clusters: ColorCluster[] = [];
  for (let c = 0; c < k; c++) {
    const pick = sampled[Math.floor((c * sampled.length) / k)];
    const p4 = pick * 4;
    clusters.push({
      l: labL[pick],
      a: labA[pick],
      b: labB[pick],
      r: rgba[p4],
      g: rgba[p4 + 1],
      bl: rgba[p4 + 2],
      variance: 14,
      weight: 1 / k,
    });
  }

  // 4 vòng lặp K-Means nhanh
  const assignments = new Int32Array(sampled.length);
  for (let iter = 0; iter < 4; iter++) {
    const sumL = new Float64Array(k);
    const sumA = new Float64Array(k);
    const sumB = new Float64Array(k);
    const sumR = new Float64Array(k);
    const sumG = new Float64Array(k);
    const sumBl = new Float64Array(k);
    const counts = new Int32Array(k);

    for (let i = 0; i < sampled.length; i++) {
      const idx = sampled[i];
      const l = labL[idx];
      const a = labA[idx];
      const b = labB[idx];

      let bestC = 0;
      let bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const dl = l - clusters[c].l;
        const da = a - clusters[c].a;
        const db = b - clusters[c].b;
        const d = dl * dl + da * da + db * db;
        if (d < bestDist) {
          bestDist = d;
          bestC = c;
        }
      }
      assignments[i] = bestC;
      sumL[bestC] += l;
      sumA[bestC] += a;
      sumB[bestC] += b;
      const p4 = idx * 4;
      sumR[bestC] += rgba[p4];
      sumG[bestC] += rgba[p4 + 1];
      sumBl[bestC] += rgba[p4 + 2];
      counts[bestC]++;
    }

    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        clusters[c].l = sumL[c] / counts[c];
        clusters[c].a = sumA[c] / counts[c];
        clusters[c].b = sumB[c] / counts[c];
        clusters[c].r = Math.round(sumR[c] / counts[c]);
        clusters[c].g = Math.round(sumG[c] / counts[c]);
        clusters[c].bl = Math.round(sumBl[c] / counts[c]);
        clusters[c].weight = counts[c] / sampled.length;
      }
    }
  }

  // Tính độ lệch chuẩn (variance) của mỗi cụm
  const distSqSum = new Float64Array(k);
  const counts = new Int32Array(k);
  for (let i = 0; i < sampled.length; i++) {
    const idx = sampled[i];
    const c = assignments[i];
    const dl = labL[idx] - clusters[c].l;
    const da = labA[idx] - clusters[c].a;
    const db = labB[idx] - clusters[c].b;
    distSqSum[c] += Math.sqrt(dl * dl + da * da + db * db);
    counts[c]++;
  }

  for (let c = 0; c < k; c++) {
    if (counts[c] > 0) {
      clusters[c].variance = Math.max(9, Math.min(28, (distSqSum[c] / counts[c]) * 1.35 + 8));
    }
  }

  return clusters.filter((c) => c.weight > 0.02);
}

function computeSobelGradientMagnitude(
  labL: Float32Array,
  labA: Float32Array,
  labB: Float32Array,
  w: number,
  h: number
): Float32Array {
  const grad = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const gxL =
        -labL[idx - w - 1] +
        labL[idx - w + 1] -
        2 * labL[idx - 1] +
        2 * labL[idx + 1] -
        labL[idx + w - 1] +
        labL[idx + w + 1];
      const gyL =
        -labL[idx - w - 1] -
        2 * labL[idx - w] -
        labL[idx - w + 1] +
        labL[idx + w - 1] +
        2 * labL[idx + w] +
        labL[idx + w + 1];

      const gxA = -labA[idx - 1] + labA[idx + 1];
      const gyA = -labA[idx - w] + labA[idx + w];
      const gxB = -labB[idx - 1] + labB[idx + 1];
      const gyB = -labB[idx - w] + labB[idx + w];

      grad[idx] =
        Math.sqrt(gxL * gxL + gyL * gyL) +
        Math.sqrt(gxA * gxA + gyA * gyA + gxB * gxB + gyB * gyB) * 1.5;
    }
  }
  return grad;
}

function computeBorderGeodesicBackgroundProbability(
  bgDistMap: Float32Array,
  edgeGrad: Float32Array,
  w: number,
  h: number
): Float32Array {
  const cost = new Float32Array(w * h);
  cost.fill(1e6);

  // Khởi tạo chi phí tại 4 cạnh biên
  for (let x = 0; x < w; x++) {
    const topIdx = x;
    const botIdx = (h - 1) * w + x;
    cost[topIdx] = bgDistMap[topIdx] * 0.5;
    if (x < w * 0.25 || x > w * 0.75) {
      cost[botIdx] = bgDistMap[botIdx] * 0.6;
    }
  }
  for (let y = 0; y < h; y++) {
    const leftIdx = y * w;
    const rightIdx = y * w + (w - 1);
    cost[leftIdx] = bgDistMap[leftIdx] * 0.5;
    cost[rightIdx] = bgDistMap[rightIdx] * 0.5;
  }

  // Quét 2 chiều Chamfer Geodesic Distance (Trái-Trên -> Phải-Dưới và ngược lại)
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const stepCost =
          Math.max(0, bgDistMap[idx] - 0.55) * 0.14 + Math.max(0, edgeGrad[idx] - 18) * 0.0045;
        const minNeighbor = Math.min(
          cost[idx - 1],
          cost[idx - w],
          cost[idx - w - 1] + 0.05,
          cost[idx - w + 1] + 0.05
        );
        if (minNeighbor + stepCost < cost[idx]) {
          cost[idx] = minNeighbor + stepCost;
        }
      }
    }

    for (let y = h - 2; y >= 1; y--) {
      for (let x = w - 2; x >= 1; x--) {
        const idx = y * w + x;
        const stepCost =
          Math.max(0, bgDistMap[idx] - 0.55) * 0.14 + Math.max(0, edgeGrad[idx] - 18) * 0.0045;
        const minNeighbor = Math.min(
          cost[idx + 1],
          cost[idx + w],
          cost[idx + w + 1] + 0.05,
          cost[idx + w - 1] + 0.05
        );
        if (minNeighbor + stepCost < cost[idx]) {
          cost[idx] = minNeighbor + stepCost;
        }
      }
    }
  }

  const prob = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    prob[i] = Math.exp(-cost[i] * 0.85);
  }
  return prob;
}

function cleanMorphologicalMask(mask: Uint8Array, w: number, h: number): Uint8Array {
  // Lọc trung vị nhẹ 3x3 để khử nhiễu hạt đơn lẻ
  const out = new Uint8Array(mask);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const row = (y + dy) * w;
        for (let dx = -1; dx <= 1; dx++) {
          sum += mask[row + x + dx];
        }
      }
      const avg = sum / 9;
      if (mask[idx] > 180 && avg > 140) {
        out[idx] = Math.min(255, Math.round((mask[idx] + avg) * 0.52));
      } else if (mask[idx] < 65 && avg < 85) {
        out[idx] = Math.max(0, Math.round((mask[idx] + avg) * 0.4));
      } else {
        out[idx] = Math.round((mask[idx] * 2 + avg) / 3);
      }
    }
  }
  return out;
}

function refineBoundaryAlphaMatting(
  alpha: Uint8Array,
  labL: Float32Array,
  labA: Float32Array,
  labB: Float32Array,
  bgClusters: ColorCluster[],
  w: number,
  h: number
): Uint8Array {
  const refined = new Uint8Array(alpha);
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const idx = y * w + x;
      const aVal = alpha[idx];
      // Chỉ tinh chỉnh vùng biên chuyển tiếp (Trimap Unknown Zone)
      if (aVal > 12 && aVal < 245) {
        const l = labL[idx];
        const a = labA[idx];
        const b = labB[idx];

        let minBgDist = Infinity;
        for (let c = 0; c < bgClusters.length; c++) {
          const cl = bgClusters[c];
          const d = Math.sqrt(
            Math.pow(l - cl.l, 2) + Math.pow(a - cl.a, 2) + Math.pow(b - cl.b, 2)
          );
          if (d < minBgDist) minBgDist = d;
        }

        const matteAlpha = Math.min(255, Math.max(0, Math.round(((minBgDist - 7) / 28) * 255)));
        refined[idx] = Math.round(aVal * 0.55 + matteAlpha * 0.45);
      }
    }
  }
  return refined;
}

function upsampleAlphaMaskBilinear(
  src: Uint8Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): Uint8Array {
  const dst = new Uint8Array(dstW * dstH);
  const xRatio = (srcW - 1) / Math.max(1, dstW - 1);
  const yRatio = (srcH - 1) / Math.max(1, dstH - 1);

  for (let y = 0; y < dstH; y++) {
    const sy = y * yRatio;
    const y0 = Math.floor(sy);
    const y1 = Math.min(srcH - 1, y0 + 1);
    const wy = sy - y0;
    const row0 = y0 * srcW;
    const row1 = y1 * srcW;
    const dstRow = y * dstW;

    for (let x = 0; x < dstW; x++) {
      const sx = x * xRatio;
      const x0 = Math.floor(sx);
      const x1 = Math.min(srcW - 1, x0 + 1);
      const wx = sx - x0;

      const top = src[row0 + x0] * (1 - wx) + src[row0 + x1] * wx;
      const bot = src[row1 + x0] * (1 - wx) + src[row1 + x1] * wx;
      dst[dstRow + x] = Math.round(top * (1 - wy) + bot * wy);
    }
  }
  return dst;
}

export function computeSubjectBoundingBox(
  alphaMask: Uint8Array,
  w: number,
  h: number
): SubjectBoundingBox {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let fgCount = 0;

  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (alphaMask[row + x] > 35) {
        fgCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (fgCount === 0 || minX > maxX) {
    return {
      minX: 0,
      minY: 0,
      maxX: w - 1,
      maxY: h - 1,
      width: w,
      height: h,
      coveragePercent: 100,
    };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(1, maxX - minX + 1),
    height: Math.max(1, maxY - minY + 1),
    coveragePercent: Math.round((fgCount / (w * h)) * 1000) / 10,
  };
}

// BƯỚC 4: TINH CHỈNH VIỀN CHỦ THỂ & TÓC (EDGE & HAIR REFINEMENT PIPELINE)
export function applyEdgeAndHairRefinementToMask(
  workingMask: Uint8Array,
  originalImageData: ImageData,
  edgeConfig: EdgeRefinementConfig
): Uint8Array {
  const w = originalImageData.width;
  const h = originalImageData.height;
  let current: Uint8Array = new Uint8Array(workingMask);

  if (!edgeConfig.enabled) {
    return current;
  }

  // 1. Expand / Contract (Giãn hoặc Thu hẹp vùng mask chủ thể)
  const shift = Math.round(edgeConfig.expandContract);
  if (shift !== 0) {
    const radius = Math.min(12, Math.abs(shift));
    current = applyMorphologicalShift(current, w, h, radius, shift > 0 ? 'dilate' : 'erode');
  }

  // 2. Edge Cleanup (Loại bỏ đốm nhiễu nhỏ ngoài biên)
  if (edgeConfig.edgeCleanup) {
    current = cleanMorphologicalMask(current, w, h);
  }

  // 3. Hair Refinement (Khôi phục chi tiết sợi tóc & lông mảnh ở vùng biên chuyển tiếp)
  if (edgeConfig.hairRefinement > 0) {
    const strength = edgeConfig.hairRefinement / 100;
    const rgba = originalImageData.data;
    // Ước tính độ sáng trung bình của nền từ 4 góc
    const bgLum = estimateCornerLuminance(rgba, w, h);
    const next = new Uint8Array(current);

    for (let y = 1; y < h - 1; y++) {
      const row = y * w;
      for (let x = 1; x < w - 1; x++) {
        const idx = row + x;
        const a = current[idx];
        if (a > 10 && a < 245) {
          const p4 = idx * 4;
          const lum = rgba[p4] * 0.299 + rgba[p4 + 1] * 0.587 + rgba[p4 + 2] * 0.114;
          const lumDiff = Math.abs(lum - bgLum);
          const detailAlpha = Math.min(255, Math.max(0, Math.round((lumDiff / 65) * 255)));
          next[idx] = Math.round(a * (1 - strength * 0.45) + detailAlpha * (strength * 0.45));
        }
      }
    }
    current = next;
  }

  // 4. Smooth & Feather (Làm mượt và làm mềm mép bằng Box Blur khả tách)
  const blurRadius = Math.round(edgeConfig.feather + edgeConfig.smooth * 0.6);
  if (blurRadius > 0) {
    current = applyBoxBlurToAlpha(current, w, h, Math.min(15, blurRadius));
  }

  return current;
}

function estimateCornerLuminance(rgba: Uint8ClampedArray, w: number, h: number): number {
  const sampleCoords = [
    [2, 2],
    [w - 3, 2],
    [2, h - 3],
    [w - 3, h - 3],
  ];
  let sum = 0;
  let count = 0;
  for (const [cx, cy] of sampleCoords) {
    if (cx >= 0 && cx < w && cy >= 0 && cy < h) {
      const idx = (cy * w + cx) * 4;
      sum += rgba[idx] * 0.299 + rgba[idx + 1] * 0.587 + rgba[idx + 2] * 0.114;
      count++;
    }
  }
  return count > 0 ? sum / count : 240;
}

function applyMorphologicalShift(
  mask: Uint8Array,
  w: number,
  h: number,
  radius: number,
  mode: 'dilate' | 'erode'
): Uint8Array {
  const horiz = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);

  // Quét ngang
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let val = mode === 'dilate' ? 0 : 255;
      const xStart = Math.max(0, x - radius);
      const xEnd = Math.min(w - 1, x + radius);
      for (let xx = xStart; xx <= xEnd; xx++) {
        const v = mask[row + xx];
        if (mode === 'dilate') {
          if (v > val) val = v;
        } else {
          if (v < val) val = v;
        }
      }
      horiz[row + x] = val;
    }
  }

  // Quét dọc
  for (let y = 0; y < h; y++) {
    const yStart = Math.max(0, y - radius);
    const yEnd = Math.min(h - 1, y + radius);
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let val = mode === 'dilate' ? 0 : 255;
      for (let yy = yStart; yy <= yEnd; yy++) {
        const v = horiz[yy * w + x];
        if (mode === 'dilate') {
          if (v > val) val = v;
        } else {
          if (v < val) val = v;
        }
      }
      out[row + x] = val;
    }
  }

  return out;
}

function applyBoxBlurToAlpha(mask: Uint8Array, w: number, h: number, radius: number): Uint8Array {
  const horiz = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);

  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(w - 1, x + radius);
      for (let xx = x0; xx <= x1; xx++) {
        sum += mask[row + xx];
        count++;
      }
      horiz[row + x] = Math.round(sum / count);
    }
  }

  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(h - 1, y + radius);
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let yy = y0; yy <= y1; yy++) {
        sum += horiz[yy * w + x];
        count++;
      }
      out[row + x] = Math.round(sum / count);
    }
  }

  return out;
}

// BƯỚC 4.3: CÔNG CỤ BÚT XÓA & KHÔI PHỤC TRỰC TIẾP TRÊN ALPHA MASK
export function applyBrushStrokeSegmentToMask(
  mask: Uint8Array,
  w: number,
  h: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  mode: 'erase' | 'restore',
  brushRadius: number,
  softnessPercent: number, // 0..100
  opacityPercent: number // 1..100
): void {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / Math.max(1, brushRadius * 0.25)));
  const maxOpacity = Math.min(1, Math.max(0.05, opacityPercent / 100));
  const innerHardRatio = Math.max(0.05, 1 - softnessPercent / 100);
  const rSq = brushRadius * brushRadius;

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const cx = x0 + (x1 - x0) * t;
    const cy = y0 + (y1 - y0) * t;

    const minX = Math.max(0, Math.floor(cx - brushRadius));
    const maxX = Math.min(w - 1, Math.ceil(cx + brushRadius));
    const minY = Math.max(0, Math.floor(cy - brushRadius));
    const maxY = Math.min(h - 1, Math.ceil(cy + brushRadius));

    for (let y = minY; y <= maxY; y++) {
      const dy = y - cy;
      const row = y * w;
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dSq = dx * dx + dy * dy;
        if (dSq > rSq) continue;

        const dRatio = Math.sqrt(dSq) / Math.max(1, brushRadius);
        let falloff = 1;
        if (dRatio > innerHardRatio) {
          falloff = 1 - (dRatio - innerHardRatio) / Math.max(0.01, 1 - innerHardRatio);
        }
        const strength = falloff * maxOpacity * 0.55;
        const idx = row + x;
        if (mode === 'erase') {
          mask[idx] = Math.max(0, Math.round(mask[idx] * (1 - strength)));
        } else {
          mask[idx] = Math.min(255, Math.round(mask[idx] + (255 - mask[idx]) * strength));
        }
      }
    }
  }
}

// Tạo Canvas của riêng chủ thể đã tách nền + xử lý khử ám màu viền (Defringe & Color Decontamination)
export function buildForegroundSubjectCanvas(
  originalImageData: ImageData,
  refinedAlphaMask: Uint8Array,
  edgeConfig: EdgeRefinementConfig
): HTMLCanvasElement {
  const w = originalImageData.width;
  const h = originalImageData.height;
  const src = originalImageData.data;
  const outImageData = new ImageData(w, h);
  const dst = outImageData.data;

  // Ước tính màu nền trung bình từ 4 góc để khử ám màu ở biên bán trong suốt
  const cornerIdx = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  for (const cIdx of cornerIdx) {
    bgR += src[cIdx];
    bgG += src[cIdx + 1];
    bgB += src[cIdx + 2];
  }
  bgR /= 4;
  bgG /= 4;
  bgB /= 4;

  const defringeFactor =
    edgeConfig.enabled && edgeConfig.decontaminateColors ? edgeConfig.defringe / 100 : 0;

  for (let i = 0; i < w * h; i++) {
    const p4 = i * 4;
    const alpha = refinedAlphaMask[i];
    if (alpha === 0) {
      dst[p4 + 3] = 0;
      continue;
    }

    let r = src[p4];
    let g = src[p4 + 1];
    let b = src[p4 + 2];

    // Khử màu nền bám ở vùng viền bán trong suốt (Color Decontamination)
    if (defringeFactor > 0 && alpha > 5 && alpha < 235) {
      const aNorm = Math.max(0.15, alpha / 255);
      const decontamR = (r - (1 - aNorm) * bgR) / aNorm;
      const decontamG = (g - (1 - aNorm) * bgG) / aNorm;
      const decontamB = (b - (1 - aNorm) * bgB) / aNorm;

      const mix = defringeFactor * (1 - aNorm);
      r = Math.min(255, Math.max(0, Math.round(r * (1 - mix) + decontamR * mix)));
      g = Math.min(255, Math.max(0, Math.round(g * (1 - mix) + decontamG * mix)));
      b = Math.min(255, Math.max(0, Math.round(b * (1 - mix) + decontamB * mix)));
    }

    dst[p4] = r;
    dst[p4 + 1] = g;
    dst[p4 + 2] = b;
    dst[p4 + 3] = alpha;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(outImageData, 0, 0);
  return canvas;
}

// BƯỚC 6 & 7: KẾT XUẤT ẢNH ĐẦU RA HOÀN CHỈNH (GHÉP NỀN, ĐỔ BÓNG, CROP, XOAY/LẬT, CHỈNH MÀU, RESIZE)
export async function renderFinalOutputCanvas(
  originalImageData: ImageData,
  refinedAlphaMask: Uint8Array,
  subjectBounds: SubjectBoundingBox,
  config: BackgroundRemoverStudioConfig,
  loadedBgImage?: HTMLImageElement | null,
  forceOpaqueForJpeg: boolean = false
): Promise<HTMLCanvasElement> {
  const srcW = originalImageData.width;
  const srcH = originalImageData.height;

  // 1. Tạo lớp chủ thể đã tách nền
  const subjectCanvas = buildForegroundSubjectCanvas(
    originalImageData,
    refinedAlphaMask,
    config.edge
  );

  // 2. Xác định kích thước khung Crop theo tỷ lệ được chọn
  const { cropPreset, customCropWidthPercent, customCropHeightPercent } = config.postProcess;
  let cropW = srcW;
  let cropH = srcH;

  const targetRatioMap: Record<string, number> = {
    '1:1': 1,
    '4:3': 4 / 3,
    '3:2': 3 / 2,
    '16:9': 16 / 9,
    '9:16': 9 / 16,
  };

  if (cropPreset === 'custom') {
    cropW = Math.max(32, Math.round((srcW * customCropWidthPercent) / 100));
    cropH = Math.max(32, Math.round((srcH * customCropHeightPercent) / 100));
  } else if (cropPreset !== 'original' && targetRatioMap[cropPreset]) {
    const targetRatio = targetRatioMap[cropPreset];
    const currentRatio = srcW / srcH;
    if (currentRatio > targetRatio) {
      cropH = srcH;
      cropW = Math.round(srcH * targetRatio);
    } else {
      cropW = srcW;
      cropH = Math.round(srcW / targetRatio);
    }
  }

  // 3. Tạo Canvas ghép nền + chủ thể ở độ phân giải sau Crop
  const stageCanvas = document.createElement('canvas');
  stageCanvas.width = cropW;
  stageCanvas.height = cropH;
  const ctx = stageCanvas.getContext('2d')!;

  const bgCfg = config.background;
  const effectiveBgMode =
    forceOpaqueForJpeg && bgCfg.mode === 'transparent' ? 'solid' : bgCfg.mode;

  // 3a. Vẽ lớp nền (Background Layer)
  if (effectiveBgMode !== 'transparent') {
    ctx.save();
    ctx.globalAlpha = Math.min(1, Math.max(0, bgCfg.bgOpacity / 100));

    const filterParts: string[] = [];
    if (bgCfg.bgBlur > 0) filterParts.push(`blur(${bgCfg.bgBlur}px)`);
    if (bgCfg.bgBrightness !== 100) filterParts.push(`brightness(${bgCfg.bgBrightness}%)`);
    if (bgCfg.bgContrast !== 100) filterParts.push(`contrast(${bgCfg.bgContrast}%)`);
    if (filterParts.length > 0) {
      ctx.filter = filterParts.join(' ');
    }

    if (effectiveBgMode === 'solid') {
      ctx.fillStyle = bgCfg.solidColor || '#FFFFFF';
      ctx.fillRect(0, 0, cropW, cropH);
    } else if (effectiveBgMode === 'gradient') {
      let grad: CanvasGradient;
      if (bgCfg.gradientType === 'radial') {
        grad = ctx.createRadialGradient(
          cropW / 2,
          cropH / 2,
          Math.min(cropW, cropH) * 0.05,
          cropW / 2,
          cropH / 2,
          Math.max(cropW, cropH) * 0.7
        );
      } else {
        const rad = ((bgCfg.gradientAngle - 90) * Math.PI) / 180;
        const cx = cropW / 2;
        const cy = cropH / 2;
        const r = Math.hypot(cropW, cropH) / 2;
        grad = ctx.createLinearGradient(
          cx - Math.cos(rad) * r,
          cy - Math.sin(rad) * r,
          cx + Math.cos(rad) * r,
          cy + Math.sin(rad) * r
        );
      }
      grad.addColorStop(0, bgCfg.gradientStart || '#4F46E5');
      if (bgCfg.gradientMid) {
        grad.addColorStop(0.5, bgCfg.gradientMid);
      }
      grad.addColorStop(1, bgCfg.gradientEnd || '#EC4899');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cropW, cropH);
    } else if (effectiveBgMode === 'image' && loadedBgImage) {
      const imgW = loadedBgImage.naturalWidth || loadedBgImage.width || cropW;
      const imgH = loadedBgImage.naturalHeight || loadedBgImage.height || cropH;
      const fitScale =
        bgCfg.bgFit === 'contain'
          ? Math.min(cropW / imgW, cropH / imgH)
          : Math.max(cropW / imgW, cropH / imgH);
      const finalScale = fitScale * (bgCfg.bgScale / 100);
      const drawW = imgW * finalScale;
      const drawH = imgH * finalScale;
      const drawX = (cropW - drawW) / 2 + (bgCfg.bgOffsetX / 100) * cropW;
      const drawY = (cropH - drawH) / 2 + (bgCfg.bgOffsetY / 100) * cropH;
      ctx.drawImage(loadedBgImage, drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, cropW, cropH);
    }
    ctx.restore();
  }

  // 3b. Vẽ lớp Chủ thể (Foreground Subject) kèm bóng đổ, tỷ lệ và căn giữa tự động
  ctx.save();
  const subScale = bgCfg.subjectScale / 100;
  const offsetX = (bgCfg.subjectOffsetX / 100) * cropW;
  const offsetY = (bgCfg.subjectOffsetY / 100) * cropH;

  let drawSubX = (cropW - srcW * subScale) / 2 + offsetX;
  let drawSubY = (cropH - srcH * subScale) / 2 + offsetY;

  if (bgCfg.autoCenterSubject) {
    const subCenterX = (subjectBounds.minX + subjectBounds.maxX) / 2;
    const subCenterY = (subjectBounds.minY + subjectBounds.maxY) / 2;
    drawSubX = cropW / 2 - subCenterX * subScale + offsetX;
    drawSubY = cropH / 2 - subCenterY * subScale + offsetY;
  }

  if (bgCfg.shadow.enabled) {
    const sh = bgCfg.shadow;
    const hex = sh.color || '#000000';
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${(sh.opacity / 100).toFixed(2)})`;
    ctx.shadowBlur = sh.blur;
    ctx.shadowOffsetX = sh.offsetX;
    ctx.shadowOffsetY = sh.offsetY;
  }

  ctx.drawImage(subjectCanvas, drawSubX, drawSubY, srcW * subScale, srcH * subScale);
  ctx.restore();

  // 4. Áp dụng Xoay (90/180/270), Lật (Ngang/Dọc), Chỉnh màu (Brightness/Contrast/Saturation) & Đổi kích thước
  const { rotation, flipH, flipV, brightness, contrast, saturation, sharpness, resizeMode } =
    config.postProcess;

  const isRotated90 = rotation === 90 || rotation === 270;
  const baseOutW = isRotated90 ? cropH : cropW;
  const baseOutH = isRotated90 ? cropW : cropH;

  let finalW = baseOutW;
  let finalH = baseOutH;
  if (resizeMode !== 'original') {
    finalW = Math.max(16, Math.min(4096, Math.round(config.postProcess.targetWidth || baseOutW)));
    finalH = Math.max(16, Math.min(4096, Math.round(config.postProcess.targetHeight || baseOutH)));
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = finalW;
  outCanvas.height = finalH;
  const outCtx = outCanvas.getContext('2d')!;

  outCtx.save();
  const postFilters: string[] = [];
  if (brightness !== 100) postFilters.push(`brightness(${brightness}%)`);
  if (contrast !== 100) postFilters.push(`contrast(${contrast}%)`);
  if (saturation !== 100) postFilters.push(`saturate(${saturation}%)`);
  if (postFilters.length > 0) {
    outCtx.filter = postFilters.join(' ');
  }

  outCtx.translate(finalW / 2, finalH / 2);
  if (rotation !== 0) {
    outCtx.rotate((rotation * Math.PI) / 180);
  }
  outCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  const drawTargetW = isRotated90 ? finalH : finalW;
  const drawTargetH = isRotated90 ? finalW : finalH;
  outCtx.drawImage(
    stageCanvas,
    -drawTargetW / 2,
    -drawTargetH / 2,
    drawTargetW,
    drawTargetH
  );
  outCtx.restore();

  // 5. Áp dụng bộ lọc làm sắc nét (Sharpness Convolution) nếu sharpness > 0
  if (sharpness > 0) {
    applyUnsharpMaskToCanvas(outCanvas, sharpness / 100);
  }

  return outCanvas;
}

function applyUnsharpMaskToCanvas(canvas: HTMLCanvasElement, amount: number): void {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const imgData = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(imgData.data);
  const dst = imgData.data;
  const strength = amount * 0.75;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      if (src[idx + 3] === 0) continue;
      for (let c = 0; c < 3; c++) {
        const center = src[idx + c];
        const neighbors =
          (src[((y - 1) * w + x) * 4 + c] +
            src[((y + 1) * w + x) * 4 + c] +
            src[(y * w + x - 1) * 4 + c] +
            src[(y * w + x + 1) * 4 + c]) *
          0.25;
        dst[idx + c] = Math.min(255, Math.max(0, Math.round(center + (center - neighbors) * strength * 2)));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

// BƯỚC 9: XUẤT FILE ẢNH ĐA ĐỊNH DẠNG VỚI KIỂM TRA MIME THỰC TẾ
export async function exportProcessedImageBlob(
  originalImageData: ImageData,
  refinedAlphaMask: Uint8Array,
  subjectBounds: SubjectBoundingBox,
  config: BackgroundRemoverStudioConfig,
  loadedBgImage?: HTMLImageElement | null
): Promise<{
  blob: Blob;
  actualFormat: OutputImageFormat;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  notice?: string;
}> {
  const requestedFormat = config.exportConfig.format;
  const quality = Math.min(1, Math.max(0.1, config.exportConfig.quality / 100));
  const forceOpaque = requestedFormat === 'jpeg';

  const canvas = await renderFinalOutputCanvas(
    originalImageData,
    refinedAlphaMask,
    subjectBounds,
    config,
    loadedBgImage,
    forceOpaque
  );

  // Định dạng BMP: Mã hóa nhị phân BMP 32-bit BGRA trực tiếp
  if (requestedFormat === 'bmp') {
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bmpBlob = encodeImageDataToBmp32Blob(imgData);
    return {
      blob: bmpBlob,
      actualFormat: 'bmp',
      mimeType: 'image/bmp',
      extension: 'bmp',
      width: canvas.width,
      height: canvas.height,
    };
  }

  const mimeMap: Record<OutputImageFormat, string> = {
    png: 'image/png',
    webp: 'image/webp',
    jpeg: 'image/jpeg',
    bmp: 'image/bmp',
    avif: 'image/avif',
  };

  const targetMime = mimeMap[requestedFormat] || 'image/png';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), targetMime, quality)
  );

  if (!blob) {
    throw new Error('Không thể xuất Blob từ Canvas.');
  }

  // Kiểm tra thực tế: Trình duyệt có hỗ trợ encoder đã yêu cầu hay tự fallback về image/png?
  if (requestedFormat === 'avif' && blob.type !== 'image/avif') {
    // Tự động chuyển sang WebP chất lượng cao nếu trình duyệt chưa hỗ trợ AVIF encoder
    const webpBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/webp', quality)
    );
    if (webpBlob && webpBlob.type === 'image/webp') {
      return {
        blob: webpBlob,
        actualFormat: 'webp',
        mimeType: 'image/webp',
        extension: 'webp',
        width: canvas.width,
        height: canvas.height,
        notice:
          'Trình duyệt hiện tại chưa hỗ trợ bộ mã hóa AVIF trực tiếp; đã xuất sang định dạng WebP Alpha tương đương.',
      };
    }
  }

  const extMap: Record<string, { fmt: OutputImageFormat; ext: string }> = {
    'image/png': { fmt: 'png', ext: 'png' },
    'image/webp': { fmt: 'webp', ext: 'webp' },
    'image/jpeg': { fmt: 'jpeg', ext: 'jpg' },
    'image/avif': { fmt: 'avif', ext: 'avif' },
  };

  const resolved = extMap[blob.type] || { fmt: 'png', ext: 'png' };
  return {
    blob,
    actualFormat: resolved.fmt,
    mimeType: blob.type || 'image/png',
    extension: resolved.ext,
    width: canvas.width,
    height: canvas.height,
    notice:
      requestedFormat === 'jpeg' && config.background.mode === 'transparent'
        ? 'Định dạng JPEG không hỗ trợ kênh trong suốt Alpha; ảnh đã được ghép lên nền màu trước khi xuất.'
        : undefined,
  };
}

function encodeImageDataToBmp32Blob(imgData: ImageData): Blob {
  const w = imgData.width;
  const h = imgData.height;
  const pixelBytes = w * h * 4;
  const fileSize = 54 + pixelBytes;
  const buf = new ArrayBuffer(fileSize);
  const view = new DataView(buf);
  const out = new Uint8Array(buf);

  // BMP File Header (14 bytes)
  out[0] = 0x42; // 'B'
  out[1] = 0x4d; // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);

  // DIB Header BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, 40, true);
  view.setInt32(18, w, true);
  view.setInt32(22, -h, true); // Top-down DIB
  view.setUint16(26, 1, true);
  view.setUint16(28, 32, true); // 32-bit BGRA
  view.setUint32(30, 0, true);
  view.setUint32(34, pixelBytes, true);

  const src = imgData.data;
  let offset = 54;
  for (let i = 0; i < w * h; i++) {
    const p4 = i * 4;
    out[offset] = src[p4 + 2]; // B
    out[offset + 1] = src[p4 + 1]; // G
    out[offset + 2] = src[p4]; // R
    out[offset + 3] = src[p4 + 3]; // A
    offset += 4;
  }

  return new Blob([buf], { type: 'image/bmp' });
}

// BƯỚC 15: QUẢN LÝ ĐẶT TÊN TỆP ĐẦU RA KHÔNG TRÙNG LẶP
export function buildOutputFileName(
  originalName: string,
  indexInBatch: number,
  extension: string,
  exportConfig: OutputExportConfig,
  usedNames?: Set<string>
): string {
  const dotIdx = originalName.lastIndexOf('.');
  const rawBase = dotIdx > 0 ? originalName.slice(0, dotIdx) : originalName;
  const safeBase =
    rawBase
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
      .replace(/\s+/g, '-')
      .slice(0, 80) || 'image';

  let stem = safeBase;
  if (exportConfig.namingRule === 'suffix_nobg') {
    stem = `${safeBase}_no-bg`;
  } else if (exportConfig.namingRule === 'custom_suffix') {
    const cleanSuffix = (exportConfig.customSuffix || '_no-bg').replace(
      /[<>:"/\\|?*\x00-\x1F]/g,
      ''
    );
    stem = `${safeBase}${cleanSuffix}`;
  } else if (exportConfig.namingRule === 'pattern_seq') {
    const cleanPrefix =
      (exportConfig.patternPrefix || 'product').replace(/[<>:"/\\|?*\x00-\x1F]/g, '') || 'product';
    const seq = String(indexInBatch + 1).padStart(3, '0');
    stem = `${cleanPrefix}-${seq}_no-bg`;
  }

  let candidate = `${stem}.${extension}`;
  if (usedNames) {
    let counter = 2;
    while (usedNames.has(candidate.toLowerCase())) {
      candidate = `${stem}-${counter}.${extension}`;
      counter++;
    }
    usedNames.add(candidate.toLowerCase());
  }
  return candidate;
}

// BƯỚC 14: ĐÓNG GÓI TẤT CẢ KẾT QUẢ THÀNH TỆP ZIP CHUẨN PKZIP (CRC-32)
export interface ZipEntryInput {
  fileName: string;
  blob: Blob;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function computeCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export async function createBatchZipArchive(
  entries: ZipEntryInput[],
  onProgress?: (current: number, total: number, currentName: string) => void
): Promise<Blob> {
  if (entries.length === 0) {
    throw new Error('Không có tệp hợp lệ để đóng gói ZIP.');
  }

  const encoder = new TextEncoder();
  const localFileChunks: Uint8Array[] = [];
  const centralDirChunks: Uint8Array[] = [];
  let offset = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    onProgress?.(i + 1, entries.length, entry.fileName);
    await yieldToMainThread();

    const nameBytes = encoder.encode(entry.fileName);
    const dataBuffer = await entry.blob.arrayBuffer();
    const dataBytes = new Uint8Array(dataBuffer);
    const crc = computeCrc32(dataBytes);
    const size = dataBytes.length;

    // Local File Header (30 bytes + fileName)
    const localHeader = new ArrayBuffer(30 + nameBytes.length);
    const lv = new DataView(localHeader);
    lv.setUint32(0, 0x04034b50, true); // Signature PK\x03\x04
    lv.setUint16(4, 20, true); // Version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // Store method (PNG/JPG/WebP đã nén)
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    new Uint8Array(localHeader, 30).set(nameBytes);

    localFileChunks.push(new Uint8Array(localHeader));
    localFileChunks.push(dataBytes);

    // Central Directory File Header (46 bytes + fileName)
    const centralHeader = new ArrayBuffer(46 + nameBytes.length);
    const cv = new DataView(centralHeader);
    cv.setUint32(0, 0x02014b50, true); // Signature PK\x01\x02
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true); // UTF-8 flag
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    new Uint8Array(centralHeader, 46).set(nameBytes);

    centralDirChunks.push(new Uint8Array(centralHeader));
    offset += 30 + nameBytes.length + size;
  }

  let centralDirSize = 0;
  for (const c of centralDirChunks) centralDirSize += c.length;

  // End of Central Directory Record (22 bytes)
  const eocd = new ArrayBuffer(22);
  const ev = new DataView(eocd);
  ev.setUint32(0, 0x06054b50, true); // PK\x05\x06
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralDirSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob(
    [...localFileChunks, ...centralDirChunks, new Uint8Array(eocd)] as unknown as BlobPart[],
    {
      type: 'application/zip',
    }
  );
}

// BỘ TẠO ẢNH MẪU THỰC TẾ ĐỂ KIỂM THỬ TỨC THÌ (CHÂN DUNG, SẢN PHẨM GIÀY, LOGO)
export async function generateDemoTestImageFile(
  sampleType: 'portrait' | 'sneaker' | 'logo'
): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  if (sampleType === 'portrait') {
    // Nền studio xanh nhạt có hoa văn nhẹ
    const bgGrad = ctx.createLinearGradient(0, 0, 960, 720);
    bgGrad.addColorStop(0, '#DBEAFE');
    bgGrad.addColorStop(1, '#BFDBFE');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 960, 720);

    // Vẽ chủ thể chân dung (Áo vest, khuôn mặt, mái tóc nhiều sợi chi tiết ở biên)
    ctx.save();
    // Thân áo vest đỏ đô nổi bật
    ctx.fillStyle = '#7F1D1D';
    ctx.beginPath();
    ctx.moveTo(270, 720);
    ctx.quadraticCurveTo(300, 480, 480, 470);
    ctx.quadraticCurveTo(660, 480, 690, 720);
    ctx.closePath();
    ctx.fill();

    // Cổ & Khuôn mặt
    ctx.fillStyle = '#FDBA74';
    ctx.fillRect(445, 390, 70, 100);
    ctx.beginPath();
    ctx.ellipse(480, 310, 95, 118, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mái tóc đen nhánh kèm các lọn tóc mảnh ở vùng biên
    ctx.fillStyle = '#1E1B4B';
    ctx.beginPath();
    ctx.arc(480, 275, 112, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = 3;
    for (let angle = -160; angle <= -20; angle += 5) {
      const rad = (angle * Math.PI) / 180;
      const x1 = 480 + Math.cos(rad) * 105;
      const y1 = 275 + Math.sin(rad) * 105;
      const x2 = 480 + Math.cos(rad) * 132 + Math.sin(angle) * 8;
      const y2 = 275 + Math.sin(rad) * 128;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo((x1 + x2) / 2 + 5, (y1 + y2) / 2 - 6, x2, y2);
      ctx.stroke();
    }

    // Mắt & Nụ cười
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(445, 305, 8, 0, Math.PI * 2);
    ctx.arc(515, 305, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(480, 345, 28, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  } else if (sampleType === 'sneaker') {
    // Nền bàn studio xám bạc
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 720);
    bgGrad.addColorStop(0, '#E2E8F0');
    bgGrad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 960, 720);

    // Vẽ sản phẩm Giày thể thao màu Cam Đỏ / Trắng độ tương phản cao
    ctx.save();
    ctx.translate(480, 390);
    ctx.rotate(-0.12);

    // Đế giày
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.roundRect(-240, 60, 480, 58, 28);
    ctx.fill();

    // Thân giày chính
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(-220, 65);
    ctx.lineTo(-190, -90);
    ctx.quadraticCurveTo(-70, -110, 30, -25);
    ctx.lineTo(210, 15);
    ctx.quadraticCurveTo(245, 35, 230, 65);
    ctx.closePath();
    ctx.fill();

    // Điểm nhấn sọc vàng
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-140, 20);
    ctx.lineTo(60, 40);
    ctx.stroke();
    ctx.restore();
  } else {
    // Logo thương hiệu trên nền màu kem
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(0, 0, 960, 720);

    ctx.save();
    ctx.translate(480, 360);
    ctx.fillStyle = '#4F46E5';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const x = Math.cos(angle) * 175;
      const y = Math.sin(angle) * 175;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#EC4899';
    ctx.beginPath();
    ctx.arc(0, 0, 88, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Blob error'))), 'image/png');
  });

  const fileNameMap = {
    portrait: 'chan-dung-mau-studio.png',
    sneaker: 'giay-the-thao-tmdt.png',
    logo: 'logo-thuong-hieu-hex.png',
  };

  return new File([blob], fileNameMap[sampleType], { type: 'image/png' });
}

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
