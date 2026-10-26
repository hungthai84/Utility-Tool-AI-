// Hệ thống phân tích thị giác, trích xuất đặc trưng hình ảnh, chuẩn hóa Schema Image-to-Prompt
// và xuất dữ liệu đa định dạng (TXT, JSON, CSV chuẩn RFC-4180, Markdown, Batch ZIP)

import {
  inspectImageFileSignature,
  decodeImageFile,
  createBatchZipArchive,
  formatFileSize,
} from './backgroundRemoverEngine';

export { inspectImageFileSignature, decodeImageFile, createBatchZipArchive, formatFileSize };

export type AnalysisModeId =
  | 'faithful_recreation'
  | 'detailed_visual'
  | 'style_analysis'
  | 'composition_analysis'
  | 'product_commercial'
  | 'portrait_character'
  | 'ui_screenshot'
  | 'banner_design'
  | 'glass_ui'
  | 'architecture_interior'
  | 'landscape'
  | 'cinematic'
  | 'illustration_3d'
  | 'general_analysis';

export type TargetAIToolId =
  | 'universal'
  | 'gemini_image'
  | 'openai_image'
  | 'midjourney'
  | 'stable_diffusion'
  | 'sdxl'
  | 'flux';

export type OutputLanguageMode = 'vi' | 'en' | 'bilingual';

export type DetailLevelMode = 'concise' | 'standard' | 'ultra_detailed';

export type TextHandlingPolicy = 'keep_exact' | 'leave_blank_space' | 'describe_layout_no_text';

export type PromptBatchStatus =
  | 'waiting'
  | 'preparing'
  | 'analyzing'
  | 'generating_prompt'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface EstimatedColorSwatch {
  hex: string;
  role: 'dominant' | 'secondary' | 'accent' | 'background';
  name: string;
  percentage: number;
  note: string; // Ghi rõ màu ước lượng từ pixel ảnh
}

export interface EditablePromptBlocks {
  subject: string;
  environment: string;
  composition: string;
  lighting: string;
  colors: string;
  style: string;
  aspectRatioAndFraming: string;
  fidelityConstraints: string;
}

export interface StructuredImageAnalysis {
  imageId: string;
  fileName: string;
  width: number;
  height: number;
  detectedFormat: string;
  analysisMode: AnalysisModeId;
  targetTool: TargetAIToolId;
  outputLanguage: OutputLanguageMode;

  // 7.1. Tổng quan
  summary: string;
  sceneType: string;
  visualPurpose: string;
  dominantElement: string;
  detailDensity: string;

  // 7.2. Chủ thể
  subjects: {
    count: string;
    primaryDescription: string;
    positionInFrame: string;
    scaleRatio: string;
    poseAndAction: string;
    orientationAndGaze: string;
    subjectRelationships: string;
    distinctiveFeatures: string[];
  };

  // 7.3. Bố cục
  composition: {
    overallStructure: string;
    foregroundMidgroundBackground: string;
    negativeSpace: string;
    visualBalanceAndFocalPoint: string;
    eyeLeadingLines: string;
    subjectToBackgroundRatio: string;
    uiLayoutDetails?: string; // Dành riêng cho Mode 7 (UI Screenshot)
    bannerCopySpace?: string; // Dành riêng cho Mode 8 (Banner)
  };

  // 7.4. Góc máy & Phối cảnh
  cameraAndPerspective: {
    shotType: string;
    cameraAngle: string;
    perspectiveType: string;
    depthOfField: string;
  };

  // 7.5. Ánh sáng
  lighting: {
    keyLightSource: string;
    fillAndRimLight: string;
    direction: string;
    softnessAndIntensity: string;
    contrastLevel: string;
    shadowsAndReflections: string;
    naturalOrArtificial: string;
  };

  // 7.6. Màu sắc
  colorPalette: {
    dominantColors: string[];
    secondaryColors: string[];
    accentColors: string[];
    estimatedHexSwatches: EstimatedColorSwatch[];
    colorTemperature: string;
    saturationAndContrast: string;
    colorGrading: string;
    subjectBackgroundHarmony: string;
  };

  // 7.7. Chất liệu & Kết cấu
  materialsAndTextures: {
    observedMaterials: string[];
    surfaceCharacteristics: string;
    roughnessAndReflectivity: string;
  };

  // 7.8. Phong cách hình ảnh
  style: {
    primaryStyle: string;
    secondaryTraits: string[];
    realismLevel: string;
    renderingTechnique: string;
  };

  // Hậu cảnh
  background: {
    settingDescription: string;
    backgroundObjects: string[];
    spatialDepth: string;
  };

  // 7.9. Chữ trong hình ảnh (OCR & Typography Analysis)
  visibleText: {
    hasVisibleText: boolean;
    readableTextItems: {
      content: string;
      language: string;
      position: string;
      hierarchyRole: string;
      typographyStyle: string;
      colorAndAlignment: string;
    }[];
    unreadableOrBlurryTextNote: string;
  };

  // Tỷ lệ khung hình
  aspectRatio: {
    exactPixelRatio: string;
    nearestStandardRatio: string;
    framingRecommendation: string;
  };

  // 8 & 9. Các phiên bản Prompt độc lập
  faithfulPrompt: string; // Version A: Tái hiện sát ảnh gốc (Mặc định)
  detailedPrompt: string; // Version B: Ultra-Detailed Prompt
  concisePrompt: string; // Version C: Concise Prompt ngắn gọn
  editableBlocks: EditablePromptBlocks; // Version D: Khối chỉnh sửa độc lập
  creativeVariationPrompt: string; // Version E: Creative Variation có kiểm soát
  negativePrompt: string; // Bước 6: Negative Prompt chuyên biệt

  // Bản song ngữ riêng biệt (Bước 8)
  vietnamesePrompt: string;
  englishPrompt: string;

  // 7.10. Độ tin cậy, suy luận và cảnh báo
  confidenceAssessment: {
    directlyObserved: string[];
    reasonableInferences: string[];
    insufficientDataToConclude: string[];
    qualitativeConfidenceLabel: string;
  };
  uncertainties: string[];
  warnings: string[];
}

export interface BatchComparativeSummary {
  analyzedCount: number;
  commonVisualStyle: string;
  sharedColorPalette: string[];
  recurringCompositionPatterns: string;
  keySimilarities: string[];
  keyDifferences: string[];
  representativeMasterPrompt: string;
}

export interface AnalysisModeMeta {
  id: AnalysisModeId;
  name: string;
  shortLabel: string;
  badge: string;
  description: string;
  focusPoints: string[];
}

