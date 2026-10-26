'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Code2,
  Sparkles,
  Link as LinkIcon,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Copy,
  Download,
  FileCode,
  Layers,
  Sliders,
  Eye,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  Square,
  FileText,
  Boxes,
  ArrowRight,
  Maximize2,
  Minimize2,
  Terminal,
  HelpCircle,
  Archive,
  ClipboardPaste,
  Cpu,
  RefreshCw,
  FolderDown,
  Monitor,
  Smartphone,
  Tablet,
  Check,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import JSZip from 'jszip';
import {
  CodePenParsedSource,
  CodePenAnalysisConfig,
  CodePenAnalysisResult,
  TargetFrameworkStack,
  OutputGenerationMode,
  AnalysisGroupId,
  CODEPEN_ANALYSIS_ITEMS,
  CODEPEN_QUICK_PRESETS,
  SAMPLE_CODEPEN_DEMOS,
  DEFAULT_ANALYSIS_CONFIG,
} from '@/lib/codepen/types';
import {
  createSandboxedPreviewHtml,
  normalizeCodePenUrl,
  createManualCodePenSource,
} from '@/lib/codepen/codepen-parser';

type StudioStep = 1 | 2 | 3 | 4 | 5;
type ResultTab =
  | 'overview'
  | 'ui_ux'
  | 'source_code'
  | 'interactions'
  | 'audit'
  | 'prompt'
  | 'code'
  | 'guide';

