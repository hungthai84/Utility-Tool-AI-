// Types & Constants cho CodePen Analyzer Studio
// Hỗ trợ phân tích mã nguồn CodePen, trích xuất HTML/CSS/JS, 21 mục phân tích, 10 Presets và xuất Prompt/Code đa framework

export type CodePenReadScope =
  | 'full_source'
  | 'partial_source'
  | 'preview_only'
  | 'requires_auth'
  | 'manual_paste'
  | 'fetch_error';

export interface CodePenExternalResource {
  type: 'css' | 'js';
  url: string;
  name: string;
  version?: string;
}

export interface CodePenParsedSource {
  url: string;
  penId: string;
  author: string;
  title: string;
  description: string;
  html: string;
  css: string;
  js: string;
  externalCss: string[];
  externalJs: string[];
  dependencies: CodePenExternalResource[];
  preprocessorHtml?: string;
  preprocessorCss?: string;
  preprocessorJs?: string;
  readScope: CodePenReadScope;
  isPublic: boolean;
  rawFetchedAt: string;
  previewUrl?: string;
  errorReason?: string;
}

export type AnalysisGroupId =
  | 'ui_ux'
  | 'source_code'
  | 'interactions'
  | 'audit_improvements'
  | 'recreation_porting';

export interface AnalysisItemDefinition {
  id: string;
  number: number;
  groupId: AnalysisGroupId;
  groupName: string;
  title: string;
  shortLabel: string;
  description: string;
  badge: string;
  focusPoints: string[];
}

