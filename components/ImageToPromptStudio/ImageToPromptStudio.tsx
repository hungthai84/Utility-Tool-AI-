'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Copy,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sliders,
  FileText,
  Code2,
  Eye,
  Wand2,
  Undo2,
  Redo2,
  Play,
  Pause,
  XCircle,
  Archive,
  BookOpen,
  ShieldCheck,
  CheckSquare,
  Square,
  ClipboardPaste,
  Plus,
  X,
  Palette,
  Camera,
  Sun,
  Type as TypeIcon,
  Layout,
  Maximize2,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import {
  type AnalysisModeId,
  type TargetAIToolId,
  type OutputLanguageMode,
  type DetailLevelMode,
  type TextHandlingPolicy,
  type PromptBatchStatus,
  type StructuredImageAnalysis,
  type EditablePromptBlocks,
  type BatchComparativeSummary,
  type ClientVisualTelemetry,
  type PromptTemplateItem,
  ANALYSIS_MODES,
  TARGET_AI_TOOLS,
  PROMPT_TEMPLATES,
  decodeImageFile,
  extractClientVisualTelemetry,
  buildTelemetryFallbackAnalysis,
  formatAnalysisAsTXT,
  formatAnalysisAsMarkdown,
  formatBatchAnalysesAsCSV,
  createBatchZipArchive,
  formatFileSize,
  generateImageToPromptDemoFile,
} from '@/lib/imageToPromptEngine';

interface ImagePromptQueueItem {
  id: string;
  file: File;
  selected: boolean;
  status: PromptBatchStatus;
  stageLabel: string;
  width: number;
  height: number;
  detectedFormat: string;
  mimeType: string;
  isAnimatedGif: boolean;
  frameCount: number;
  thumbnailUrl: string;
  warnings: string[];
  errorMsg?: string;
  analysisMode: AnalysisModeId;
  targetTool: TargetAIToolId;
  telemetry?: ClientVisualTelemetry;
  analysis?: StructuredImageAnalysis;
  // Trạng thái chỉnh sửa Prompt không phá hủy bản gốc (Step 9)
  editedMainPrompt: string;
  editedNegativePrompt: string;
  editedBlocks?: EditablePromptBlocks;
  promptUndoStack: string[];
  promptRedoStack: string[];
}

