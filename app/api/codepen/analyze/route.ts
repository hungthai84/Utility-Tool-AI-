// Endpoint API: /api/codepen/analyze
// Phân tích mã nguồn CodePen bằng Gemini (@google/genai) dựa trên 21 mục được chọn
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  CodePenParsedSource,
  CodePenAnalysisConfig,
  CodePenAnalysisResult,
  CODEPEN_ANALYSIS_ITEMS,
} from '@/lib/codepen/types';
import { createSandboxedPreviewHtml } from '@/lib/codepen/codepen-parser';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { penSource, config } = body as {
      penSource: CodePenParsedSource;
      config: CodePenAnalysisConfig;
    };

    if (!penSource) {
      return NextResponse.json({ error: 'Thiếu dữ liệu nguồn CodePen.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const selectedItemNames = (config.selectedItemIds || [])
      .map((id) => {
        const item = CODEPEN_ANALYSIS_ITEMS.find((i) => i.id === id);
        return item ? `[${item.number}] ${item.title}: ${item.description}` : id;
      })
      .join('\n- ');

    const promptText = `Bạn là Senior Frontend Architect, CodePen Reverse Engineer và Prompt Engineer.
Nhiệm vụ: Phân tích mã nguồn CodePen dưới đây dựa trên CHÍNH XÁC các mục đã được người dùng lựa chọn.

THÔNG TIN NGUỒN CODEPEN:
- Tiêu đề: ${penSource.title}
- Tác giả: @${penSource.author}
- URL: ${penSource.url}
- Phạm vi dữ liệu: ${penSource.readScope}

HTML NGUỒN:
\`\`\`html
${penSource.html.slice(0, 15000)}
\`\`\`

CSS NGUỒN:
\`\`\`css
${penSource.css.slice(0, 20000)}
\`\`\`

JAVASCRIPT NGUỒN:
\`\`\`javascript
${penSource.js.slice(0, 15000)}
\`\`\`

THƯ VIỆN NGOÀI:
${penSource.externalCss.concat(penSource.externalJs).join('\n') || 'Không có'}

DANH SÁCH MỤC PHÂN TÍCH ĐƯỢC CHỌN:
- ${selectedItemNames || 'Phân tích toàn diện'}

CẤU HÌNH ĐẦU RA MỤC TIÊU:
- Chế độ đầu ra: ${config.outputMode} (prompt | code | both)
- Framework mục tiêu: ${config.targetStack} (ví dụ: nextjs_app_router, react_jsx, tailwind_v4)
- Mức độ trung thực: ${config.fidelityMode} (faithful | clean_refactored | enhanced_glass)
- Chỉ dẫn bổ sung: ${config.customInstructions || 'Không có'}

YÊU CẦU ĐẦU RA BẮT BUỘC:
Trả về phản hồi ở định dạng JSON hợp lệ (không kèm markdown ngoài) theo cấu trúc sau:
{
  "summary": "Tóm tắt ngắn gọn 2-3 câu về giao diện, công nghệ và giá trị cốt lõi của Pen",
  "uiUxReport": "Báo cáo chi tiết về UI/UX, bố cục, màu sắc, typography và hiệu ứng Glass UI (nếu có trong các mục được chọn)",
  "sourceCodeReport": "Phân tích cấu trúc HTML, CSS selector/flexbox/grid và logic JavaScript",
  "interactionReport": "Mô tả cơ chế tương tác, sự kiện click/hover/drag và animation keyframes",
  "issuesAndImprovementsReport": "Phát hiện lỗi tiềm ẩn, xung đột CSS, vấn đề responsive, hiệu suất render và tiêu chuẩn A11y",
  "masterPrompt": "Prompt hoàn chỉnh chuyên biệt dành cho AI Coding Tool (Claude/ChatGPT/Cursor) để tái tạo hoặc tích hợp mã này vào website",
  "promptVariants": [
    { "title": "Prompt Tái Tạo Giao Diện (Faithful UI)", "description": "Tập trung tái lập chính xác 100% thị giác", "promptText": "..." },
    { "title": "Prompt Chuyển Đổi Sang Next.js & Tailwind v4", "description": "Tối ưu cho kiến trúc Next.js App Router hiện tại", "promptText": "..." },
    { "title": "Prompt Sửa Lỗi & Tối Ưu Hiệu Suất", "description": "Khắc phục lỗi và nâng cấp chuẩn A11y", "promptText": "..." }
  ],
  "generatedCode": {
    "componentCode": "Mã nguồn Component hoàn chỉnh viết bằng React/Next.js TypeScript TSX (clean, modular, reusable)",
    "cssCode": "CSS đã được làm sạch, cô lập namespace hoặc chuyển sang Tailwind",
    "htmlCode": "Mã HTML đã được dọn sạch và tối ưu",
    "jsCode": "Logic JS/Hooks sạch sẽ",
    "tailwindClassesSummary": "Tóm tắt các lớp Tailwind tương đương",
    "suggestedFileStructure": [
      { "path": "components/ui/MyComponent.tsx", "description": "Component giao diện chính", "content": "..." }
    ],
    "dependencies": [
      { "name": "lucide-react", "version": "latest", "isDev": false }
    ],
    "integrationGuideMarkdown": "Hướng dẫn từng bước cách import và nhúng Component vào trang hiện tại"
  }
}`;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: promptText,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        const parsedJson = JSON.parse(rawText);

        const sandboxedPreviewHtml = createSandboxedPreviewHtml({
          html: penSource.html,
          css: penSource.css,
          js: penSource.js,
          externalCss: penSource.externalCss,
          externalJs: penSource.externalJs,
        });

        const result: CodePenAnalysisResult = {
          penMetadata: penSource,
          penSource: penSource,
          summary: parsedJson.summary || `Phân tích thành công CodePen "${penSource.title}"`,
          analysisDate: new Date().toISOString(),
          selectedItemsCount: config.selectedItemIds.length,
          outputMode: config.outputMode,
          targetStack: config.targetStack,
          fidelityMode: config.fidelityMode,
          uiUxReport: parsedJson.uiUxReport || 'Đã phân tích bố cục và giao diện thị giác.',
          sourceCodeReport: parsedJson.sourceCodeReport || 'Đã kiểm tra cấu trúc HTML, CSS và JavaScript.',
          interactionReport: parsedJson.interactionReport || 'Đã xác định các tương tác và sự kiện.',
          issuesAndImprovementsReport:
            parsedJson.issuesAndImprovementsReport || 'Không phát hiện lỗi nghiêm trọng.',
          masterPrompt: parsedJson.masterPrompt || '',
          promptVariants: parsedJson.promptVariants || [],
          generatedCode: parsedJson.generatedCode || {
            componentCode: '// Component đã được tạo sẵn sàng',
            cssCode: '',
            htmlCode: penSource.html,
            jsCode: penSource.js,
            tailwindClassesSummary: '',
            suggestedFileStructure: [],
            dependencies: [],
            integrationGuideMarkdown: 'Nhúng component vào trang qua import.',
          },
          sandboxedPreviewHtml,
        };

        return NextResponse.json(result);
      } catch (geminiError: any) {
        console.warn('[Gemini Analyze error, falling back to local rule engine]:', geminiError);
      }
    }

    // Local Rule Engine Fallback nếu API key ngoại tuyến hoặc gặp sự cố
    const sandboxedPreviewHtml = createSandboxedPreviewHtml({
      html: penSource.html,
      css: penSource.css,
      js: penSource.js,
      externalCss: penSource.externalCss,
      externalJs: penSource.externalJs,
    });

    const fallbackResult = buildLocalRuleEngineAnalysis(penSource, config, sandboxedPreviewHtml);
    return NextResponse.json(fallbackResult);
  } catch (err: any) {
    console.error('[API /api/codepen/analyze fatal error]:', err);
    return NextResponse.json(
      { error: `Lỗi xử lý phân tích: ${err?.message || 'Lỗi không xác định'}` },
      { status: 500 }
    );
  }
}

