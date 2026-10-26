'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Scissors,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Settings,
  Layers,
  Sliders,
  Crop,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Eraser,
  Paintbrush,
  Play,
  Pause,
  XCircle,
  FolderOpen,
  ClipboardPaste,
  Copy,
  Archive,
  ShieldCheck,
  Wand2,
  Eye,
  CheckSquare,
  Square,
  Sun,
  Moon,
  Grid,
  X,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import {
  type AIQualityMode,
  type OutputImageFormat,
  type BackgroundMode,
  type CropAspectPreset,
  type BatchItemStatus,
  type BackgroundRemoverStudioConfig,
  type SubjectBoundingBox,
  DEFAULT_STUDIO_CONFIG,
  BG_REMOVER_PRESETS,
  STUDIO_BACKDROP_PRESETS,
  GRADIENT_PRESETS,
  formatFileSize,
  decodeImageFile,
  runAISubjectSegmentation,
  applyEdgeAndHairRefinementToMask,
  applyBrushStrokeSegmentToMask,
  computeSubjectBoundingBox,
  exportProcessedImageBlob,
  buildOutputFileName,
  createBatchZipArchive,
  generateDemoTestImageFile,
} from '@/lib/backgroundRemoverEngine';

interface BatchImageRecord {
  id: string;
  file: File;
  selected: boolean;
  status: BatchItemStatus;
  stageText: string;
  progress: number;
  width: number;
  height: number;
  detectedFormat: string;
  mimeType: string;
  isAnimatedGif: boolean;
  frameCount: number;
  thumbnailUrl: string;
  warnings: string[];
  errorMsg?: string;
  // Dữ liệu tách nền thực tế
  originalImageData?: ImageData;
  aiBaseAlphaMask?: Uint8Array;
  workingAlphaMask?: Uint8Array;
  refinedAlphaMask?: Uint8Array;
  maskUndoStack: Uint8Array[];
  maskRedoStack: Uint8Array[];
  subjectBounds?: SubjectBoundingBox;
  processingTimeMs?: number;
  detectedCategory?: string;
  // Kết quả xuất Blob hiện tại
  outputBlob?: Blob;
  outputObjectUrl?: string;
  outputFileName?: string;
  outputFormat?: OutputImageFormat;
  outputWidth?: number;
  outputHeight?: number;
  outputNotice?: string;
}

const SOLID_COLOR_PRESETS = [
  { label: 'Trắng', hex: '#FFFFFF' },
  { label: 'Đen', hex: '#000000' },
  { label: 'Xám Sáng', hex: '#F1F5F9' },
  { label: 'Xám Đậm', hex: '#334155' },
  { label: 'Xanh Dương', hex: '#2563EB' },
  { label: 'Xanh Ngọc', hex: '#10B981' },
  { label: 'Đỏ Studio', hex: '#EF4444' },
  { label: 'Vàng Kem', hex: '#FEF3C7' },
  { label: 'Tím Indigo', hex: '#4F46E5' },
  { label: 'Hồng Pastel', hex: '#FCE7F3' },
];

const RESIZE_QUICK_PRESETS = [
  { label: 'Avatar (800×800)', w: 800, h: 800 },
  { label: 'TMĐT (1000×1000)', w: 1000, h: 1000 },
  { label: 'Full HD (1920×1080)', w: 1920, h: 1080 },
  { label: 'Story MXH (1080×1920)', w: 1080, h: 1920 },
  { label: 'Website (1200×900)', w: 1200, h: 900 },
];