export const ANALYSIS_MODES: AnalysisModeMeta[] = [
  {
    id: 'faithful_recreation',
    name: 'Mode 1: Faithful Recreation — Tái hiện sát ảnh gốc',
    shortLabel: 'Tái hiện sát gốc',
    badge: 'Ưu tiên số 1',
    description:
      'Phân tích chính xác chủ thể, vị trí, tư thế, tỷ lệ, ánh sáng, màu sắc và chất liệu để tái tạo hình ảnh gần bản gốc nhất.',
    focusPoints: ['Chủ thể & Số lượng', 'Vị trí & Bố cục', 'Ánh sáng & Màu sắc', 'Ràng buộc trung thực'],
  },
  {
    id: 'detailed_visual',
    name: 'Mode 2: Detailed Visual Analysis — Phân tích thị giác chi tiết',
    shortLabel: 'Thị giác chuyên sâu',
    badge: 'Phân cấp 10 lớp',
    description:
      'Bản phân tích chuyên sâu từ tổng quan đến từng chi tiết vi mô dành cho nghiên cứu cấu trúc hình ảnh.',
    focusPoints: ['Tổng quan & Bối cảnh', 'Chi tiết bề mặt', 'Phân lớp không gian', 'Cấu trúc thị giác'],
  },
  {
    id: 'style_analysis',
    name: 'Mode 3: Style Analysis — Phân tích phong cách',
    shortLabel: 'Phong cách & Color',
    badge: 'Style Transfer',
    description:
      'Tách biệt phong cách mỹ thuật, kỹ thuật ánh sáng, color grading và chất liệu khỏi chủ thể để tái sử dụng.',
    focusPoints: ['Kỹ thuật thể hiện', 'Color Grading', 'Xử lý tương phản', 'Ngôn ngữ thị giác'],
  },
  {
    id: 'composition_analysis',
    name: 'Mode 4: Composition Analysis — Phân tích bố cục',
    shortLabel: 'Bố cục & Góc máy',
    badge: 'Framing & DOF',
    description:
      'Tập trung vào tiền/trung/hậu cảnh, khoảng trống âm, quy tắc 1/3, trục thị giác và độ sâu trường ảnh.',
    focusPoints: ['Tiền/Trung/Hậu cảnh', 'Khoảng trống âm', 'Đường dẫn mắt', 'Cân bằng khung hình'],
  },
  {
    id: 'product_commercial',
    name: 'Mode 5: Product & Commercial Photography',
    shortLabel: 'Sản phẩm TMĐT',
    badge: 'Commercial Studio',
    description:
      'Phân tích hình dáng sản phẩm, chất liệu bề mặt, ánh sáng studio, phản chiếu và khoảng trống quảng cáo.',
    focusPoints: ['Chất liệu sản phẩm', 'Ánh sáng Studio', 'Bóng đổ & Phản chiếu', 'Trình bày thương mại'],
  },
  {
    id: 'portrait_character',
    name: 'Mode 6: Portrait & Character Analysis',
    shortLabel: 'Chân dung & Nhân vật',
    badge: 'Portrait & Pose',
    description:
      'Phân tích tóc, trang phục, tư thế, hướng nhìn, biểu cảm và ánh sáng chân dung quan sát được.',
    focusPoints: ['Tóc & Trang phục', 'Tư thế & Hướng nhìn', 'Biểu cảm quan sát', 'Ánh sáng chân dung'],
  },
  {
    id: 'ui_screenshot',
    name: 'Mode 7: UI / Website Screenshot Analysis',
    shortLabel: 'Giao diện UI / Web',
    badge: 'UI/UX Layout',
    description:
      'Phân tích cấu trúc Header, Sidebar, Card, Grid, khoảng cách, Typography, mã màu, Border, Shadow và Radius.',
    focusPoints: ['Layout & Grid System', 'Card & Spacing', 'Typography & Colors', 'Border & Glass UI'],
  },
  {
    id: 'banner_design',
    name: 'Mode 8: Banner & Visual Design',
    shortLabel: 'Banner & Quảng cáo',
    badge: 'Copy Space',
    description:
      'Phân tích vị trí chủ thể, khoảng trống tiêu đề (copy space), màu thương hiệu và bố cục đồ họa.',
    focusPoints: ['Vị trí chủ thể', 'Vùng trống tiêu đề', 'Màu thương hiệu', 'Tùy chọn Không tạo chữ'],
  },
  {
    id: 'glass_ui',
    name: 'Mode 9: Glass UI Design — Giao diện Kính Mờ Đa Sắc',
    shortLabel: 'Glass UI Design',
    badge: 'Glassmorphism',
    description:
      'Phân tích độ trong suốt, backdrop-blur, viền phản sáng, bóng đổ mềm, hệ lưới card và gradient đa tầng.',
    focusPoints: ['Backdrop Blur & Opacity', 'Border & Specular Highlight', 'Grid & Card Radius', 'Ambient Glow'],
  },
  {
    id: 'architecture_interior',
    name: 'Mode 10: Architecture & Interior — Kiến trúc & Nội thất',
    shortLabel: 'Kiến trúc & Nội thất',
    badge: 'Spatial & Materials',
    description:
      'Phân tích hình khối công trình, phối cảnh không gian, bố trí nội thất, vật liệu gỗ/đá/kính và ánh sáng tự nhiên/đèn.',
    focusPoints: ['Phối cảnh & Tỷ lệ phòng', 'Vật liệu Kiến trúc', 'Ánh sáng Cửa sổ & Đèn', 'Bố trí Nội thất'],
  },
  {
    id: 'landscape',
    name: 'Mode 11: Landscape — Phong cảnh & Môi trường',
    shortLabel: 'Phong cảnh & Thiên nhiên',
    badge: 'Atmosphere & Depth',
    description:
      'Phân tích tiền cảnh, trung cảnh, hậu cảnh, đường chân trời, điều kiện thời tiết, khí quyển và ánh sáng tự nhiên.',
    focusPoints: ['Tiền/Trung/Hậu cảnh', 'Khí quyển & Thời tiết', 'Giờ vàng / Ánh sáng trời', 'Địa hình & Thực vật'],
  },
  {
    id: 'cinematic',
    name: 'Mode 12: Cinematic Photography — Nhiếp ảnh Điện ảnh',
    shortLabel: 'Cinematic Photography',
    badge: 'Anamorphic & Grading',
    description:
      'Phân tích khung hình điện ảnh, tương phản sáng tối (chiaroscuro), rim light, độ sâu trường ảnh và color grading.',
    focusPoints: ['Framing Điện ảnh', 'Tương phản & Rim Light', 'Color Grading', 'Chiều sâu Trường ảnh'],
  },
  {
    id: 'illustration_3d',
    name: 'Mode 13: Illustration & 3D Render — Minh họa & Đồ họa 3D',
    shortLabel: 'Illustration & 3D',
    badge: 'Stylized & PBR',
    description:
      'Phân tích kỹ thuật dựng hình 3D, vật liệu PBR, subsurface scattering hoặc nét cọ, mảng màu minh họa 2D.',
    focusPoints: ['Kỹ thuật Render / Nét vẽ', 'Vật liệu PBR / Shading', 'Đặt đèn Studio 3D', 'Bảng màu Nghệ thuật'],
  },
  {
    id: 'general_analysis',
    name: 'Mode 14: General Image Analysis — Phân tích Tổng quát Đa năng',
    shortLabel: 'Phân tích Tổng quát',
    badge: 'All-in-One Vision',
    description:
      'Phân tích cân bằng toàn diện 10 yếu tố thị giác cho mọi loại hình ảnh bất kỳ.',
    focusPoints: ['Chủ thể & Bối cảnh', 'Bố cục & Góc máy', 'Ánh sáng & Bảng màu', 'Chất liệu & Typography'],
  },
];

export interface TargetAIToolMeta {
  id: TargetAIToolId;
  name: string;
  versionNote: string;
  supportsNegativePromptField: boolean;
  aspectRatioSyntax: string;
  parameterNotes: string;
  formatPromptForTool: (
    basePrompt: string,
    negativePrompt: string,
    aspectRatio: string,
    noTextOption: boolean
  ) => { formattedMainPrompt: string; formattedParameters: string; toolGuidance: string };
}