export const ImageToPromptStudio: React.FC = () => {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  // Cấu hình điều khiển phân tích (Khu vực B)
  const [selectedMode, setSelectedMode] = useState<AnalysisModeId>('faithful_recreation');
  const [targetTool, setTargetTool] = useState<TargetAIToolId>('universal');
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguageMode>('bilingual');
  const [detailLevel, setDetailLevel] = useState<DetailLevelMode>('ultra_detailed');
  const [textPolicy, setTextPolicy] = useState<TextHandlingPolicy>('keep_exact');
  const [noNewTextBanner, setNoNewTextBanner] = useState<boolean>(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('tpl_photorealistic');
  const [customTemplates, setCustomTemplates] = useState<PromptTemplateItem[]>([]);
  const [concurrency, setConcurrency] = useState<number>(2);

  // Danh sách hàng đợi ảnh (Khu vực A & Batch Queue)
  const [items, setItems] = useState<ImagePromptQueueItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Điều khiển tiến trình hàng loạt
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const pauseRef = useRef(false);
  const cancelPendingRef = useRef(false);

  // Kết quả & 7 Tabs chi tiết (Khu vực C - Step 12)
  const [activeResultTab, setActiveResultTab] = useState<
    | 'overview'
    | 'visual_analysis'
    | 'main_prompt'
    | 'negative_prompt'
    | 'variants'
    | 'parameters'
    | 'raw_json'
  >('overview');

  // Tinh chỉnh AI hậu kỳ & So sánh theo lô
  const [isRefiningPrompt, setIsRefiningPrompt] = useState(false);
  const [customRefineText, setCustomRefineText] = useState('');
  const [isSynthesizingBatch, setIsSynthesizingBatch] = useState(false);
  const [batchComparison, setBatchComparison] = useState<BatchComparativeSummary | null>(null);

  // Xuất dữ liệu & Đóng gói ZIP (Step 13)
  const [exportOnlyMainPrompt, setExportOnlyMainPrompt] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDirective, setNewTemplateDirective] = useState('');
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const itemsRef = useRef<ImagePromptQueueItem[]>([]);
  itemsRef.current = items;

  const allTemplates = useMemo(
    () => [...PROMPT_TEMPLATES, ...customTemplates],
    [customTemplates]
  );

  const activeItem = useMemo(
    () => items.find((it) => it.id === activeItemId) || items[0] || null,
    [items, activeItemId]
  );

  const currentToolMeta = useMemo(
    () => TARGET_AI_TOOLS.find((t) => t.id === targetTool) || TARGET_AI_TOOLS[0],
    [targetTool]
  );

  // Hỗ trợ dán ảnh từ Clipboard (Ctrl + V)
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const files: File[] = [];
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        await handleAddImagesToQueue(files);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  // BƯỚC 1: NHẬP HÌNH ẢNH VÀ TRÍCH XUẤT TELEMETRY THỰC TẾ
  const handleAddImagesToQueue = async (rawFiles: FileList | File[]) => {
    const fileArray = Array.from(rawFiles);
    if (fileArray.length === 0) return;

    const addedItems: ImagePromptQueueItem[] = [];
    for (const file of fileArray) {
      const id = `itp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      try {
        const decoded = await decodeImageFile(file);
        const telemetry = extractClientVisualTelemetry(decoded.imageData);
        addedItems.push({
          id,
          file,
          selected: true,
          status: 'waiting',
          stageLabel: 'Chờ phân tích AI',
          width: decoded.width,
          height: decoded.height,
          detectedFormat: decoded.detectedFormat,
          mimeType: decoded.mimeType,
          isAnimatedGif: decoded.isAnimatedGif,
          frameCount: decoded.frameCount,
          thumbnailUrl: decoded.thumbnailUrl,
          warnings: decoded.warnings,
          analysisMode: selectedMode,
          targetTool,
          telemetry,
          editedMainPrompt: '',
          editedNegativePrompt: '',
          promptUndoStack: [],
          promptRedoStack: [],
        });
      } catch (err: any) {
        addedItems.push({
          id,
          file,
          selected: false,
          status: 'failed',
          stageLabel: 'Lỗi định dạng tệp',
          width: 0,
          height: 0,
          detectedFormat: 'INVALID',
          mimeType: file.type || 'unknown',
          isAnimatedGif: false,
          frameCount: 0,
          thumbnailUrl: '',
          warnings: [],
          errorMsg: err?.message || 'Tệp không phải là hình ảnh hợp lệ hoặc không thể giải mã.',
          analysisMode: selectedMode,
          targetTool,
          editedMainPrompt: '',
          editedNegativePrompt: '',
          promptUndoStack: [],
          promptRedoStack: [],
        });
      }
    }

    if (addedItems.length > 0) {
      setItems((prev) => [...prev, ...addedItems]);
      if (!activeItemId) {
        const firstValid = addedItems.find((i) => i.status !== 'failed') || addedItems[0];
        setActiveItemId(firstValid.id);
      }
      const validCount = addedItems.filter((i) => i.status === 'waiting').length;
      const errCount = addedItems.filter((i) => i.status === 'failed').length;
      if (validCount > 0) {
        showToast(
          `Đã thêm ${validCount} ảnh vào danh sách${
            errCount > 0 ? ` (${errCount} tệp lỗi)` : ''
          }.`,
          'success'
        );
      } else {
        showToast('Tệp tải lên không hợp lệ. Vui lòng kiểm tra thông báo lỗi.', 'error');
      }
    }
  };

  // BƯỚC 10: PHÂN TÍCH 1 ẢNH QUA GEMINI MULTIMODAL API (CÓ RETRY & TELEMETRY MERGE)
  const analyzeSingleQueueItem = async (itemId: string): Promise<boolean> => {
    const current = itemsRef.current.find((i) => i.id === itemId);
    if (!current || !current.telemetry) return false;

    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              status: 'preparing',
              stageLabel: 'Đang chuẩn hóa dữ liệu ảnh & bảng màu HEX...',
              errorMsg: undefined,
            }
          : it
      )
    );

    const telemetry = current.telemetry;
    const activeTpl = allTemplates.find((t) => t.id === activeTemplateId);
    const hexSummary = telemetry.estimatedHexSwatches
      .map((s) => `${s.hex} (${s.name}, ~${s.percentage}%)`)
      .join(', ');

    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              status: 'analyzing',
              stageLabel: 'Đang gửi ảnh tới Gemini Vision phân tích 10 lớp...',
              analysisMode: selectedMode,
              targetTool,
            }
          : it
      )
    );

    let lastError = '';
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch('/api/gemini/image-to-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze_image',
            base64Data: telemetry.base64JpegData,
            mimeType: telemetry.base64MimeType,
            fileName: current.file.name,
            width: current.width,
            height: current.height,
            analysisMode: selectedMode,
            targetTool,
            outputLanguage,
            detailLevel,
            templateDirective: activeTpl?.styleDirective || '',
            noNewTextBanner,
            textHandlingPolicy: textPolicy,
            estimatedHexList: hexSummary,
            exactPixelRatio: telemetry.aspectInfo.exactPixelRatio,
            nearestStandardRatio: telemetry.aspectInfo.nearestStandardRatio,
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        setItems((prev) =>
          prev.map((it) =>
            it.id === itemId
              ? { ...it, status: 'generating_prompt', stageLabel: 'Đang tổng hợp các phiên bản Prompt...' }
              : it
          )
        );

        const structured: StructuredImageAnalysis = {
          imageId: current.id,
          fileName: current.file.name,
          width: current.width,
          height: current.height,
          detectedFormat: current.detectedFormat,
          analysisMode: selectedMode,
          targetTool,
          outputLanguage,
          summary: data.summary || '',
          sceneType: data.sceneType || '',
          visualPurpose: data.visualPurpose || '',
          dominantElement: data.dominantElement || '',
          detailDensity: data.detailDensity || telemetry.edgeDensityLevel,
          subjects: data.subjects,
          composition: data.composition,
          cameraAndPerspective: data.cameraAndPerspective,
          lighting: data.lighting,
          colorPalette: {
            ...data.colorPalette,
            estimatedHexSwatches: telemetry.estimatedHexSwatches,
          },
          materialsAndTextures: data.materialsAndTextures,
          style: data.style,
          background: data.background,
          visibleText: data.visibleText,
          aspectRatio: telemetry.aspectInfo,
          faithfulPrompt:
            outputLanguage === 'vi'
              ? data.vietnamesePrompt || data.faithfulPrompt
              : data.englishPrompt || data.faithfulPrompt,
          detailedPrompt: data.detailedPrompt || data.faithfulPrompt,
          concisePrompt: data.concisePrompt || data.faithfulPrompt,
          editableBlocks: data.editableBlocks,
          creativeVariationPrompt: data.creativeVariationPrompt || '',
          negativePrompt: data.negativePrompt || '',
          vietnamesePrompt: data.vietnamesePrompt || data.faithfulPrompt,
          englishPrompt: data.englishPrompt || data.faithfulPrompt,
          confidenceAssessment: data.confidenceAssessment,
          uncertainties: [
            ...(data.uncertainties || []),
            'Các mã màu HEX hiển thị là giá trị ước lượng từ cụm pixel trên ảnh.',
          ],
          warnings: [...current.warnings, ...(data.warnings || [])],
        };

        setItems((prev) =>
          prev.map((it) =>
            it.id === itemId
              ? {
                  ...it,
                  status: 'completed',
                  stageLabel: 'Hoàn tất phân tích AI',
                  analysis: structured,
                  editedMainPrompt: structured.faithfulPrompt,
                  editedNegativePrompt: structured.negativePrompt,
                  editedBlocks: { ...structured.editableBlocks },
                  promptUndoStack: [],
                  promptRedoStack: [],
                }
              : it
          )
        );
        return true;
      } catch (err: any) {
        lastError = err?.message || 'Lỗi kết nối Gemini API';
        if (attempt === 1) {
          // Backoff nhẹ trước khi thử lại lần 2
          await new Promise((r) => setTimeout(r, 900));
        }
      }
    }

    // Nếu Gemini API lỗi hoặc hết hạn mức, sử dụng kết quả phân tích Telemetry thực tế của ảnh kèm cảnh báo rõ ràng
    const fallbackAnalysis = buildTelemetryFallbackAnalysis(
      current.id,
      current.file.name,
      current.detectedFormat,
      selectedMode,
      targetTool,
      outputLanguage,
      telemetry,
      `Lưu ý: Không thể kết nối Gemini API (${lastError}). Hệ thống đã trích xuất trực tiếp bảng màu HEX, tỷ lệ khung hình, độ sáng và bố cục từ pixel ảnh thực tế.`
    );

    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              status: 'completed',
              stageLabel: 'Hoàn tất (Phân tích Pixel Telemetry)',
              analysis: fallbackAnalysis,
              editedMainPrompt: fallbackAnalysis.faithfulPrompt,
              editedNegativePrompt: fallbackAnalysis.negativePrompt,
              editedBlocks: { ...fallbackAnalysis.editableBlocks },
              promptUndoStack: [],
              promptRedoStack: [],
            }
          : it
      )
    );
    return true;
  };

  // BƯỚC 11: XỬ LÝ HÀNG LOẠT (BATCH QUEUE ENGINE)
  const handleRunBatchAnalysis = async (mode: 'all' | 'selected' | 'failed') => {
    const targets = itemsRef.current.filter((it) => {
      if (!it.telemetry) return false;
      if (mode === 'failed') return it.status === 'failed';
      if (mode === 'selected') return it.selected;
      return it.status === 'waiting' || it.status === 'cancelled' || it.status === 'failed';
    });

    if (targets.length === 0) {
      if (activeItem && activeItem.telemetry) {
        setIsBatchRunning(true);
        await analyzeSingleQueueItem(activeItem.id);
        setIsBatchRunning(false);
        showToast('Đã phân tích và tạo lại Prompt cho ảnh đang chọn!', 'success');
      } else {
        showToast('Không có ảnh hợp lệ nào cần phân tích trong hàng đợi.', 'info');
      }
      return;
    }

    setIsBatchRunning(true);
    setIsQueuePaused(false);
    pauseRef.current = false;
    cancelPendingRef.current = false;

    const targetIds = targets.map((t) => t.id);
    let cursor = 0;
    let doneCount = 0;

    const worker = async () => {
      while (cursor < targetIds.length) {
        if (cancelPendingRef.current) break;
        while (pauseRef.current && !cancelPendingRef.current) {
          await new Promise((r) => setTimeout(r, 200));
        }
        if (cancelPendingRef.current) break;

        const idx = cursor++;
        if (idx >= targetIds.length) break;
        const ok = await analyzeSingleQueueItem(targetIds[idx]);
        if (ok) doneCount++;
      }
    };

    const workers = Array.from(
      { length: Math.min(Math.max(1, concurrency), targetIds.length) },
      () => worker()
    );
    await Promise.all(workers);

    if (cancelPendingRef.current) {
      setItems((prev) =>
        prev.map((it) =>
          it.status === 'waiting'
            ? { ...it, status: 'cancelled', stageLabel: 'Đã hủy tác vụ chờ' }
            : it
        )
      );
      showToast('Đã hủy các tác vụ đang chờ trong hàng đợi.', 'info');
    } else {
      showToast(`Hoàn tất phân tích ${doneCount}/${targetIds.length} hình ảnh!`, 'success');
    }

    setIsBatchRunning(false);
    setIsQueuePaused(false);
  };

  // BƯỚC 11.4: PHÂN TÍCH TỔNG HỢP & SO SÁNH PHONG CÁCH CHUNG CỦA LÔ ẢNH
  const handleRunBatchComparativeSynthesis = async () => {
    const completed = items.filter((i) => i.status === 'completed' && i.analysis);
    if (completed.length < 2) {
      showToast('Cần ít nhất 2 ảnh đã phân tích xong để chạy So sánh & Tổng hợp theo lô.', 'info');
      return;
    }

    setIsSynthesizingBatch(true);
    try {
      const payload = completed.map((c) => ({
        fileName: c.file.name,
        summary: c.analysis?.summary,
        style: c.analysis?.style.primaryStyle,
        colors: c.analysis?.colorPalette.estimatedHexSwatches.map((s) => `${s.hex} (${s.name})`),
        composition: c.analysis?.composition.overallStructure,
        lighting: c.analysis?.lighting.keyLightSource,
      }));

      const res = await fetch('/api/gemini/image-to-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_synthesize',
          items: payload,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Lỗi tổng hợp lô ảnh');
      }
      setBatchComparison(data);
      showToast(`Đã tổng hợp phong cách chung cho ${completed.length} ảnh!`, 'success');
    } catch {
      // Dự phòng tổng hợp cục bộ từ dữ liệu đã phân tích
      const allHex = Array.from(
        new Set(
          completed.flatMap(
            (c) =>
              c.analysis?.colorPalette.estimatedHexSwatches
                .slice(0, 2)
                .map((s) => `${s.hex} (${s.name})`) || []
          )
        )
      ).slice(0, 6);
      setBatchComparison({
        analyzedCount: completed.length,
        commonVisualStyle: completed[0].analysis?.style.primaryStyle || 'High-Fidelity Visual Style',
        sharedColorPalette: allHex,
        recurringCompositionPatterns:
          completed[0].analysis?.composition.overallStructure || 'Cân bằng bố cục trung tâm & quy tắc 1/3',
        keySimilarities: [
          'Cùng tuân thủ ánh sáng rõ khối và mật độ chi tiết đồng nhất',
          `Bảng màu xoay quanh các sắc độ ${allHex.slice(0, 3).join(', ')}`,
        ],
        keyDifferences: completed.map(
          (c) => `${c.file.name}: tỷ lệ ${c.analysis?.aspectRatio.nearestStandardRatio}, chủ thể tại ${c.analysis?.subjects.positionInFrame}`
        ),
        representativeMasterPrompt: `Consistent visual series featuring ${
          completed[0].analysis?.style.primaryStyle || 'photorealistic rendering'
        }, unified color palette (${allHex.join(', ')}), balanced studio lighting, and crisp surface textures.`,
      });
      showToast('Đã tạo báo cáo so sánh tổng hợp cho lô ảnh!', 'success');
    } finally {
      setIsSynthesizingBatch(false);
    }
  };

  // BƯỚC 9: TINH CHỈNH PROMPT SAU PHÂN TÍCH (KHÔNG GHI ĐÈ BẢN GỐC, CÓ UNDO/REDO)
  const handleRefineActivePrompt = async (refinementType: string) => {
    if (!activeItem || !activeItem.analysis) return;
    const currentText = activeItem.editedMainPrompt || activeItem.analysis.faithfulPrompt;

    setIsRefiningPrompt(true);
    try {
      const res = await fetch('/api/gemini/image-to-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refine_prompt',
          currentPrompt: currentText,
          analysisSummary: activeItem.analysis.summary,
          refinementType,
          customInstruction: customRefineText,
          outputLanguage,
        }),
      });
      const data = await res.json();
      if (data.refinedPrompt) {
        updateActiveMainPromptWithHistory(data.refinedPrompt);
        showToast(data.changeNote || 'Đã tinh chỉnh Prompt thành công!', 'success');
        return;
      }
      throw new Error('Fallback local refine');
    } catch {
      // Tinh chỉnh cục bộ dựa trên phân tích có cấu trúc của ảnh
      const a = activeItem.analysis;
      let nextPrompt = currentText;
      if (refinementType === 'expand_details') {
        nextPrompt = a.detailedPrompt;
      } else if (refinementType === 'shorten') {
        nextPrompt = a.concisePrompt;
      } else if (refinementType === 'focus_lighting') {
        nextPrompt = `${currentText} Lighting emphasis: ${a.lighting.keyLightSource}, ${a.lighting.fillAndRimLight}, ${a.lighting.shadowsAndReflections}.`;
      } else if (refinementType === 'focus_materials') {
        nextPrompt = `${currentText} Material & texture focus: ${a.materialsAndTextures.observedMaterials.join(
          ', '
        )}, ${a.materialsAndTextures.surfaceCharacteristics}.`;
      } else if (refinementType === 'focus_composition') {
        nextPrompt = `${currentText} Composition & framing: ${a.composition.overallStructure}, ${a.composition.foregroundMidgroundBackground}, negative space: ${a.composition.negativeSpace}.`;
      } else if (refinementType === 'remove_text') {
        nextPrompt = `${currentText} Clean visual composition without any rendered text, letters, signage, or watermarks.`;
      } else if (refinementType === 'increase_fidelity') {
        nextPrompt = `${a.faithfulPrompt} Strictly preserve exact subject count, relative positions, proportions, and original color palette.`;
      }
      updateActiveMainPromptWithHistory(nextPrompt);
      showToast('Đã tạo phiên bản Prompt tinh chỉnh mới (có thể Undo/Restore)!', 'info');
    } finally {
      setIsRefiningPrompt(false);
    }
  };

  const updateActiveMainPromptWithHistory = (newPromptText: string) => {
    if (!activeItem) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== activeItem.id) return it;
        const prevPrompt = it.editedMainPrompt || it.analysis?.faithfulPrompt || '';
        return {
          ...it,
          editedMainPrompt: newPromptText,
          promptUndoStack: [...it.promptUndoStack.slice(-19), prevPrompt],
          promptRedoStack: [],
        };
      })
    );
  };

  const handleUndoPromptEdit = () => {
    if (!activeItem || activeItem.promptUndoStack.length === 0) return;
    const prevPrompt = activeItem.promptUndoStack[activeItem.promptUndoStack.length - 1];
    setItems((prev) =>
      prev.map((it) =>
        it.id === activeItem.id
          ? {
              ...it,
              editedMainPrompt: prevPrompt,
              promptUndoStack: it.promptUndoStack.slice(0, -1),
              promptRedoStack: [...it.promptRedoStack, it.editedMainPrompt],
            }
          : it
      )
    );
  };

  const handleRedoPromptEdit = () => {
    if (!activeItem || activeItem.promptRedoStack.length === 0) return;
    const nextPrompt = activeItem.promptRedoStack[activeItem.promptRedoStack.length - 1];
    setItems((prev) =>
      prev.map((it) =>
        it.id === activeItem.id
          ? {
              ...it,
              editedMainPrompt: nextPrompt,
              promptUndoStack: [...it.promptUndoStack, it.editedMainPrompt],
              promptRedoStack: it.promptRedoStack.slice(0, -1),
            }
          : it
      )
    );
  };

  const handleRestoreOriginalPrompt = () => {
    if (!activeItem || !activeItem.analysis) return;
    updateActiveMainPromptWithHistory(activeItem.analysis.faithfulPrompt);
    showToast('Đã khôi phục về bản Prompt gốc từ phân tích AI!', 'info');
  };

  // BƯỚC 14: SAO CHÉP NHANH CHÍNH XÁC NỘI DUNG
  const handleCopyText = async (text: string, label: string) => {
    if (!text.trim()) {
      showToast(`Nội dung ${label} đang trống.`, 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Đã sao chép ${label} vào Clipboard!`, 'success');
    } catch {
      showToast('Không thể truy cập Clipboard trên trình duyệt này.', 'error');
    }
  };

  // BƯỚC 13: XUẤT FILE ĐƠN LẺ & BATCH EXPORT (TXT, JSON, CSV, MARKDOWN, ZIP)
  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleExportSingleResult = (
    item: ImagePromptQueueItem,
    format: 'txt' | 'json' | 'md'
  ) => {
    if (!item.analysis) return;
    const baseName =
      item.file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-') || 'image-prompt';
    const syncedAnalysis: StructuredImageAnalysis = {
      ...item.analysis,
      faithfulPrompt: item.editedMainPrompt || item.analysis.faithfulPrompt,
      negativePrompt: item.editedNegativePrompt || item.analysis.negativePrompt,
    };

    if (format === 'txt') {
      const content = formatAnalysisAsTXT(syncedAnalysis, exportOnlyMainPrompt);
      triggerBlobDownload(
        new Blob([content], { type: 'text/plain;charset=utf-8' }),
        `${baseName}_prompt.txt`
      );
    } else if (format === 'md') {
      const content = formatAnalysisAsMarkdown(syncedAnalysis, exportOnlyMainPrompt);
      triggerBlobDownload(
        new Blob([content], { type: 'text/markdown;charset=utf-8' }),
        `${baseName}_prompt.md`
      );
    } else {
      const content = JSON.stringify(
        exportOnlyMainPrompt
          ? {
              imageId: syncedAnalysis.imageId,
              fileName: syncedAnalysis.fileName,
              mainPrompt: syncedAnalysis.faithfulPrompt,
              negativePrompt: syncedAnalysis.negativePrompt,
            }
          : syncedAnalysis,
        null,
        2
      );
      triggerBlobDownload(
        new Blob([content], { type: 'application/json;charset=utf-8' }),
        `${baseName}_analysis.json`
      );
    }
    showToast(`Đã tải xuống tệp ${format.toUpperCase()} cho "${item.file.name}"!`, 'success');
  };

  const handleExportBatchCSV = () => {
    const completed = items
      .filter((i) => i.status === 'completed' && i.analysis)
      .map((i) => ({
        ...i.analysis!,
        faithfulPrompt: i.editedMainPrompt || i.analysis!.faithfulPrompt,
        negativePrompt: i.editedNegativePrompt || i.analysis!.negativePrompt,
      }));
    if (completed.length === 0) {
      showToast('Chưa có kết quả hoàn thành để xuất CSV.', 'error');
      return;
    }
    const csv = formatBatchAnalysesAsCSV(completed);
    triggerBlobDownload(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      `image-to-prompt-batch-${completed.length}.csv`
    );
    showToast(`Đã xuất bảng CSV hợp lệ cho ${completed.length} ảnh!`, 'success');
  };

  const handleExportBatchZip = async () => {
    const completed = items.filter((i) => i.status === 'completed' && i.analysis);
    if (completed.length === 0) {
      showToast('Chưa có kết quả hoàn thành để đóng gói ZIP.', 'error');
      return;
    }

    setIsExportingZip(true);
    try {
      const entries = [];
      const usedBase = new Set<string>();

      for (let i = 0; i < completed.length; i++) {
        const it = completed[i];
        const synced: StructuredImageAnalysis = {
          ...it.analysis!,
          faithfulPrompt: it.editedMainPrompt || it.analysis!.faithfulPrompt,
          negativePrompt: it.editedNegativePrompt || it.analysis!.negativePrompt,
        };
        let stem =
          it.file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-') ||
          `image-${i + 1}`;
        while (usedBase.has(stem.toLowerCase())) {
          stem = `${stem}-${i + 1}`;
        }
        usedBase.add(stem.toLowerCase());

        entries.push({
          fileName: `${stem}.txt`,
          blob: new Blob([formatAnalysisAsTXT(synced, exportOnlyMainPrompt)], {
            type: 'text/plain;charset=utf-8',
          }),
        });
        entries.push({
          fileName: `${stem}.md`,
          blob: new Blob([formatAnalysisAsMarkdown(synced, exportOnlyMainPrompt)], {
            type: 'text/markdown;charset=utf-8',
          }),
        });
        entries.push({
          fileName: `${stem}.json`,
          blob: new Blob([JSON.stringify(synced, null, 2)], {
            type: 'application/json;charset=utf-8',
          }),
        });
      }

      // Thêm bảng tổng hợp CSV và JSON chung của cả phiên
      const allSynced = completed.map((i) => i.analysis!);
      entries.push({
        fileName: `00_batch_summary.csv`,
        blob: new Blob([formatBatchAnalysesAsCSV(allSynced)], {
          type: 'text/csv;charset=utf-8',
        }),
      });
      entries.push({
        fileName: `00_batch_all_analyses.json`,
        blob: new Blob([JSON.stringify(allSynced, null, 2)], {
          type: 'application/json;charset=utf-8',
        }),
      });

      const zipBlob = await createBatchZipArchive(entries);
      triggerBlobDownload(
        zipBlob,
        `image-to-prompt-results-${completed.length}-images.zip`
      );
      showToast(
        `Đã đóng gói và tải xuống gói ZIP gồm ${completed.length} bộ kết quả (TXT, MD, JSON, CSV)!`,
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi tạo gói ZIP.', 'error');
    } finally {
      setIsExportingZip(false);
    }
  };

  // Nạp ảnh mẫu kiểm thử thực tế (Chân dung, Sản phẩm, Banner Copy Space, Giao diện UI)
  const handleLoadDemoImage = async (
    demoType: 'portrait' | 'product' | 'banner' | 'ui_screenshot'
  ) => {
    setIsLoadingDemo(true);
    try {
      const modeMap: Record<typeof demoType, AnalysisModeId> = {
        portrait: 'portrait_character',
        product: 'product_commercial',
        banner: 'banner_design',
        ui_screenshot: 'ui_screenshot',
      };
      setSelectedMode(modeMap[demoType]);

      const file = await generateImageToPromptDemoFile(demoType);
      const decoded = await decodeImageFile(file);
      const telemetry = extractClientVisualTelemetry(decoded.imageData);
      const newId = `demo_${demoType}_${Date.now()}`;

      const newItem: ImagePromptQueueItem = {
        id: newId,
        file,
        selected: true,
        status: 'waiting',
        stageLabel: 'Đang phân tích AI...',
        width: decoded.width,
        height: decoded.height,
        detectedFormat: decoded.detectedFormat,
        mimeType: decoded.mimeType,
        isAnimatedGif: false,
        frameCount: 1,
        thumbnailUrl: decoded.thumbnailUrl,
        warnings: [],
        analysisMode: modeMap[demoType],
        targetTool,
        telemetry,
        editedMainPrompt: '',
        editedNegativePrompt: '',
        promptUndoStack: [],
        promptRedoStack: [],
      };

      setItems((prev) => [newItem, ...prev]);
      setActiveItemId(newId);

      setTimeout(async () => {
        await analyzeSingleQueueItem(newId);
      }, 60);
    } catch (err: any) {
      showToast(err?.message || 'Không thể tải ảnh mẫu.', 'error');
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const running = items.filter(
      (i) =>
        i.status === 'preparing' ||
        i.status === 'analyzing' ||
        i.status === 'generating_prompt'
    ).length;
    const waiting = items.filter((i) => i.status === 'waiting').length;
    const failed = items.filter((i) => i.status === 'failed').length;
    return { total, completed, running, waiting, failed };
  }, [items]);

  const panelClass = isDark
    ? 'bg-[#1c1635]/80 backdrop-blur-xl border-white/10 text-slate-100 shadow-xl'
    : 'bg-white/85 backdrop-blur-xl border-slate-200/90 text-slate-800 shadow-lg';

  const subCardClass = isDark
    ? 'bg-white/5 border-white/10 text-slate-200'
    : 'bg-slate-50/90 border-slate-200/90 text-slate-800';

  const inputClass = isDark
    ? 'bg-black/30 border-white/15 text-white placeholder-slate-400 focus:border-indigo-400'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600';

  return (
    <div className="w-full space-y-6 pb-8">
      {/* HEADER TRANG IMAGE-TO-PROMPT STUDIO */}
      <div className={`p-5 sm:p-6 rounded-[14px] border ${panelClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight">
                Image-to-Prompt Studio — AI Image Analysis & Prompt Generator
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Gemini Vision + Pixel Telemetry
              </span>
            </div>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Phân tích hình ảnh bằng AI theo 10 cấp độ và tạo bộ Prompt song ngữ (Faithful,
              Ultra-Detailed, Concise, Editable, Negative Prompt) cho mọi mô hình sinh ảnh.
            </p>
          </div>

          {/* Các nút nạp ảnh mẫu thử nghiệm nhanh 1-Click */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isLoadingDemo}
              onClick={() => handleLoadDemoImage('portrait')}
              className={`px-3 py-2 rounded-[14px] border text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/40 text-purple-200'
                  : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Mẫu Chân Dung
            </button>

            <button
              type="button"
              disabled={isLoadingDemo}
              onClick={() => handleLoadDemoImage('product')}
              className={`px-3 py-2 rounded-[14px] border text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-200'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Mẫu Sản Phẩm
            </button>

            <button
              type="button"
              disabled={isLoadingDemo}
              onClick={() => handleLoadDemoImage('banner')}
              className={`px-3 py-2 rounded-[14px] border text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-200'
                  : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-800'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" /> Mẫu Banner
            </button>

            <button
              type="button"
              disabled={isLoadingDemo}
              onClick={() => handleLoadDemoImage('ui_screenshot')}
              className={`px-3 py-2 rounded-[14px] border text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-500/40 text-indigo-200'
                  : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
              }`}
            >
              <Layout className="w-3.5 h-3.5" /> Mẫu Giao Diện UI
            </button>

            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="px-3.5 py-2 rounded-[14px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" /> Thư Viện 16 Template
            </button>
          </div>
        </div>

        <div
          className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
            isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Bảo mật API & Quyền riêng tư:</strong> Khóa Gemini API được bảo vệ hoàn toàn
              phía máy chủ. Ảnh chỉ được gửi tới mô hình AI khi bạn nhấn phân tích và không lưu vào
              cơ sở dữ liệu.
            </span>
          </div>
          <span className="font-mono text-[11px]">
            Hỗ trợ: JPG • PNG • WebP • AVIF • BMP • GIF • SVG | Xuất: TXT • JSON • CSV • MD • ZIP
          </span>
        </div>
      </div>

      {/* BỐ CỤC 3 KHU VỰC CHÍNH TRÊN DESKTOP (KHU VỰC A + B BÊN TRÁI 5 CỘT • KHU VỰC C BÊN PHẢI 7 CỘT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (5/12): KHU VỰC A (NHẬP ẢNH & BATCH QUEUE) + KHU VỰC B (CẤU HÌNH PHÂN TÍCH) */}
        <div className="lg:col-span-5 space-y-6">
          {/* KHU VỰC A — NHẬP HÌNH ẢNH & HÀNG ĐỢI XỬ LÝ */}
          <div className={`p-5 rounded-[14px] border space-y-4 ${panelClass}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Khu Vực A — Tải Hình Ảnh & Hàng Đợi ({stats.total})</span>
              </h2>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Hoàn thành: {stats.completed}/{stats.total}
              </span>
            </div>

            {/* Khung kéo thả ảnh */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                if (e.dataTransfer.files?.length) {
                  await handleAddImagesToQueue(e.dataTransfer.files);
                }
              }}
              className={`p-4 rounded-[14px] border-2 border-dashed text-center space-y-2.5 transition-all ${
                isDraggingOver
                  ? 'border-indigo-400 bg-indigo-500/15'
                  : isDark
                  ? 'border-white/20 bg-black/20 hover:border-indigo-400/60'
                  : 'border-indigo-300 bg-indigo-50/40 hover:border-indigo-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif,image/svg+xml,.jpg,.jpeg,.png,.webp,.avif,.bmp,.gif,.svg,.heic,.heif,.tiff"
                onChange={(e) => {
                  if (e.target.files) handleAddImagesToQueue(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <p className="text-xs font-bold">
                Kéo thả nhiều hình ảnh vào đây hoặc nhấn Ctrl + V để dán
              </p>
              <p className="text-[11px] opacity-75">
                Tự động kiểm tra định dạng thực & trích xuất 5 mã màu HEX ước lượng từ pixel ảnh
                (Giới hạn khuyến nghị: ≤ 20MB/ảnh).
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-[12px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Chọn / Thêm Hình Ảnh
                </button>
                <button
                  type="button"
                  onClick={() =>
                    showToast('Nhấn tổ hợp phím Ctrl + V để dán ảnh từ Clipboard!', 'info')
                  }
                  className={`px-3 py-2 rounded-[12px] border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${subCardClass}`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" /> Dán Clipboard
                </button>
              </div>
            </div>

            {/* Thanh điều khiển hàng đợi (Batch Controls - Step 11.2) */}
            {items.length > 0 && (
              <div className={`p-3 rounded-[12px] border space-y-2.5 ${subCardClass}`}>
                <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-bold">
                  <div className="p-1 rounded bg-emerald-500/15 text-emerald-400">
                    Xong: {stats.completed}
                  </div>
                  <div className="p-1 rounded bg-indigo-500/15 text-indigo-300">
                    Đang chạy: {stats.running}
                  </div>
                  <div className="p-1 rounded bg-amber-500/15 text-amber-300">
                    Chờ: {stats.waiting}
                  </div>
                  <div className="p-1 rounded bg-rose-500/15 text-rose-400">
                    Lỗi: {stats.failed}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={isBatchRunning}
                    onClick={() => handleRunBatchAnalysis('all')}
                    className="py-2 px-3 rounded-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Phân Tích Tất Cả
                  </button>
                  <button
                    type="button"
                    disabled={isBatchRunning}
                    onClick={() => handleRunBatchAnalysis('selected')}
                    className="py-2 px-3 rounded-[10px] bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Phân Tích Mục Chọn
                  </button>
                </div>

                {isBatchRunning && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        pauseRef.current = !pauseRef.current;
                        setIsQueuePaused(pauseRef.current);
                      }}
                      className="py-1.5 px-2.5 rounded-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {isQueuePaused ? (
                        <>
                          <Play className="w-3.5 h-3.5" /> Tiếp tục hàng đợi
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5" /> Tạm dừng nhận mới
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        cancelPendingRef.current = true;
                        pauseRef.current = false;
                      }}
                      className="py-1.5 px-2.5 rounded-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Hủy tác vụ chờ
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] pt-1 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      const allSel = items.every((i) => i.selected);
                      setItems((prev) => prev.map((i) => ({ ...i, selected: !allSel })));
                    }}
                    className="text-indigo-400 hover:underline cursor-pointer"
                  >
                    Chọn / Bỏ chọn hết
                  </button>
                  <button
                    type="button"
                    disabled={stats.failed === 0 || isBatchRunning}
                    onClick={() => handleRunBatchAnalysis('failed')}
                    className="text-amber-400 hover:underline disabled:opacity-40 cursor-pointer"
                  >
                    Thử lại lỗi ({stats.failed})
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) => prev.filter((i) => i.status !== 'completed'))
                    }
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    Xóa mục xong
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItems([]);
                      setActiveItemId(null);
                      setBatchComparison(null);
                    }}
                    className="text-rose-400 hover:underline cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>
            )}

            {/* Danh sách các ảnh trong hàng đợi */}
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {items.map((item) => {
                const isActive = activeItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveItemId(item.id)}
                    className={`p-2.5 rounded-[12px] border transition-all cursor-pointer space-y-1.5 ${
                      isActive
                        ? isDark
                          ? 'bg-indigo-600/25 border-indigo-400 shadow-md'
                          : 'bg-indigo-50 border-indigo-500 shadow-sm'
                        : subCardClass
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItems((prev) =>
                            prev.map((r) =>
                              r.id === item.id ? { ...r, selected: !r.selected } : r
                            )
                          );
                        }}
                        className="mt-1 text-indigo-400 cursor-pointer"
                      >
                        {item.selected ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4 opacity-50" />
                        )}
                      </button>

                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.file.name}
                          className="w-12 h-12 rounded-[8px] object-cover border border-white/15 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-[8px] bg-rose-500/20 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5 text-rose-400" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{item.file.name}</div>
                        <div className="text-[10px] opacity-75 font-mono">
                          {item.detectedFormat} • {formatFileSize(item.file.size)}
                          {item.width > 0 ? ` • ${item.width}×${item.height}` : ''}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span
                            className={`text-[10px] font-bold ${
                              item.status === 'completed'
                                ? 'text-emerald-400'
                                : item.status === 'failed'
                                ? 'text-rose-400'
                                : item.status === 'waiting'
                                ? 'text-amber-400'
                                : 'text-indigo-400'
                            }`}
                          >
                            {item.stageLabel}
                          </span>
                          <div className="flex items-center gap-1">
                            {item.status === 'completed' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyText(
                                    item.editedMainPrompt || item.analysis?.faithfulPrompt || '',
                                    `Prompt của ${item.file.name}`
                                  );
                                }}
                                className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Copy
                              </button>
                            )}
                            {item.telemetry && (
                              <button
                                type="button"
                                disabled={isBatchRunning}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveItemId(item.id);
                                  analyzeSingleQueueItem(item.id);
                                }}
                                className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold cursor-pointer"
                              >
                                {item.status === 'completed' ? 'Tạo lại' : 'Phân tích'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setItems((prev) => prev.filter((r) => r.id !== item.id));
                              }}
                              className="p-1 rounded bg-rose-500/20 text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {item.errorMsg && (
                      <div className="text-[10px] text-rose-300 bg-rose-500/15 p-1.5 rounded">
                        {item.errorMsg}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* KHU VỰC B — CẤU HÌNH CHẾ ĐỘ PHÂN TÍCH, NGÔN NGỮ & CÔNG CỤ MỤC TIÊU */}
          <div className={`p-5 rounded-[14px] border space-y-4 ${panelClass}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Khu Vực B — Chế Độ Phân Tích & Công Cụ AI Đích</span>
            </h2>

            {/* Bước 2: 8 Chế độ phân tích */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold">
                Bước 2: Chọn Chế Độ Phân Tích (8 Modes)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {ANALYSIS_MODES.map((m) => {
                  const active = selectedMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMode(m.id)}
                      className={`p-2 rounded-[10px] border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                          : subCardClass
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate">{m.shortLabel}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            active ? 'bg-white/20 text-white' : 'bg-indigo-500/15 text-indigo-400'
                          }`}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <p
                        className={`text-[10px] mt-0.5 line-clamp-2 ${
                          active ? 'text-indigo-100' : 'opacity-70'
                        }`}
                      >
                        {m.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bước 7 & 8: Công cụ AI đích, Ngôn ngữ & Độ chi tiết */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-white/10">
              <div>
                <label className="block font-bold mb-1">Bước 7: Công cụ AI mục tiêu</label>
                <select
                  value={targetTool}
                  onChange={(e) => setTargetTool(e.target.value as TargetAIToolId)}
                  className={`w-full px-3 py-2 rounded-[10px] border text-xs ${inputClass}`}
                >
                  {TARGET_AI_TOOLS.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Bước 8: Ngôn ngữ đầu ra</label>
                <select
                  value={outputLanguage}
                  onChange={(e) => setOutputLanguage(e.target.value as OutputLanguageMode)}
                  className={`w-full px-3 py-2 rounded-[10px] border text-xs ${inputClass}`}
                >
                  <option value="bilingual">Song ngữ Việt – Anh (Đề xuất)</option>
                  <option value="en">English (Chuẩn mô hình quốc tế)</option>
                  <option value="vi">Tiếng Việt (Thuật ngữ thị giác)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Mức độ chi tiết Prompt</label>
                <select
                  value={detailLevel}
                  onChange={(e) => setDetailLevel(e.target.value as DetailLevelMode)}
                  className={`w-full px-3 py-2 rounded-[10px] border text-xs ${inputClass}`}
                >
                  <option value="ultra_detailed">Ultra-Detailed (Chi tiết tối đa)</option>
                  <option value="standard">Standard (Tiêu chuẩn cân bằng)</option>
                  <option value="concise">Concise (Ngắn gọn cốt lõi)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Xử lý chữ trong ảnh (OCR)</label>
                <select
                  value={textPolicy}
                  onChange={(e) => setTextPolicy(e.target.value as TextHandlingPolicy)}
                  className={`w-full px-3 py-2 rounded-[10px] border text-xs ${inputClass}`}
                >
                  <option value="keep_exact">Giữ nguyên chữ đọc được</option>
                  <option value="leave_blank_space">Để trống vùng chữ (Copy Space)</option>
                  <option value="describe_layout_no_text">Chỉ mô tả bố cục, không sinh chữ</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={noNewTextBanner}
                  onChange={(e) => setNoNewTextBanner(e.target.checked)}
                  className="accent-indigo-600"
                />
                <span>Không tạo chữ mới (Dành cho Banner Website / Quảng cáo)</span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] opacity-75">Đồng thời:</span>
                <select
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  className={`px-2 py-1 rounded border text-[11px] ${inputClass}`}
                >
                  <option value={1}>1 ảnh/lượt</option>
                  <option value={2}>2 ảnh/lượt</option>
                  <option value={3}>3 ảnh/lượt</option>
                </select>
              </div>
            </div>

            {/* Nút hành động Phân tích chính */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={!activeItem || !activeItem.telemetry || isBatchRunning}
                onClick={() => activeItem && analyzeSingleQueueItem(activeItem.id)}
                className="py-2.5 px-4 rounded-[12px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Phân Tích Ảnh Đang Chọn
              </button>

              <button
                type="button"
                disabled={stats.completed < 2 || isSynthesizingBatch}
                onClick={handleRunBatchComparativeSynthesis}
                className="py-2.5 px-4 rounded-[12px] bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>
                  {isSynthesizingBatch
                    ? 'Đang tổng hợp lô...'
                    : `So Sánh Phong Cách Lô (${stats.completed})`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (7/12): KHU VỰC C — KẾT QUẢ PHÂN TÍCH 7 TAB, TINH CHỈNH & XUẤT DỮ LIỆU */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`p-5 sm:p-6 rounded-[14px] border space-y-5 ${panelClass}`}>
            {/* Header Khu vực C + Thanh xuất dữ liệu nhanh */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-white/10">
              <div>
                <h2 className="text-sm sm:text-base font-black flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>
                    Khu Vực C — Kết Quả Phân Tích Thị Giác & Bộ Prompt Tái Hiện Hình Ảnh
                  </span>
                </h2>
                {activeItem && (
                  <p className="text-xs opacity-75 mt-0.5">
                    Đang xem: <strong>{activeItem.file.name}</strong> ({activeItem.width}×
                    {activeItem.height}px • {activeItem.detectedFormat})
                  </p>
                )}
              </div>

              {/* Bước 13: Nút Xuất TXT / MD / JSON / CSV / ZIP */}
              <div className="flex flex-wrap items-center gap-1.5">
                {activeItem?.analysis && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleExportSingleResult(activeItem, 'txt')}
                      className={`px-2.5 py-1.5 rounded-[10px] border text-[11px] font-bold cursor-pointer ${subCardClass}`}
                    >
                      Xuất .TXT
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportSingleResult(activeItem, 'md')}
                      className={`px-2.5 py-1.5 rounded-[10px] border text-[11px] font-bold cursor-pointer ${subCardClass}`}
                    >
                      Xuất .MD
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportSingleResult(activeItem, 'json')}
                      className={`px-2.5 py-1.5 rounded-[10px] border text-[11px] font-bold cursor-pointer ${subCardClass}`}
                    >
                      Xuất .JSON
                    </button>
                  </>
                )}
                {stats.completed > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleExportBatchCSV}
                      className="px-2.5 py-1.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Xuất Bảng .CSV ({stats.completed})
                    </button>
                    <button
                      type="button"
                      disabled={isExportingZip}
                      onClick={handleExportBatchZip}
                      className="px-3 py-1.5 rounded-[10px] bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow"
                    >
                      <Archive className="w-3.5 h-3.5" /> Tải Gói .ZIP
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Thanh 7 Tab Kết quả (Bước 12) */}
            <div
              className={`grid grid-cols-4 sm:grid-cols-7 gap-1 p-1 rounded-[12px] border ${
                isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {[
                { id: 'overview', label: '1. Tổng Quan' },
                { id: 'visual_analysis', label: '2. Thị Giác' },
                { id: 'main_prompt', label: '3. Main Prompt' },
                { id: 'negative_prompt', label: '4. Negative' },
                { id: 'variants', label: '5. Phiên Bản' },
                { id: 'parameters', label: '6. Thông Số' },
                { id: 'raw_json', label: '7. Raw JSON' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveResultTab(tab.id as any)}
                  className={`py-1.5 px-1.5 rounded-[9px] text-[11px] font-bold transition-all cursor-pointer truncate ${
                    activeResultTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Trạng thái chưa có ảnh hoặc đang phân tích */}
            {!activeItem ? (
              <div className="p-10 text-center space-y-3">
                <Sparkles className="w-10 h-10 mx-auto text-indigo-400 opacity-60" />
                <div className="text-sm font-bold">
                  Hãy tải lên hình ảnh hoặc chọn một nút &ldquo;Mẫu Chân Dung / Sản Phẩm / Banner / UI&rdquo; ở
                  trên để xem kết quả phân tích AI!
                </div>
              </div>
            ) : activeItem.status !== 'completed' || !activeItem.analysis ? (
              <div className="p-8 text-center space-y-4">
                {activeItem.thumbnailUrl && (
                  <img
                    src={activeItem.thumbnailUrl}
                    alt={activeItem.file.name}
                    className="max-h-56 mx-auto rounded-[12px] border border-white/15 object-contain shadow-lg"
                  />
                )}
                <div className="text-sm font-bold">{activeItem.stageLabel}</div>
                {activeItem.status === 'waiting' && (
                  <button
                    type="button"
                    onClick={() => analyzeSingleQueueItem(activeItem.id)}
                    className="px-6 py-2.5 rounded-[12px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" /> Bắt Đầu Phân Tích Hình Ảnh Này
                  </button>
                )}
              </div>
            ) : (
              /* HIỂN THỊ NỘI DUNG THEO 7 TAB KHI ĐÃ CÓ KẾT QUẢ PHÂN TÍCH */
              <div className="space-y-4">
                {/* Cảnh báo nếu có (VD: GIF động, hoặc fallback) */}
                {activeItem.analysis.warnings.length > 0 && (
                  <div className="p-3 rounded-[12px] bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                    {activeItem.analysis.warnings.map((w, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 1: OVERVIEW (TỔNG QUAN, SONG NGỮ & ĐỘ TIN CẬY) */}
                {activeResultTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      <div className="md:col-span-5 space-y-2">
                        <div className="rounded-[12px] overflow-hidden border border-white/15 bg-black/30 p-2 flex items-center justify-center">
                          <img
                            src={activeItem.thumbnailUrl}
                            alt={activeItem.file.name}
                            className="max-h-56 object-contain rounded-[8px]"
                          />
                        </div>
                        {/* Bảng màu HEX ước lượng trực tiếp từ pixel */}
                        <div className={`p-3 rounded-[12px] border space-y-2 ${subCardClass}`}>
                          <div className="text-[11px] font-bold flex items-center justify-between">
                            <span>Mã màu HEX ước lượng từ ảnh:</span>
                            <span className="text-[10px] opacity-70">Nhấp để copy HEX</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {activeItem.analysis.colorPalette.estimatedHexSwatches.map((sw) => (
                              <button
                                key={sw.hex}
                                type="button"
                                onClick={() => handleCopyText(sw.hex, `Mã màu ${sw.hex}`)}
                                className="px-2 py-1 rounded-[8px] border border-white/20 text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform"
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0"
                                  style={{ backgroundColor: sw.hex }}
                                />
                                <span>{sw.hex}</span>
                                <span className="opacity-70">({sw.percentage}%)</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-7 space-y-3 text-xs">
                        <div className={`p-3.5 rounded-[12px] border space-y-1.5 ${subCardClass}`}>
                          <div className="font-bold text-indigo-400">
                            Tóm tắt nội dung thị giác (Summary)
                          </div>
                          <p className="leading-relaxed">{activeItem.analysis.summary}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className={`p-3 rounded-[12px] border ${subCardClass}`}>
                            <div className="text-[10px] opacity-70">Loại cảnh & Phong cách</div>
                            <div className="font-bold mt-0.5">
                              {activeItem.analysis.sceneType} •{' '}
                              {activeItem.analysis.style.primaryStyle}
                            </div>
                          </div>
                          <div className={`p-3 rounded-[12px] border ${subCardClass}`}>
                            <div className="text-[10px] opacity-70">Tỷ lệ khung hình gốc</div>
                            <div className="font-bold font-mono mt-0.5">
                              {activeItem.analysis.aspectRatio.nearestStandardRatio} (
                              {activeItem.analysis.aspectRatio.exactPixelRatio})
                            </div>
                          </div>
                        </div>

                        {/* Hai khung Prompt Song ngữ Việt – Anh tách biệt có nút Copy riêng (Bước 8 & 14) */}
                        <div className="space-y-2.5">
                          <div className={`p-3 rounded-[12px] border space-y-1.5 ${subCardClass}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-400">
                                English Prompt (Chuẩn sinh ảnh quốc tế)
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    activeItem.analysis!.englishPrompt,
                                    'English Prompt'
                                  )
                                }
                                className="px-2.5 py-1 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" /> Copy English
                              </button>
                            </div>
                            <p className="text-[11px] font-mono leading-relaxed select-all">
                              {activeItem.analysis.englishPrompt}
                            </p>
                          </div>

                          <div className={`p-3 rounded-[12px] border space-y-1.5 ${subCardClass}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-purple-400">
                                Phiên bản Tiếng Việt (Thuật ngữ thị giác)
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    activeItem.analysis!.vietnamesePrompt,
                                    'Prompt Tiếng Việt'
                                  )
                                }
                                className="px-2.5 py-1 rounded-[8px] bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" /> Copy Tiếng Việt
                              </button>
                            </div>
                            <p className="text-[11px] leading-relaxed select-all">
                              {activeItem.analysis.vietnamesePrompt}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mục 7.10: Đánh giá độ tin cậy (Quan sát trực tiếp vs Suy luận vs Chưa đủ dữ liệu) */}
                    <div className={`p-3.5 rounded-[12px] border space-y-2 text-xs ${subCardClass}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">
                          7.10. Đánh giá độ tin cậy & Phân loại căn cứ thị giác:
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {activeItem.analysis.confidenceAssessment.qualitativeConfidenceLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                        <div className="p-2.5 rounded bg-black/20 border border-white/10">
                          <div className="font-bold text-emerald-400 mb-1">
                            Quan sát trực tiếp:
                          </div>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {activeItem.analysis.confidenceAssessment.directlyObserved.map(
                              (item, i) => (
                                <li key={i}>{item}</li>
                              )
                            )}
                          </ul>
                        </div>
                        <div className="p-2.5 rounded bg-black/20 border border-white/10">
                          <div className="font-bold text-indigo-400 mb-1">
                            Suy luận có cơ sở:
                          </div>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {activeItem.analysis.confidenceAssessment.reasonableInferences.map(
                              (item, i) => (
                                <li key={i}>{item}</li>
                              )
                            )}
                          </ul>
                        </div>
                        <div className="p-2.5 rounded bg-black/20 border border-white/10">
                          <div className="font-bold text-amber-400 mb-1">
                            Chưa đủ dữ liệu kết luận:
                          </div>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {activeItem.analysis.confidenceAssessment.insufficientDataToConclude.map(
                              (item, i) => (
                                <li key={i}>{item}</li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: VISUAL ANALYSIS (PHÂN TÍCH THỊ GIÁC CHI TIẾT 9 NHÓM) */}
                {activeResultTab === 'visual_analysis' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs max-h-[540px] overflow-y-auto pr-1">
                    <div className={`p-3.5 rounded-[12px] border space-y-1.5 ${subCardClass}`}>
                      <div className="font-bold text-indigo-400">7.2. Chủ thể (Subjects)</div>
                      <p>
                        <strong>Số lượng:</strong> {activeItem.analysis.subjects.count}
                      </p>
                      <p>
                        <strong>Mô tả chính:</strong>{' '}
                        {activeItem.analysis.subjects.primaryDescription}
                      </p>
                      <p>
                        <strong>Vị trí & Tỷ lệ:</strong>{' '}
                        {activeItem.analysis.subjects.positionInFrame} (
                        {activeItem.analysis.subjects.scaleRatio})
                      </p>
                      <p>
                        <strong>Tư thế & Hướng nhìn:</strong>{' '}
                        {activeItem.analysis.subjects.poseAndAction} •{' '}
                        {activeItem.analysis.subjects.orientationAndGaze}
                      </p>
                    </div>

                    <div className={`p-3.5 rounded-[12px] border space-y-1.5 ${subCardClass}`}>
                      <div className="font-bold text-purple-400">7.3. Bố cục (Composition)</div>
                      <p>
                        <strong>Cấu trúc:</strong>{' '}
                        {activeItem.analysis.composition.overallStructure}
                      </p>
                      <p>
                        <strong>Phân lớp:</strong>{' '}
                        {activeItem.analysis.composition.foregroundMidgroundBackground}
                      </p>
                      <p>
                        <strong>Khoảng trống âm:</strong>{' '}
                        {activeItem.analysis.composition.negativeSpace}
                      </p>
                      {activeItem.analysis.composition.uiLayoutDetails && (
                        <p className="text-indigo-300">
                          <strong>Phân tích UI/Website:</strong>{' '}
                          {activeItem.analysis.composition.uiLayoutDetails}
                        </p>
                      )}
                      {activeItem.analysis.composition.bannerCopySpace && (
                        <p className="text-amber-300">
                          <strong>Vùng Copy Space Banner:</strong>{' '}
                          {activeItem.analysis.composition.bannerCopySpace}
                        </p>
                      )}
                    </div>

                    <div className={`p-3.5 rounded-[12px] border space-y-1.5 ${subCardClass}`}>
                      <div className="font-bold text-cyan-400">
                        7.4. Góc máy & Phối cảnh (Camera & Perspective)
                      </div>
                      <p>
                        <strong>Cỡ cảnh (Shot):</strong>{' '}
                        {activeItem.analysis.cameraAndPerspective.shotType}
                      </p>
                      <p>
                        <strong>Góc máy:</strong>{' '}
                        {activeItem.analysis.cameraAndPerspective.cameraAngle}
                      </p>
                      <p>
                        <strong>Phối cảnh & DOF:</strong>{' '}
                        {activeItem.analysis.cameraAndPerspective.perspectiveType} •{' '}
                        {activeItem.analysis.cameraAndPerspective.depthOfField}
                      </p>
                    </div>

                    <div className={`p-3.5 rounded-[12px] border space-y-1.5 ${subCardClass}`}>
                      <div className="font-bold text-amber-400">7.5. Ánh sáng (Lighting)</div>
                      <p>
                        <strong>Nguồn sáng chính:</strong>{' '}
                        {activeItem.analysis.lighting.keyLightSource}
                      </p>
                      <p>
                        <strong>Hướng & Độ mềm:</strong> {activeItem.analysis.lighting.direction}{' '}
                        • {activeItem.analysis.lighting.softnessAndIntensity}
                      </p>
                      <p>
                        <strong>Bóng đổ & Phản chiếu:</strong>{' '}
                        {activeItem.analysis.lighting.shadowsAndReflections}
                      </p>
                    </div>

                    <div className={`p-3.5 rounded-[12px] border space-y-1.5 ${subCardClass}`}>
                      <div className="font-bold text-pink-400">
                        7.6. Màu sắc & Color Grading
                      </div>
                      <p>
                        <strong>Màu chủ đạo:</strong>{' '}
                        {activeItem.analysis.colorPalette.dominantColors.join(', ')}
                      </p>
                      <p>
                        <strong>Tông nhiệt độ & Bão hòa:</strong>{' '}
                        {activeItem.analysis.colorPalette.colorTemperature} •{' '}
                        {activeItem.analysis.colorPalette.saturationAndContrast}
                      </p>
                      <p>
                        <strong>Color Grading:</strong>{' '}
                        {activeItem.analysis.colorPalette.colorGrading}
                      </p>
                    </div>

                    <div className={`p-3.5 rounded-[12px] border space-y-1.5 ${subCardClass}`}>
                      <div className="font-bold text-emerald-400">
                        7.7 & 7.8. Chất liệu & Phong cách
                      </div>
                      <p>
                        <strong>Vật liệu quan sát được:</strong>{' '}
                        {activeItem.analysis.materialsAndTextures.observedMaterials.join(', ')}
                      </p>
                      <p>
                        <strong>Đặc tính bề mặt:</strong>{' '}
                        {activeItem.analysis.materialsAndTextures.surfaceCharacteristics}
                      </p>
                      <p>
                        <strong>Phong cách:</strong> {activeItem.analysis.style.primaryStyle} (
                        {activeItem.analysis.style.realismLevel})
                      </p>
                    </div>

                    {/* 7.9. Chữ xuất hiện trong ảnh (OCR) */}
                    <div
                      className={`sm:col-span-2 p-3.5 rounded-[12px] border space-y-2 ${subCardClass}`}
                    >
                      <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                        <TypeIcon className="w-4 h-4" />
                        <span>7.9. Nhận diện chữ xuất hiện trong hình ảnh (Visible Text / OCR)</span>
                      </div>
                      {!activeItem.analysis.visibleText.hasVisibleText ||
                      activeItem.analysis.visibleText.readableTextItems.length === 0 ? (
                        <p className="opacity-75">
                          Không phát hiện văn bản đọc được rõ ràng hoặc chế độ phân tích hiện tại
                          không có chữ hiển thị. (
                          {activeItem.analysis.visibleText.unreadableOrBlurryTextNote})
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {activeItem.analysis.visibleText.readableTextItems.map((txt, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded bg-black/20 border border-white/10 flex flex-wrap items-center justify-between gap-2"
                            >
                              <div>
                                <span className="font-mono font-bold text-emerald-400">
                                  &ldquo;{txt.content}&rdquo;
                                </span>{' '}
                                <span className="opacity-75">
                                  ({txt.language} • {txt.hierarchyRole} • Vị trí: {txt.position})
                                </span>
                              </div>
                              <span className="text-[11px] opacity-80">
                                {txt.typographyStyle} | {txt.colorAndAlignment}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: MAIN PROMPT & BỘ TINH CHỈNH SAU PHÂN TÍCH (BƯỚC 9) */}
                {activeResultTab === 'main_prompt' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={activeItem.promptUndoStack.length === 0}
                          onClick={handleUndoPromptEdit}
                          className={`px-2.5 py-1 rounded-[8px] border text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 ${subCardClass}`}
                        >
                          <Undo2 className="w-3.5 h-3.5" /> Undo
                        </button>
                        <button
                          type="button"
                          disabled={activeItem.promptRedoStack.length === 0}
                          onClick={handleRedoPromptEdit}
                          className={`px-2.5 py-1 rounded-[8px] border text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 ${subCardClass}`}
                        >
                          <Redo2 className="w-3.5 h-3.5" /> Redo
                        </button>
                        <button
                          type="button"
                          onClick={handleRestoreOriginalPrompt}
                          className="px-2.5 py-1 rounded-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer"
                        >
                          Restore Original Prompt
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => analyzeSingleQueueItem(activeItem.id)}
                          className={`px-3 py-1.5 rounded-[10px] border text-xs font-bold flex items-center gap-1 cursor-pointer ${subCardClass}`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(
                              activeItem.editedMainPrompt || activeItem.analysis!.faithfulPrompt,
                              'Main Prompt'
                            )
                          }
                          className="px-4 py-1.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Main Prompt
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={6}
                      value={activeItem.editedMainPrompt}
                      onChange={(e) => updateActiveMainPromptWithHistory(e.target.value)}
                      className={`w-full p-3.5 rounded-[12px] border text-xs sm:text-sm font-mono leading-relaxed outline-none ${inputClass}`}
                    />

                    {/* Các nút tinh chỉnh nhanh sau phân tích (Step 9) */}
                    <div className={`p-3.5 rounded-[12px] border space-y-2.5 ${subCardClass}`}>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>
                          Bước 9: Tinh chỉnh Prompt sau phân tích (Không ghi đè phân tích gốc)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'expand_details', label: 'Chi tiết hơn (Expand)' },
                          { id: 'shorten', label: 'Rút gọn (Shorten)' },
                          { id: 'increase_fidelity', label: 'Tăng độ trung thành' },
                          { id: 'focus_lighting', label: 'Tập trung Ánh sáng' },
                          { id: 'focus_materials', label: 'Tập trung Chất liệu' },
                          { id: 'focus_composition', label: 'Tập trung Bố cục' },
                          { id: 'highlight_subject', label: 'Nổi bật Chủ thể' },
                          { id: 'reduce_secondary', label: 'Giảm chi tiết phụ' },
                          { id: 'remove_text', label: 'Loại bỏ chữ' },
                          { id: 'change_palette', label: 'Đổi bảng màu' },
                          { id: 'change_style', label: 'Chuyển phong cách' },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            type="button"
                            disabled={isRefiningPrompt}
                            onClick={() => handleRefineActivePrompt(btn.id)}
                            className={`px-2.5 py-1.5 rounded-[8px] border text-[11px] font-semibold cursor-pointer hover:bg-indigo-600 hover:text-white transition-colors ${subCardClass}`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={customRefineText}
                          onChange={(e) => setCustomRefineText(e.target.value)}
                          placeholder="Hoặc nhập yêu cầu tinh chỉnh cụ thể (VD: Đổi sang tông màu vàng ấm hoàng hôn)..."
                          className={`flex-1 px-3 py-1.5 rounded-[10px] border text-xs ${inputClass}`}
                        />
                        <button
                          type="button"
                          disabled={isRefiningPrompt || !customRefineText.trim()}
                          onClick={() => handleRefineActivePrompt('custom')}
                          className="px-3.5 py-1.5 rounded-[10px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                        >
                          Áp dụng
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: NEGATIVE PROMPT (BƯỚC 6) */}
                {activeResultTab === 'negative_prompt' && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">
                        Bước 6: Negative Prompt (Các yếu tố cần loại trừ riêng cho ảnh này)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            activeItem.editedNegativePrompt ||
                              activeItem.analysis!.negativePrompt,
                            'Negative Prompt'
                          )
                        }
                        className="px-3.5 py-1.5 rounded-[10px] bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Negative Prompt
                      </button>
                    </div>

                    <textarea
                      rows={4}
                      value={activeItem.editedNegativePrompt}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it) =>
                            it.id === activeItem.id
                              ? { ...it, editedNegativePrompt: e.target.value }
                              : it
                          )
                        )
                      }
                      className={`w-full p-3.5 rounded-[12px] border font-mono text-xs leading-relaxed outline-none ${inputClass}`}
                    />

                    <div className={`p-3 rounded-[12px] border space-y-1 ${subCardClass}`}>
                      <div className="font-bold text-amber-400">
                        Lưu ý tương thích công cụ đích ({currentToolMeta.name}):
                      </div>
                      <p className="opacity-85">
                        {currentToolMeta.supportsNegativePromptField
                          ? 'Công cụ này hỗ trợ trường Negative Prompt hoặc cờ loại trừ (--no). Bạn có thể sao chép riêng trường trên.'
                          : 'Công cụ này ưu tiên mô tả ngôn ngữ tự nhiên, không dùng ô Negative Prompt riêng. Ở Tab 6 (Thông Số), hệ thống đã tự động chuyển các ràng buộc này thành câu chỉ dẫn tự nhiên ở cuối Prompt chính.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 5: VARIANTS — 5 PHIÊN BẢN PROMPT ĐỘC LẬP A -> E (BƯỚC 5) */}
                {activeResultTab === 'variants' && (
                  <div className="space-y-3 text-xs max-h-[540px] overflow-y-auto pr-1">
                    {[
                      {
                        code: 'Version A — Faithful Prompt (Tái hiện sát ảnh tham chiếu)',
                        text: activeItem.analysis.faithfulPrompt,
                        badge: 'Mặc định',
                      },
                      {
                        code: 'Version B — Ultra-Detailed Prompt (Mô tả chuyên sâu mọi chi tiết)',
                        text: activeItem.analysis.detailedPrompt,
                        badge: 'Chi tiết cao',
                      },
                      {
                        code: 'Version C — Concise Prompt (Ngắn gọn, giữ yếu tố cốt lõi)',
                        text: activeItem.analysis.concisePrompt,
                        badge: 'Cô đọng',
                      },
                      {
                        code: 'Version E — Creative Variation (Biến thể sáng tạo có kiểm soát)',
                        text: activeItem.analysis.creativeVariationPrompt,
                        badge: 'Sáng tạo',
                      },
                    ].map((v) => (
                      <div
                        key={v.code}
                        className={`p-3.5 rounded-[12px] border space-y-1.5 ${subCardClass}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-indigo-400">{v.code}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                updateActiveMainPromptWithHistory(v.text);
                                setActiveResultTab('main_prompt');
                                showToast(`Đã chọn ${v.badge} làm Main Prompt!`, 'info');
                              }}
                              className="px-2 py-1 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold cursor-pointer"
                            >
                              Chuyển sang chỉnh sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyText(v.text, v.code)}
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          </div>
                        </div>
                        <p className="font-mono text-[11px] leading-relaxed">{v.text}</p>
                      </div>
                    ))}

                    {/* Version D — Editable Modular Prompt Blocks */}
                    {activeItem.editedBlocks && (
                      <div className={`p-4 rounded-[12px] border space-y-3 ${subCardClass}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-400">
                            Version D — Editable Modular Prompt (Chỉnh sửa từng khối thành phần)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const b = activeItem.editedBlocks!;
                              const combined = [
                                b.subject,
                                b.environment,
                                b.composition,
                                b.lighting,
                                b.colors,
                                b.style,
                                b.aspectRatioAndFraming,
                                b.fidelityConstraints,
                              ]
                                .filter(Boolean)
                                .join('. ');
                              updateActiveMainPromptWithHistory(combined);
                              handleCopyText(combined, 'Prompt ghép từ 8 khối Version D');
                            }}
                            className="px-3 py-1 rounded-[8px] bg-purple-600 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Ghép & Copy Toàn Bộ Khối
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {(
                            [
                              ['subject', '1. Chủ thể (Subject)'],
                              ['environment', '2. Bối cảnh (Environment)'],
                              ['composition', '3. Bố cục (Composition)'],
                              ['lighting', '4. Ánh sáng (Lighting)'],
                              ['colors', '5. Màu sắc (Colors)'],
                              ['style', '6. Phong cách (Style)'],
                              ['aspectRatioAndFraming', '7. Tỷ lệ hình ảnh'],
                              ['fidelityConstraints', '8. Ràng buộc trung thực'],
                            ] as [keyof EditablePromptBlocks, string][]
                          ).map(([key, label]) => (
                            <div key={key}>
                              <label className="block text-[10px] font-bold opacity-80 mb-1">
                                {label}
                              </label>
                              <input
                                type="text"
                                value={activeItem.editedBlocks![key]}
                                onChange={(e) => {
                                  const nextBlocks = {
                                    ...activeItem.editedBlocks!,
                                    [key]: e.target.value,
                                  };
                                  setItems((prev) =>
                                    prev.map((it) =>
                                      it.id === activeItem.id
                                        ? { ...it, editedBlocks: nextBlocks }
                                        : it
                                    )
                                  );
                                }}
                                className={`w-full px-2.5 py-1.5 rounded border text-[11px] font-mono ${inputClass}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: PARAMETERS & ĐỊNH DẠNG THEO CÔNG CỤ ĐÍCH (BƯỚC 7) */}
                {activeResultTab === 'parameters' && (
                  <div className="space-y-3.5 text-xs">
                    {(() => {
                      const formatted = currentToolMeta.formatPromptForTool(
                        activeItem.editedMainPrompt || activeItem.analysis.faithfulPrompt,
                        activeItem.editedNegativePrompt || activeItem.analysis.negativePrompt,
                        activeItem.analysis.aspectRatio.nearestStandardRatio,
                        noNewTextBanner
                      );
                      return (
                        <>
                          <div className={`p-3.5 rounded-[12px] border space-y-2 ${subCardClass}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-indigo-400">
                                Prompt đã chuẩn hóa cho: {currentToolMeta.name}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    formatted.formattedMainPrompt,
                                    `Prompt chuẩn ${currentToolMeta.name}`
                                  )
                                }
                                className="px-3 py-1 rounded-[8px] bg-indigo-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" /> Copy Prompt Chuẩn Công Cụ
                              </button>
                            </div>
                            <p className="p-3 rounded bg-black/30 font-mono text-[11px] leading-relaxed select-all">
                              {formatted.formattedMainPrompt}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className={`p-3 rounded-[12px] border space-y-1 ${subCardClass}`}>
                              <div className="font-bold">Cú pháp & Tham số xác minh:</div>
                              <p className="font-mono text-[11px] text-emerald-400">
                                {formatted.formattedParameters}
                              </p>
                              <p className="text-[11px] opacity-75 mt-1">
                                {currentToolMeta.parameterNotes}
                              </p>
                            </div>

                            <div className={`p-3 rounded-[12px] border space-y-1 ${subCardClass}`}>
                              <div className="font-bold">Hướng dẫn sử dụng trên công cụ đích:</div>
                              <p className="text-[11px] opacity-85">{formatted.toolGuidance}</p>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 7: RAW ANALYSIS (STRUCTURED JSON) */}
                {activeResultTab === 'raw_json' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">
                        Structured Output Schema JSON (Kiểm tra & Tích hợp tự động hóa)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            JSON.stringify(activeItem.analysis, null, 2),
                            'Structured JSON'
                          )
                        }
                        className="px-3 py-1.5 rounded-[10px] bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5" /> Copy JSON
                      </button>
                    </div>
                    <pre className="p-4 rounded-[12px] bg-black/60 border border-white/15 text-[11px] font-mono text-emerald-300 max-h-[440px] overflow-auto">
                      {JSON.stringify(activeItem.analysis, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* KẾT QUẢ SO SÁNH & TỔNG HỢP THEO LÔ NHIỀU ẢNH (BƯỚC 11.4) */}
          {batchComparison && (
            <div className={`p-5 rounded-[14px] border-2 border-purple-500/50 space-y-3 ${panelClass}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2 text-purple-300">
                  <Layers className="w-4 h-4" />
                  <span>
                    Báo Cáo Phân Tích Tổng Hợp & So Sánh Lô ({batchComparison.analyzedCount} ảnh)
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setBatchComparison(null)}
                  className="text-xs underline opacity-75 cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className={`p-3 rounded-[10px] border ${subCardClass}`}>
                  <div className="font-bold text-indigo-400">Phong cách chung:</div>
                  <p className="mt-0.5">{batchComparison.commonVisualStyle}</p>
                </div>
                <div className={`p-3 rounded-[10px] border ${subCardClass}`}>
                  <div className="font-bold text-emerald-400">Bảng màu chung:</div>
                  <p className="mt-0.5 font-mono">
                    {batchComparison.sharedColorPalette.join(' • ')}
                  </p>
                </div>
              </div>

              <div className={`p-3 rounded-[10px] border text-xs space-y-1.5 ${subCardClass}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">
                    Master Style Prompt đại diện cho cả bộ ảnh:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        batchComparison.representativeMasterPrompt,
                        'Master Style Prompt'
                      )
                    }
                    className="px-2.5 py-1 rounded bg-purple-600 text-white text-[11px] font-bold cursor-pointer"
                  >
                    Copy Master Prompt
                  </button>
                </div>
                <p className="font-mono text-[11px]">
                  {batchComparison.representativeMasterPrompt}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL THƯ VIỆN 16 PROMPT TEMPLATE & LƯU TEMPLATE PHIÊN HIỆN TẠI (BƯỚC 15) */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-3xl p-6 rounded-[14px] border space-y-4 ${panelClass}`}>
            <div className="flex items-center justify-between border-b pb-3 border-white/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Bước 15: Thư Viện 16 Prompt Template & Template Tùy Chỉnh</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1 rounded hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1 text-xs">
              {allTemplates.map((tpl) => {
                const isSel = activeTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setActiveTemplateId(tpl.id);
                      setSelectedMode(tpl.recommendedMode);
                      setDetailLevel(tpl.detailLevel);
                      setShowTemplateModal(false);
                      showToast(`Đã áp dụng Template: ${tpl.name}`, 'success');
                    }}
                    className={`p-3 rounded-[12px] border text-left transition-all cursor-pointer ${
                      isSel
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                        : subCardClass
                    }`}
                  >
                    <div className="font-bold truncate">{tpl.name}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{tpl.category}</div>
                    <p className="text-[11px] mt-1 line-clamp-2 opacity-90">
                      {tpl.styleDirective}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Tạo và lưu Template tùy chỉnh trong phiên làm việc */}
            <div className={`p-3.5 rounded-[12px] border space-y-2 text-xs ${subCardClass}`}>
              <div className="font-bold">
                + Lưu Template tùy chỉnh mới trong phiên làm việc hiện tại:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Tên Template (VD: Lookbook Mùa Đông)"
                  className={`px-3 py-1.5 rounded-[8px] border ${inputClass}`}
                />
                <input
                  type="text"
                  value={newTemplateDirective}
                  onChange={(e) => setNewTemplateDirective(e.target.value)}
                  placeholder="Định hướng phân tích & viết prompt..."
                  className={`sm:col-span-2 px-3 py-1.5 rounded-[8px] border ${inputClass}`}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!newTemplateName.trim() || !newTemplateDirective.trim()) return;
                    const created: PromptTemplateItem = {
                      id: `custom_${Date.now()}`,
                      name: newTemplateName.trim(),
                      category: 'Custom Session Template',
                      recommendedMode: selectedMode,
                      detailLevel,
                      styleDirective: newTemplateDirective.trim(),
                      fidelityNote: 'Tuân thủ ràng buộc trung thực của người dùng.',
                    };
                    setCustomTemplates((prev) => [...prev, created]);
                    setActiveTemplateId(created.id);
                    setNewTemplateName('');
                    setNewTemplateDirective('');
                    showToast('Đã lưu Template mới vào phiên làm việc!', 'success');
                  }}
                  className="px-4 py-1.5 rounded-[10px] bg-emerald-600 text-white font-bold cursor-pointer"
                >
                  Lưu Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