export const CODEPEN_ANALYSIS_ITEMS: AnalysisItemDefinition[] = [
  // Nhóm A — UI/UX và thiết kế giao diện
  {
    id: 'item_1_layout',
    number: 1,
    groupId: 'ui_ux',
    groupName: 'Nhóm A: UI/UX & Thiết Kế Giao Diện',
    title: '1. Phân tích tổng thể giao diện',
    shortLabel: 'Bố cục tổng thể',
    badge: 'UI Hierarchy',
    description: 'Bố cục, cấu trúc các vùng, phân cấp thông tin, khoảng cách, tỷ lệ và cân bằng thị giác.',
    focusPoints: ['Bố cục các khối', 'Phân cấp thông tin', 'Khoảng cách & Tỷ lệ', 'Thành phần nổi bật'],
  },
  {
    id: 'item_2_color',
    number: 2,
    groupId: 'ui_ux',
    groupName: 'Nhóm A: UI/UX & Thiết Kế Giao Diện',
    title: '2. Phân tích màu sắc',
    shortLabel: 'Bảng màu & Gradient',
    badge: 'Color Palette',
    description: 'Màu nền, màu chữ, màu nhấn, gradient, tương phản và cách sử dụng màu theo từng thành phần.',
    focusPoints: ['Màu nền & Màu chữ', 'Màu nhấn & Gradient', 'Tương phản sáng/tối', 'Mã màu HEX/RGBA'],
  },
  {
    id: 'item_3_typography',
    number: 3,
    groupId: 'ui_ux',
    groupName: 'Nhóm A: UI/UX & Thiết Kế Giao Diện',
    title: '3. Phân tích typography',
    shortLabel: 'Typography',
    badge: 'Fonts & Scale',
    description: 'Font family, cỡ chữ, font weight, line height, letter spacing và hệ thống tiêu đề/nội dung.',
    focusPoints: ['Font Families', 'Thang kích thước chữ', 'Line-height & Spacing', 'Hệ thống Headings'],
  },
  {
    id: 'item_4_components',
    number: 4,
    groupId: 'ui_ux',
    groupName: 'Nhóm A: UI/UX & Thiết Kế Giao Diện',
    title: '4. Phân tích component UI',
    shortLabel: 'Component UI',
    badge: 'Atomic UI',
    description: 'Button, Card, Input, Navigation, Modal, Tabs, Dropdown, Tooltip, Badge, Icon và Form thực tế.',
    focusPoints: ['Button & Card styles', 'Inputs & Form controls', 'Navigation & Tabs', 'Trạng thái hover/active'],
  },
  {
    id: 'item_5_glass_effects',
    number: 5,
    groupId: 'ui_ux',
    groupName: 'Nhóm A: UI/UX & Thiết Kế Giao Diện',
    title: '5. Phân tích Glass UI và hiệu ứng',
    shortLabel: 'Glass UI & Hiệu ứng',
    badge: 'Glassmorphism',
    description: 'Transparency, backdrop blur, border, shadow, border radius, hover effects, transition và layering.',
    focusPoints: ['Backdrop filter blur', 'Viền bán trong suốt', 'Bóng đổ mềm đa lớp', 'Border radius & Layers'],
  },

  // Nhóm B — Phân tích mã nguồn
  {
    id: 'item_6_html',
    number: 6,
    groupId: 'source_code',
    groupName: 'Nhóm B: Phân Tích Mã Nguồn',
    title: '6. Phân tích HTML',
    shortLabel: 'Cấu trúc DOM / HTML',
    badge: 'Semantic DOM',
    description: 'Cấu trúc DOM, Semantic HTML, các vùng layout, phân cấp thẻ và component structure.',
    focusPoints: ['Semantic HTML5', 'Cấu trúc cây DOM', 'Thuộc tính data-* / id / class', 'Phân chia vùng layout'],
  },
  {
    id: 'item_7_css',
    number: 7,
    groupId: 'source_code',
    groupName: 'Nhóm B: Phân Tích Mã Nguồn',
    title: '7. Phân tích CSS',
    shortLabel: 'Kiến trúc CSS',
    badge: 'CSS / Styling',
    description: 'Class & selector, Flexbox, CSS Grid, biến CSS custom properties, pseudo-elements và media queries.',
    focusPoints: ['Flexbox / Grid systems', 'CSS Variables (--*)', 'Pseudo-elements (::before/::after)', 'Quy tắc xung đột'],
  },
  {
    id: 'item_8_js',
    number: 8,
    groupId: 'source_code',
    groupName: 'Nhóm B: Phân Tích Mã Nguồn',
    title: '8. Phân tích JavaScript',
    shortLabel: 'Logic JavaScript',
    badge: 'JS & State',
    description: 'Biến, hàm, event listeners, state, DOM manipulation, event delegation và API được sử dụng.',
    focusPoints: ['Biến & Cấu trúc hàm', 'Event Listeners', 'State & DOM updates', 'Event Delegation'],
  },
  {
    id: 'item_9_dependencies',
    number: 9,
    groupId: 'source_code',
    groupName: 'Nhóm B: Phân Tích Mã Nguồn',
    title: '9. Phân tích thư viện và dependency',
    shortLabel: 'Thư viện & Phụ thuộc',
    badge: 'Dependencies',
    description: 'Thư viện đang sử dụng, external assets, frameworks, preprocessors và yêu cầu để chạy mã.',
    focusPoints: ['Thư viện external CDN', 'Icons & Fonts CDN', 'Preprocessors (SCSS, Babel)', 'Khả năng loại bỏ phụ thuộc'],
  },

  // Nhóm C — Tương tác và hành vi
  {
    id: 'item_10_functions',
    number: 10,
    groupId: 'interactions',
    groupName: 'Nhóm C: Tương Tác & Hành Vi',
    title: '10. Phân tích chức năng tương tác',
    shortLabel: 'Chức năng tương tác',
    badge: 'User Flow',
    description: 'Nút bấm, menu, modal, form, tabs, accordion, bộ lọc, tìm kiếm, kéo thả và tương tác chuột/bàn phím.',
    focusPoints: ['Sự kiện click/hover/drag', 'Keyboard accessibility', 'Modal / Drawer toggling', 'Form input handling'],
  },
  {
    id: 'item_11_animation',
    number: 11,
    groupId: 'interactions',
    groupName: 'Nhóm C: Tương Tác & Hành Vi',
    title: '11. Phân tích animation & chuyển động',
    shortLabel: 'Animation & Keyframes',
    badge: 'Motion Design',
    description: 'Keyframes, transition timings (cubic-bezier), hover effects, scroll effects và entrance/exit animations.',
    focusPoints: ['@keyframes rules', 'Transition timings', 'Micro-interactions', 'GPU acceleration (transform/opacity)'],
  },
  {
    id: 'item_12_responsive',
    number: 12,
    groupId: 'interactions',
    groupName: 'Nhóm C: Tương Tác & Hành Vi',
    title: '12. Phân tích responsive đa màn hình',
    shortLabel: 'Responsive Multi-Device',
    badge: 'Breakpoints',
    description: 'Breakpoints, bố cục Desktop, Tablet, Mobile, thành phần ẩn/hiện và các vùng có thể tràn ngang.',
    focusPoints: ['@media queries', 'Bố cục Desktop vs Mobile', 'Anti-overflow rules', 'Viewport scaling'],
  },

  // Nhóm D — Kiểm tra và cải tiến
  {
    id: 'item_13_bugs',
    number: 13,
    groupId: 'audit_improvements',
    groupName: 'Nhóm D: Kiểm Tra & Cải Tiến',
    title: '13. Phát hiện lỗi & xung đột',
    shortLabel: 'Phát hiện lỗi & Bug',
    badge: 'Bug Detection',
    description: 'Lỗi cú pháp, selector không khớp, xung đột CSS toàn cục, event listener rò rỉ và dữ liệu chưa xử lý.',
    focusPoints: ['Lỗi cú pháp HTML/CSS/JS', 'Xung đột namespace CSS', 'Rò rỉ bộ nhớ / listeners', 'Edge cases chưa xử lý'],
  },
  {
    id: 'item_14_performance',
    number: 14,
    groupId: 'audit_improvements',
    groupName: 'Nhóm D: Kiểm Tra & Cải Tiến',
    title: '14. Phân tích hiệu suất & tối ưu',
    shortLabel: 'Hiệu suất & Tối ưu',
    badge: 'Performance',
    description: 'Mã lặp lại, reflow/repaint không cần thiết, animation tốn CPU/GPU, kích thước tệp và thời gian render.',
    focusPoints: ['Tránh Layout Thrashing', 'Tối ưu CSS Selectors', 'Giảm tải CPU khi cuộn', 'Giảm kích thước bundle'],
  },
  {
    id: 'item_15_accessibility',
    number: 15,
    groupId: 'audit_improvements',
    groupName: 'Nhóm D: Kiểm Tra & Cải Tiến',
    title: '15. Phân tích accessibility (A11y)',
    shortLabel: 'Tiêu chuẩn A11y',
    badge: 'Accessibility',
    description: 'Semantic HTML, label/aria-label, focus rings, contrast tỷ lệ tương phản và điều hướng bàn phím.',
    focusPoints: ['ARIA attributes chuẩn', 'Focus visible states', 'Tương phản màu WCAG AA', 'Hỗ trợ Screen Readers'],
  },
  {
    id: 'item_16_suggestions',
    number: 16,
    groupId: 'audit_improvements',
    groupName: 'Nhóm D: Kiểm Tra & Cải Tiến',
    title: '16. Đề xuất cải tiến kiến trúc',
    shortLabel: 'Đề xuất cải tiến',
    badge: 'Refactoring',
    description: 'Tối ưu cấu trúc, tách component nhỏ tái sử dụng, chuẩn hóa styling và nâng cao khả năng bảo trì.',
    focusPoints: ['Modular Componentization', 'Clean Code patterns', 'Khả năng tái sử dụng', 'Dễ dàng mở rộng'],
  },

  // Nhóm E — Tái tạo và chuyển đổi
  {
    id: 'item_17_recreate_ui',
    number: 17,
    groupId: 'recreation_porting',
    groupName: 'Nhóm E: Tái Tạo & Chuyển Đổi Framework',
    title: '17. Tái tạo giao diện trung thành (Faithful UI)',
    shortLabel: 'Tái tạo giao diện',
    badge: 'Pixel-Perfect',
    description: 'Tạo prompt hoặc code nhằm tái tạo giao diện gần nhất 100% với bản tham chiếu CodePen.',
    focusPoints: ['Giữ đúng tỷ lệ khung hình', 'Tái lập chính xác màu sắc', 'Đồng bộ typography', 'Không thêm bớt ngoài ý muốn'],
  },
  {
    id: 'item_18_recreate_logic',
    number: 18,
    groupId: 'recreation_porting',
    groupName: 'Nhóm E: Tái Tạo & Chuyển Đổi Framework',
    title: '18. Tái tạo chức năng & tương tác',
    shortLabel: 'Tái tạo chức năng',
    badge: 'Full Logic',
    description: 'Tạo prompt hoặc code để triển khai đầy đủ hành vi tương tác đã phân tích từ CodePen.',
    focusPoints: ['Xử lý State hoàn chỉnh', 'Mô phỏng chính xác sự kiện', 'Animation mượt mà', 'Xử lý lỗi thực tế'],
  },
  {
    id: 'item_19_framework_port',
    number: 19,
    groupId: 'recreation_porting',
    groupName: 'Nhóm E: Tái Tạo & Chuyển Đổi Framework',
    title: '19. Chuyển đổi framework đích',
    shortLabel: 'Chuyển đổi Framework',
    badge: 'Porting Suite',
    description: 'Chuyển đổi sang Next.js App Router, React 19 JSX/TSX, Tailwind CSS v4 hoặc Vue 3.',
    focusPoints: ['React / Next.js JSX', 'Tailwind utility classes', 'TypeScript type-safety', 'Không dùng thư viện nặng'],
  },
  {
    id: 'item_20_extract_component',
    number: 20,
    groupId: 'recreation_porting',
    groupName: 'Nhóm E: Tái Tạo & Chuyển Đổi Framework',
    title: '20. Trích xuất Component độc lập',
    shortLabel: 'Trích xuất Component',
    badge: 'Reusable Props',
    description: 'Tạo component độc lập kèm Props, default values, CSS scoped và hướng dẫn nhúng.',
    focusPoints: ['Reusable Props interface', 'Cô lập CSS không xung đột', 'Tự đóng gói logic', 'Dễ dàng import'],
  },
  {
    id: 'item_21_enhance_ui',
    number: 21,
    groupId: 'recreation_porting',
    groupName: 'Nhóm E: Tái Tạo & Chuyển Đổi Framework',
    title: '21. Nâng cấp giao diện Glassmorphism hiện đại',
    shortLabel: 'Nâng cấp Glass UI',
    badge: 'Enhanced Version',
    description: 'Nâng cấp giao diện với hiệu ứng Glass UI đa sắc, hiệu ứng tương tác cao cấp và phong cách website hiện tại.',
    focusPoints: ['Đồng bộ Theme 5 màu', 'Glass soft claymorphism', 'Micro-interactions nâng cấp', 'Tách biệt rõ với bản gốc'],
  },
];