export const TARGET_AI_TOOLS: TargetAIToolMeta[] = [
  {
    id: 'universal',
    name: 'Universal (Đa mô hình trung lập)',
    versionNote: 'Chuẩn mô tả ngôn ngữ tự nhiên có cấu trúc',
    supportsNegativePromptField: true,
    aspectRatioSyntax: 'Tỷ lệ khung hình mô tả trực tiếp trong văn bản',
    parameterNotes:
      'Tương thích với mọi mô hình sinh ảnh hiện đại. Không sử dụng cờ lệnh riêng biệt.',
    formatPromptForTool: (base, neg, ar, noText) => ({
      formattedMainPrompt: `${base}${noText ? ' Do not generate any text, typography, or watermarks in the image.' : ''}`,
      formattedParameters: `Aspect Ratio: ${ar} | Negative Constraints: ${neg || 'None'}`,
      toolGuidance:
        'Sao chép Main Prompt vào ô nhập chính và Negative Prompt vào trường loại trừ (nếu công cụ đích có hỗ trợ).',
    }),
  },
  {
    id: 'gemini_image',
    name: 'Gemini Image (Imagen / Nano Banana)',
    versionNote: 'Google GenAI Image Generation',
    supportsNegativePromptField: false,
    aspectRatioSyntax: 'aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9"',
    parameterNotes:
      'Ưu tiên câu mô tả hoàn chỉnh, tự nhiên. Các yếu tố cần tránh được chuyển thành câu chỉ dẫn khẳng định ở cuối prompt.',
    formatPromptForTool: (base, neg, ar, noText) => {
      const avoidClause = neg
        ? ` Ensure the scene avoids: ${neg}.`
        : '';
      const textClause = noText
        ? ' Keep copy space clean without any rendered text or lettering.'
        : '';
      return {
        formattedMainPrompt: `${base} Framed in ${ar} aspect ratio.${textClause}${avoidClause}`,
        formattedParameters: `config: { imageConfig: { aspectRatio: "${normalizeStandardAspectRatio(ar)}" } }`,
        toolGuidance:
          'Gemini Image hoạt động tốt nhất với câu văn mô tả mạch lạc và cấu hình aspectRatio trong imageConfig.',
      };
    },
  },
  {
    id: 'openai_image',
    name: 'OpenAI Image Generation',
    versionNote: 'Natural Language Descriptive Prompting',
    supportsNegativePromptField: false,
    aspectRatioSyntax: 'size: "1024x1024" | "1792x1024" | "1024x1792"',
    parameterNotes:
      'Không có trường Negative Prompt tách rời; các ràng buộc độ trung thực được tích hợp trực tiếp vào cuối đoạn mô tả.',
    formatPromptForTool: (base, neg, ar, noText) => ({
      formattedMainPrompt: `${base}${noText ? ' Do not include any text, letters, or signage.' : ''}${
        neg ? ` Strictly avoid: ${neg}.` : ''
      }`,
      formattedParameters: `Recommended Aspect Ratio: ${ar}`,
      toolGuidance:
        'Sử dụng trực tiếp đoạn văn bản tự nhiên chi tiết; các ràng buộc loại trừ đã được lồng ghép vào cuối prompt.',
    }),
  },
  {
    id: 'midjourney',
    name: 'Midjourney (v6 / v6.1 Verified Syntax)',
    versionNote: 'Hỗ trợ tham số --ar và --no đã xác minh',
    supportsNegativePromptField: true,
    aspectRatioSyntax: '--ar <width>:<height>',
    parameterNotes:
      'Chỉ sử dụng các tham số chuẩn đã được tài liệu xác nhận (--ar, --no, --style raw). Không tự chế tham số không tồn tại.',
    formatPromptForTool: (base, neg, ar, noText) => {
      const cleanAr = normalizeStandardAspectRatio(ar);
      const shortNeg = neg
        ? neg
            .split(',')
            .slice(0, 6)
            .map((s) => s.trim())
            .filter(Boolean)
            .join(', ')
        : '';
      const noFlag =
        noText && shortNeg
          ? ` --no text, typography, watermark, ${shortNeg}`
          : noText
          ? ' --no text, typography, letters, watermark'
          : shortNeg
          ? ` --no ${shortNeg}`
          : '';
      return {
        formattedMainPrompt: `${base} --ar ${cleanAr}${noFlag}`,
        formattedParameters: `--ar ${cleanAr}${noFlag}`,
        toolGuidance:
          'Midjourney nhận các cờ tham số ở cuối câu lệnh (--ar cho tỷ lệ khung hình, --no cho các thành phần cần loại trừ).',
      };
    },
  },
  {
    id: 'stable_diffusion',
    name: 'Stable Diffusion (SD 1.5 / WebUI)',
    versionNote: 'Tag & Phrase Prompting + Separate Negative Prompt',
    supportsNegativePromptField: true,
    aspectRatioSyntax: 'Width × Height (px) trong trình tạo ảnh',
    parameterNotes:
      'Hỗ trợ trường Negative Prompt độc lập. Phân tách rõ ràng giữa Prompt mô tả chính và Negative Prompt.',
    formatPromptForTool: (base, neg, ar, noText) => ({
      formattedMainPrompt: base,
      formattedParameters: `Target Aspect Ratio: ${ar} | Separate Negative Prompt Field: Enabled${
        noText ? ' (Include: text, watermark, signature in Negative Prompt)' : ''
      }`,
      toolGuidance:
        'Dán Main Prompt vào ô Positive Prompt và sao chép riêng Negative Prompt vào ô Negative Prompt của giao diện SD.',
    }),
  },
  {
    id: 'sdxl',
    name: 'SDXL (Stable Diffusion XL)',
    versionNote: 'Dual Text Encoder (Natural Prose + Keywords)',
    supportsNegativePromptField: true,
    aspectRatioSyntax: 'Độ phân giải gốc đề xuất ~1024×1024 hoặc tương đương tỷ lệ',
    parameterNotes:
      'SDXL hiểu tốt câu mô tả tự nhiên kết hợp cụm từ chất liệu/ánh sáng, có trường Negative Prompt riêng.',
    formatPromptForTool: (base, neg, ar, noText) => ({
      formattedMainPrompt: `${base}${noText ? ', clean background without any text or typography' : ''}`,
      formattedParameters: `Aspect Ratio: ${ar} | Negative Prompt: ${neg || 'Standard SDXL negative'}`,
      toolGuidance:
        'Sử dụng đồng thời Main Prompt và Negative Prompt để kiểm soát bố cục và chi tiết bề mặt.',
    }),
  },
  {
    id: 'flux',
    name: 'FLUX (FLUX.1 Dev / Pro / Schnell)',
    versionNote: 'T5-XXL Natural Language Architecture',
    supportsNegativePromptField: false,
    aspectRatioSyntax: 'aspect_ratio: "1:1" | "16:9" | "9:16" | "4:3" | "3:2"',
    parameterNotes:
      'FLUX sử dụng bộ mã hóa ngôn ngữ tự nhiên T5-XXL, không sử dụng Negative Prompt truyền thống. Mọi chỉ dẫn được diễn đạt bằng câu tự nhiên.',
    formatPromptForTool: (base, _neg, ar, noText) => ({
      formattedMainPrompt: `${base}${
        noText
          ? ' The composition contains pure visual elements with no text, titles, or watermarks.'
          : ''
      }`,
      formattedParameters: `Aspect Ratio: ${normalizeStandardAspectRatio(ar)} | Natural Language Guidance`,
      toolGuidance:
        'FLUX ưu tiên văn xuôi mô tả chi tiết thứ tự không gian (tiền cảnh, trung cảnh, hậu cảnh) và ánh sáng.',
    }),
  },
];

// BƯỚC 15: THƯ VIỆN 16 PROMPT TEMPLATE CHUYÊN DỤNG
export interface PromptTemplateItem {
  id: string;
  name: string;
  category: string;
  recommendedMode: AnalysisModeId;
  detailLevel: DetailLevelMode;
  styleDirective: string;
  fidelityNote: string;
}