export function CodePenAnalyzerStudio() {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  // State Step 1: Input URL & Code
  const [urlInput, setUrlInput] = useState<string>('');
  const [inputMode, setInputMode] = useState<'url' | 'manual'>('url');
  const [manualTitle, setManualTitle] = useState<string>('Custom Interactive Component');
  const [manualHtml, setManualHtml] = useState<string>('');
  const [manualCss, setManualCss] = useState<string>('');
  const [manualJs, setManualJs] = useState<string>('');

  // Source & Loading State
  const [isFetchingSource, setIsFetchingSource] = useState<boolean>(false);
  const [parsedSource, setParsedSource] = useState<CodePenParsedSource | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Step 3: Analysis Config (Items & Output Mode)
  const [config, setConfig] = useState<CodePenAnalysisConfig>(DEFAULT_ANALYSIS_CONFIG);
  const [activeGroupFilter, setActiveGroupFilter] = useState<AnalysisGroupId | 'all'>('all');
  const [activePresetId, setActivePresetId] = useState<string>('preset_reverse_engineer');

  // Step 4 & 5: AI Analysis Execution & Results
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<CodePenAnalysisResult | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>('overview');

  // Preview Sandbox Controls
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState<boolean>(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState<number>(0);
  const [codeViewerTab, setCodeViewerTab] = useState<'tsx' | 'css' | 'tailwind' | 'usage'>('tsx');

  // Copy Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, label: string = 'Nội dung') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Đã sao chép ${label} vào clipboard!`, 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Load Sample Demo
  const handleLoadSampleDemo = (demo: typeof SAMPLE_CODEPEN_DEMOS[0]) => {
    setUrlInput(demo.sourceUrl);
    setInputMode('url');
    setParsedSource({
      url: demo.sourceUrl,
      penId: demo.id,
      author: demo.author,
      title: demo.title,
      description: demo.description,
      html: demo.html,
      css: demo.css,
      js: demo.js,
      externalCss: demo.externalCss,
      externalJs: demo.externalJs,
      dependencies: [],
      readScope: 'full_source',
      isPublic: true,
      rawFetchedAt: new Date().toISOString(),
    });
    setFetchError(null);
    showToast(`Đã nạp Pen mẫu: ${demo.title}`, 'info');
  };

  // Fetch CodePen from URL
  const handleFetchCodePen = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || urlInput).trim();
    if (!targetUrl) {
      showToast('Vui lòng dán liên kết CodePen hợp lệ.', 'error');
      return;
    }

    const norm = normalizeCodePenUrl(targetUrl);
    if (!norm.isValid) {
      setFetchError(norm.error || 'URL không hợp lệ');
      showToast(norm.error || 'URL CodePen không hợp lệ', 'error');
      return;
    }

    setIsFetchingSource(true);
    setFetchError(null);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/codepen/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: norm.normalizedUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Lỗi máy chủ (${res.status})`);
      }

      const sourceData: CodePenParsedSource = await res.json();
      setParsedSource(sourceData);
      showToast(`Đã đọc thành công Pen: ${sourceData.title || norm.penId}`, 'success');
    } catch (err: any) {
      console.warn('CodePen direct fetch error, offering manual paste fallback:', err);
      setFetchError(err.message || 'Không thể tải Pen công khai');
      showToast(err.message || 'Lỗi truy xuất Pen, bạn có thể dán mã thủ công bên dưới.', 'error');
    } finally {
      setIsFetchingSource(false);
    }
  };

  // Handle Manual Code Save
  const handleApplyManualCode = () => {
    if (!manualHtml.trim() && !manualCss.trim() && !manualJs.trim()) {
      showToast('Vui lòng nhập ít nhất mã HTML hoặc CSS.', 'error');
      return;
    }

    const customSource = createManualCodePenSource({
      title: manualTitle,
      html: manualHtml,
      css: manualCss,
      js: manualJs,
      url: urlInput || 'https://codepen.io/custom-source',
    });

    setParsedSource(customSource);
    setFetchError(null);
    showToast('Đã lưu mã nguồn thủ công để phân tích!', 'success');
  };

  // Toggle selection of analysis items
  const handleToggleItem = (itemId: string) => {
    setConfig((prev) => {
      const exists = prev.selectedItemIds.includes(itemId);
      const updated = exists
        ? prev.selectedItemIds.filter((id) => id !== itemId)
        : [...prev.selectedItemIds, itemId];
      return { ...prev, selectedItemIds: updated };
    });
  };

  // Select all or deselect all
  const handleSelectAll = (select: boolean) => {
    setConfig((prev) => ({
      ...prev,
      selectedItemIds: select ? CODEPEN_ANALYSIS_ITEMS.map((item) => item.id) : [],
    }));
  };

  // Apply quick preset
  const handleApplyPreset = (presetId: string) => {
    const preset = CODEPEN_QUICK_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(presetId);
    setConfig((prev) => ({
      ...prev,
      selectedItemIds: [...(preset.selectedItemIds || [])],
      outputMode: preset.defaultOutputMode || prev.outputMode,
      targetStack: preset.defaultFramework || prev.targetStack,
    }));
    showToast(`Đã áp dụng mẫu: ${preset.name}`, 'info');
  };

  // Execute AI Analysis
  const handleExecuteAnalysis = async () => {
    if (!parsedSource) {
      showToast('Vui lòng nạp hoặc nhập mã nguồn CodePen trước.', 'error');
      return;
    }

    if (config.selectedItemIds.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 mục phân tích cần thực hiện.', 'error');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress('Đang đọc mã nguồn và phân tích cấu trúc DOM/CSS...');

    try {
      const res = await fetch('/api/codepen/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penSource: parsedSource, config }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Lỗi phân tích mã nguồn (${res.status})`);
      }

      setAnalysisProgress('Đang sinh Prompt cấu trúc cao cấp và chuyển đổi mã nguồn React...');
      const resultData: CodePenAnalysisResult = await res.json();
      setAnalysisResult(resultData);
      setActiveResultTab('overview');
      showToast('Hoàn tất phân tích CodePen & sinh Prompt thành công!', 'success');
    } catch (err: any) {
      console.error('CodePen analysis failed:', err);
      showToast(err.message || 'Quá trình phân tích gặp lỗi. Vui lòng thử lại.', 'error');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  // Sandboxed HTML source for Live Preview
  const previewSandboxedHtml = useMemo(() => {
    if (!parsedSource) return '';
    return createSandboxedPreviewHtml(parsedSource);
  }, [parsedSource, previewRefreshKey]);

  // Export as ZIP
  const handleExportZip = async () => {
    if (!analysisResult) return;
    try {
      const source = analysisResult.penSource || analysisResult.penMetadata;
      const zip = new JSZip();
      const folderName = `codepen-${source.penId || 'export'}`;
      const folder = zip.folder(folderName) || zip;

      // Source Files
      folder.file('original.html', source.html);
      folder.file('original.css', source.css);
      folder.file('original.js', source.js);

      // Generated Code
      if (analysisResult.generatedCode) {
        if (analysisResult.generatedCode.reactComponentTsx) folder.file('Component.tsx', analysisResult.generatedCode.reactComponentTsx);
        if (analysisResult.generatedCode.tailwindClasses) folder.file('tailwind.css', analysisResult.generatedCode.tailwindClasses);
        if (analysisResult.generatedCode.isolatedCss) folder.file('customStyles.css', analysisResult.generatedCode.isolatedCss);
        if (analysisResult.generatedCode.usageExample) folder.file('usageExample.tsx', analysisResult.generatedCode.usageExample);
      }

      // Generated Prompt
      if (analysisResult.generatedPrompt) {
        folder.file('MASTER_PROMPT.txt', analysisResult.generatedPrompt.fullMasterPrompt);
        folder.file('PROMPT_RECREATION.txt', analysisResult.generatedPrompt.recreationPrompt);
        folder.file('PROMPT_PORTING.txt', analysisResult.generatedPrompt.portingPrompt);
      }

      // Comprehensive Report
      const reportMarkdown = `# BÁO CÁO PHÂN TÍCH CODEPEN: ${analysisResult.penSource.title}
- Nguồn Pen: ${analysisResult.penSource.url}
- Tác giả: @${analysisResult.penSource.author}
- Thời gian phân tích: ${analysisResult.analyzedAt}
- Framework mục tiêu: ${analysisResult.config.targetFramework}

## 1. TỔNG QUAN KIẾN TRÚC
${analysisResult.overviewSummary.keyArchitecture}

## 2. BẢNG MÀU & TYPOGRAPHY
- Màu sắc: ${analysisResult.uiAnalysis.colorPalette.map((c: any) => `${c.label} (${c.hex})`).join(', ')}
- Fonts: ${analysisResult.uiAnalysis.typography.fontFamilies.join(', ')}

## 3. MASTER PROMPT
\`\`\`text
${analysisResult.generatedPrompt?.fullMasterPrompt || 'N/A'}
\`\`\`
`;
      folder.file('README.md', reportMarkdown);
      folder.file('analysis-result.json', JSON.stringify(analysisResult, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${folderName}-bundle.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      showToast('Đã tải xuống bộ tệp ZIP hoàn chỉnh!', 'success');
    } catch (err: any) {
      showToast('Lỗi khi nén tệp ZIP: ' + err.message, 'error');
    }
  };

  // Filtered analysis items list
  const filteredAnalysisItems = useMemo(() => {
    if (activeGroupFilter === 'all') return CODEPEN_ANALYSIS_ITEMS;
    return CODEPEN_ANALYSIS_ITEMS.filter((item) => item.groupId === activeGroupFilter);
  }, [activeGroupFilter]);

  const selectedCount = config.selectedItemIds.length;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Studio Banner & Master Headline */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border backdrop-blur-xl relative overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-r from-amber-950/30 via-purple-950/20 to-slate-900/40 border-amber-500/25 shadow-[0_10px_35px_rgba(245,158,11,0.08)]'
            : 'bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-purple-50/80 border-amber-200/90 shadow-[0_10px_35px_rgba(245,158,11,0.12)]'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                <Code2 size={13} /> CodePen Reverse Engineer Studio
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                21 Mục Phân Tích • 10 Presets • Next.js & React 19
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Isolated Sandbox Preview
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-purple-400 bg-clip-text text-transparent">
                CodePen Analyzer Studio
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Phân tích toàn diện mã nguồn CodePen công khai, dịch ngược kiến trúc HTML / CSS / JavaScript,
              kiểm tra khả năng truy cập, tạo Master Prompt chi tiết và chuyển đổi trực tiếp sang mã nguồn
              Next.js 15, React 19, Tailwind CSS v4 an toàn, không xung đột.
            </p>
          </div>

          {/* Quick Actions & Demo Loader */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleLoadSampleDemo(SAMPLE_CODEPEN_DEMOS[0])}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isDark
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
              }`}
            >
              <Sparkles size={13} /> Nạp Demo 1 (Glass Card)
            </button>
            <button
              onClick={() => handleLoadSampleDemo(SAMPLE_CODEPEN_DEMOS[1])}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isDark
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25'
                  : 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
              }`}
            >
              <Sparkles size={13} /> Demo 2 (Cyber Matrix)
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          KHU VỰC 1: NHẬP ĐƯỜNG DẪN HOẶC MÃ NGUỒN CODEPEN
          ========================================================================= */}
      <div
        className={`p-5 rounded-2xl border backdrop-blur-xl transition-all ${
          isDark ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-white/80 border-slate-200 shadow-md'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
              1
            </span>
            <h2 className="text-base sm:text-lg font-bold">
              Nhập Đường Dẫn CodePen Hoặc Mã Nguồn Tùy Chỉnh
            </h2>
          </div>

          {/* Toggle URL vs Manual Paste */}
          <div className="flex items-center p-0.5 rounded-xl border bg-black/10 dark:bg-white/5 border-white/10 text-xs font-semibold">
            <button
              onClick={() => setInputMode('url')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                inputMode === 'url'
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon size={12} /> Đường dẫn CodePen
            </button>
            <button
              onClick={() => setInputMode('manual')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                inputMode === 'manual'
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardPaste size={12} /> Dán mã trực tiếp
            </button>
          </div>
        </div>

        {inputMode === 'url' ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchCodePen()}
                  placeholder="Dán đường dẫn CodePen (ví dụ: https://codepen.io/username/pen/xxxxxx)..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all font-mono ${
                    isDark
                      ? 'bg-black/30 border-white/15 text-white placeholder-slate-500 focus:border-amber-400'
                      : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-amber-500'
                  }`}
                />
                <LinkIcon
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <button
                onClick={() => handleFetchCodePen()}
                disabled={isFetchingSource || !urlInput.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  isFetchingSource || !urlInput.trim()
                    ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold shadow-amber-500/25'
                }`}
              >
                {isFetchingSource ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" /> Đang đọc Pen...
                  </>
                ) : (
                  <>
                    <Search size={15} /> Kiểm tra & Đọc Pen
                  </>
                )}
              </button>
            </div>

            {/* Error Banner */}
            {fetchError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-red-400" />
                <div className="space-y-1">
                  <p className="font-bold">Không thể tải trực tiếp: {fetchError}</p>
                  <p className="text-slate-300">
                    Gợi ý: Pen có thể là dạng Private, hoặc mạng bị chặn CORS. Bạn có thể bấm sang tab{' '}
                    <strong
                      onClick={() => setInputMode('manual')}
                      className="underline text-amber-400 cursor-pointer"
                    >
                      &quot;Dán mã trực tiếp&quot;
                    </strong>{' '}
                    để dán HTML / CSS / JS và tiến hành phân tích ngay lập tức!
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Manual Code Paste Mode */
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Tên / Tiêu đề Component:
              </label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-medium ${
                  isDark
                    ? 'bg-black/30 border-white/15 text-white'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-emerald-400 block mb-1">
                  HTML Nguồn:
                </label>
                <textarea
                  value={manualHtml}
                  onChange={(e) => setManualHtml(e.target.value)}
                  placeholder="<div class='card'>...</div>"
                  rows={6}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono border outline-none resize-none ${
                    isDark
                      ? 'bg-black/40 border-white/10 text-emerald-300'
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-sky-400 block mb-1">
                  CSS Nguồn:
                </label>
                <textarea
                  value={manualCss}
                  onChange={(e) => setManualCss(e.target.value)}
                  placeholder=".card { background: rgba(...); }"
                  rows={6}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono border outline-none resize-none ${
                    isDark
                      ? 'bg-black/40 border-white/10 text-sky-300'
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-amber-400 block mb-1">
                  JavaScript Nguồn:
                </label>
                <textarea
                  value={manualJs}
                  onChange={(e) => setManualJs(e.target.value)}
                  placeholder="const btn = document.querySelector(...);"
                  rows={6}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono border outline-none resize-none ${
                    isDark
                      ? 'bg-black/40 border-white/10 text-amber-300'
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>
            </div>

            <button
              onClick={handleApplyManualCode}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <CheckCircle2 size={14} /> Áp dụng mã nguồn thủ công
            </button>
          </div>
        )}

        {/* Source Telemetry Card (Shown when parsedSource is available) */}
        {parsedSource && (
          <div
            className={`mt-4 p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs ${
              isDark ? 'bg-black/25 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-amber-400">{parsedSource.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {parsedSource.readScope === 'full_source'
                    ? 'Đầy đủ HTML + CSS + JS'
                    : parsedSource.readScope === 'manual_paste'
                    ? 'Mã nguồn tự nhập'
                    : 'Phạm vi một phần'}
                </span>
                <span className="text-slate-400">bởi @{parsedSource.author}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono flex-wrap">
                <span>HTML: {parsedSource.html.length} chars</span>
                <span>•</span>
                <span>CSS: {parsedSource.css.length} chars</span>
                <span>•</span>
                <span>JS: {parsedSource.js.length} chars</span>
                <span>•</span>
                <span>Thư viện: {parsedSource.externalCss.length + parsedSource.externalJs.length}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={parsedSource.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg border border-slate-500/30 hover:border-amber-400 text-slate-300 hover:text-white transition-all flex items-center gap-1 text-[11px]"
              >
                <ExternalLink size={12} /> Mở gốc trên CodePen
              </a>
              <button
                onClick={() => setPreviewRefreshKey((k) => k + 1)}
                title="Tải lại khung xem trước"
                className="p-1.5 rounded-lg border border-slate-500/30 hover:border-amber-400 text-slate-300 transition-all cursor-pointer"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          KHU VỰC 2 & 3: DANH SÁCH 21 MỤC PHÂN TÍCH, PRESETS & CẤU HÌNH ĐẦU RA
          ========================================================================= */}
      <div
        className={`p-5 rounded-2xl border backdrop-blur-xl transition-all ${
          isDark ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-white/80 border-slate-200 shadow-md'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">
              2
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                Chọn Mục Phân Tích & Cấu Hình Đầu Ra
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-normal">
                  Đã chọn {selectedCount}/21 mục
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Lựa chọn chính xác những khía cạnh bạn muốn AI mổ xẻ và sinh Prompt / Code.
              </p>
            </div>
          </div>

          {/* Quick Action Presets (10 Presets) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400">Mẫu nhanh:</span>
            {CODEPEN_QUICK_PRESETS.slice(0, 4).map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Output Generation Mode & Target Stack Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5 p-3.5 rounded-xl bg-black/15 dark:bg-black/30 border border-white/10 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1 flex items-center gap-1">
              <Boxes size={13} className="text-amber-400" /> Chế độ đầu ra:
            </label>
            <select
              value={config.outputMode}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, outputMode: e.target.value as OutputGenerationMode }))
              }
              className={`w-full p-2 rounded-lg border outline-none font-semibold ${
                isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value="both">Cả hai: Tạo Master Prompt + Xuất Code</option>
              <option value="prompt">Chỉ tạo Master Prompt (AI Spec)</option>
              <option value="code">Chỉ xuất Code Components hoàn chỉnh</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1 flex items-center gap-1">
              <Cpu size={13} className="text-purple-400" /> Framework mục tiêu:
            </label>
            <select
              value={config.targetFramework}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  targetFramework: e.target.value as TargetFrameworkStack,
                }))
              }
              className={`w-full p-2 rounded-lg border outline-none font-semibold ${
                isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value="nextjs_tailwind">Next.js 15 App Router + Tailwind v4 (Mặc định website)</option>
              <option value="react_tailwind">React 19 + Tailwind CSS</option>
              <option value="react_isolated_css">React + Isolated Modular CSS</option>
              <option value="vanilla_js">HTML5 + Modern ES6+ + CSS3</option>
              <option value="vue3">Vue 3 (Composition API)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1 flex items-center gap-1">
              <Sliders size={13} className="text-emerald-400" /> Phong cách & Scope:
            </label>
            <div className="flex items-center gap-3 pt-1.5">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isolateStyles}
                  onChange={(e) => setConfig((prev) => ({ ...prev, isolateStyles: e.target.checked }))}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>Khử xung đột CSS (Scope)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeAudit}
                  onChange={(e) => setConfig((prev) => ({ ...prev, includeAudit: e.target.checked }))}
                  className="rounded text-purple-500 focus:ring-0"
                />
                <span>Audit hiệu năng & a11y</span>
              </label>
            </div>
          </div>
        </div>

        {/* Filter Groups & Bulk Select Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-bold text-slate-400 mr-1">Nhóm:</span>
            {[
              { id: 'all', label: 'Tất cả (21)' },
              { id: 'ui_ux', label: 'A: UI/UX (5)' },
              { id: 'source_code', label: 'B: Mã nguồn (5)' },
              { id: 'interactions', label: 'C: Tương tác (4)' },
              { id: 'audit_improvements', label: 'D: Audit & Đề xuất (4)' },
              { id: 'recreation_porting', label: 'E: Tái tạo & Code (3)' },
            ].map((grp) => (
              <button
                key={grp.id}
                onClick={() => setActiveGroupFilter(grp.id as any)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  activeGroupFilter === grp.id
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {grp.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => handleSelectAll(true)}
              className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <CheckSquare size={13} /> Chọn tất cả
            </button>
            <span className="text-slate-500">•</span>
            <button
              onClick={() => handleSelectAll(false)}
              className="text-slate-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Square size={13} /> Bỏ chọn
            </button>
          </div>
        </div>

        {/* 21 Granular Items Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAnalysisItems.map((item) => {
            const isChecked = config.selectedItemIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => handleToggleItem(item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none relative ${
                  isChecked
                    ? isDark
                      ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-sm'
                      : 'bg-amber-50 border-amber-400 text-slate-900 shadow-sm'
                    : isDark
                    ? 'bg-black/20 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="pt-0.5">
                    {isChecked ? (
                      <CheckCircle2 size={16} className="text-amber-400 flex-shrink-0" />
                    ) : (
                      <Square size={16} className="text-slate-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold leading-tight truncate">{item.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono text-slate-400">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Execute Analysis Primary Trigger CTA */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            {parsedSource ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 size={13} /> Sẵn sàng phân tích Pen: &quot;{parsedSource.title}&quot;
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle size={13} /> Chưa nạp mã nguồn CodePen
              </span>
            )}
          </div>

          <button
            onClick={handleExecuteAnalysis}
            disabled={isAnalyzing || !parsedSource || selectedCount === 0}
            className={`w-full sm:w-auto px-7 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              isAnalyzing || !parsedSource || selectedCount === 0
                ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-black font-extrabold shadow-amber-500/30 hover:scale-[1.02]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> {analysisProgress || 'Đang phân tích...'}
              </>
            ) : (
              <>
                <Sparkles size={16} /> Bắt đầu Phân Tích & Sinh Prompt / Code
              </>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          KHU VỰC 4 & 5: KẾT QUẢ PHÂN TÍCH, PROMPTS, CODE & LIVE SANDBOX PREVIEW
          ========================================================================= */}
      {analysisResult && (
        <div
          className={`p-5 rounded-2xl border backdrop-blur-xl transition-all space-y-5 ${
            isDark ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-white/85 border-slate-200 shadow-xl'
          }`}
        >
          {/* Header Bar with Tabs & Quick Download / Copy */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Kết Quả Phân Tích & Mã Nguồn
              </span>
              <h3 className="text-lg font-black flex items-center gap-2">
                {analysisResult.penSource.title || 'CodePen Analysis Report'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                  Hoàn tất
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportZip}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <FolderDown size={14} /> Xuất Gói ZIP Hoàn Chỉnh
              </button>

              <button
                onClick={() =>
                  handleCopy(
                    analysisResult.generatedPrompt?.fullMasterPrompt || '',
                    'full_prompt',
                    'Master Prompt'
                  )
                }
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'full_prompt' ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={14} />
                )}
                Sao chép Prompt
              </button>
            </div>
          </div>

          {/* 8 Result Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs border-b border-white/10">
            {[
              { id: 'overview', label: '1. Tổng quan & Kiến trúc' },
              { id: 'ui_ux', label: '2. UI/UX & Bảng màu' },
              { id: 'source_code', label: '3. Mã nguồn & DOM' },
              { id: 'interactions', label: '4. Tương tác & Keyframes' },
              { id: 'audit', label: '5. Audit & Đề xuất' },
              { id: 'prompt', label: '6. Master Prompt (AI)' },
              { id: 'code', label: '7. Code Next.js / React' },
              { id: 'guide', label: '8. Hướng dẫn tích hợp' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveResultTab(tab.id as ResultTab)}
                className={`px-3 py-2 rounded-t-xl font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                  activeResultTab === tab.id
                    ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {activeResultTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-4 text-xs">
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h4 className="font-bold text-sm mb-2 text-amber-400 flex items-center gap-1.5">
                    <Terminal size={15} /> Tóm Tắt Khả Năng Hoạt Động & Kiến Trúc
                  </h4>
                  <p className="text-slate-300 leading-relaxed mb-3">
                    {analysisResult.overviewSummary.keyArchitecture}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 font-mono text-[11px]">
                    <div className="p-2 rounded-lg bg-black/20">
                      <span className="text-slate-500 block">HTML:</span>
                      <span className="font-bold text-emerald-400">
                        {analysisResult.penSource.html.length} chars
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/20">
                      <span className="text-slate-500 block">CSS:</span>
                      <span className="font-bold text-sky-400">
                        {analysisResult.penSource.css.length} chars
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/20">
                      <span className="text-slate-500 block">JS:</span>
                      <span className="font-bold text-amber-400">
                        {analysisResult.penSource.js.length} chars
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/20">
                      <span className="text-slate-500 block">Libraries:</span>
                      <span className="font-bold text-purple-400">
                        {analysisResult.penSource.externalCss.length +
                          analysisResult.penSource.externalJs.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h4 className="font-bold text-sm mb-2 text-purple-400 flex items-center gap-1.5">
                    <Boxes size={15} /> Thư Viện Phụ Thuộc Phát Hiện Được
                  </h4>
                  {(analysisResult.dependenciesDetected?.length || 0) > 0 ? (
                    <ul className="space-y-1.5">
                      {(analysisResult.dependenciesDetected || []).map((dep: any, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-black/20 text-slate-300 font-mono text-[11px]"
                        >
                          <span className="font-bold text-amber-300">{dep.name}</span>
                          <span className="text-slate-500 truncate max-w-xs">{dep.url}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400">
                      Không phát hiện thư viện bên ngoài (Pure HTML / Vanilla CSS / ES6).
                    </p>
                  )}
                </div>
              </div>

              {/* Live Sandboxed Preview Box */}
              <div
                className={`p-4 rounded-xl border flex flex-col ${
                  isDark ? 'bg-black/30 border-white/10' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <Eye size={13} className="text-amber-400" /> Isolated Sandbox Preview
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                      sandbox=&quot;allow-scripts&quot;
                    </span>
                  </div>

                  {/* Viewport switchers */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewViewport('desktop')}
                      className={`p-1 rounded ${
                        previewViewport === 'desktop' ? 'bg-amber-500 text-black' : 'text-slate-400'
                      }`}
                      title="Desktop"
                    >
                      <Monitor size={13} />
                    </button>
                    <button
                      onClick={() => setPreviewViewport('tablet')}
                      className={`p-1 rounded ${
                        previewViewport === 'tablet' ? 'bg-amber-500 text-black' : 'text-slate-400'
                      }`}
                      title="Tablet (768px)"
                    >
                      <Tablet size={13} />
                    </button>
                    <button
                      onClick={() => setPreviewViewport('mobile')}
                      className={`p-1 rounded ${
                        previewViewport === 'mobile' ? 'bg-amber-500 text-black' : 'text-slate-400'
                      }`}
                      title="Mobile (375px)"
                    >
                      <Smartphone size={13} />
                    </button>
                  </div>
                </div>

                {/* The Iframe Sandbox Container */}
                <div
                  className={`w-full h-80 sm:h-96 rounded-lg overflow-hidden border border-black/30 bg-neutral-900 mx-auto transition-all ${
                    previewViewport === 'mobile'
                      ? 'max-w-[375px]'
                      : previewViewport === 'tablet'
                      ? 'max-w-[768px]'
                      : 'w-full'
                  }`}
                >
                  <iframe
                    key={previewRefreshKey}
                    title="CodePen Sandbox Preview"
                    srcDoc={previewSandboxedHtml}
                    sandbox="allow-scripts"
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: UI/UX & Color Palette */}
          {activeResultTab === 'ui_ux' && (
            <div className="space-y-4 text-xs">
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h4 className="font-bold text-sm mb-3 text-amber-400">Bảng Màu Nhận Diện & Tương Phản</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {(analysisResult.uiAnalysis?.colorPalette || []).map((col: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-black/20 space-y-1.5 border border-white/5">
                      <div
                        className="w-full h-10 rounded-md border border-white/20 shadow-inner"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="font-mono font-bold block text-slate-200">{col.hex}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{col.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h4 className="font-bold text-sm mb-2 text-purple-400">Typography & Hierarchy</h4>
                  <ul className="space-y-1 text-slate-300">
                    <li>
                      <strong>Fonts:</strong> {analysisResult.uiAnalysis.typography.fontFamilies.join(', ')}
                    </li>
                    <li>
                      <strong>Cỡ chữ chính:</strong>{' '}
                      {analysisResult.uiAnalysis.typography.fontSizes.join(', ')}
                    </li>
                    <li>
                      <strong>Độ đậm (weights):</strong>{' '}
                      {analysisResult.uiAnalysis.typography.fontWeights.join(', ')}
                    </li>
                  </ul>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h4 className="font-bold text-sm mb-2 text-sky-400">Hiệu Ứng Glass & Shadows</h4>
                  <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                    <li>Backdrop-blur: {analysisResult.uiAnalysis.glassEffects.blur || 'N/A'}</li>
                    <li>Border-radius: {analysisResult.uiAnalysis.glassEffects.borderRadius || 'N/A'}</li>
                    <li>Bóng đổ: {analysisResult.uiAnalysis.glassEffects.shadow || 'N/A'}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Source Code & DOM */}
          {activeResultTab === 'source_code' && (
            <div className="space-y-4 text-xs">
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h4 className="font-bold text-sm mb-2 text-emerald-400">Cấu Trúc Cây DOM & Phần Tử</h4>
                <div className="p-3 rounded-lg bg-black/40 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-60">
                  <pre>{analysisResult.sourceCodeAnalysis.domTreeSummary}</pre>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h4 className="font-bold text-sm mb-2 text-amber-400">CSS Architecture</h4>
                  <p className="text-slate-300 mb-2">
                    {analysisResult.sourceCodeAnalysis.cssArchitecture}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h4 className="font-bold text-sm mb-2 text-purple-400">JavaScript Logic & Events</h4>
                  <p className="text-slate-300 mb-2">
                    {analysisResult.sourceCodeAnalysis.jsLogicSummary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Interactions */}
          {activeResultTab === 'interactions' && (
            <div className="space-y-4 text-xs">
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h4 className="font-bold text-sm mb-2 text-amber-400">
                  Trạng Thái Tương Tác (Hover, Focus, Click, MouseMove)
                </h4>
                <p className="text-slate-300 leading-relaxed mb-3">
                  {analysisResult.interactionsAnalysis.hoverActiveStates}
                </p>
                <h5 className="font-bold text-slate-200 mb-1">Keyframe Animations:</h5>
                <div className="p-3 rounded-lg bg-black/40 font-mono text-[11px] text-amber-300 overflow-x-auto max-h-48">
                  <pre>{analysisResult.interactionsAnalysis.keyframesList || 'Không có @keyframes'}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Audit & Improvements */}
          {activeResultTab === 'audit' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h4 className="font-bold text-sm mb-2 text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle size={15} /> Điểm Cần Khắc Phục (Issues & Risks)
                  </h4>
                  <ul className="space-y-2 text-slate-300">
                    {(analysisResult.auditAndImprovements?.issuesDetected || []).map((issue: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h4 className="font-bold text-sm mb-2 text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Đề Xuất Tối Ưu Hóa (Modernization)
                  </h4>
                  <ul className="space-y-2 text-slate-300">
                    {(analysisResult.auditAndImprovements?.recommendedOptimizations || []).map((rec: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Master Prompt (AI Spec) */}
          {activeResultTab === 'prompt' && (
            <div className="space-y-4 text-xs">
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h4 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                    <Sparkles size={15} /> Master Prompt Dành Cho AI Code Generation
                  </h4>
                  <button
                    onClick={() =>
                      handleCopy(
                        analysisResult.generatedPrompt?.fullMasterPrompt || '',
                        'prompt_tab',
                        'Master Prompt'
                      )
                    }
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'prompt_tab' ? <Check size={13} /> : <Copy size={13} />}
                    Sao chép Master Prompt
                  </button>
                </div>
                <div className="p-3.5 rounded-lg bg-black/40 font-mono text-[11px] text-amber-200/90 leading-relaxed overflow-x-auto max-h-96">
                  <pre className="whitespace-pre-wrap">
                    {analysisResult.generatedPrompt?.fullMasterPrompt}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: Generated Code */}
          {activeResultTab === 'code' && (
            <div className="space-y-4 text-xs">
              {/* Code viewer tabs */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10 flex-wrap">
                <div className="flex items-center gap-1">
                  {[
                    { id: 'tsx', label: 'Component.tsx (React 19 / Next.js)' },
                    { id: 'tailwind', label: 'Tailwind Classes' },
                    { id: 'css', label: 'Isolated CSS' },
                    { id: 'usage', label: 'Usage Example' },
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setCodeViewerTab(subTab.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        codeViewerTab === subTab.id
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const activeCode =
                      codeViewerTab === 'tsx'
                        ? analysisResult.generatedCode?.reactComponentTsx
                        : codeViewerTab === 'tailwind'
                        ? analysisResult.generatedCode?.tailwindClasses
                        : codeViewerTab === 'css'
                        ? analysisResult.generatedCode?.isolatedCss
                        : analysisResult.generatedCode?.usageExample;
                    handleCopy(activeCode || '', 'code_view', 'Mã nguồn');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'code_view' ? (
                    <Check size={13} className="text-emerald-400" />
                  ) : (
                    <Copy size={13} />
                  )}
                  Sao chép mã tab này
                </button>
              </div>

              <div className="p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-[500px]">
                <pre>
                  {codeViewerTab === 'tsx'
                    ? analysisResult.generatedCode?.reactComponentTsx
                    : codeViewerTab === 'tailwind'
                    ? analysisResult.generatedCode?.tailwindClasses
                    : codeViewerTab === 'css'
                    ? analysisResult.generatedCode?.isolatedCss
                    : analysisResult.generatedCode?.usageExample}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 8: Integration Guide */}
          {activeResultTab === 'guide' && (
            <div className="space-y-4 text-xs">
              <div
                className={`p-4 rounded-xl border leading-relaxed space-y-3 ${
                  isDark ? 'bg-black/25 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <h4 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                  <FileCode size={15} /> Các Bước Tích Hợp Vào Codebase Hiện Tại
                </h4>
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    <strong>Tạo component mới:</strong> Sao chép mã từ tab{' '}
                    <code className="text-amber-300 font-mono">Component.tsx</code> vào thư mục{' '}
                    <code className="text-purple-300 font-mono">components/custom/</code>.
                  </li>
                  <li>
                    <strong>Tách Style không xung đột:</strong> Nếu có isolated CSS, gán class scoped hoặc nhúng
                    vào <code className="text-sky-300 font-mono">globals.css</code> với namespace riêng.
                  </li>
                  <li>
                    <strong>Đồng bộ Multi-Theme:</strong> Thay các mã màu cố định bằng theme token{' '}
                    <code className="text-emerald-300 font-mono">--color-surface</code>,{' '}
                    <code className="text-emerald-300 font-mono">--color-text-primary</code>.
                  </li>
                  <li>
                    <strong>Nhập và sử dụng:</strong> Import component vào trang đích theo mẫu tại tab{' '}
                    <code className="text-amber-300 font-mono">Usage Example</code>.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default CodePenAnalyzerStudio;