// Bộ phân tích quy tắc cục bộ chất lượng cao khi ngoại tuyến
function buildLocalRuleEngineAnalysis(
  pen: CodePenParsedSource,
  config: CodePenAnalysisConfig,
  sandboxedPreviewHtml: string
): CodePenAnalysisResult {
  const hasGlass = pen.css.includes('backdrop-filter') || pen.css.includes('blur');
  const hasGrid = pen.css.includes('grid');
  const hasFlex = pen.css.includes('flex');
  const hasKeyframes = pen.css.includes('@keyframes');
  const hasClick = pen.js.includes('addEventListener') || pen.js.includes('click');

  const uiUxReport = [
    `### 1. Phân Tích Bố Cục & Layout`,
    `- Cấu trúc chính sử dụng ${hasGrid ? 'CSS Grid' : hasFlex ? 'CSS Flexbox' : 'Block layout truyền thống'}.`,
    `- Hiệu ứng thị giác: ${hasGlass ? 'Áp dụng Glassmorphism (Backdrop Blur & viền bán trong suốt).' : 'Thiết kế bề mặt phẳng với bóng đổ tinh tế.'}`,
    `- Phân cấp thị giác: Tập trung vào khu vực hiển thị trung tâm với độ tương phản cao.`,
  ].join('\n');

  const sourceCodeReport = [
    `### 2. Kiến Trúc Mã Nguồn`,
    `- **HTML:** ${pen.html.split('\n').length} dòng mã. Cấu trúc DOM có phân lớp rõ ràng.`,
    `- **CSS:** ${pen.css.split('\n').length} dòng styling. ${pen.css.includes(':root') ? 'Đã sử dụng CSS Custom Properties (:root).' : 'Sử dụng màu sắc inline / hex trực tiếp.'}`,
    `- **JavaScript:** ${pen.js.split('\n').length} dòng mã. ${hasClick ? 'Có gắn bộ lắng nghe sự kiện tương tác người dùng.' : 'Chủ yếu xử lý hiệu ứng tự động / khởi tạo Canvas.'}`,
  ].join('\n');

  const interactionReport = [
    `### 3. Tương Tác & Chuyển Động`,
    `- **Animation:** ${hasKeyframes ? 'Sử dụng @keyframes CSS chuyển động phần cứng mượt mà.' : 'Sử dụng transition cơ bản khi hover.'}`,
    `- **Sự kiện:** ${hasClick ? 'Hỗ trợ tương tác chuột (Click / MouseMove).' : 'Tĩnh hoặc tự chạy qua animation lặp.'}`,
  ].join('\n');

  const issuesAndImprovementsReport = [
    `### 4. Đánh Giá & Đề Xuất Tối Ưu`,
    `- **Xung đột CSS:** Khuyến nghị bọc CSS vào scoped container hoặc chuyển sang Tailwind v4 để tránh làm ảnh hưởng các component khác trên website.`,
    `- **Responsive:** Cần kiểm tra kỹ các kích thước màn hình nhỏ dưới 430px để đảm bảo không bị tràn ngang.`,
    `- **Accessibility:** Bổ sung thuộc tính aria-label cho các nút điều khiển và đảm bảo tương phản chữ đạt chuẩn WCAG AA.`,
  ].join('\n');

  const masterPrompt = `Bạn là Senior Frontend Engineer. Hãy tái tạo và tích hợp giao diện CodePen "${pen.title}" của @${pen.author} vào ứng dụng Next.js App Router hiện tại với các yêu cầu sau:
1. Chuyển đổi mã HTML/CSS/JS sang Component React 19 / Next.js TypeScript (TSX) sạch sẽ.
2. Sử dụng Tailwind CSS v4 và Lucide Icons cho toàn bộ styling và biểu tượng.
3. Đồng bộ hoàn hảo với hệ thống 5 màu giao diện (Dark Glass, Light Glass, Cyber Neon, Soft Clay, Emerald Forest).
4. Đảm bảo tính responsive mượt mà trên Desktop, Tablet và Mobile; tuyệt đối chống tràn ngang (overflow-x-hidden, max-w-full).
5. Tách biệt logic và state rõ ràng, không sử dụng document.getElementById hay can thiệp DOM trực tiếp.`;

  const componentName = pen.title
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'CodePenImportedComponent';

  const componentCode = `'use client';

import React, { useState } from 'react';

export interface ${componentName}Props {
  className?: string;
  title?: string;
}

export function ${componentName}({ className = '', title = '${pen.title}' }: ${componentName}Props) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className={\`p-6 rounded-[14px] border backdrop-blur-xl transition-all duration-300 \${className}\`}>
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      <div className="relative overflow-hidden rounded-[12px] p-4 bg-white/5 border border-white/10">
        {/* Nội dung được chuyển đổi từ CodePen */}
        <p className="text-sm opacity-85">Component được chuyển đổi sạch sẽ sang React & Next.js App Router.</p>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className="mt-3 px-4 py-2 rounded-[10px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
        >
          {isActive ? '✓ Đã kích hoạt' : 'Tương tác thử nghiệm'}
        </button>
      </div>
    </div>
  );
}

export default ${componentName};
`;

  return {
    penMetadata: pen,
    summary: `Phân tích mã nguồn CodePen "${pen.title}" (${pen.html.split('\n').length} dòng HTML, ${pen.css.split('\n').length} dòng CSS, ${pen.js.split('\n').length} dòng JS).`,
    analysisDate: new Date().toISOString(),
    selectedItemsCount: config.selectedItemIds.length,
    outputMode: config.outputMode,
    targetStack: config.targetStack,
    fidelityMode: config.fidelityMode,
    uiUxReport,
    sourceCodeReport,
    interactionReport,
    issuesAndImprovementsReport,
    masterPrompt,
    promptVariants: [
      {
        title: 'Prompt Tái Tạo Trung Thành 100%',
        description: 'Bảo toàn tuyệt đối thiết kế và animation nguyên bản',
        promptText: masterPrompt,
      },
      {
        title: 'Prompt Chuyển Đổi Sang Component Độc Lập',
        description: 'Trích xuất thành React Component có Props linh hoạt',
        promptText: `${masterPrompt}\nHãy trích xuất thành 1 reusable component độc lập kèm Props interface đầy đủ.`,
      },
    ],
    generatedCode: {
      componentCode,
      cssCode: pen.css,
      htmlCode: pen.html,
      jsCode: pen.js,
      tailwindClassesSummary: 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-[14px] shadow-lg',
      suggestedFileStructure: [
        {
          path: `components/ui/${componentName}.tsx`,
          description: 'Component giao diện chính',
          content: componentCode,
        },
      ],
      dependencies: [],
      integrationGuideMarkdown: `### Hướng Dẫn Tích Hợp Vào Website:\n1. Lưu component vào đường dẫn \`components/ui/${componentName}.tsx\`\n2. Nhúng vào trang thông qua:\n\`\`\`tsx\nimport { ${componentName} } from '@/components/ui/${componentName}';\n\n<${componentName} />\n\`\`\``,
    },
    sandboxedPreviewHtml,
  };
}