export interface CodePenPresetDefinition {
  id: string;
  name: string;
  badge: string;
  description: string;
  selectedItemIds: string[];
  defaultOutputMode?: OutputTargetMode;
  defaultFramework?: TargetFrameworkStack;
}

export const CODEPEN_QUICK_PRESETS: CodePenPresetDefinition[] = [
  {
    id: 'preset_full',
    name: 'Full Analysis',
    badge: 'Toàn diện 21 mục',
    description: 'Phân tích tất cả các mục từ UI/UX, mã nguồn, tương tác, lỗi đến tái tạo chuyển đổi.',
    selectedItemIds: CODEPEN_ANALYSIS_ITEMS.map((i) => i.id),
  },
  {
    id: 'preset_ui_ux',
    name: 'UI/UX Analysis',
    badge: 'Giao diện & Mỹ thuật',
    description: 'Tập trung phân tích bố cục, bảng màu, typography, components và hiệu ứng Glass UI.',
    selectedItemIds: [
      'item_1_layout',
      'item_2_color',
      'item_3_typography',
      'item_4_components',
      'item_5_glass_effects',
      'item_12_responsive',
    ],
  },
  {
    id: 'preset_code_arch',
    name: 'Code Analysis',
    badge: 'Kiến trúc mã nguồn',
    description: 'Mổ xẻ chi tiết HTML DOM, quy tắc CSS/Flexbox/Grid, biến JS và thư viện phụ thuộc.',
    selectedItemIds: ['item_6_html', 'item_7_css', 'item_8_js', 'item_9_dependencies'],
  },
  {
    id: 'preset_interactions',
    name: 'Interaction Analysis',
    badge: 'Hành vi & Animation',
    description: 'Khám phá keyframes, transition timings, tương tác chuột, kéo thả và chuyển động.',
    selectedItemIds: ['item_8_js', 'item_10_functions', 'item_11_animation', 'item_18_recreate_logic'],
  },
  {
    id: 'preset_responsive',
    name: 'Responsive Audit',
    badge: 'Đa màn hình & Anti-overflow',
    description: 'Đánh giá breakpoints, layout mobile/tablet/desktop và các vùng có nguy cơ tràn màn hình.',
    selectedItemIds: ['item_1_layout', 'item_7_css', 'item_12_responsive', 'item_13_bugs'],
  },
  {
    id: 'preset_bugs_perf',
    name: 'Bug & Performance Audit',
    badge: 'Kiểm tra lỗi & Tối ưu',
    description: 'Rà soát lỗi cú pháp, xung đột CSS, rò rỉ bộ nhớ, hiệu suất render và tiêu chuẩn A11y.',
    selectedItemIds: [
      'item_13_bugs',
      'item_14_performance',
      'item_15_accessibility',
      'item_16_suggestions',
    ],
  },
  {
    id: 'preset_recreate',
    name: 'Recreate This Pen',
    badge: 'Tái tạo chuẩn xác',
    description: 'Tái lập trung thành 100% giao diện và tương tác, xuất mã nguồn sạch sẵn sàng chạy.',
    selectedItemIds: [
      'item_1_layout',
      'item_2_color',
      'item_6_html',
      'item_7_css',
      'item_8_js',
      'item_11_animation',
      'item_17_recreate_ui',
      'item_18_recreate_logic',
    ],
  },
  {
    id: 'preset_integration_prompt',
    name: 'Generate Integration Prompt',
    badge: 'Prompt AI tích hợp',
    description: 'Tạo prompt chuẩn hóa chi tiết dành riêng cho AI Coding Agent tích hợp vào website hiện tại.',
    selectedItemIds: [
      'item_1_layout',
      'item_7_css',
      'item_8_js',
      'item_13_bugs',
      'item_16_suggestions',
      'item_19_framework_port',
      'item_20_extract_component',
    ],
  },
  {
    id: 'preset_complete_code',
    name: 'Generate Complete Code',
    badge: 'Xuất mã nguồn đầy đủ',
    description: 'Chuyển đổi toàn bộ Pen sang React / Next.js / Tailwind sạch sẽ, có chú thích đầy đủ.',
    selectedItemIds: [
      'item_6_html',
      'item_7_css',
      'item_8_js',
      'item_17_recreate_ui',
      'item_18_recreate_logic',
      'item_19_framework_port',
    ],
  },
  {
    id: 'preset_component',
    name: 'Create Component',
    badge: 'Trích xuất Component',
    description: 'Đóng gói Pen thành một Component độc lập, tái sử dụng cao, kèm Props và style cô lập.',
    selectedItemIds: [
      'item_4_components',
      'item_17_recreate_ui',
      'item_19_framework_port',
      'item_20_extract_component',
    ],
  },
];