export const PROMPT_TEMPLATES: PromptTemplateItem[] = [
  {
    id: 'tpl_photorealistic',
    name: '1. Photorealistic (Chân thực nhiếp ảnh)',
    category: 'Photography',
    recommendedMode: 'faithful_recreation',
    detailLevel: 'ultra_detailed',
    styleDirective: 'Tập trung mô tả độ chân thực quang học, kết cấu vật lý tự nhiên và ánh sáng thực tế.',
    fidelityNote: 'Bảo toàn 100% chủ thể và bố cục quan sát được.',
  },
  {
    id: 'tpl_cinematic',
    name: '2. Cinematic (Điện ảnh & Chiều sâu)',
    category: 'Film & Storytelling',
    recommendedMode: 'composition_analysis',
    detailLevel: 'ultra_detailed',
    styleDirective: 'Nhấn mạnh phân lớp không gian, tỷ lệ khung hình điện ảnh, hướng sáng và tương phản màu sắc.',
    fidelityNote: 'Giữ nguyên vị trí chủ thể và góc máy.',
  },
  {
    id: 'tpl_portrait',
    name: '3. Portrait (Chân dung nghệ thuật & Studio)',
    category: 'People',
    recommendedMode: 'portrait_character',
    detailLevel: 'ultra_detailed',
    styleDirective: 'Mô tả kỹ mái tóc, trang phục, hướng nhìn, biểu cảm, ánh sáng key/fill/rim và độ sâu trường ảnh.',
    fidelityNote: 'Không suy đoán danh tính hoặc thêm phụ kiện không có trong ảnh.',
  },
  {
    id: 'tpl_commercial_product',
    name: '4. Commercial Product (Sản phẩm thương mại)',
    category: 'E-Commerce',
    recommendedMode: 'product_commercial',
    detailLevel: 'ultra_detailed',
    styleDirective: 'Mô tả hình khối sản phẩm, độ bóng/nhám của vật liệu, bóng đổ mặt bàn và nền studio.',
    fidelityNote: 'Bảo toàn màu sắc và tỷ lệ hình học của sản phẩm.',
  },
  {
    id: 'tpl_website_banner',
    name: '5. Website Banner (Banner & Copy Space)',
    category: 'Marketing',
    recommendedMode: 'banner_design',
    detailLevel: 'standard',
    styleDirective: 'Xác định rõ vị trí chủ thể lệch trái/phải và vùng khoảng trống âm dành cho tiêu đề.',
    fidelityNote: 'Hỗ trợ tùy chọn không sinh chữ mới trên nền banner.',
  },
  {
    id: 'tpl_ui_screenshot',
    name: '6. UI Screenshot (Giao diện Website / App)',
    category: 'UI/UX Design',
    recommendedMode: 'ui_screenshot',
    detailLevel: 'ultra_detailed',
    styleDirective: 'Phân tích hệ thống lưới, Header, Sidebar, Card, bo góc, bóng đổ, bảng màu và phân cấp chữ.',
    fidelityNote: 'Tái tạo chính xác cấu trúc bố cục giao diện.',
  },
  {
    id: 'tpl_interior',
    name: '7. Interior Design (Thiết kế nội thất)',
    category: 'Architecture',
    recommendedMode: 'detailed_visual',
    detailLevel: 'ultra_detailed',
    styleDirective: 'Mô tả bố trí đồ nội thất, vật liệu gỗ/đá/vải/kính, ánh sáng cửa sổ và đèn trang trí.',
    fidelityNote: 'Giữ đúng phối cảnh phòng và tỷ lệ nội thất.',
  },
  {
    id: 'tpl_architecture',
    name: '8. Architecture (Kiến trúc & Công trình)',
    category: 'Architecture',
    recommendedMode: 'composition_analysis',
    detailLevel: 'ultra_detailed',
    styleDirective: 'Phân tích hình khối mặt đứng, đường dẫn phối cảnh, vật liệu ngoại thất và ánh sáng bầu trời.',
    fidelityNote: 'Bảo toàn cấu trúc hình học công trình.',
  },
  {
    id: 'tpl_landscape',
    name: '9. Landscape (Phong cảnh & Thiên nhiên)',
    category: 'Nature',
    recommendedMode: 'composition_analysis',
    detailLevel: 'standard',
    styleDirective: 'Phân tích tiền cảnh, trung cảnh, hậu cảnh, điều kiện khí quyển và ánh sáng tự nhiên.',
    fidelityNote: 'Giữ đúng địa hình và bảng màu tự nhiên.',
  },
  {
    id: 'tpl_fashion',
    name: '10. Fashion (Thời trang & Lookbook)',
    category: 'Fashion',
    recommendedMode: 'portrait_character',
    detailLevel: 'ultra_detailed',
    styleDirective: 'Tập trung vào phom dáng trang phục, chất liệu vải, nếp gấp, tư thế tạo dáng và bảng màu.',
    fidelityNote: 'Không thay đổi kiểu dáng hoặc màu trang phục.',
  },
  {
    id: 'tpl_character_design',
    name: '11. Character Design (Thiết kế nhân vật)',
    category: 'Concept Art',
    recommendedMode: 'portrait_character',
    detailLevel: 'ultra_detailed',
    styleDirective: 'Mô tả tỷ lệ cơ thể, trang phục, phụ kiện nhận diện, bảng màu nhân vật và phong cách vẽ.',
    fidelityNote: 'Bảo toàn toàn bộ đặc điểm nhận diện nhân vật.',
  },
  {
    id: 'tpl_illustration',
    name: '12. Illustration (Tranh minh họa 2D/Digital)',
    category: 'Art & Design',
    recommendedMode: 'style_analysis',
    detailLevel: 'standard',
    styleDirective: 'Phân tích nét vẽ, mảng màu phẳng hoặc chuyển sắc, chất liệu cọ và bố cục đồ họa.',
    fidelityNote: 'Giữ đúng phong cách minh họa gốc.',
  },
  {
    id: 'tpl_3d_render',
    name: '13. 3D Render (Đồ họa 3D & Isometric)',
    category: '3D Graphics',
    recommendedMode: 'style_analysis',
    detailLevel: 'ultra_detailed',
    styleDirective: 'Mô tả vật liệu PBR, subsurface scattering, global illumination và độ mịn bề mặt 3D.',
    fidelityNote: 'Bảo toàn hình khối 3D và cách đặt đèn.',
  },
  {
    id: 'tpl_minimalist',
    name: '14. Minimalist (Tối giản & Không gian âm)',
    category: 'Minimalism',
    recommendedMode: 'composition_analysis',
    detailLevel: 'concise',
    styleDirective: 'Nhấn mạnh tỷ lệ khoảng trống âm, sự tinh gọn của chủ thể và bảng màu tối giản.',
    fidelityNote: 'Không thêm bất kỳ chi tiết phụ nào.',
  },
  {
    id: 'tpl_glass_ui',
    name: '15. Glass UI (Glassmorphism & Translucent)',
    category: 'UI/UX Design',
    recommendedMode: 'ui_screenshot',
    detailLevel: 'ultra_detailed',
    styleDirective: 'Mô tả độ mờ kính (backdrop blur), viền mảnh phản sáng, bóng đổ mềm và nền đa sắc.',
    fidelityNote: 'Giữ đúng tỷ lệ thẻ và hiệu ứng trong suốt.',
  },
  {
    id: 'tpl_storytelling',
    name: '16. Visual Storytelling (Kể chuyện bằng hình ảnh)',
    category: 'Film & Storytelling',
    recommendedMode: 'detailed_visual',
    detailLevel: 'ultra_detailed',
    styleDirective: 'Mô tả tương tác giữa các chủ thể, bối cảnh môi trường và bầu không khí thị giác.',
    fidelityNote: 'Chỉ mô tả hành động và bối cảnh có căn cứ trong ảnh.',
  },
];

export function normalizeStandardAspectRatio(rawRatio: string): string {
  const cleaned = (rawRatio || '').trim();
  const valid = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9', '4:5', '5:4'];
  for (const v of valid) {
    if (cleaned.includes(v)) return v;
  }
  return '1:1';
}

export function computeImageAspectRatioInfo(w: number, h: number): {
  exactPixelRatio: string;
  nearestStandardRatio: string;
  framingRecommendation: string;
} {
  if (!w || !h) {
    return {
      exactPixelRatio: '1:1',
      nearestStandardRatio: '1:1',
      framingRecommendation: 'Khung hình vuông cân đối (1:1).',
    };
  }
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(w, h);
  const exactPixelRatio = `${Math.round(w / d)}:${Math.round(h / d)} (${w}×${h}px)`;

  const ratio = w / h;
  const standards = [
    { label: '1:1', val: 1, desc: 'Khung vuông (1:1) — Phù hợp Avatar, Sản phẩm, Post vuông.' },
    { label: '4:3', val: 4 / 3, desc: 'Khung ngang tiêu chuẩn (4:3) — Phù hợp nhiếp ảnh & trình chiếu.' },
    { label: '3:4', val: 3 / 4, desc: 'Khung dọc tiêu chuẩn (3:4) — Phù hợp chân dung & poster.' },
    { label: '3:2', val: 3 / 2, desc: 'Khung ngang nhiếp ảnh 35mm (3:2) — Phù hợp Lookbook & Editorial.' },
    { label: '2:3', val: 2 / 3, desc: 'Khung dọc nhiếp ảnh (2:3) — Phù hợp thời trang & chân dung.' },
    { label: '16:9', val: 16 / 9, desc: 'Khung ngang rộng (16:9) — Phù hợp Website Hero, Banner, Điện ảnh.' },
    { label: '9:16', val: 9 / 16, desc: 'Khung dọc toàn màn hình (9:16) — Phù hợp Story, Reels, Mobile UI.' },
    { label: '21:9', val: 21 / 9, desc: 'Khung siêu rộng Ultrawide (21:9) — Phù hợp Banner ngang & Cinematic.' },
  ];

  let nearest = standards[0];
  let minDiff = Math.abs(ratio - nearest.val);
  for (const s of standards) {
    const diff = Math.abs(ratio - s.val);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = s;
    }
  }

  return {
    exactPixelRatio,
    nearestStandardRatio: nearest.label,
    framingRecommendation: nearest.desc,
  };
}

// Trích xuất thông số thị giác thực tế từ Pixel của ImageData (Bảng màu HEX ước lượng, độ sáng, tương phản, bố cục)
export interface ClientVisualTelemetry {
  width: number;
  height: number;
  aspectInfo: {
    exactPixelRatio: string;
    nearestStandardRatio: string;
    framingRecommendation: string;
  };
  estimatedHexSwatches: EstimatedColorSwatch[];
  colorTemperature: 'Ấm (Warm tone)' | 'Lạnh (Cool tone)' | 'Trung tính (Neutral tone)';
  avgBrightnessPercent: number;
  contrastLevel: string;
  saturationLevel: string;
  lightingDirectionEstimate: string;
  focalQuadrant: string;
  edgeDensityLevel: string;
  base64JpegData: string;
  base64MimeType: string;
}