export const BackgroundRemoverStudio: React.FC = () => {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  // Cấu hình Studio tổng thể
  const [config, setConfig] = useState<BackgroundRemoverStudioConfig>(DEFAULT_STUDIO_CONFIG);
  const [activePresetId, setActivePresetId] = useState<string>('transparent_standard');
  const [activeInspectorTab, setActiveInspectorTab] = useState<
    'ai_preset' | 'edge_hair' | 'background' | 'post_crop' | 'export_zip'
  >('ai_preset');

  // Danh sách hàng đợi xử lý ảnh (Batch Queue)
  const [items, setItems] = useState<BatchImageRecord[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Điều khiển tiến trình hàng loạt
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const pauseRef = useRef(false);
  const cancelRef = useRef(false);

  // Chế độ xem trước (Image Preview Studio)
  const [previewViewMode, setPreviewViewMode] = useState<
    'split_slider' | 'side_by_side' | 'result_only' | 'brush_edit'
  >('split_slider');
  const [splitSliderPos, setSplitSliderPos] = useState<number>(50);
  const [previewBackdropSurface, setPreviewBackdropSurface] = useState<
    'checkerboard' | 'light' | 'dark'
  >('checkerboard');
  const [zoomPercent, setZoomPercent] = useState<number>(100);

  // Công cụ Bút xóa & Khôi phục Mask (Erase / Restore Brush)
  const [brushMode, setBrushMode] = useState<'erase' | 'restore'>('erase');
  const [brushSize, setBrushSize] = useState<number>(28);
  const [brushSoftness, setBrushSoftness] = useState<number>(65);
  const [brushOpacity, setBrushOpacity] = useState<number>(85);
  const isPaintingRef = useRef(false);
  const lastBrushPointRef = useRef<{ x: number; y: number } | null>(null);
  const brushCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Hình ảnh nền tải lên hoặc từ preset
  const [loadedBgImage, setLoadedBgImage] = useState<HTMLImageElement | null>(null);

  // Đóng gói ZIP
  const [isPackingZip, setIsPackingZip] = useState(false);
  const [zipProgressText, setZipProgressText] = useState<string>('');

  // Modal trợ giúp & cài đặt
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  // Refs cho Input File / Folder / Background Image
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);
  const itemsRef = useRef<BatchImageRecord[]>([]);
  itemsRef.current = items;

  const activeItem = useMemo(
    () => items.find((it) => it.id === activeItemId) || items[0] || null,
    [items, activeItemId]
  );

  // Giải phóng Object URL khi卸载 component
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => {
        if (it.outputObjectUrl) URL.revokeObjectURL(it.outputObjectUrl);
      });
    };
  }, []);

  // Tải ảnh nền khi bgImageUrl thay đổi
  useEffect(() => {
    if (!config.background.bgImageUrl) {
      setLoadedBgImage(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!cancelled) setLoadedBgImage(img);
    };
    img.onerror = () => {
      if (!cancelled) {
        setLoadedBgImage(null);
        showToast('Không thể tải hình ảnh nền đã chọn.', 'error');
      }
    };
    img.src = config.background.bgImageUrl;
    return () => {
      cancelled = true;
    };
  }, [config.background.bgImageUrl, showToast]);

  // Hỗ trợ dán ảnh trực tiếp từ Clipboard (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
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
        await handleAddFilesToQueue(files);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  });

  // Cập nhật lại ảnh kết quả của activeItem mỗi khi cấu hình Edge / Background / PostProcess / Export thay đổi
  const recomputeItemOutput = useCallback(
    async (
      item: BatchImageRecord,
      currentCfg: BackgroundRemoverStudioConfig,
      bgImg: HTMLImageElement | null,
      indexInList: number
    ): Promise<Partial<BatchImageRecord>> => {
      if (!item.originalImageData || !item.workingAlphaMask || !item.subjectBounds) {
        return {};
      }
      const refinedAlphaMask = applyEdgeAndHairRefinementToMask(
        item.workingAlphaMask,
        item.originalImageData,
        currentCfg.edge
      );
      const updatedBounds = computeSubjectBoundingBox(
        refinedAlphaMask,
        item.width,
        item.height
      );
      const exported = await exportProcessedImageBlob(
        item.originalImageData,
        refinedAlphaMask,
        updatedBounds,
        currentCfg,
        bgImg
      );
      if (item.outputObjectUrl) {
        URL.revokeObjectURL(item.outputObjectUrl);
      }
      const newUrl = URL.createObjectURL(exported.blob);
      const outName = buildOutputFileName(
        item.file.name,
        indexInList,
        exported.extension,
        currentCfg.exportConfig
      );
      return {
        refinedAlphaMask,
        subjectBounds: updatedBounds,
        outputBlob: exported.blob,
        outputObjectUrl: newUrl,
        outputFileName: outName,
        outputFormat: exported.actualFormat,
        outputWidth: exported.width,
        outputHeight: exported.height,
        outputNotice: exported.notice,
      };
    },
    []
  );

  // Tự động render lại preview khi người dùng chỉnh thông số của ảnh đang chọn
  useEffect(() => {
    if (!activeItem || activeItem.status !== 'completed' || !activeItem.originalImageData) {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const idx = itemsRef.current.findIndex((i) => i.id === activeItem.id);
      const updates = await recomputeItemOutput(
        activeItem,
        config,
        loadedBgImage,
        idx >= 0 ? idx : 0
      );
      if (!cancelled) {
        setItems((prev) =>
          prev.map((it) => (it.id === activeItem.id ? { ...it, ...updates } : it))
        );
      }
    }, 80);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [config, loadedBgImage, activeItem?.id, activeItem?.status, recomputeItemOutput]);

  // Vẽ lên Canvas chỉnh sửa Cọ (Brush Edit Mode)
  useEffect(() => {
    if (previewViewMode !== 'brush_edit' || !brushCanvasRef.current || !activeItem) return;
    const canvas = brushCanvasRef.current;
    if (!activeItem.originalImageData || !activeItem.refinedAlphaMask) return;

    const w = activeItem.width;
    const h = activeItem.height;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const src = activeItem.originalImageData.data;
    const mask = activeItem.refinedAlphaMask;
    const previewData = new ImageData(w, h);
    const dst = previewData.data;

    for (let i = 0; i < w * h; i++) {
      const p4 = i * 4;
      const a = mask[i];
      // Hiển thị vùng đã xóa dưới dạng lớp phủ đỏ mờ nhẹ để người dùng dễ khôi phục (Restore)
      if (a < 25) {
        dst[p4] = Math.round(src[p4] * 0.35 + 220 * 0.25);
        dst[p4 + 1] = Math.round(src[p4 + 1] * 0.25);
        dst[p4 + 2] = Math.round(src[p4 + 2] * 0.25);
        dst[p4 + 3] = 110;
      } else {
        dst[p4] = src[p4];
        dst[p4 + 1] = src[p4 + 1];
        dst[p4 + 2] = src[p4 + 2];
        dst[p4 + 3] = a;
      }
    }
    ctx.putImageData(previewData, 0, 0);
  }, [
    previewViewMode,
    activeItem?.id,
    activeItem?.refinedAlphaMask,
    activeItem?.originalImageData,
    activeItem?.width,
    activeItem?.height,
  ]);

  // BƯỚC 1: NHẬP ẢNH ĐA ĐỊNH DẠNG VÀ KIỂM TRA HỢP LỆ
  const handleAddFilesToQueue = async (rawFiles: FileList | File[]) => {
    const fileArray = Array.from(rawFiles);
    if (fileArray.length === 0) return;

    const existingSignatures = new Set(
      itemsRef.current.map((it) => `${it.file.name.toLowerCase()}_${it.file.size}`)
    );

    const newRecords: BatchImageRecord[] = [];
    let skippedDuplicates = 0;

    for (const file of fileArray) {
      const fileSig = `${file.name.toLowerCase()}_${file.size}`;
      if (config.duplicatePolicy === 'skip' && existingSignatures.has(fileSig)) {
        skippedDuplicates++;
        continue;
      }
      existingSignatures.add(fileSig);

      const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      try {
        const decoded = await decodeImageFile(file);
        newRecords.push({
          id,
          file,
          selected: true,
          status: 'waiting',
          stageText: 'Sẵn sàng tách nền AI',
          progress: 0,
          width: decoded.width,
          height: decoded.height,
          detectedFormat: decoded.detectedFormat,
          mimeType: decoded.mimeType,
          isAnimatedGif: decoded.isAnimatedGif,
          frameCount: decoded.frameCount,
          thumbnailUrl: decoded.thumbnailUrl,
          warnings: decoded.warnings,
          originalImageData: decoded.imageData,
          maskUndoStack: [],
          maskRedoStack: [],
        });
      } catch (err: any) {
        newRecords.push({
          id,
          file,
          selected: false,
          status: 'failed',
          stageText: 'Lỗi giải mã ảnh',
          progress: 0,
          width: 0,
          height: 0,
          detectedFormat: 'INVALID',
          mimeType: file.type || 'unknown',
          isAnimatedGif: false,
          frameCount: 0,
          thumbnailUrl: '',
          warnings: [],
          errorMsg: err?.message || 'Tệp không hợp lệ hoặc bị hỏng.',
          maskUndoStack: [],
          maskRedoStack: [],
        });
      }
    }

    if (skippedDuplicates > 0) {
      showToast(`Đã bỏ qua ${skippedDuplicates} ảnh trùng lặp theo cấu hình hiện tại.`, 'info');
    }

    if (newRecords.length > 0) {
      setItems((prev) => {
        const updated = [...prev, ...newRecords];
        return updated;
      });
      if (!activeItemId) {
        const firstValid = newRecords.find((r) => r.status !== 'failed') || newRecords[0];
        setActiveItemId(firstValid.id);
      }
      const validCount = newRecords.filter((r) => r.status === 'waiting').length;
      const errCount = newRecords.filter((r) => r.status === 'failed').length;
      if (validCount > 0) {
        showToast(
          `Đã nạp ${validCount} ảnh vào danh sách${
            errCount > 0 ? ` (${errCount} tệp lỗi định dạng)` : ''
          }.`,
          'success'
        );
      } else if (errCount > 0) {
        showToast(
          `Không thể đọc ${errCount} tệp đã chọn. Vui lòng kiểm tra thông báo lỗi chi tiết.`,
          'error'
        );
      }
    }
  };

  // Xử lý tách nền AI cho 1 ảnh cụ thể
  const processSingleImageItem = async (itemId: string, indexInBatch: number): Promise<boolean> => {
    const currentItem = itemsRef.current.find((i) => i.id === itemId);
    if (!currentItem || !currentItem.originalImageData) return false;

    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              status: 'processing',
              stageText: 'Đang khởi chạy mô hình AI Segmentation...',
              progress: 10,
              errorMsg: undefined,
            }
          : it
      )
    );

    try {
      const segResult = await runAISubjectSegmentation(
        currentItem.originalImageData,
        config.qualityMode,
        (stageText, percent) => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === itemId ? { ...it, stageText, progress: percent } : it
            )
          );
        }
      );

      if (cancelRef.current) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === itemId
              ? { ...it, status: 'cancelled', stageText: 'Đã hủy theo yêu cầu', progress: 0 }
              : it
          )
        );
        return false;
      }

      const refinedMask = applyEdgeAndHairRefinementToMask(
        segResult.workingAlphaMask,
        segResult.originalImageData,
        config.edge
      );

      const exported = await exportProcessedImageBlob(
        segResult.originalImageData,
        refinedMask,
        segResult.subjectBounds,
        config,
        loadedBgImage
      );

      const outUrl = URL.createObjectURL(exported.blob);
      const outName = buildOutputFileName(
        currentItem.file.name,
        indexInBatch,
        exported.extension,
        config.exportConfig
      );

      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it;
          if (it.outputObjectUrl) URL.revokeObjectURL(it.outputObjectUrl);
          return {
            ...it,
            status: 'completed',
            stageText: `Hoàn tất (${segResult.processingTimeMs}ms)`,
            progress: 100,
            aiBaseAlphaMask: segResult.aiBaseAlphaMask,
            workingAlphaMask: segResult.workingAlphaMask,
            refinedAlphaMask: refinedMask,
            subjectBounds: segResult.subjectBounds,
            processingTimeMs: segResult.processingTimeMs,
            detectedCategory: segResult.detectedCategory,
            outputBlob: exported.blob,
            outputObjectUrl: outUrl,
            outputFileName: outName,
            outputFormat: exported.actualFormat,
            outputWidth: exported.width,
            outputHeight: exported.height,
            outputNotice: exported.notice,
            maskUndoStack: [],
            maskRedoStack: [],
          };
        })
      );
      return true;
    } catch (err: any) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                status: 'failed',
                stageText: 'Tách nền thất bại',
                progress: 0,
                errorMsg: err?.message || 'Lỗi không xác định khi tách nền.',
              }
            : it
        )
      );
      return false;
    }
  };

  // BƯỚC 8: CHẠY HÀNG ĐỢI BATCH PROCESSING VỚI KIỂM SOÁT ĐỒNG THỜI (CONCURRENCY)
  const handleRunBatchQueue = async (onlyFailed: boolean = false) => {
    const targetIds = itemsRef.current
      .filter((it) => {
        if (onlyFailed) return it.status === 'failed' && it.originalImageData;
        return (
          (it.status === 'waiting' || it.status === 'cancelled' || it.status === 'failed') &&
          it.originalImageData
        );
      })
      .map((it) => it.id);

    if (targetIds.length === 0) {
      // Nếu tất cả đã hoàn thành nhưng người dùng nhấn chạy lại cho ảnh đang chọn
      if (activeItem && activeItem.originalImageData) {
        cancelRef.current = false;
        setIsBatchRunning(true);
        await processSingleImageItem(activeItem.id, 0);
        setIsBatchRunning(false);
        showToast('Đã cập nhật tách nền AI cho ảnh đang chọn!', 'success');
      } else {
        showToast('Không có ảnh nào đang chờ xử lý trong hàng đợi.', 'info');
      }
      return;
    }

    setIsBatchRunning(true);
    setIsQueuePaused(false);
    pauseRef.current = false;
    cancelRef.current = false;

    const concurrency = Math.max(1, Math.min(4, config.concurrency));
    let cursor = 0;
    let successCount = 0;

    const workerLoop = async () => {
      while (cursor < targetIds.length) {
        if (cancelRef.current) break;
        while (pauseRef.current && !cancelRef.current) {
          await new Promise((r) => setTimeout(r, 200));
        }
        if (cancelRef.current) break;

        const currentIndex = cursor++;
        if (currentIndex >= targetIds.length) break;
        const id = targetIds[currentIndex];
        const ok = await processSingleImageItem(id, currentIndex);
        if (ok) successCount++;
      }
    };

    const workers = Array.from(
      { length: Math.min(concurrency, targetIds.length) },
      () => workerLoop()
    );
    await Promise.all(workers);

    setIsBatchRunning(false);
    setIsQueuePaused(false);

    if (cancelRef.current) {
      showToast('Đã hủy hàng đợi xử lý theo yêu cầu.', 'info');
    } else {
      showToast(
        `Hoàn tất xử lý hàng loạt: ${successCount}/${targetIds.length} ảnh thành công!`,
        'success'
      );
    }
  };

  // Xử lý thao tác vẽ cọ Xóa / Khôi phục trên Canvas
  const getCanvasPointFromEvent = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = brushCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleBrushPointerDown = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!activeItem || !activeItem.workingAlphaMask || !activeItem.originalImageData) return;
    const pt = getCanvasPointFromEvent(e);
    if (!pt) return;

    isPaintingRef.current = true;
    lastBrushPointRef.current = pt;

    // Lưu trạng thái mask hiện tại vào Undo stack
    const snapshot = new Uint8Array(activeItem.workingAlphaMask);
    const nextMask = new Uint8Array(activeItem.workingAlphaMask);
    applyBrushStrokeSegmentToMask(
      nextMask,
      activeItem.width,
      activeItem.height,
      pt.x,
      pt.y,
      pt.x,
      pt.y,
      brushMode,
      brushSize,
      brushSoftness,
      brushOpacity
    );

    const refined = applyEdgeAndHairRefinementToMask(
      nextMask,
      activeItem.originalImageData,
      config.edge
    );

    setItems((prev) =>
      prev.map((it) =>
        it.id === activeItem.id
          ? {
              ...it,
              workingAlphaMask: nextMask,
              refinedAlphaMask: refined,
              maskUndoStack: [...it.maskUndoStack.slice(-14), snapshot],
              maskRedoStack: [],
            }
          : it
      )
    );
  };

  const handleBrushPointerMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (
      !isPaintingRef.current ||
      !activeItem ||
      !activeItem.workingAlphaMask ||
      !activeItem.originalImageData
    ) {
      return;
    }
    const pt = getCanvasPointFromEvent(e);
    if (!pt) return;
    const prevPt = lastBrushPointRef.current || pt;
    lastBrushPointRef.current = pt;

    const nextMask = new Uint8Array(activeItem.workingAlphaMask);
    applyBrushStrokeSegmentToMask(
      nextMask,
      activeItem.width,
      activeItem.height,
      prevPt.x,
      prevPt.y,
      pt.x,
      pt.y,
      brushMode,
      brushSize,
      brushSoftness,
      brushOpacity
    );

    const refined = applyEdgeAndHairRefinementToMask(
      nextMask,
      activeItem.originalImageData,
      config.edge
    );

    setItems((prev) =>
      prev.map((it) =>
        it.id === activeItem.id
          ? {
              ...it,
              workingAlphaMask: nextMask,
              refinedAlphaMask: refined,
            }
          : it
      )
    );
  };

  const handleBrushPointerUp = async () => {
    if (!isPaintingRef.current || !activeItem) return;
    isPaintingRef.current = false;
    lastBrushPointRef.current = null;

    // Kết xuất lại ảnh đầu ra sau khi nhả cọ
    const idx = itemsRef.current.findIndex((i) => i.id === activeItem.id);
    const current = itemsRef.current[idx];
    if (current) {
      const updates = await recomputeItemOutput(current, config, loadedBgImage, idx);
      setItems((prev) =>
        prev.map((it) => (it.id === current.id ? { ...it, ...updates } : it))
      );
    }
  };

  const handleUndoBrush = async () => {
    if (!activeItem || activeItem.maskUndoStack.length === 0 || !activeItem.workingAlphaMask) {
      return;
    }
    const previousMask = activeItem.maskUndoStack[activeItem.maskUndoStack.length - 1];
    const currentSnapshot = new Uint8Array(activeItem.workingAlphaMask);
    const updatedItem: BatchImageRecord = {
      ...activeItem,
      workingAlphaMask: previousMask,
      maskUndoStack: activeItem.maskUndoStack.slice(0, -1),
      maskRedoStack: [...activeItem.maskRedoStack, currentSnapshot],
    };
    const idx = itemsRef.current.findIndex((i) => i.id === activeItem.id);
    const updates = await recomputeItemOutput(updatedItem, config, loadedBgImage, idx);
    setItems((prev) =>
      prev.map((it) =>
        it.id === activeItem.id ? { ...updatedItem, ...updates } : it
      )
    );
  };

  const handleRedoBrush = async () => {
    if (!activeItem || activeItem.maskRedoStack.length === 0 || !activeItem.workingAlphaMask) {
      return;
    }
    const nextMask = activeItem.maskRedoStack[activeItem.maskRedoStack.length - 1];
    const currentSnapshot = new Uint8Array(activeItem.workingAlphaMask);
    const updatedItem: BatchImageRecord = {
      ...activeItem,
      workingAlphaMask: nextMask,
      maskUndoStack: [...activeItem.maskUndoStack, currentSnapshot],
      maskRedoStack: activeItem.maskRedoStack.slice(0, -1),
    };
    const idx = itemsRef.current.findIndex((i) => i.id === activeItem.id);
    const updates = await recomputeItemOutput(updatedItem, config, loadedBgImage, idx);
    setItems((prev) =>
      prev.map((it) =>
        it.id === activeItem.id ? { ...updatedItem, ...updates } : it
      )
    );
  };

  const handleResetMaskToAI = async () => {
    if (!activeItem || !activeItem.aiBaseAlphaMask) return;
    const restored = new Uint8Array(activeItem.aiBaseAlphaMask);
    const updatedItem: BatchImageRecord = {
      ...activeItem,
      workingAlphaMask: restored,
      maskUndoStack: [],
      maskRedoStack: [],
    };
    const idx = itemsRef.current.findIndex((i) => i.id === activeItem.id);
    const updates = await recomputeItemOutput(updatedItem, config, loadedBgImage, idx);
    setItems((prev) =>
      prev.map((it) =>
        it.id === activeItem.id ? { ...updatedItem, ...updates } : it
      )
    );
    showToast('Đã khôi phục Alpha Mask về kết quả AI ban đầu!', 'info');
  };

  // Áp dụng cấu hình hiện tại cho toàn bộ ảnh đã hoàn thành trong danh sách
  const handleApplyConfigToAllCompleted = async () => {
    const completedItems = itemsRef.current.filter(
      (it) => it.status === 'completed' && it.originalImageData && it.workingAlphaMask
    );
    if (completedItems.length === 0) {
      showToast('Chưa có ảnh nào hoàn thành để đồng bộ cấu hình.', 'info');
      return;
    }

    for (let i = 0; i < itemsRef.current.length; i++) {
      const it = itemsRef.current[i];
      if (it.status === 'completed' && it.originalImageData && it.workingAlphaMask) {
        const updates = await recomputeItemOutput(it, config, loadedBgImage, i);
        setItems((prev) =>
          prev.map((row) => (row.id === it.id ? { ...row, ...updates } : row))
        );
      }
    }
    showToast(
      `Đã đồng bộ cấu hình nền, viền & định dạng xuất cho ${completedItems.length} ảnh!`,
      'success'
    );
  };

  // Tải xuống 1 ảnh
  const handleDownloadSingleItem = (item: BatchImageRecord) => {
    if (!item.outputBlob || !item.outputObjectUrl) {
      showToast('Ảnh này chưa được tách nền. Hãy nhấn "Xóa nền AI" trước.', 'error');
      return;
    }
    const a = document.createElement('a');
    a.href = item.outputObjectUrl;
    a.download = item.outputFileName || `image_no-bg.${item.outputFormat || 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Đã tải xuống tệp ${a.download}!`, 'success');
  };

  // BƯỚC 10: TẢI TẤT CẢ DƯỚI DẠNG GÓI ZIP CHUẨN
  const handleDownloadAllZip = async () => {
    if (isPackingZip) return;
    const completed = itemsRef.current.filter(
      (it) => it.status === 'completed' && it.outputBlob
    );
    if (completed.length === 0) {
      showToast('Chưa có ảnh nào hoàn thành để đóng gói ZIP.', 'error');
      return;
    }

    setIsPackingZip(true);
    try {
      const usedNames = new Set<string>();
      const zipEntries = [];

      for (let i = 0; i < completed.length; i++) {
        const item = completed[i];
        // Đảm bảo ảnh được xuất theo đúng cấu hình định dạng hiện hành
        const updates = await recomputeItemOutput(item, config, loadedBgImage, i);
        const blob = updates.outputBlob || item.outputBlob!;
        const ext = updates.outputFormat || item.outputFormat || 'png';
        const uniqueName = buildOutputFileName(
          item.file.name,
          i,
          ext === 'jpeg' ? 'jpg' : ext,
          config.exportConfig,
          usedNames
        );
        zipEntries.push({
          fileName: uniqueName,
          blob,
        });
      }

      const zipBlob = await createBatchZipArchive(zipEntries, (curr, total, name) => {
        setZipProgressText(`Đang đóng gói ${curr}/${total}: ${name}`);
      });

      const zipUrl = URL.createObjectURL(zipBlob);
      const stamp = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `background-remover-batch-${completed.length}-images-${stamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 5000);

      showToast(
        `Đã đóng gói và tải xuống tệp ZIP gồm ${completed.length} ảnh (${formatFileSize(
          zipBlob.size
        )})!`,
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi tạo tệp ZIP.', 'error');
    } finally {
      setIsPackingZip(false);
      setZipProgressText('');
    }
  };

  // Nạp ảnh mẫu kiểm thử nhanh (Chân dung, Giày TMĐT, Logo) và tự động chạy AI xóa nền
  const handleLoadDemoSample = async (sampleType: 'portrait' | 'sneaker' | 'logo') => {
    setIsLoadingDemo(true);
    try {
      const sampleFile = await generateDemoTestImageFile(sampleType);
      const decoded = await decodeImageFile(sampleFile);
      const newId = `demo_${sampleType}_${Date.now()}`;
      const record: BatchImageRecord = {
        id: newId,
        file: sampleFile,
        selected: true,
        status: 'waiting',
        stageText: 'Đang tách nền AI...',
        progress: 0,
        width: decoded.width,
        height: decoded.height,
        detectedFormat: decoded.detectedFormat,
        mimeType: decoded.mimeType,
        isAnimatedGif: false,
        frameCount: 1,
        thumbnailUrl: decoded.thumbnailUrl,
        warnings: [],
        originalImageData: decoded.imageData,
        maskUndoStack: [],
        maskRedoStack: [],
      };

      setItems((prev) => [record, ...prev]);
      setActiveItemId(newId);

      // Chạy AI xóa nền ngay cho ảnh mẫu vừa tạo
      setTimeout(async () => {
        await processSingleImageItem(newId, 0);
      }, 60);
    } catch (err: any) {
      showToast(err?.message || 'Không thể khởi tạo ảnh mẫu.', 'error');
    } finally {
      setIsLoadingDemo(false);
    }
  };

  // Thống kê hàng đợi
  const queueStats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const processing = items.filter((i) => i.status === 'processing' || i.status === 'loading')
      .length;
    const waiting = items.filter((i) => i.status === 'waiting').length;
    const failed = items.filter((i) => i.status === 'failed').length;
    const overallPercent =
      total === 0
        ? 0
        : Math.round(
            items.reduce((acc, it) => {
              if (it.status === 'completed') return acc + 100;
              if (it.status === 'processing') return acc + it.progress;
              return acc;
            }, 0) / total
          );
    return { total, completed, processing, waiting, failed, overallPercent };
  }, [items]);

  // Class đồng bộ Glassmorphism 14px Sáng / Tối
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
      {/* A. HEADER CÔNG CỤ BACKGROUND REMOVER STUDIO */}
      <div className={`p-5 sm:p-6 rounded-[14px] border ${panelClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md">
                <Scissors className="w-5 h-5" />
              </div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight">
                Background Remover Studio — AI Remove Background
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AI Alpha Matting Sẵn Sàng
              </span>
            </div>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Xóa nền ảnh bằng AI, tinh chỉnh viền & sợi tóc, bút xóa/khôi phục Mask, thay nền Studio
              và xử lý hàng loạt đóng gói ZIP ngay trên trình duyệt.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Nút nạp ảnh mẫu thử nghiệm ngay */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isLoadingDemo}
                onClick={() => handleLoadDemoSample('portrait')}
                className={`px-3 py-2 rounded-[14px] border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/40 text-purple-200'
                    : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Thử Chân Dung
              </button>
              <button
                type="button"
                disabled={isLoadingDemo}
                onClick={() => handleLoadDemoSample('sneaker')}
                className={`px-3 py-2 rounded-[14px] border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? 'bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-500/40 text-indigo-200'
                    : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" /> Thử Giày TMĐT
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className={`px-3 py-2 rounded-[14px] border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Cài đặt
            </button>

            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className={`px-3 py-2 rounded-[14px] border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" /> Trợ giúp
            </button>

            <button
              type="button"
              onClick={() => {
                setConfig(DEFAULT_STUDIO_CONFIG);
                setActivePresetId('transparent_standard');
                showToast('Đã đặt lại toàn bộ cấu hình về mặc định!', 'info');
              }}
              className={`px-3 py-2 rounded-[14px] border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300'
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Đặt lại
            </button>
          </div>
        </div>

        {/* Thanh thông tin bảo mật & định dạng hỗ trợ */}
        <div
          className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
            isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Chế độ xử lý cục bộ (Local Browser AI):</strong> Ảnh không bị tải lên máy chủ,
              bảo toàn hướng xoay EXIF & kiểm tra chữ ký byte thực.
            </span>
          </div>
          <div className="font-mono text-[11px]">
            Đầu vào: PNG • JPG/JPEG • WebP • BMP • GIF • SVG • AVIF | Đầu ra: PNG • WebP • JPG • BMP • ZIP
          </div>
        </div>
      </div>

      {/* B. KHU VỰC TẢI ẢNH ĐA ĐỊNH DẠNG (DROPZONE & MULTI-IMPORT) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleAddFilesToQueue(e.dataTransfer.files);
          }
        }}
        className={`p-5 sm:p-6 rounded-[14px] border-2 border-dashed transition-all ${
          isDraggingOver
            ? 'border-indigo-400 bg-indigo-500/15 scale-[1.005]'
            : isDark
            ? 'border-white/20 bg-[#1c1635]/60 hover:border-indigo-400/60'
            : 'border-indigo-300 bg-white/80 hover:border-indigo-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/bmp,image/gif,image/avif,image/svg+xml,.png,.jpg,.jpeg,.webp,.bmp,.gif,.avif,.svg,.heic,.heif,.tiff,.tif"
          onChange={(e) => {
            if (e.target.files) handleAddFilesToQueue(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          // @ts-expect-error webkitdirectory support for folder import
          webkitdirectory="true"
          onChange={(e) => {
            if (e.target.files) handleAddFilesToQueue(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-[14px] flex items-center justify-center shrink-0 ${
                isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              <Upload className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold">
                Kéo thả một hoặc nhiều ảnh vào đây, hoặc dán từ Clipboard (Ctrl + V)
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Hỗ trợ xử lý hàng loạt (Batch Processing) • Tự động kiểm tra định dạng thực & bảo
                toàn EXIF • Giới hạn khuyến nghị: ≤ 25MB/ảnh (tối đa 4096×4096px).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-[14px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" /> Chọn Ảnh (Nhiều tệp)
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className={`px-3.5 py-2.5 rounded-[14px] border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              <FolderOpen className="w-4 h-4" /> Chọn Thư Mục
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  if (!navigator.clipboard?.read) {
                    showToast('Hãy nhấn tổ hợp phím Ctrl + V để dán ảnh trực tiếp!', 'info');
                    return;
                  }
                  const clipboardItems = await navigator.clipboard.read();
                  const files: File[] = [];
                  for (const item of clipboardItems) {
                    const imgType = item.types.find((t) => t.startsWith('image/'));
                    if (imgType) {
                      const blob = await item.getType(imgType);
                      const ext = imgType.split('/')[1] || 'png';
                      files.push(
                        new File([blob], `clipboard-${Date.now()}.${ext}`, { type: imgType })
                      );
                    }
                  }
                  if (files.length > 0) {
                    await handleAddFilesToQueue(files);
                  } else {
                    showToast('Không tìm thấy dữ liệu hình ảnh trong Clipboard.', 'info');
                  }
                } catch {
                  showToast('Bạn có thể nhấn Ctrl + V trực tiếp trên trang để dán ảnh.', 'info');
                }
              }}
              className={`px-3.5 py-2.5 rounded-[14px] border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              <ClipboardPaste className="w-4 h-4" /> Dán Ảnh
            </button>
          </div>
        </div>
      </div>

      {/* C. KHU VỰC LÀM VIỆC CHÍNH (3 CỘT TRÊN DESKTOP: HÀNG ĐỢI • PREVIEW STUDIO • BẢNG ĐIỀU KHIỂN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (3/12): DANH SÁCH HÀNG ĐỢI & ĐIỀU KHIỂN HÀNG LOẠT (BATCH QUEUE) */}
        <div className={`lg:col-span-3 p-4 sm:p-5 rounded-[14px] border space-y-4 ${panelClass}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Hàng Đợi Ảnh ({queueStats.total})</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              Hoàn tất: {queueStats.completed}/{queueStats.total}
            </span>
          </div>

          {/* Thanh tiến trình tổng Batch Processing */}
          <div className={`p-3 rounded-[12px] border space-y-2 ${subCardClass}`}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold">
                {isBatchRunning
                  ? isQueuePaused
                    ? 'Đang tạm dừng nhận tác vụ mới...'
                    : `Đang xử lý (${queueStats.processing} tác vụ)...`
                  : 'Tiến trình hàng loạt'}
              </span>
              <span className="font-mono font-bold">{queueStats.overallPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${queueStats.overallPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-1 text-[10px] pt-1 text-center font-medium">
              <div className="p-1 rounded bg-emerald-500/15 text-emerald-400">
                Xong: {queueStats.completed}
              </div>
              <div className="p-1 rounded bg-indigo-500/15 text-indigo-300">
                Chạy: {queueStats.processing}
              </div>
              <div className="p-1 rounded bg-amber-500/15 text-amber-300">
                Chờ: {queueStats.waiting}
              </div>
              <div className="p-1 rounded bg-rose-500/15 text-rose-400">
                Lỗi: {queueStats.failed}
              </div>
            </div>
          </div>

          {/* Các nút điều khiển hàng loạt (Batch Controls) */}
          <div className="space-y-2">
            <button
              type="button"
              disabled={items.length === 0 || isBatchRunning}
              onClick={() => handleRunBatchQueue(false)}
              className="w-full py-2.5 px-4 rounded-[12px] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Remove Background All (Xóa nền tất cả)</span>
            </button>

            {isBatchRunning && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    pauseRef.current = !pauseRef.current;
                    setIsQueuePaused(pauseRef.current);
                  }}
                  className="py-2 px-3 rounded-[10px] bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isQueuePaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isQueuePaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cancelRef.current = true;
                    pauseRef.current = false;
                  }}
                  className="py-2 px-3 rounded-[10px] bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" /> Hủy hàng đợi
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                disabled={queueStats.failed === 0 || isBatchRunning}
                onClick={() => handleRunBatchQueue(true)}
                className={`py-1.5 px-2 rounded-[10px] border font-semibold cursor-pointer disabled:opacity-40 ${subCardClass}`}
              >
                Thử lại ảnh lỗi ({queueStats.failed})
              </button>
              <button
                type="button"
                disabled={queueStats.completed === 0}
                onClick={handleApplyConfigToAllCompleted}
                className={`py-1.5 px-2 rounded-[10px] border font-semibold cursor-pointer disabled:opacity-40 ${subCardClass}`}
                title="Sao chép cấu hình nền & viền hiện tại sang toàn bộ ảnh đã tách nền"
              >
                Đồng bộ cấu hình
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1 pt-1 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  const allSelected = items.every((i) => i.selected);
                  setItems((prev) => prev.map((i) => ({ ...i, selected: !allSelected })));
                }}
                className="text-indigo-400 hover:underline cursor-pointer"
              >
                Chọn / Bỏ chọn tất cả
              </button>
              <button
                type="button"
                onClick={() => {
                  setItems((prev) => {
                    prev.forEach((it) => {
                      if (it.selected && it.outputObjectUrl) {
                        URL.revokeObjectURL(it.outputObjectUrl);
                      }
                    });
                    const remaining = prev.filter((it) => !it.selected);
                    return remaining;
                  });
                }}
                className="text-amber-400 hover:underline cursor-pointer"
              >
                Xóa mục đã chọn
              </button>
              <button
                type="button"
                onClick={() => {
                  setItems((prev) => {
                    prev.forEach((it) => {
                      if (it.status === 'completed' && it.outputObjectUrl) {
                        URL.revokeObjectURL(it.outputObjectUrl);
                      }
                    });
                    return prev.filter((it) => it.status !== 'completed');
                  });
                }}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                Dọn mục xong
              </button>
              <button
                type="button"
                onClick={() => {
                  items.forEach((it) => {
                    if (it.outputObjectUrl) URL.revokeObjectURL(it.outputObjectUrl);
                  });
                  setItems([]);
                  setActiveItemId(null);
                  showToast('Đã xóa danh sách và giải phóng bộ nhớ tạm!', 'info');
                }}
                className="text-rose-400 hover:underline cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          </div>

          {/* Danh sách từng ảnh trong hàng đợi */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div
                className={`p-6 rounded-[12px] border text-center space-y-2 text-xs ${subCardClass}`}
              >
                <ImageIcon className="w-8 h-8 mx-auto opacity-40" />
                <p className="font-semibold">Chưa có ảnh nào trong hàng đợi</p>
                <p className="opacity-70 text-[11px]">
                  Hãy tải ảnh lên hoặc nhấn &ldquo;Thử Chân Dung&rdquo; / &ldquo;Thử Giày TMĐT&rdquo; ở góc trên để trải nghiệm ngay.
                </p>
              </div>
            ) : (
              items.map((item, idx) => {
                const isSelectedActive = activeItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveItemId(item.id)}
                    className={`p-2.5 rounded-[12px] border transition-all cursor-pointer space-y-2 ${
                      isSelectedActive
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
                            prev.map((row) =>
                              row.id === item.id ? { ...row, selected: !row.selected } : row
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
                          src={item.outputObjectUrl || item.thumbnailUrl}
                          alt={item.file.name}
                          className="w-12 h-12 rounded-[10px] object-cover border border-white/15 shrink-0 bg-[conic-gradient(#cbd5e1_25%,#f8fafc_0_50%,#cbd5e1_0_75%,#f8fafc_0)] bg-[length:12px_12px]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-[10px] bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5 text-rose-400" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate" title={item.file.name}>
                          {item.file.name}
                        </div>
                        <div className="text-[10px] opacity-75 font-mono">
                          {item.detectedFormat} • {formatFileSize(item.file.size)}
                          {item.width > 0 ? ` • ${item.width}×${item.height}` : ''}
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-1">
                          <span
                            className={`text-[10px] font-bold ${
                              item.status === 'completed'
                                ? 'text-emerald-400'
                                : item.status === 'failed'
                                ? 'text-rose-400'
                                : item.status === 'processing'
                                ? 'text-indigo-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {item.stageText}
                          </span>
                          {item.outputBlob && (
                            <span className="text-[10px] font-mono text-emerald-400">
                              → {formatFileSize(item.outputBlob.size)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {item.errorMsg && (
                      <div className="p-2 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px]">
                        {item.errorMsg}
                      </div>
                    )}

                    {item.warnings.length > 0 && (
                      <div className="p-1.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px]">
                        {item.warnings[0]}
                      </div>
                    )}

                    {/* Nút hành động từng ảnh */}
                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-white/10">
                      {item.status !== 'failed' && (
                        <button
                          type="button"
                          disabled={isBatchRunning}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveItemId(item.id);
                            processSingleImageItem(item.id, idx);
                          }}
                          className="px-2.5 py-1 rounded-[8px] bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          {item.status === 'completed' ? 'Tách lại' : 'Xóa nền AI'}
                        </button>
                      )}

                      {item.status === 'completed' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadSingleItem(item);
                          }}
                          className="px-2.5 py-1 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" /> Tải
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.outputObjectUrl) URL.revokeObjectURL(item.outputObjectUrl);
                          setItems((prev) => prev.filter((r) => r.id !== item.id));
                        }}
                        className="p-1 rounded-[8px] bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 cursor-pointer"
                        title="Xóa khỏi hàng đợi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CỘT GIỮA (5/12): IMAGE PREVIEW STUDIO & NON-DESTRUCTIVE BRUSH MASK EDITOR */}
        <div className={`lg:col-span-5 p-4 sm:p-5 rounded-[14px] border space-y-4 ${panelClass}`}>
          {/* Thanh điều khiển chế độ xem trước */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-white/10">
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'split_slider', label: 'Thanh Kéo Before/After' },
                { id: 'side_by_side', label: 'Đặt Cạnh Nhau' },
                { id: 'result_only', label: 'Kết Quả' },
                { id: 'brush_edit', label: 'Cọ Xóa / Khôi Phục' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setPreviewViewMode(
                      m.id as 'split_slider' | 'side_by_side' | 'result_only' | 'brush_edit'
                    )
                  }
                  className={`px-2.5 py-1.5 rounded-[10px] text-[11px] font-bold transition-all cursor-pointer ${
                    previewViewMode === m.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isDark
                      ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Chọn nền hiển thị vùng trong suốt (Caro / Sáng / Tối) & Phóng to/Thu nhỏ */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center rounded-[10px] p-0.5 bg-black/20 border border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewBackdropSurface('checkerboard')}
                  title="Nền caro thể hiện vùng trong suốt"
                  className={`p-1.5 rounded-[8px] cursor-pointer ${
                    previewBackdropSurface === 'checkerboard'
                      ? 'bg-indigo-600 text-white'
                      : 'opacity-70'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBackdropSurface('light')}
                  title="Nền sáng"
                  className={`p-1.5 rounded-[8px] cursor-pointer ${
                    previewBackdropSurface === 'light' ? 'bg-indigo-600 text-white' : 'opacity-70'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBackdropSurface('dark')}
                  title="Nền tối"
                  className={`p-1.5 rounded-[8px] cursor-pointer ${
                    previewBackdropSurface === 'dark' ? 'bg-indigo-600 text-white' : 'opacity-70'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoomPercent((z) => Math.max(50, z - 25))}
                  className={`p-1.5 rounded-[8px] border cursor-pointer ${subCardClass}`}
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold w-11 text-center">
                  {zoomPercent}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomPercent((z) => Math.min(250, z + 25))}
                  className={`p-1.5 rounded-[8px] border cursor-pointer ${subCardClass}`}
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomPercent(100)}
                  className={`p-1.5 rounded-[8px] border cursor-pointer ${subCardClass}`}
                  title="Vừa khung (100%)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Thanh công cụ Bút xóa & Khôi phục Mask khi đang ở chế độ Brush Edit */}
          {previewViewMode === 'brush_edit' && activeItem?.status === 'completed' && (
            <div className={`p-3 rounded-[12px] border space-y-2.5 ${subCardClass}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBrushMode('erase')}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      brushMode === 'erase'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-white/5 text-slate-300'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" /> Erase (Xóa thêm nền)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrushMode('restore')}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      brushMode === 'restore'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-white/5 text-slate-300'
                    }`}
                  >
                    <Paintbrush className="w-3.5 h-3.5" /> Restore (Khôi phục chủ thể)
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={activeItem.maskUndoStack.length === 0}
                    onClick={handleUndoBrush}
                    className={`p-1.5 rounded-[8px] border text-xs cursor-pointer disabled:opacity-40 ${subCardClass}`}
                    title="Hoàn tác (Undo)"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={activeItem.maskRedoStack.length === 0}
                    onClick={handleRedoBrush}
                    className={`p-1.5 rounded-[8px] border text-xs cursor-pointer disabled:opacity-40 ${subCardClass}`}
                    title="Làm lại (Redo)"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetMaskToAI}
                    className="px-2.5 py-1 rounded-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold cursor-pointer"
                  >
                    Reset về Mask AI
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <label className="block font-semibold mb-1">Cỡ cọ: {brushSize}px</label>
                  <input
                    type="range"
                    min={4}
                    max={120}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Độ mềm: {brushSoftness}%</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={brushSoftness}
                    onChange={(e) => setBrushSoftness(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Độ mạnh: {brushOpacity}%</label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={brushOpacity}
                    onChange={(e) => setBrushOpacity(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
              <p className="text-[11px] opacity-75">
                Mẹo: Vùng màu đỏ mờ là phần nền đang bị loại bỏ. Dùng cọ{' '}
                <strong>Restore</strong> quét lên vùng đỏ để lấy lại chi tiết chủ thể, hoặc dùng{' '}
                <strong>Erase</strong> để xóa phần nền thừa.
              </p>
            </div>
          )}

          {/* KHUNG HIỂN THỊ ẢNH CHÍNH (PREVIEW STAGE) */}
          <div
            className={`relative rounded-[14px] border overflow-auto flex items-center justify-center min-h-[380px] max-h-[540px] p-3 select-none ${
              previewBackdropSurface === 'checkerboard'
                ? 'bg-[conic-gradient(#cbd5e1_25%,#f8fafc_0_50%,#cbd5e1_0_75%,#f8fafc_0)] bg-[length:20px_20px] border-slate-300'
                : previewBackdropSurface === 'light'
                ? 'bg-slate-100 border-slate-300'
                : 'bg-slate-950 border-white/15'
            }`}
          >
            {!activeItem ? (
              <div className="text-center p-8 space-y-3 bg-slate-900/80 text-white rounded-[14px] backdrop-blur-md max-w-sm">
                <Scissors className="w-10 h-10 mx-auto text-indigo-400" />
                <div className="text-sm font-bold">Chưa có ảnh được chọn</div>
                <p className="text-xs text-slate-300">
                  Tải ảnh từ thiết bị hoặc nhấn nút <strong>&ldquo;Thử Chân Dung&rdquo;</strong> trên thanh
                  tiêu đề để xem AI tách nền trực tiếp.
                </p>
              </div>
            ) : activeItem.status === 'waiting' ? (
              <div className="relative flex flex-col items-center gap-4">
                <img
                  src={activeItem.thumbnailUrl}
                  alt={activeItem.file.name}
                  className="max-h-[360px] rounded-[12px] shadow-xl object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    const idx = items.findIndex((i) => i.id === activeItem.id);
                    processSingleImageItem(activeItem.id, idx >= 0 ? idx : 0);
                  }}
                  className="px-6 py-3 rounded-[14px] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-sm font-black flex items-center gap-2 shadow-2xl cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" /> Remove Background — Xóa nền ngay
                </button>
              </div>
            ) : activeItem.status === 'processing' ? (
              <div className="p-8 rounded-[14px] bg-slate-900/90 text-white text-center space-y-3 max-w-sm border border-white/15">
                <RefreshCw className="w-9 h-9 mx-auto text-indigo-400 animate-spin" />
                <div className="text-sm font-bold">{activeItem.stageText}</div>
                <div className="w-60 h-2 rounded-full bg-white/15 overflow-hidden mx-auto">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-200"
                    style={{ width: `${activeItem.progress}%` }}
                  />
                </div>
                <div className="text-xs font-mono text-indigo-300">{activeItem.progress}%</div>
              </div>
            ) : activeItem.status === 'failed' ? (
              <div className="p-6 rounded-[14px] bg-rose-950/90 text-rose-100 text-center space-y-2 max-w-md border border-rose-500/40">
                <AlertTriangle className="w-8 h-8 mx-auto text-rose-400" />
                <div className="text-sm font-bold">Không thể xử lý tệp ảnh này</div>
                <p className="text-xs">{activeItem.errorMsg}</p>
              </div>
            ) : previewViewMode === 'brush_edit' ? (
              <div
                style={{
                  transform: `scale(${zoomPercent / 100})`,
                  transformOrigin: 'center center',
                }}
                className="transition-transform"
              >
                <canvas
                  ref={brushCanvasRef}
                  onMouseDown={handleBrushPointerDown}
                  onMouseMove={handleBrushPointerMove}
                  onMouseUp={handleBrushPointerUp}
                  onMouseLeave={handleBrushPointerUp}
                  onTouchStart={handleBrushPointerDown}
                  onTouchMove={handleBrushPointerMove}
                  onTouchEnd={handleBrushPointerUp}
                  className="max-w-full max-h-[460px] object-contain cursor-crosshair rounded-[10px] shadow-lg"
                />
              </div>
            ) : previewViewMode === 'side_by_side' ? (
              <div
                style={{
                  transform: `scale(${zoomPercent / 100})`,
                  transformOrigin: 'center center',
                }}
                className="grid grid-cols-2 gap-3 items-center w-full transition-transform"
              >
                <div className="relative rounded-[10px] overflow-hidden border border-white/20 bg-black/40 p-1">
                  <img
                    src={activeItem.thumbnailUrl}
                    alt="Original"
                    className="w-full max-h-[420px] object-contain mx-auto"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-amber-300 text-[10px] font-bold">
                    TRƯỚC (Ảnh gốc)
                  </span>
                </div>
                <div className="relative rounded-[10px] overflow-hidden border border-emerald-400/40 p-1">
                  <img
                    src={activeItem.outputObjectUrl}
                    alt="Removed Background"
                    className="w-full max-h-[420px] object-contain mx-auto"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 text-emerald-300 text-[10px] font-bold">
                    SAU (Đã tách nền)
                  </span>
                </div>
              </div>
            ) : previewViewMode === 'split_slider' ? (
              <div
                style={{
                  transform: `scale(${zoomPercent / 100})`,
                  transformOrigin: 'center center',
                }}
                className="relative inline-block max-w-full max-h-[460px] transition-transform"
              >
                {/* Ảnh sau khi tách nền */}
                <img
                  src={activeItem.outputObjectUrl}
                  alt="After Background Removal"
                  className="max-w-full max-h-[440px] object-contain block rounded-[10px]"
                />

                {/* Lớp ảnh gốc cắt theo vị trí thanh trượt */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none rounded-[10px]"
                  style={{ clipPath: `inset(0 ${100 - splitSliderPos}% 0 0)` }}
                >
                  <img
                    src={activeItem.thumbnailUrl}
                    alt="Before Original"
                    className="w-full h-full object-contain block"
                  />
                </div>

                {/* Thanh phân cách */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.95)] pointer-events-none"
                  style={{ left: `${splitSliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-lg">
                    ⇄
                  </div>
                </div>

                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-amber-300 text-[10px] font-bold">
                  TRƯỚC (Gốc)
                </span>
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 text-emerald-300 text-[10px] font-bold">
                  SAU (AI Alpha)
                </span>
              </div>
            ) : (
              <div
                style={{
                  transform: `scale(${zoomPercent / 100})`,
                  transformOrigin: 'center center',
                }}
                className="transition-transform"
              >
                <img
                  src={activeItem.outputObjectUrl}
                  alt="Processed Output"
                  className="max-w-full max-h-[450px] object-contain rounded-[10px] shadow-lg"
                />
              </div>
            )}
          </div>

          {/* Thanh kéo điều chỉnh vị trí Before/After */}
          {activeItem?.status === 'completed' && previewViewMode === 'split_slider' && (
            <div className="flex items-center gap-3 px-2">
              <span className="text-xs font-semibold">Kéo so sánh Trước / Sau:</span>
              <input
                type="range"
                min={0}
                max={100}
                value={splitSliderPos}
                onChange={(e) => setSplitSliderPos(Number(e.target.value))}
                className="flex-1 accent-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold w-10 text-right">
                {splitSliderPos}%
              </span>
            </div>
          )}

          {/* Thông tin kỹ thuật của ảnh đang xem */}
          {activeItem && (
            <div
              className={`p-3 rounded-[12px] border flex flex-wrap items-center justify-between gap-2 text-xs ${subCardClass}`}
            >
              <div className="space-y-0.5">
                <div className="font-bold">
                  {activeItem.file.name}{' '}
                  {activeItem.detectedCategory && (
                    <span className="text-indigo-400 font-semibold">
                      • Chủ thể: {activeItem.detectedCategory}
                    </span>
                  )}
                </div>
                <div className="text-[11px] opacity-75 font-mono">
                  Gốc: {activeItem.width}×{activeItem.height}px ({activeItem.detectedFormat},{' '}
                  {formatFileSize(activeItem.file.size)})
                  {activeItem.outputBlob && (
                    <>
                      {' '}
                      → Đầu ra: {activeItem.outputWidth}×{activeItem.outputHeight}px (
                      {activeItem.outputFormat?.toUpperCase()},{' '}
                      {formatFileSize(activeItem.outputBlob.size)})
                    </>
                  )}
                </div>
              </div>

              {activeItem.status === 'completed' && (
                <button
                  type="button"
                  onClick={() => handleDownloadSingleItem(activeItem)}
                  className="px-4 py-2 rounded-[12px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Tải Ảnh Này ({activeItem.outputFormat?.toUpperCase()})
                </button>
              )}
            </div>
          )}
        </div>

        {/* CỘT PHẢI (4/12): BẢNG ĐIỀU KHIỂN 5 TAB (AI • VIỀN/TÓC • THAY NỀN • HẬU KỲ • XUẤT/ZIP) */}
        <div className={`lg:col-span-4 p-4 sm:p-5 rounded-[14px] border space-y-4 ${panelClass}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Bảng Tinh Chỉnh & Thiết Kế Đầu Ra</span>
            </h3>
            <span className="text-[11px] font-mono text-indigo-400">
              {config.qualityMode === 'high_quality'
                ? 'High Quality'
                : config.qualityMode === 'balanced'
                ? 'Balanced'
                : 'Fast Mode'}
            </span>
          </div>

          {/* 5 Tab chuyển đổi chức năng */}
          <div
            className={`grid grid-cols-5 gap-1 p-1 rounded-[12px] border ${
              isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {[
              { id: 'ai_preset', label: 'AI/Preset' },
              { id: 'edge_hair', label: 'Viền/Tóc' },
              { id: 'background', label: 'Thay Nền' },
              { id: 'post_crop', label: 'Crop/Màu' },
              { id: 'export_zip', label: 'Xuất/ZIP' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  setActiveInspectorTab(
                    t.id as
                      | 'ai_preset'
                      | 'edge_hair'
                      | 'background'
                      | 'post_crop'
                      | 'export_zip'
                  )
                }
                className={`py-1.5 px-1 rounded-[9px] text-[11px] font-bold transition-all cursor-pointer truncate ${
                  activeInspectorTab === t.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: CHẾ ĐỘ CHẤT LƯỢNG AI & 10 PRESET NHU CẦU PHỔ BIẾN */}
          {activeInspectorTab === 'ai_preset' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold">
                  Bước 3: Chọn Chế Độ Chất Lượng Engine AI
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: 'fast',
                      title: 'Fast Mode',
                      desc: 'Ưu tiên tốc độ, xử lý nhanh số lượng lớn',
                    },
                    {
                      id: 'balanced',
                      title: 'Balanced',
                      desc: 'Cân bằng tốc độ & chi tiết (Mặc định)',
                    },
                    {
                      id: 'high_quality',
                      title: 'High Quality',
                      desc: 'Tối đa hóa chi tiết sợi tóc & viền mảnh',
                    },
                  ].map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() =>
                        setConfig({ ...config, qualityMode: q.id as AIQualityMode })
                      }
                      className={`p-2.5 rounded-[12px] border text-left transition-all cursor-pointer ${
                        config.qualityMode === q.id
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                          : subCardClass
                      }`}
                    >
                      <div className="text-xs font-bold">{q.title}</div>
                      <div
                        className={`text-[10px] mt-0.5 line-clamp-2 ${
                          config.qualityMode === q.id ? 'text-indigo-100' : 'opacity-75'
                        }`}
                      >
                        {q.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 10 Preset cấu hình thương mại */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">
                    10 Preset Chuyên Dụng (TMĐT, Avatar, CV, Logo, Web)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[310px] overflow-y-auto pr-1">
                  {BG_REMOVER_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setActivePresetId(preset.id);
                          setConfig((prev) => preset.apply(prev));
                          showToast(`Đã áp dụng Preset: ${preset.name}`, 'info');
                        }}
                        className={`p-2.5 rounded-[12px] border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                            : subCardClass
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold truncate">{preset.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-400'
                            }`}
                          >
                            {preset.badge}
                          </span>
                        </div>
                        <p
                          className={`text-[10px] mt-1 line-clamp-2 ${
                            isSelected ? 'text-purple-100' : 'opacity-75'
                          }`}
                        >
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BƯỚC 4 — TINH CHỈNH VIỀN CHỦ THỂ & TÓC (EDGE & HAIR REFINEMENT) */}
          {activeInspectorTab === 'edge_hair' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.edge.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        edge: { ...config.edge, enabled: e.target.checked },
                      })
                    }
                    className="accent-indigo-600"
                  />
                  <span>Bật bộ tinh chỉnh Viền & Sợi Tóc (Edge & Hair)</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setConfig({ ...config, edge: DEFAULT_STUDIO_CONFIG.edge })
                  }
                  className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                >
                  Đặt lại mặc định
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Hair Refinement (Giữ chi tiết tóc & lông động vật)</span>
                    <span className="font-mono text-indigo-400">
                      {config.edge.hairRefinement}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={config.edge.hairRefinement}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        edge: { ...config.edge, hairRefinement: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Feather (Mềm mép)</span>
                      <span className="font-mono">{config.edge.feather}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={12}
                      step={0.5}
                      value={config.edge.feather}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          edge: { ...config.edge, feather: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Smooth (Làm mượt)</span>
                      <span className="font-mono">{config.edge.smooth}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={config.edge.smooth}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          edge: { ...config.edge, smooth: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Expand / Contract (Mở rộng / Thu nhỏ vùng chủ thể)</span>
                    <span className="font-mono">
                      {config.edge.expandContract > 0
                        ? `+${config.edge.expandContract}px`
                        : `${config.edge.expandContract}px`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={config.edge.expandContract}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        edge: { ...config.edge, expandContract: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Defringe (Khử viền màu ám từ nền cũ)</span>
                    <span className="font-mono">{config.edge.defringe}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={config.edge.defringe}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        edge: { ...config.edge, defringe: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label className={`p-2.5 rounded-[10px] border flex items-center gap-2 cursor-pointer ${subCardClass}`}>
                    <input
                      type="checkbox"
                      checked={config.edge.edgeCleanup}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          edge: { ...config.edge, edgeCleanup: e.target.checked },
                        })
                      }
                      className="accent-indigo-600"
                    />
                    <span className="text-[11px] font-semibold">Edge Cleanup (Làm sạch đốm biên)</span>
                  </label>

                  <label className={`p-2.5 rounded-[10px] border flex items-center gap-2 cursor-pointer ${subCardClass}`}>
                    <input
                      type="checkbox"
                      checked={config.edge.decontaminateColors}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          edge: { ...config.edge, decontaminateColors: e.target.checked },
                        })
                      }
                      className="accent-indigo-600"
                    />
                    <span className="text-[11px] font-semibold">Decontaminate Colors</span>
                  </label>
                </div>

                {/* Chuyển nhanh sang công cụ Bút xóa & khôi phục thủ công */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setPreviewViewMode('brush_edit')}
                    className="w-full py-2.5 px-3 rounded-[12px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow"
                  >
                    <Paintbrush className="w-4 h-4" />
                    <span>Mở Bút Xóa & Khôi Phục Thủ Công (Brush Mask)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BƯỚC 6 — THAY THẾ VÀ THIẾT KẾ NỀN + ĐỔ BÓNG CHỦ THỂ */}
          {activeInspectorTab === 'background' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'transparent', label: 'Trong Suốt' },
                  { id: 'solid', label: 'Màu Đơn' },
                  { id: 'gradient', label: 'Gradient' },
                  { id: 'image', label: 'Ảnh Nền' },
                ].map((bm) => (
                  <button
                    key={bm.id}
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        background: {
                          ...config.background,
                          mode: bm.id as BackgroundMode,
                        },
                      })
                    }
                    className={`py-2 px-2 rounded-[10px] border font-bold cursor-pointer ${
                      config.background.mode === bm.id
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : subCardClass
                    }`}
                  >
                    {bm.label}
                  </button>
                ))}
              </div>

              {/* 10.2. Nền màu đơn */}
              {config.background.mode === 'solid' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Chọn màu nền hoặc nhập mã HEX:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={config.background.solidColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            background: { ...config.background, solidColor: e.target.value },
                          })
                        }
                        className="w-7 h-7 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={config.background.solidColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            background: { ...config.background, solidColor: e.target.value },
                          })
                        }
                        className={`w-24 px-2 py-1 rounded border font-mono text-xs ${inputClass}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {SOLID_COLOR_PRESETS.map((sw) => (
                      <button
                        key={sw.hex}
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            background: { ...config.background, solidColor: sw.hex },
                          })
                        }
                        className="p-1.5 rounded-[8px] border border-white/20 flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform"
                        style={{ backgroundColor: sw.hex }}
                        title={`${sw.label} (${sw.hex})`}
                      >
                        <span
                          className="text-[10px] font-bold truncate"
                          style={{
                            color:
                              sw.hex === '#FFFFFF' ||
                              sw.hex === '#F1F5F9' ||
                              sw.hex === '#FEF3C7' ||
                              sw.hex === '#FCE7F3'
                                ? '#0F172A'
                                : '#FFFFFF',
                          }}
                        >
                          {sw.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 10.3. Nền Gradient */}
              {config.background.mode === 'gradient' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div>
                      <label className="block text-[10px] mb-1">Màu đầu</label>
                      <input
                        type="color"
                        value={config.background.gradientStart}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            background: {
                              ...config.background,
                              gradientStart: e.target.value,
                            },
                          })
                        }
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] mb-1">Màu cuối</label>
                      <input
                        type="color"
                        value={config.background.gradientEnd}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            background: {
                              ...config.background,
                              gradientEnd: e.target.value,
                            },
                          })
                        }
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] mb-1">
                        Góc: {config.background.gradientAngle}°
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={config.background.gradientAngle}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            background: {
                              ...config.background,
                              gradientAngle: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {GRADIENT_PRESETS.map((gp) => (
                      <button
                        key={gp.name}
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            background: {
                              ...config.background,
                              gradientStart: gp.start,
                              gradientEnd: gp.end,
                              gradientAngle: gp.angle,
                            },
                          })
                        }
                        className="h-9 rounded-[8px] border border-white/20 text-[10px] font-bold text-white shadow cursor-pointer px-1 truncate"
                        style={{
                          background: `linear-gradient(${gp.angle}deg, ${gp.start}, ${gp.end})`,
                        }}
                      >
                        {gp.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 10.4. Nền bằng Hình ảnh */}
              {config.background.mode === 'image' && (
                <div className="space-y-2.5">
                  <input
                    ref={bgFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const url = URL.createObjectURL(f);
                        setConfig({
                          ...config,
                          background: { ...config.background, bgImageUrl: url },
                        });
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bgFileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Tải Ảnh Nền Từ Thiết Bị
                  </button>

                  <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {STUDIO_BACKDROP_PRESETS.map((bp) => (
                      <button
                        key={bp.id}
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            background: { ...config.background, bgImageUrl: bp.url },
                          })
                        }
                        className={`p-1.5 rounded-[8px] border flex items-center gap-2 text-left cursor-pointer ${
                          config.background.bgImageUrl === bp.url
                            ? 'bg-indigo-600 text-white border-indigo-400'
                            : subCardClass
                        }`}
                      >
                        <img
                          src={bp.url}
                          alt={bp.name}
                          className="w-10 h-7 rounded object-cover shrink-0"
                        />
                        <span className="text-[11px] font-semibold truncate">{bp.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] mb-1">
                        Làm mờ nền (Blur): {config.background.bgBlur}px
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={25}
                        value={config.background.bgBlur}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            background: { ...config.background, bgBlur: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] mb-1">
                        Phóng ảnh nền: {config.background.bgScale}%
                      </label>
                      <input
                        type="range"
                        min={50}
                        max={200}
                        value={config.background.bgScale}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            background: { ...config.background, bgScale: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 10.5. Đổ bóng chủ thể & Vị trí chủ thể */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.background.shadow.enabled}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          background: {
                            ...config.background,
                            shadow: {
                              ...config.background.shadow,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                      className="accent-indigo-600"
                    />
                    <span>Đổ bóng chủ thể (Drop Shadow)</span>
                  </label>

                  <label className="flex items-center gap-1.5 font-semibold cursor-pointer text-indigo-400">
                    <input
                      type="checkbox"
                      checked={config.background.autoCenterSubject}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          background: {
                            ...config.background,
                            autoCenterSubject: e.target.checked,
                          },
                        })
                      }
                      className="accent-indigo-600"
                    />
                    <span>Tự căn giữa chủ thể</span>
                  </label>
                </div>

                {config.background.shadow.enabled && (
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <label>Độ nhòe: {config.background.shadow.blur}px</label>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={config.background.shadow.blur}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            background: {
                              ...config.background,
                              shadow: {
                                ...config.background.shadow,
                                blur: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <label>Độ đậm: {config.background.shadow.opacity}%</label>
                      <input
                        type="range"
                        min={5}
                        max={90}
                        value={config.background.shadow.opacity}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            background: {
                              ...config.background,
                              shadow: {
                                ...config.background.shadow,
                                opacity: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <label>Lệch Y: {config.background.shadow.offsetY}px</label>
                      <input
                        type="range"
                        min={-30}
                        max={30}
                        value={config.background.shadow.offsetY}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            background: {
                              ...config.background,
                              shadow: {
                                ...config.background.shadow,
                                offsetY: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <label>Tỷ lệ chủ thể: {config.background.subjectScale}%</label>
                    <input
                      type="range"
                      min={50}
                      max={140}
                      value={config.background.subjectScale}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          background: {
                            ...config.background,
                            subjectScale: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <label>Vị trí X: {config.background.subjectOffsetX}%</label>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      value={config.background.subjectOffsetX}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          background: {
                            ...config.background,
                            subjectOffsetX: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <label>Vị trí Y: {config.background.subjectOffsetY}%</label>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      value={config.background.subjectOffsetY}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          background: {
                            ...config.background,
                            subjectOffsetY: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BƯỚC 7 — CHỈNH SỬA ẢNH ĐẦU RA (CROP, XOAY/LẬT, MÀU SẮC, ĐỔI KÍCH THƯỚC) */}
          {activeInspectorTab === 'post_crop' && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1.5 flex items-center gap-1.5">
                  <Crop className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cắt Khung Hình Tỷ Lệ Chuẩn (Crop & Aspect Ratio)</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    ['original', '1:1', '4:3', '3:2', '16:9', '9:16', 'custom'] as CropAspectPreset[]
                  ).map((cp) => (
                    <button
                      key={cp}
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          postProcess: { ...config.postProcess, cropPreset: cp },
                        })
                      }
                      className={`py-1.5 rounded-[8px] border text-[11px] font-bold cursor-pointer ${
                        config.postProcess.cropPreset === cp
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : subCardClass
                      }`}
                    >
                      {cp === 'original' ? 'Tỷ lệ gốc' : cp === 'custom' ? 'Tùy chỉnh' : cp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Xoay & Lật */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      postProcess: {
                        ...config.postProcess,
                        rotation: (((config.postProcess.rotation + 90) % 360) as
                          | 0
                          | 90
                          | 180
                          | 270),
                      },
                    })
                  }
                  className={`py-2 px-2 rounded-[10px] border font-bold flex items-center justify-center gap-1 cursor-pointer ${subCardClass}`}
                >
                  <RotateCw className="w-3.5 h-3.5" /> Xoay ({config.postProcess.rotation}°)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      postProcess: {
                        ...config.postProcess,
                        flipH: !config.postProcess.flipH,
                      },
                    })
                  }
                  className={`py-2 px-2 rounded-[10px] border font-bold flex items-center justify-center gap-1 cursor-pointer ${
                    config.postProcess.flipH
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : subCardClass
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" /> Lật ngang
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      postProcess: {
                        ...config.postProcess,
                        flipV: !config.postProcess.flipV,
                      },
                    })
                  }
                  className={`py-2 px-2 rounded-[10px] border font-bold flex items-center justify-center gap-1 cursor-pointer ${
                    config.postProcess.flipV
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : subCardClass
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" /> Lật dọc
                </button>
              </div>

              {/* Điều chỉnh Độ sáng, Tương phản, Bão hòa, Độ sắc nét */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Điều chỉnh hình ảnh & Độ sắc nét</span>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        postProcess: {
                          ...config.postProcess,
                          brightness: 100,
                          contrast: 100,
                          saturation: 100,
                          sharpness: 0,
                        },
                      })
                    }
                    className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                  >
                    Đặt lại
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                  <div>
                    <label>Độ sáng: {config.postProcess.brightness}%</label>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={config.postProcess.brightness}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          postProcess: {
                            ...config.postProcess,
                            brightness: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <label>Tương phản: {config.postProcess.contrast}%</label>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={config.postProcess.contrast}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          postProcess: {
                            ...config.postProcess,
                            contrast: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <label>Độ bão hòa: {config.postProcess.saturation}%</label>
                    <input
                      type="range"
                      min={0}
                      max={200}
                      value={config.postProcess.saturation}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          postProcess: {
                            ...config.postProcess,
                            saturation: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <label>Độ sắc nét (Sharpness): {config.postProcess.sharpness}%</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={config.postProcess.sharpness}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          postProcess: {
                            ...config.postProcess,
                            sharpness: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Đổi kích thước đầu ra */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Đổi kích thước đầu ra (Resize)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        postProcess: { ...config.postProcess, resizeMode: 'original' },
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      config.postProcess.resizeMode === 'original'
                        ? 'bg-emerald-600 text-white'
                        : subCardClass
                    }`}
                  >
                    Giữ kích thước gốc
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {RESIZE_QUICK_PRESETS.map((rp) => (
                    <button
                      key={rp.label}
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          postProcess: {
                            ...config.postProcess,
                            resizeMode: 'preset',
                            targetWidth: rp.w,
                            targetHeight: rp.h,
                          },
                        })
                      }
                      className={`px-2 py-1 rounded-[8px] border text-[10px] font-semibold cursor-pointer ${
                        config.postProcess.resizeMode !== 'original' &&
                        config.postProcess.targetWidth === rp.w &&
                        config.postProcess.targetHeight === rp.h
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : subCardClass
                      }`}
                    >
                      {rp.label}
                    </button>
                  ))}
                </div>

                {config.postProcess.resizeMode !== 'original' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] mb-1">Chiều rộng (px)</label>
                      <input
                        type="number"
                        min={32}
                        max={4096}
                        value={config.postProcess.targetWidth}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            postProcess: {
                              ...config.postProcess,
                              resizeMode: 'custom',
                              targetWidth: Number(e.target.value),
                            },
                          })
                        }
                        className={`w-full px-2.5 py-1 rounded border font-mono ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] mb-1">Chiều cao (px)</label>
                      <input
                        type="number"
                        min={32}
                        max={4096}
                        value={config.postProcess.targetHeight}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            postProcess: {
                              ...config.postProcess,
                              resizeMode: 'custom',
                              targetHeight: Number(e.target.value),
                            },
                          })
                        }
                        className={`w-full px-2.5 py-1 rounded border font-mono ${inputClass}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: BƯỚC 9, 10 & 15 — CẤU HÌNH ĐẦU RA ĐA ĐỊNH DẠNG, ĐẶT TÊN & TẢI ZIP */}
          {activeInspectorTab === 'export_zip' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1.5">
                  Bước 9: Chọn Định Dạng Xuất Thực Tế
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'png', label: 'PNG (Alpha)', desc: 'Nền trong suốt chuẩn' },
                    { id: 'webp', label: 'WebP (Alpha)', desc: 'Nhẹ cho Website' },
                    { id: 'jpeg', label: 'JPEG / JPG', desc: 'Tự ghép nền đặc' },
                    { id: 'bmp', label: 'BMP 32-bit', desc: 'Ảnh Bitmap không nén' },
                    { id: 'avif', label: 'AVIF', desc: 'Nén thế hệ mới' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          exportConfig: {
                            ...config.exportConfig,
                            format: fmt.id as OutputImageFormat,
                          },
                        })
                      }
                      className={`p-2 rounded-[10px] border text-left cursor-pointer ${
                        config.exportConfig.format === fmt.id
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                          : subCardClass
                      }`}
                    >
                      <div className="font-bold">{fmt.label}</div>
                      <div className="text-[10px] opacity-75 truncate">{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {config.exportConfig.format === 'jpeg' &&
                config.background.mode === 'transparent' && (
                  <div className="p-2.5 rounded-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px]">
                    Lưu ý: JPEG không hỗ trợ kênh trong suốt Alpha. Hệ thống sẽ tự động ghép chủ
                    thể lên nền màu ({config.background.solidColor}) trước khi xuất.
                  </div>
                )}

              {(config.exportConfig.format === 'webp' ||
                config.exportConfig.format === 'jpeg' ||
                config.exportConfig.format === 'avif') && (
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Chất lượng nén ({config.exportConfig.format.toUpperCase()})</span>
                    <span className="font-mono">{config.exportConfig.quality}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={config.exportConfig.quality}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        exportConfig: {
                          ...config.exportConfig,
                          quality: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>
              )}

              {/* Quy tắc đặt tên tệp */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="block font-bold">Bước 15: Quy Tắc Đặt Tên Tệp Xuất Ra</label>
                <select
                  value={config.exportConfig.namingRule}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      exportConfig: {
                        ...config.exportConfig,
                        namingRule: e.target.value as any,
                      },
                    })
                  }
                  className={`w-full px-3 py-2 rounded-[10px] border text-xs ${inputClass}`}
                >
                  <option value="suffix_nobg">Thêm hậu tố _no-bg (VD: anh_no-bg.png)</option>
                  <option value="keep_original">Giữ nguyên tên tệp gốc</option>
                  <option value="custom_suffix">Thêm hậu tố tùy chỉnh</option>
                  <option value="pattern_seq">Đánh số thứ tự theo mẫu (product-001_no-bg)</option>
                </select>

                {config.exportConfig.namingRule === 'custom_suffix' && (
                  <input
                    type="text"
                    value={config.exportConfig.customSuffix}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        exportConfig: {
                          ...config.exportConfig,
                          customSuffix: e.target.value,
                        },
                      })
                    }
                    placeholder="Nhập hậu tố (VD: _tach-nen)"
                    className={`w-full px-3 py-1.5 rounded-[10px] border text-xs font-mono ${inputClass}`}
                  />
                )}

                {config.exportConfig.namingRule === 'pattern_seq' && (
                  <input
                    type="text"
                    value={config.exportConfig.patternPrefix}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        exportConfig: {
                          ...config.exportConfig,
                          patternPrefix: e.target.value,
                        },
                      })
                    }
                    placeholder="Tiền tố (VD: product)"
                    className={`w-full px-3 py-1.5 rounded-[10px] border text-xs font-mono ${inputClass}`}
                  />
                )}
              </div>
            </div>
          )}

          {/* DOCK HÀNH ĐỘNG LUÔN HIỂN THỊ DƯỚI CÙNG CỘT PHẢI: TẢI ẢNH HIỆN TẠI & TẢI TẤT CẢ ZIP */}
          <div className="pt-3 border-t border-white/10 space-y-2.5">
            {activeItem && activeItem.status !== 'completed' && activeItem.status !== 'failed' && (
              <button
                type="button"
                disabled={isBatchRunning}
                onClick={() => {
                  const idx = items.findIndex((i) => i.id === activeItem.id);
                  processSingleImageItem(activeItem.id, idx >= 0 ? idx : 0);
                }}
                className="w-full py-2.5 px-4 rounded-[12px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Remove Background (Xóa nền ảnh đang chọn)
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!activeItem || activeItem.status !== 'completed'}
                onClick={() => activeItem && handleDownloadSingleItem(activeItem)}
                className="py-2.5 px-3 rounded-[12px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" /> Tải Ảnh Đang Chọn
              </button>

              <button
                type="button"
                disabled={queueStats.completed === 0 || isPackingZip}
                onClick={handleDownloadAllZip}
                className="py-2.5 px-3 rounded-[12px] bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                <span>
                  {isPackingZip
                    ? 'Đang đóng gói...'
                    : `Download All ZIP (${queueStats.completed})`}
                </span>
              </button>
            </div>

            {isPackingZip && zipProgressText && (
              <div className="text-[11px] font-mono text-purple-300 text-center">
                {zipProgressText}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* D. BẢNG LỊCH SỬ & KẾT QUẢ PHIÊN LÀM VIỆC HIỆN TẠI (SESSION RESULTS TABLE) */}
      {queueStats.completed > 0 && (
        <div className={`p-5 rounded-[14px] border space-y-3 ${panelClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Bảng Kết Quả Phiên Làm Việc ({queueStats.completed} ảnh đã tách nền)</span>
            </h3>
            <span className="text-xs opacity-75">
              Chỉ lưu trong bộ nhớ phiên hiện tại để bảo vệ quyền riêng tư tuyệt đối.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b ${
                    isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <th className="py-2 px-3">Ảnh gốc / Đã xử lý</th>
                  <th className="py-2 px-3">Tên tệp đầu ra</th>
                  <th className="py-2 px-3">Định dạng & Kích thước</th>
                  <th className="py-2 px-3">Dung lượng</th>
                  <th className="py-2 px-3">Thời gian AI</th>
                  <th className="py-2 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .filter((it) => it.status === 'completed')
                  .map((it) => (
                    <tr
                      key={it.id}
                      className={`border-b ${
                        isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={it.thumbnailUrl}
                            alt="Original"
                            className="w-9 h-9 rounded object-cover border border-white/15"
                          />
                          <span>→</span>
                          <img
                            src={it.outputObjectUrl}
                            alt="Result"
                            className="w-9 h-9 rounded object-cover border border-emerald-500/40 bg-[conic-gradient(#cbd5e1_25%,#f8fafc_0_50%,#cbd5e1_0_75%,#f8fafc_0)] bg-[length:10px_10px]"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold">{it.outputFileName}</td>
                      <td className="py-2 px-3 font-mono">
                        {it.outputFormat?.toUpperCase()} • {it.outputWidth}×{it.outputHeight}px
                      </td>
                      <td className="py-2 px-3 font-mono text-emerald-400">
                        {it.outputBlob ? formatFileSize(it.outputBlob.size) : '—'}
                      </td>
                      <td className="py-2 px-3 font-mono">{it.processingTimeMs || 0} ms</td>
                      <td className="py-2 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveItemId(it.id)}
                            className={`px-2.5 py-1 rounded-[8px] border text-[11px] font-semibold cursor-pointer ${subCardClass}`}
                          >
                            <Eye className="w-3 h-3 inline mr-1" /> Xem
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadSingleItem(it)}
                            className="px-2.5 py-1 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                          >
                            <Download className="w-3 h-3 inline mr-1" /> Tải xuống
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CÀI ĐẶT NÂNG CAO (CONCURRENCY & DUPLICATE POLICY) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-[14px] border space-y-4 ${panelClass}`}>
            <div className="flex items-center justify-between border-b pb-3 border-white/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Cài Đặt Xử Lý Hàng Loạt & Bộ Nhớ</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">
                  Số tác vụ xử lý đồng thời (Batch Concurrency): {config.concurrency} ảnh/lượt
                </label>
                <input
                  type="range"
                  min={1}
                  max={4}
                  value={config.concurrency}
                  onChange={(e) =>
                    setConfig({ ...config, concurrency: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
                <p className="text-[11px] opacity-75 mt-1">
                  Khuyến nghị 2 tác vụ đồng thời để cân bằng tốc độ và bảo vệ RAM trình duyệt khi xử
                  lý ảnh độ phân giải lớn.
                </p>
              </div>

              <div>
                <label className="block font-bold mb-1">Chính sách phát hiện ảnh trùng lặp</label>
                <select
                  value={config.duplicatePolicy}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      duplicatePolicy: e.target.value as 'skip' | 'allow_rename',
                    })
                  }
                  className={`w-full px-3 py-2 rounded-[10px] border ${inputClass}`}
                >
                  <option value="skip">Bỏ qua tệp trùng tên và dung lượng</option>
                  <option value="allow_rename">Cho phép thêm và tự động đánh số tên tệp</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-[12px] bg-indigo-600 text-white text-xs font-bold cursor-pointer"
              >
                Đóng & Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRỢ GIÚP & THÔNG TIN GIỚI HẠN MÔ HÌNH */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg p-6 rounded-[14px] border space-y-4 ${panelClass}`}>
            <div className="flex items-center justify-between border-b pb-3 border-white/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>Hướng Dẫn & Giới Hạn Kỹ Thuật Thực Tế</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs leading-relaxed">
              <p>
                <strong>1. Nguyên lý hoạt động:</strong> Bộ máy kết hợp mô hình phân cụm màu biên
                CIE LAB (Multi-Cluster GMM/K-Means), bản đồ Saliency trung tâm, lan truyền Geodesic
                Flood-Fill có rào chắn đạo hàm Sobel và Guided Alpha Matting để tách chủ thể với
                kênh trong suốt Alpha liên tục (0..255).
              </p>
              <p>
                <strong>2. Phạm vi tối ưu & Giới hạn thực tế:</strong> Hoạt động rất tốt với ảnh
                chân dung, sản phẩm thương mại điện tử, giày dép, túi xách, logo và đồ vật có độ
                tương phản với nền. Với ảnh có nền trùng màu hoàn toàn với chủ thể (camouflage), hãy
                kết hợp công cụ <strong>Bút Xóa & Khôi Phục (Erase / Restore)</strong> ở Tab
                Viền/Tóc để đạt độ chính xác 100%.
              </p>
              <p>
                <strong>3. Định dạng đặc biệt:</strong> Ảnh SVG được tự động raster hóa sắc nét. Với
                GIF động, hệ thống thông báo rõ và xử lý khung hình chính. Với JPEG đầu ra, vì JPEG
                không hỗ trợ kênh Alpha, hệ thống tự động ghép chủ thể lên nền màu trước khi xuất.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-[12px] bg-indigo-600 text-white text-xs font-bold cursor-pointer"
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