export type OutputTargetMode = 'prompt' | 'code' | 'both';
export type OutputGenerationMode = OutputTargetMode;

export type TargetFrameworkStack =
  | 'nextjs_app_router'
  | 'react_jsx'
  | 'tailwind_v4'
  | 'vue_3'
  | 'vanilla_html_css_js';

export type ImplementationFidelityMode =
  | 'faithful'
  | 'clean_refactored'
  | 'enhanced_glass';

export interface CodePenAnalysisConfig {
  selectedItemIds: string[];
  outputMode: OutputTargetMode;
  targetStack: TargetFrameworkStack;
  targetFramework?: TargetFrameworkStack;
  fidelityMode: ImplementationFidelityMode;
  isolateStyles: boolean;
  removeExternalLibs: boolean;
  addResponsiveRules: boolean;
  addAccessibilityAria: boolean;
  customInstructions: string;
  includeAudit?: boolean;
  includePromptVariants?: boolean;
  includeZipExport?: boolean;
}

export interface GeneratedCodeFiles {
  componentCode: string;
  cssCode: string;
  htmlCode: string;
  jsCode: string;
  tailwindClassesSummary: string;
  suggestedFileStructure: { path: string; description: string; content: string }[];
  dependencies: { name: string; version?: string; isDev?: boolean }[];
  integrationGuideMarkdown: string;
  reactComponentTsx?: string;
  tailwindClasses?: string;
  isolatedCss?: string;
  usageExample?: string;
}