export function extractClientVisualTelemetry(imageData: ImageData): ClientVisualTelemetry {
  const origW = imageData.width;
  const origH = imageData.height;
  const aspectInfo = computeImageAspectRatioInfo(origW, origH);

  // Tạo bản thu gọn tối đa 1024px để gửi lên Gemini API nhanh & nhẹ bộ nhớ
  const maxApiDim = 1024;
  const scale = Math.min(1, maxApiDim / Math.max(origW, origH));
  const apiW = Math.max(16, Math.round(origW * scale));
  const apiH = Math.max(16, Math.round(origH * scale));

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = origW;
  srcCanvas.height = origH;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.putImageData(imageData, 0, 0);

  const apiCanvas = document.createElement('canvas');
  apiCanvas.width = apiW;
  apiCanvas.height = apiH;
  const apiCtx = apiCanvas.getContext('2d')!;
  apiCtx.fillStyle = '#FFFFFF';
  apiCtx.fillRect(0, 0, apiW, apiH);
  apiCtx.drawImage(srcCanvas, 0, 0, apiW, apiH);

  const dataUrl = apiCanvas.toDataURL('image/jpeg', 0.86);
  const base64JpegData = dataUrl.split(',')[1] || '';

  // Phân tích pixel trên lưới thu gọn 120×120
  const sampleCanvas = document.createElement('canvas');
  const sw = 96;
  const sh = 96;
  sampleCanvas.width = sw;
  sampleCanvas.height = sh;
  const sCtx = sampleCanvas.getContext('2d')!;
  sCtx.drawImage(srcCanvas, 0, 0, sw, sh);
  const sData = sCtx.getImageData(0, 0, sw, sh).data;

  let lumSum = 0;
  let lumSqSum = 0;
  let satSum = 0;
  let warmScore = 0;

  let topLum = 0;
  let bottomLum = 0;
  let leftLum = 0;
  let rightLum = 0;

  const quadrantEdge = [0, 0, 0, 0]; // TL, TR, BL, BR
  let totalEdge = 0;

  // Gom cụm màu đơn giản (Quantized Buckets) để tìm 5 mã HEX nổi bật thực tế
  const colorBuckets = new Map<
    string,
    { count: number; rSum: number; gSum: number; bSum: number; sat: number }
  >();

  const totalPixels = sw * sh;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const idx = (y * sw + x) * 4;
      const r = sData[idx];
      const g = sData[idx + 1];
      const b = sData[idx + 2];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      lumSum += lum;
      lumSqSum += lum * lum;

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
      satSum += sat;

      warmScore += r - b;

      if (y < sh / 2) topLum += lum;
      else bottomLum += lum;
      if (x < sw / 2) leftLum += lum;
      else rightLum += lum;

      // Tính độ biến thiên biên cục bộ
      if (x < sw - 1 && y < sh - 1) {
        const rightIdx = (y * sw + (x + 1)) * 4;
        const downIdx = ((y + 1) * sw + x) * 4;
        const diff =
          Math.abs(r - sData[rightIdx]) +
          Math.abs(g - sData[rightIdx + 1]) +
          Math.abs(b - sData[rightIdx + 2]) +
          Math.abs(r - sData[downIdx]) +
          Math.abs(g - sData[downIdx + 1]) +
          Math.abs(b - sData[downIdx + 2]);
        totalEdge += diff;
        const qIdx = (y < sh / 2 ? 0 : 2) + (x < sw / 2 ? 0 : 1);
        quadrantEdge[qIdx] += diff;
      }

      const qr = Math.round(r / 32) * 32;
      const qg = Math.round(g / 32) * 32;
      const qb = Math.round(b / 32) * 32;
      const key = `${qr}_${qg}_${qb}`;
      const existing = colorBuckets.get(key);
      if (existing) {
        existing.count++;
        existing.rSum += r;
        existing.gSum += g;
        existing.bSum += b;
      } else {
        colorBuckets.set(key, { count: 1, rSum: r, gSum: g, bSum: b, sat });
      }
    }
  }

  const avgLum = lumSum / totalPixels;
  const varianceLum = Math.max(0, lumSqSum / totalPixels - avgLum * avgLum);
  const stdLum = Math.sqrt(varianceLum);
  const avgSat = satSum / totalPixels;
  const avgWarm = warmScore / totalPixels;

  const sortedBuckets = Array.from(colorBuckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const roles: ('dominant' | 'secondary' | 'accent' | 'background')[] = [
    'dominant',
    'secondary',
    'background',
    'accent',
    'accent',
  ];

  const estimatedHexSwatches: EstimatedColorSwatch[] = sortedBuckets.map((b, idx) => {
    const r = Math.min(255, Math.round(b.rSum / b.count));
    const g = Math.min(255, Math.round(b.gSum / b.count));
    const bl = Math.min(255, Math.round(b.bSum / b.count));
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl
      .toString(16)
      .padStart(2, '0')}`.toUpperCase();
    const pct = Math.max(2, Math.round((b.count / totalPixels) * 100));
    return {
      hex,
      role: roles[idx] || 'accent',
      name: describeHexColorNameVi(r, g, bl),
      percentage: pct,
      note: 'Màu ước lượng từ phân tích pixel hình ảnh',
    };
  });

  const colorTemperature =
    avgWarm > 14
      ? 'Ấm (Warm tone)'
      : avgWarm < -14
      ? 'Lạnh (Cool tone)'
      : 'Trung tính (Neutral tone)';

  const contrastLevel =
    stdLum > 68
      ? 'Tương phản cao (High contrast)'
      : stdLum > 42
      ? 'Tương phản trung bình cân bằng (Balanced contrast)'
      : 'Tương phản dịu nhẹ (Soft low-contrast)';

  const saturationLevel =
    avgSat > 0.45
      ? 'Độ bão hòa cao, màu sắc rực rỡ (Vibrant saturation)'
      : avgSat > 0.22
      ? 'Độ bão hòa tự nhiên vừa phải (Natural saturation)'
      : 'Độ bão hòa thấp / Trầm (Muted / Desaturated)';

  const vertDiff = (topLum - bottomLum) / (totalPixels / 2);
  const horizDiff = (leftLum - rightLum) / (totalPixels / 2);
  let lightingDirectionEstimate = 'Ánh sáng khuếch tán đều khắp khung hình (Even diffused lighting)';
  if (Math.abs(vertDiff) > 18 || Math.abs(horizDiff) > 18) {
    const vLabel = vertDiff > 18 ? 'từ phía trên' : vertDiff < -18 ? 'từ phía dưới' : '';
    const hLabel = horizDiff > 18 ? 'bên trái' : horizDiff < -18 ? 'bên phải' : '';
    lightingDirectionEstimate = `Nguồn sáng chính chiếu hướng ${[vLabel, hLabel]
      .filter(Boolean)
      .join(' ')}`.trim();
  }

  const maxQuadIdx = quadrantEdge.indexOf(Math.max(...quadrantEdge));
  const quadNames = [
    'Góc phần tư trên bên trái & trung tâm',
    'Góc phần tư trên bên phải & trung tâm',
    'Góc phần tư dưới bên trái & trung tâm',
    'Góc phần tư dưới bên phải & trung tâm',
  ];
  const focalQuadrant = quadNames[maxQuadIdx] || 'Vùng trung tâm khung hình';

  const avgEdgePerPixel = totalEdge / totalPixels;
  const edgeDensityLevel =
    avgEdgePerPixel > 55
      ? 'Mật độ chi tiết cao (High detail density)'
      : avgEdgePerPixel > 25
      ? 'Mật độ chi tiết vừa phải (Balanced detail density)'
      : 'Mật độ chi tiết tối giản, nhiều mảng phẳng (Minimalist / Smooth)';

  return {
    width: origW,
    height: origH,
    aspectInfo,
    estimatedHexSwatches,
    colorTemperature,
    avgBrightnessPercent: Math.round((avgLum / 255) * 100),
    contrastLevel,
    saturationLevel,
    lightingDirectionEstimate,
    focalQuadrant,
    edgeDensityLevel,
    base64JpegData,
    base64MimeType: 'image/jpeg',
  };
}

function describeHexColorNameVi(r: number, g: number, b: number): string {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 20) {
    if (lum > 225) return 'Trắng sáng';
    if (lum > 170) return 'Xám bạc sáng';
    if (lum > 100) return 'Xám trung tính';
    if (lum > 45) return 'Xám than đậm';
    return 'Đen trầm';
  }
  if (r >= g && r >= b) {
    if (g > b + 40) return lum > 170 ? 'Vàng kem / Hổ phách' : 'Cam đất / Nâu ấm';
    return lum > 170 ? 'Hồng phấn / San hô' : 'Đỏ đô / Đỏ thẫm';
  }
  if (g >= r && g >= b) {
    if (b > r + 30) return 'Xanh ngọc bích (Teal / Cyan)';
    return lum > 160 ? 'Xanh lá mạ sáng' : 'Xanh lục rừng';
  }
  if (r > g + 30) return lum > 160 ? 'Tím Lavender' : 'Tím chàm (Indigo / Violet)';
  return lum > 160 ? 'Xanh da trời (Sky Blue)' : 'Xanh dương đậm (Navy Blue)';
}

function getBrightnessLabel(pct: number): string {
  if (pct > 70) return 'high-key bright illumination';
  if (pct < 35) return 'low-key dramatic illumination';
  return 'balanced mid-tone exposure';
}

// Tạo bản phân tích dự phòng dựa trên dữ liệu Telemetry thực tế của ảnh khi API ngoại tuyến
export function buildTelemetryFallbackAnalysis(
  imageId: string,
  fileName: string,
  detectedFormat: string,
  mode: AnalysisModeId,
  targetTool: TargetAIToolId,
  outputLanguage: OutputLanguageMode,
  telemetry: ClientVisualTelemetry,
  apiErrorReason?: string
): StructuredImageAnalysis {
  const domSwatches = telemetry.estimatedHexSwatches
    .map((s) => `${s.name} (${s.hex} - ${s.percentage}%)`)
    .join(', ');
  const topHex = telemetry.estimatedHexSwatches.map((s) => s.hex).join(', ');
  const ar = telemetry.aspectInfo.nearestStandardRatio;

  const enFaithful = `A visually accurate composition framed in ${ar} aspect ratio (${telemetry.width}x${telemetry.height}px), featuring the primary subject positioned around the ${telemetry.focalQuadrant.toLowerCase()}. Illuminated by ${telemetry.lightingDirectionEstimate.toLowerCase()} with ${telemetry.contrastLevel.toLowerCase()} and ${getBrightnessLabel(
    telemetry.avgBrightnessPercent
  )}. The color palette is anchored by ${topHex} (${telemetry.colorTemperature}), exhibiting ${telemetry.saturationLevel.toLowerCase()} and ${telemetry.edgeDensityLevel.toLowerCase()}. Preserve the exact spatial proportions, subject count, material surface textures, and lighting direction of the reference image without adding extra objects or text.`;

  const viFaithful = `Bố cục hình ảnh chuẩn xác theo tỷ lệ khung hình ${ar} (${telemetry.width}×${telemetry.height}px), với trọng tâm thị giác đặt tại ${telemetry.focalQuadrant.toLowerCase()}. Ánh sáng: ${telemetry.lightingDirectionEstimate.toLowerCase()}, ${telemetry.contrastLevel.toLowerCase()}, độ sáng trung bình ${telemetry.avgBrightnessPercent}%. Bảng màu chủ đạo ước lượng từ ảnh gồm ${domSwatches} (${telemetry.colorTemperature}), ${telemetry.saturationLevel.toLowerCase()} và ${telemetry.edgeDensityLevel.toLowerCase()}. Giữ nguyên tỷ lệ không gian, số lượng chủ thể, chất liệu bề mặt và hướng sáng của ảnh tham chiếu, không tự ý thêm vật thể hay chữ mới.`;

  return {
    imageId,
    fileName,
    width: telemetry.width,
    height: telemetry.height,
    detectedFormat,
    analysisMode: mode,
    targetTool,
    outputLanguage,
    summary: `Phân tích trực tiếp từ dữ liệu thị giác của tệp "${fileName}" (${telemetry.width}×${telemetry.height}px, tỷ lệ ${ar}). Bảng màu ước lượng: ${domSwatches}.`,
    sceneType: mode === 'ui_screenshot' ? 'Giao diện kỹ thuật số / UI' : 'Hình ảnh tham chiếu thị giác',
    visualPurpose: 'Tái tạo bố cục, bảng màu, hướng sáng và mật độ chi tiết của ảnh gốc.',
    dominantElement: `Vùng chi tiết chính tập trung tại ${telemetry.focalQuadrant}`,
    detailDensity: telemetry.edgeDensityLevel,
    subjects: {
      count: 'Theo đúng các thành phần xuất hiện trong ảnh tham chiếu',
      primaryDescription: `Chủ thể chính nằm tại khu vực ${telemetry.focalQuadrant.toLowerCase()} với độ tương phản biên rõ ràng.`,
      positionInFrame: telemetry.focalQuadrant,
      scaleRatio: 'Cân đối theo khung hình gốc',
      poseAndAction: 'Giữ nguyên tư thế và trạng thái tĩnh/động như ảnh gốc',
      orientationAndGaze: 'Bảo toàn hướng quay và trục thị giác ban đầu',
      subjectRelationships: 'Giữ đúng khoảng cách tương đối giữa các thành phần',
      distinctiveFeatures: [
        `Tỷ lệ khung hình ${telemetry.aspectInfo.exactPixelRatio}`,
        `Bảng màu ${topHex}`,
        telemetry.edgeDensityLevel,
      ],
    },
    composition: {
      overallStructure: `Khung hình ${ar} với trọng tâm tại ${telemetry.focalQuadrant.toLowerCase()}`,
      foregroundMidgroundBackground: 'Phân tách lớp tiền cảnh, trung cảnh và hậu cảnh theo độ sắc nét biên.',
      negativeSpace:
        telemetry.edgeDensityLevel.includes('tối giản')
          ? 'Khoảng trống âm rộng và thoáng'
          : 'Khoảng trống âm vừa phải bao quanh chủ thể chính',
      visualBalanceAndFocalPoint: `Điểm nhấn thị giác tập trung tại ${telemetry.focalQuadrant.toLowerCase()}`,
      eyeLeadingLines: 'Dẫn hướng mắt theo độ chênh lệch tương phản sáng tối và sắc độ màu.',
      subjectToBackgroundRatio: 'Giữ nguyên tỷ lệ diện tích giữa chủ thể và nền của ảnh tham chiếu.',
    },
    cameraAndPerspective: {
      shotType: 'Medium / Standard Framing theo ảnh gốc',
      cameraAngle: 'Góc nhìn ngang tầm mắt hoặc góc chụp thực tế của ảnh tham chiếu',
      perspectiveType: 'Phối cảnh tự nhiên không biến dạng',
      depthOfField: 'Bảo toàn độ sâu trường ảnh của hình tham chiếu',
    },
    lighting: {
      keyLightSource: telemetry.lightingDirectionEstimate,
      fillAndRimLight: 'Ánh sáng bổ trợ cân bằng vùng tối theo độ sáng trung bình ' + telemetry.avgBrightnessPercent + '%',
      direction: telemetry.lightingDirectionEstimate,
      softnessAndIntensity: `Độ sáng tổng thể ${telemetry.avgBrightnessPercent}%`,
      contrastLevel: telemetry.contrastLevel,
      shadowsAndReflections: 'Bóng đổ và phản chiếu tự nhiên đồng nhất với hướng nguồn sáng chính',
      naturalOrArtificial: 'Theo điều kiện ánh sáng quan sát được trên bề mặt chủ thể',
    },
    colorPalette: {
      dominantColors: telemetry.estimatedHexSwatches
        .slice(0, 2)
        .map((s) => `${s.name} (${s.hex})`),
      secondaryColors: telemetry.estimatedHexSwatches
        .slice(2, 4)
        .map((s) => `${s.name} (${s.hex})`),
      accentColors: telemetry.estimatedHexSwatches
        .slice(4)
        .map((s) => `${s.name} (${s.hex})`),
      estimatedHexSwatches: telemetry.estimatedHexSwatches,
      colorTemperature: telemetry.colorTemperature,
      saturationAndContrast: `${telemetry.saturationLevel} • ${telemetry.contrastLevel}`,
      colorGrading: `Tông màu ${telemetry.colorTemperature.toLowerCase()} với bảng màu ${topHex}`,
      subjectBackgroundHarmony: 'Sự kết hợp hài hòa giữa sắc độ chủ thể và màu nền ước lượng.',
    },
    materialsAndTextures: {
      observedMaterials: ['Bề mặt vật liệu thực tế theo mật độ chi tiết ảnh'],
      surfaceCharacteristics: telemetry.edgeDensityLevel,
      roughnessAndReflectivity: `Tương phản bề mặt: ${telemetry.contrastLevel}`,
    },
    style: {
      primaryStyle:
        mode === 'ui_screenshot'
          ? 'Modern UI / Glassmorphism Layout'
          : mode === 'product_commercial'
          ? 'Commercial Studio Photography'
          : 'Faithful Visual Reference Style',
      secondaryTraits: [telemetry.colorTemperature, telemetry.contrastLevel],
      realismLevel: 'Cao — Bám sát đặc trưng thị giác của ảnh đầu vào',
      renderingTechnique: 'Kết xuất chi tiết sắc nét theo mật độ biên thực tế',
    },
    background: {
      settingDescription: `Nền mang tông màu ${
        telemetry.estimatedHexSwatches[2]?.name || telemetry.estimatedHexSwatches[0]?.name || 'trung tính'
      }`,
      backgroundObjects: ['Chỉ giữ các thành phần hậu cảnh có mặt trong ảnh gốc'],
      spatialDepth: 'Chiều sâu không gian tự nhiên giữa chủ thể và hậu cảnh',
    },
    visibleText: {
      hasVisibleText: false,
      readableTextItems: [],
      unreadableOrBlurryTextNote:
        'Chế độ phân tích pixel cục bộ không tự suy đoán nội dung văn bản nếu chưa kết nối Gemini Vision.',
    },
    aspectRatio: telemetry.aspectInfo,
    faithfulPrompt: outputLanguage === 'vi' ? viFaithful : enFaithful,
    detailedPrompt:
      outputLanguage === 'vi'
        ? `${viFaithful} Chi tiết ánh sáng đạt ${telemetry.avgBrightnessPercent}% độ sáng với ${telemetry.contrastLevel.toLowerCase()}. Bố cục khung hình ${telemetry.aspectInfo.exactPixelRatio} giữ trọn vẹn cấu trúc tiền cảnh, trung cảnh và hậu cảnh.`
        : `${enFaithful} Detailed surface rendering with ${telemetry.avgBrightnessPercent}% luminance balance, ${telemetry.contrastLevel.toLowerCase()}, and exact ${telemetry.aspectInfo.exactPixelRatio} spatial framing.`,
    concisePrompt:
      outputLanguage === 'vi'
        ? `Bố cục ${ar}, trọng tâm tại ${telemetry.focalQuadrant.toLowerCase()}, ${telemetry.lightingDirectionEstimate.toLowerCase()}, bảng màu ${topHex}, ${telemetry.contrastLevel.toLowerCase()}.`
        : `${ar} framing, focal subject at ${telemetry.focalQuadrant.toLowerCase()}, ${telemetry.lightingDirectionEstimate.toLowerCase()}, color palette ${topHex}, ${telemetry.contrastLevel.toLowerCase()}.`,
    editableBlocks: {
      subject: `Primary subject positioned at ${telemetry.focalQuadrant.toLowerCase()}, preserving exact proportions and count`,
      environment: `Clean environment matching the reference background tone (${
        telemetry.estimatedHexSwatches[0]?.hex || '#FFFFFF'
      })`,
      composition: `Balanced ${ar} framing (${telemetry.width}x${telemetry.height}px), preserving negative space and visual hierarchy`,
      lighting: `${telemetry.lightingDirectionEstimate}, ${telemetry.contrastLevel.toLowerCase()}, ${telemetry.avgBrightnessPercent}% average luminance`,
      colors: `Color palette anchored by estimated HEX values ${topHex} (${telemetry.colorTemperature})`,
      style: `High-fidelity visual reproduction with ${telemetry.edgeDensityLevel.toLowerCase()}`,
      aspectRatioAndFraming: `${ar} aspect ratio (${telemetry.aspectInfo.exactPixelRatio})`,
      fidelityConstraints:
        'Keep relative layout and positions, preserve subject count, do not add extra objects or unrequested text',
    },
    creativeVariationPrompt:
      outputLanguage === 'vi'
        ? `[Biến thể sáng tạo có kiểm soát] Giữ nguyên bố cục ${ar} và bảng màu chủ đạo (${topHex}), nhưng nâng cấp hiệu ứng ánh sáng điện ảnh sâu hơn và tăng độ sắc nét chi tiết bề mặt.`
        : `[Controlled Creative Variation] Maintain the core ${ar} composition and ${topHex} color harmony while enhancing cinematic rim lighting and micro-surface texture definition.`,
    negativePrompt:
      'unwanted additional objects, incorrect composition, distorted proportions, misplaced subjects, inconsistent lighting, incorrect color palette, duplicate objects, unwanted text, watermark, blurry artifacts, cropped frame',
    vietnamesePrompt: viFaithful,
    englishPrompt: enFaithful,
    confidenceAssessment: {
      directlyObserved: [
        `Kích thước thực tế ${telemetry.width}×${telemetry.height}px (${telemetry.aspectInfo.exactPixelRatio})`,
        `5 mã màu HEX ước lượng trực tiếp từ pixel: ${topHex}`,
        `Độ sáng trung bình ${telemetry.avgBrightnessPercent}% & ${telemetry.contrastLevel}`,
      ],
      reasonableInferences: [
        `Hướng sáng ước lượng: ${telemetry.lightingDirectionEstimate}`,
        `Vùng tập trung chi tiết: ${telemetry.focalQuadrant}`,
      ],
      insufficientDataToConclude: [
        'Thông số ống kính / máy ảnh vật lý (tiêu cự, khẩu độ, ISO)',
        'Ngữ nghĩa chi tiết sâu khi chạy ở chế độ dự phòng ngoại tuyến',
      ],
      qualitativeConfidenceLabel: apiErrorReason
        ? 'Trung bình (Đã trích xuất chính xác thông số màu sắc, ánh sáng & bố cục pixel cục bộ)'
        : 'Cao (Đã xác minh cấu trúc thị giác & pixel)',
    },
    uncertainties: [
      'Các mã màu HEX là giá trị ước lượng trung bình từ cụm pixel nổi bật trên ảnh.',
    ],
    warnings: apiErrorReason ? [apiErrorReason] : [],
  };
}

// BƯỚC 13: XUẤT DỮ LIỆU ĐA ĐỊNH DẠNG (TXT, JSON, CSV CHUẨN RFC-4180, MARKDOWN)
export function formatAnalysisAsTXT(
  analysis: StructuredImageAnalysis,
  onlyMainPrompt: boolean = false
): string {
  if (onlyMainPrompt) {
    return analysis.faithfulPrompt;
  }
  return [
    `====================================================================`,
    `IMAGE-TO-PROMPT STUDIO — BÁO CÁO PHÂN TÍCH & PROMPT TÁI HIỆN HÌNH ẢNH`,
    `====================================================================`,
    `Tên tệp: ${analysis.fileName}`,
    `Kích thước: ${analysis.width}×${analysis.height}px (${analysis.aspectRatio.exactPixelRatio})`,
    `Tỷ lệ chuẩn: ${analysis.aspectRatio.nearestStandardRatio}`,
    `Chế độ phân tích: ${analysis.analysisMode}`,
    `Công cụ AI mục tiêu: ${analysis.targetTool}`,
    ``,
    `--- 1. TÓM TẮT NỘI DUNG (SUMMARY) ---`,
    analysis.summary,
    ``,
    `--- 2. MAIN PROMPT (VERSION A — FAITHFUL RECREATION) ---`,
    analysis.faithfulPrompt,
    ``,
    `--- 3. NEGATIVE PROMPT ---`,
    analysis.negativePrompt,
    ``,
    `--- 4. CÁC PHIÊN BẢN PROMPT KHÁC (VARIANTS) ---`,
    `[Version B — Ultra-Detailed Prompt]:`,
    analysis.detailedPrompt,
    ``,
    `[Version C — Concise Prompt]:`,
    analysis.concisePrompt,
    ``,
    `[Version E — Creative Variation]:`,
    analysis.creativeVariationPrompt,
    ``,
    `--- 5. SONG NGỮ VIỆT – ANH ---`,
    `[English Version]:`,
    analysis.englishPrompt,
    ``,
    `[Phiên bản Tiếng Việt]:`,
    analysis.vietnamesePrompt,
    ``,
    `--- 6. BẢNG MÀU HEX ƯỚC LƯỢNG TỪ ẢNH ---`,
    ...analysis.colorPalette.estimatedHexSwatches.map(
      (s) => `- ${s.hex} (${s.name} | ${s.role} | ~${s.percentage}%): ${s.note}`
    ),
    ``,
    `--- 7. THÔNG SỐ & ĐỘ TIN CẬY ---`,
    `Đánh giá độ tin cậy: ${analysis.confidenceAssessment.qualitativeConfidenceLabel}`,
    `Quan sát trực tiếp: ${analysis.confidenceAssessment.directlyObserved.join('; ')}`,
    `Lưu ý chưa đủ dữ liệu kết luận: ${analysis.confidenceAssessment.insufficientDataToConclude.join('; ')}`,
  ].join('\n');
}

export function formatAnalysisAsMarkdown(
  analysis: StructuredImageAnalysis,
  onlyMainPrompt: boolean = false
): string {
  if (onlyMainPrompt) {
    return `# ${analysis.fileName}\n\n\`\`\`text\n${analysis.faithfulPrompt}\n\`\`\`\n`;
  }
  return [
    `# Báo Cáo Phân Tích Image-to-Prompt: \`${analysis.fileName}\``,
    ``,
    `- **Kích thước gốc:** ${analysis.width}×${analysis.height}px (\`${analysis.aspectRatio.exactPixelRatio}\`)`,
    `- **Tỷ lệ khung hình đề xuất:** \`${analysis.aspectRatio.nearestStandardRatio}\``,
    `- **Chế độ phân tích:** \`${analysis.analysisMode}\` | **Công cụ đích:** \`${analysis.targetTool}\``,
    ``,
    `## 1. Tóm tắt thị giác`,
    `${analysis.summary}`,
    ``,
    `## 2. Main Prompt (Faithful Recreation)`,
    `\`\`\`text`,
    `${analysis.faithfulPrompt}`,
    `\`\`\``,
    ``,
    `## 3. Negative Prompt`,
    `\`\`\`text`,
    `${analysis.negativePrompt}`,
    `\`\`\``,
    ``,
    `## 4. Các phiên bản Prompt (Variants)`,
    `### Version B — Ultra-Detailed Prompt`,
    `> ${analysis.detailedPrompt}`,
    ``,
    `### Version C — Concise Prompt`,
    `> ${analysis.concisePrompt}`,
    ``,
    `### Version E — Creative Variation`,
    `> ${analysis.creativeVariationPrompt}`,
    ``,
    `## 5. Bản Song Ngữ (Vietnamese & English)`,
    `- **English Prompt:** ${analysis.englishPrompt}`,
    `- **Prompt Tiếng Việt:** ${analysis.vietnamesePrompt}`,
    ``,
    `## 6. Phân tích chi tiết thị giác`,
    `- **Chủ thể:** ${analysis.subjects.primaryDescription} (Vị trí: ${analysis.subjects.positionInFrame})`,
    `- **Bố cục:** ${analysis.composition.overallStructure} | Không gian âm: ${analysis.composition.negativeSpace}`,
    `- **Góc máy & Phối cảnh:** ${analysis.cameraAndPerspective.shotType}, ${analysis.cameraAndPerspective.cameraAngle}, DOF: ${analysis.cameraAndPerspective.depthOfField}`,
    `- **Ánh sáng:** ${analysis.lighting.keyLightSource} (${analysis.lighting.contrastLevel})`,
    `- **Bảng màu ước lượng:** ${analysis.colorPalette.estimatedHexSwatches
      .map((s) => `\`${s.hex}\` (${s.name})`)
      .join(', ')}`,
    `- **Chất liệu:** ${analysis.materialsAndTextures.observedMaterials.join(', ')}`,
    `- **Phong cách:** ${analysis.style.primaryStyle} (${analysis.style.realismLevel})`,
  ].join('\n');
}

function escapeCsvCell(val: string | number | undefined | null): string {
  const str = String(val ?? '');
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatBatchAnalysesAsCSV(analyses: StructuredImageAnalysis[]): string {
  const headers = [
    'Image ID',
    'Image Name',
    'Dimensions',
    'Aspect Ratio',
    'Analysis Mode',
    'Target Tool',
    'Language',
    'Summary',
    'Main Prompt (Faithful)',
    'Ultra-Detailed Prompt',
    'Concise Prompt',
    'Negative Prompt',
    'English Prompt',
    'Vietnamese Prompt',
    'Estimated HEX Palette',
  ];

  const rows = analyses.map((a) => [
    escapeCsvCell(a.imageId),
    escapeCsvCell(a.fileName),
    escapeCsvCell(`${a.width}x${a.height}`),
    escapeCsvCell(a.aspectRatio.nearestStandardRatio),
    escapeCsvCell(a.analysisMode),
    escapeCsvCell(a.targetTool),
    escapeCsvCell(a.outputLanguage),
    escapeCsvCell(a.summary),
    escapeCsvCell(a.faithfulPrompt),
    escapeCsvCell(a.detailedPrompt),
    escapeCsvCell(a.concisePrompt),
    escapeCsvCell(a.negativePrompt),
    escapeCsvCell(a.englishPrompt),
    escapeCsvCell(a.vietnamesePrompt),
    escapeCsvCell(a.colorPalette.estimatedHexSwatches.map((s) => s.hex).join(' ')),
  ]);

  // Thêm UTF-8 BOM (\uFEFF) để Excel hiển thị tiếng Việt có dấu chính xác
  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

// Tạo ảnh mẫu đa dạng để kiểm thử thực tế (Chân dung, Sản phẩm, Banner có Copy Space, Giao diện UI)
export async function generateImageToPromptDemoFile(
  demoType: 'portrait' | 'product' | 'banner' | 'ui_screenshot'
): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  if (demoType === 'banner') {
    // Banner thương mại với chủ thể bên phải và khoảng trống Copy Space bên trái
    const grad = ctx.createLinearGradient(0, 0, 1280, 720);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(0.55, '#1E1B4B');
    grad.addColorStop(1, '#4F46E5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);

    // Chủ thể tai nghe 3D phát sáng ở góc phần ba bên phải
    ctx.save();
    ctx.translate(920, 360);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 28;
    ctx.beginPath();
    ctx.arc(0, -20, 175, Math.PI, 0);
    ctx.stroke();

    ctx.fillStyle = '#EC4899';
    ctx.beginPath();
    ctx.roundRect(-195, -30, 70, 155, 32);
    ctx.roundRect(125, -30, 70, 155, 32);
    ctx.fill();
    ctx.restore();

    // Dòng chữ tiêu đề mẫu bên trái
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('NEXT-GEN AUDIO STUDIO', 90, 290);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '28px sans-serif';
    ctx.fillText('Spatial Sound & Glassmorphic Acoustic Design', 90, 350);
  } else if (demoType === 'ui_screenshot') {
    // Ảnh chụp màn hình giao diện Dashboard Glass UI
    ctx.fillStyle = '#0B0F19';
    ctx.fillRect(0, 0, 1280, 720);

    // Sidebar trái
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(24, 24, 96, 672, 16);
    ctx.fill();

    // Header
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(144, 24, 1112, 72, 14);
    ctx.fill();

    // 3 Bento Cards
    const cardColors = ['#312E81', '#065F46', '#701A75'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = cardColors[i];
      ctx.beginPath();
      ctx.roundRect(144 + i * 378, 120, 356, 240, 14);
      ctx.fill();
    }

    // Main Chart Panel
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(144, 384, 1112, 312, 14);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('ANALYTICS DASHBOARD UI', 175, 68);
  } else if (demoType === 'product') {
    // Ảnh sản phẩm chai nước hoa cao cấp trên bục đá
    const bg = ctx.createLinearGradient(0, 0, 0, 720);
    bg.addColorStop(0, '#FEF3C7');
    bg.addColorStop(1, '#FDE68A');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1280, 720);

    // Bục đá tròn
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.ellipse(640, 560, 260, 55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thân chai thủy tinh vàng hổ phách
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.roundRect(530, 230, 220, 310, 28);
    ctx.fill();

    // Nắp kim loại vàng kim
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(595, 145, 90, 85);

    ctx.fillStyle = '#FEF3C7';
    ctx.font = 'bold 26px serif';
    ctx.fillText('LUMIÈRE OR', 558, 390);
  } else {
    // Chân dung studio ánh sáng Rim Light
    const bg = ctx.createRadialGradient(640, 340, 60, 640, 360, 650);
    bg.addColorStop(0, '#312E81');
    bg.addColorStop(1, '#090D16');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1280, 720);

    ctx.fillStyle = '#4F46E5';
    ctx.beginPath();
    ctx.arc(640, 680, 250, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#FDBA74';
    ctx.beginPath();
    ctx.ellipse(640, 320, 110, 138, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1E1B4B';
    ctx.beginPath();
    ctx.arc(640, 285, 122, Math.PI * 0.92, Math.PI * 2.08);
    ctx.fill();
  }

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Blob error'))), 'image/jpeg', 0.92)
  );

  const names = {
    portrait: 'chan-dung-studio-rimlight.jpg',
    product: 'nuoc-hoa-lumiere-studio.jpg',
    banner: 'banner-audio-copyspace.jpg',
    ui_screenshot: 'giao-dien-dashboard-glass-ui.jpg',
  };

  return new File([blob], names[demoType], { type: 'image/jpeg' });
}