export interface CodePenAnalysisResult {
  penMetadata: CodePenParsedSource;
  penSource?: any;
  analyzedAt?: string;
  config?: any;
  overviewSummary?: any;
  uiAnalysis?: any;
  sourceCodeAnalysis?: any;
  interactionsAnalysis?: any;
  auditAndImprovements?: any;
  dependenciesDetected?: any[];
  summary: string;
  analysisDate: string;
  selectedItemsCount: number;
  outputMode: OutputTargetMode;
  targetStack: TargetFrameworkStack;
  fidelityMode: ImplementationFidelityMode;

  // Chi tiết phân tích theo từng nhóm
  uiUxReport: string;
  sourceCodeReport: string;
  interactionReport: string;
  issuesAndImprovementsReport: string;

  // Prompts sinh ra
  masterPrompt: string;
  promptVariants: {
    title: string;
    description: string;
    promptText: string;
  }[];
  generatedPrompt?: {
    fullMasterPrompt: string;
    recreationPrompt: string;
    portingPrompt: string;
  };

  // Code sinh ra
  generatedCode: GeneratedCodeFiles;

  // Preview HTML an toàn (chuẩn bị sẵn để nhúng vào iframe sandbox)
  sandboxedPreviewHtml: string;
}

// 3 Mẫu CodePen Demo Tuyệt Đẹp để Thử Nghiệm Tức Thì
export interface CodePenDemoSample {
  id: string;
  title: string;
  author: string;
  sourceUrl: string;
  category: string;
  description: string;
  html: string;
  css: string;
  js: string;
  externalCss: string[];
  externalJs: string[];
}

export const SAMPLE_CODEPEN_DEMOS: CodePenDemoSample[] = [
  {
    id: 'demo_glass_card',
    title: 'Interactive 3D Glassmorphic Tilt Card',
    author: 'Elena Rostova',
    sourceUrl: 'https://codepen.io/elena-design/pen/WNMxYKb',
    category: 'UI Components',
    description:
      'Thẻ kính mờ 3D Glassmorphism tương tác di chuột (Parallax Tilt), viền phản sáng quang học, hạt phát sáng neon và hiệu ứng Claymorphism.',
    html: `<div class="card-scene">
  <div class="glass-tilt-card" id="tiltCard">
    <div class="card-glow" id="cardGlow"></div>
    <div class="card-badge">PRO EDITION</div>
    <div class="card-icon">💎</div>
    <h3 class="card-title">Cybernetic Neural Mesh</h3>
    <p class="card-desc">Thiết kế thẻ kính đa lớp (Multi-layer Glassmorphism) với góc nghiêng quang học 3D, bóng đổ mềm và tương phản cao cấp.</p>
    <div class="card-stats">
      <div class="stat"><span class="num">99.8%</span><span class="lbl">Fidelity</span></div>
      <div class="stat"><span class="num">120 FPS</span><span class="lbl">GPU Smooth</span></div>
      <div class="stat"><span class="num">0 Latency</span><span class="lbl">Realtime</span></div>
    </div>
    <button class="card-btn" id="cardBtn">Khám Phá Ngay</button>
  </div>
</div>`,
    css: `:root {
  --bg-gradient: linear-gradient(135deg, #090d16 0%, #17153a 50%, #2e1065 100%);
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.22);
  --neon-cyan: #38bdf8;
  --neon-purple: #c084fc;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-gradient);
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

.card-scene {
  perspective: 1200px;
}

.glass-tilt-card {
  position: relative;
  width: 340px;
  padding: 32px 28px;
  background: var(--glass-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  border-radius: 28px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 35px rgba(192, 132, 252, 0.15);
  color: #ffffff;
  transform-style: preserve-3d;
  transition: transform 0.15s ease-out, box-shadow 0.3s ease;
  cursor: pointer;
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 28px;
  background: radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.25), transparent 70%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.glass-tilt-card:hover .card-glow {
  opacity: 1;
}

.card-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: var(--neon-cyan);
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.4);
  padding: 4px 12px;
  border-radius: 999px;
  margin-bottom: 16px;
}

.card-icon {
  font-size: 42px;
  margin-bottom: 12px;
  transform: translateZ(40px);
  filter: drop-shadow(0 0 16px rgba(192, 132, 252, 0.6));
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: #ffffff;
  transform: translateZ(30px);
}

.card-desc {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 20px 0;
  transform: translateZ(20px);
}

.card-stats {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  margin-bottom: 22px;
  transform: translateZ(25px);
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat .num {
  font-size: 14px;
  font-weight: 800;
  color: var(--neon-cyan);
}

.stat .lbl {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.55);
}

.card-btn {
  width: 100%;
  padding: 12px 0;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #06b6d4, #8b5cf6);
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 10px 20px -5px rgba(139, 92, 246, 0.5);
  transform: translateZ(35px);
  transition: transform 0.2s ease, filter 0.2s ease;
}

.card-btn:hover {
  filter: brightness(1.15);
  transform: translateZ(45px) scale(1.02);
}`,
    js: `const card = document.getElementById('tiltCard');
const glow = document.getElementById('cardGlow');
const btn = document.getElementById('cardBtn');

if (card) {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -16;
    const rotateY = ((x - centerX) / centerX) * 16;
    
    card.style.transform = \`rotateX(\${rotateX}deg) rotateY(\${rotateY}deg)\`;
    glow.style.background = \`radial-gradient(circle at \${x}px \${y}px, rgba(56, 189, 248, 0.35), transparent 60%)\`;
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'rotateX(0deg) rotateY(0deg)';
  });
}

if (btn) {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.textContent = '✓ Đã Kích Hoạt!';
    setTimeout(() => { btn.textContent = 'Khám Phá Ngay'; }, 1800);
  });
}`,
    externalCss: [],
    externalJs: [],
  },
  {
    id: 'demo_animated_tabs',
    title: 'Morphing Floating Navbar & Slider Indicator',
    author: 'Alexandre Mercier',
    sourceUrl: 'https://codepen.io/alex-m/pen/JjYVWWb',
    category: 'Navigation UI',
    description:
      'Thanh điều hướng nổi với thanh chỉ báo trượt (Elastic Pill Slider), chuyển đổi mượt mà giữa các tab và hiển thị nội dung động.',
    html: `<div class="nav-wrapper">
  <nav class="pill-nav" id="pillNav">
    <div class="slider-indicator" id="indicator"></div>
    <button class="nav-item active" data-tab="dashboard">Dashboard</button>
    <button class="nav-item" data-tab="analytics">Analytics</button>
    <button class="nav-item" data-tab="projects">Dự Án</button>
    <button class="nav-item" data-tab="settings">Cài Đặt</button>
  </nav>
  <div class="content-box" id="tabContent">
    <h3>Bảng Điều Khiển Dashboard</h3>
    <p>Nội dung được cập nhật tức thì với hiệu ứng mờ nhạt và trượt mượt mà (Fade & Slide transition).</p>
  </div>
</div>`,
    css: `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  color: #f8fafc;
  font-family: system-ui, sans-serif;
}

.nav-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
}

.pill-nav {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(16px);
  padding: 6px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.slider-indicator {
  position: absolute;
  top: 6px;
  left: 6px;
  height: calc(100% - 12px);
  border-radius: 999px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  box-shadow: 0 4px 16px rgba(168, 85, 247, 0.45);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.35s ease;
  z-index: 1;
}

.nav-item {
  position: relative;
  z-index: 2;
  border: none;
  background: transparent;
  padding: 10px 22px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.25s ease;
}

.nav-item.active {
  color: #ffffff;
}

.content-box {
  width: 380px;
  padding: 24px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.content-box h3 {
  margin: 0 0 10px 0;
  color: #c084fc;
}

.content-box p {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
}`,
    js: `const nav = document.getElementById('pillNav');
const indicator = document.getElementById('indicator');
const items = document.querySelectorAll('.nav-item');
const contentBox = document.getElementById('tabContent');

const contents = {
  dashboard: { title: 'Bảng Điều Khiển Dashboard', desc: 'Theo dõi chỉ số KPI, hiệu năng hệ thống và lưu lượng theo thời gian thực.' },
  analytics: { title: 'Phân Tích Dữ Liệu Chuyên Sâu', desc: 'Biểu đồ trực quan hóa dữ liệu người dùng và tỷ lệ chuyển đổi tuần.' },
  projects: { title: 'Kho Dự Án Đang Hoạt Động', desc: 'Quản lý 18 dự án đang triển khai trên kiến trúc Next.js và Cloud.' },
  settings: { title: 'Cấu Hình & Tùy Biến Hệ Thống', desc: 'Quản lý quyền truy cập, API Key và giao diện cá nhân hóa.' }
};

function updateIndicator(btn) {
  indicator.style.width = \`\${btn.offsetWidth}px\`;
  indicator.style.transform = \`translateX(\${btn.offsetLeft - 6}px)\`;
}

if (items.length > 0) {
  updateIndicator(items[0]);
}

items.forEach(item => {
  item.addEventListener('click', () => {
    items.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    updateIndicator(item);
    
    const key = item.getAttribute('data-tab');
    if (contentBox && contents[key]) {
      contentBox.style.opacity = '0';
      contentBox.style.transform = 'translateY(6px)';
      setTimeout(() => {
        contentBox.innerHTML = \`<h3>\${contents[key].title}</h3><p>\${contents[key].desc}</p>\`;
        contentBox.style.opacity = '1';
        contentBox.style.transform = 'translateY(0)';
      }, 150);
    }
  });
});`,
    externalCss: [],
    externalJs: [],
  },
  {
    id: 'demo_particle_button',
    title: 'Magnetic Particle Explosion Button',
    author: 'Kenji Sato',
    sourceUrl: 'https://codepen.io/kenji-ui/pen/vYXXmQQ',
    category: 'Micro-Interactions',
    description:
      'Nút bấm từ tính với hiệu ứng vỡ hạt Canvas (Particle Burst) khi nhấn, tỏa ánh sáng Neon đa màu và tự hồi phục.',
    html: `<div class="container">
  <canvas id="particleCanvas"></canvas>
  <button class="burst-btn" id="burstBtn">
    <span class="btn-text">⚡ Phân Tích Mã Nguồn</span>
  </button>
</div>`,
    css: `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #020617;
  font-family: system-ui, sans-serif;
  overflow: hidden;
}

.container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

#particleCanvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
}

.burst-btn {
  position: relative;
  padding: 18px 44px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6);
  border: none;
  border-radius: 999px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(236, 72, 153, 0.4);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
  user-select: none;
}

.burst-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 15px 40px rgba(139, 92, 246, 0.6);
}

.burst-btn:active {
  transform: scale(0.96);
}`,
    js: `const canvas = document.getElementById('particleCanvas');
const btn = document.getElementById('burstBtn');

if (canvas && btn) {
  const ctx = canvas.getContext('2d');
  canvas.width = 400;
  canvas.height = 400;
  
  let particles = [];
  const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#38bdf8', '#fbbf24'];

  function createBurst() {
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      particles.push({
        x: 200,
        y: 200,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.025 + 0.015
      });
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(render);
  }
  render();

  btn.addEventListener('click', (e) => {
    createBurst();
  });
}`,
    externalCss: [],
    externalJs: [],
  },
];

export const DEFAULT_ANALYSIS_CONFIG: CodePenAnalysisConfig = {
  selectedItemIds: CODEPEN_ANALYSIS_ITEMS.map((item) => item.id),
  outputMode: 'both',
  targetStack: 'nextjs_app_router',
  targetFramework: 'nextjs_app_router',
  fidelityMode: 'enhanced_glass',
  isolateStyles: true,
  removeExternalLibs: false,
  addResponsiveRules: true,
  addAccessibilityAria: true,
  customInstructions: '',
};
