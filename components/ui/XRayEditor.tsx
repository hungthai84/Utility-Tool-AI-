'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { XRaySelectedElementInfo, XRayPromptTemplate, XRayCategory } from '@/types/xray';
import { WebIcon } from '@/components/ui/WebIcon';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/components/ThemeContext';
import {
  DEFAULT_TEMPLATES,
  loadSavedTemplates,
  addTemplate,
  deleteTemplate,
  updateTemplate,
  LIGHT_DARK_NOTE,
  ensureLightDarkNote,
} from '@/utils/xrayStorage';
import { XRayLibraryModal } from '@/components/ui/XRayLibraryModal';

export interface XRayEditorProps {
  currentPageId: number;
  currentPageName: string;
}

const ACTION_OPTIONS: {
  type: 'modify' | 'delete' | 'add' | 'restyle' | 'optimize';
  label: string;
  icon: string;
  placeholder: string;
}[] = [
  {
    type: 'restyle',
    label: 'Kiểu dáng',
    icon: 'palette',
    placeholder: 'Ví dụ: Đổi màu nền sang tím pastel, thêm viền phát sáng khi hover...',
  },
  {
    type: 'modify',
    label: 'Nội dung',
    icon: 'file-text',
    placeholder: 'Ví dụ: Thay đổi tiêu đề, cập nhật số liệu phần trăm thành 98%...',
  },
  {
    type: 'optimize',
    label: 'Bố cục',
    icon: 'layers',
    placeholder: 'Ví dụ: Giữ chiều cao co giãn bằng 3 thẻ, căn lề giữa trên mobile...',
  },
  {
    type: 'add',
    label: 'Bổ sung',
    icon: 'sparkles',
    placeholder: 'Ví dụ: Thêm nút tải PDF và popup xem nhanh chi tiết...',
  },
  {
    type: 'delete',
    label: 'Xóa bỏ',
    icon: 'trash',
    placeholder: 'Ví dụ: Xóa khung tròn bao quanh icon, ẩn dòng subtitle...',
  },
];

export const XRayEditor: React.FC<XRayEditorProps> = ({
  currentPageId,
  currentPageName,
}) => {
  const { showToast } = useToast();
  const { isDark } = useTheme();

  // Mode toggles
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isEditorPopupOpen, setIsEditorPopupOpen] = useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);

  // Inspector Hover State
  const [hoveredRect, setHoveredRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string>('');
  const [hoveredParent, setHoveredParent] = useState<string>('');

  // Selected element info
  const [selectedElement, setSelectedElement] = useState<XRaySelectedElementInfo | null>(null);
  const [targetDepth, setTargetDepth] = useState<'element' | 'parent' | 'section'>('element');

  // Form states for the 4 core pieces of information:
  // 1. Page (Trang)
  const [targetPage, setTargetPage] = useState<string>(currentPageName);
  // 2. Object (Đối tượng)
  const [targetObject, setTargetObject] = useState<string>('');
  // 3. Action (Hành động)
  const [actionType, setActionType] = useState<'modify' | 'delete' | 'add' | 'restyle' | 'optimize'>('restyle');
  const [actionCustomNote, setActionCustomNote] = useState<string>('');
  // 4. Scope (Phạm vi)
  const [scope, setScope] = useState<'element' | 'page' | 'global'>('element');
  // Category for library
  const [category, setCategory] = useState<XRayCategory>('Giao diện');

  // Generated prompt
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');

  // Stored templates (load from localStorage after mount for SSR hydration consistency)
  const [templates, setTemplates] = useState<XRayPromptTemplate[]>(DEFAULT_TEMPLATES);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setTemplates(loadSavedTemplates());
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  // Keep target page updated when current page changes
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setTargetPage(currentPageName);
    });
    return () => cancelAnimationFrame(timer);
  }, [currentPageName]);

  // Helper: Find human-friendly summary & technical hierarchy of an element
  const inspectElement = useCallback(
    (el: HTMLElement): XRaySelectedElementInfo => {
      const rect = el.getBoundingClientRect();
      const tag = el.tagName.toLowerCase();
      const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
      const textSnippet = text.length > 55 ? text.substring(0, 52) + '...' : text;

      let summary = '';
      if (tag === 'button') summary = textSnippet ? `Nút bấm "${textSnippet}"` : 'Nút bấm tương tác';
      else if (tag === 'img') summary = `Hình ảnh (${el.getAttribute('alt') || 'Graphic'})`;
      else if (tag === 'video') summary = 'Khung phát Video';
      else if (/^h[1-6]$/.test(tag)) summary = `Tiêu đề ${tag.toUpperCase()} "${textSnippet}"`;
      else if (tag === 'p') summary = textSnippet ? `Đoạn văn "${textSnippet}"` : 'Đoạn văn bản';
      else if (tag === 'article') summary = textSnippet ? `Thẻ bài "${textSnippet}"` : 'Thẻ nội dung (Card)';
      else if (tag === 'aside') summary = 'Thẻ cột bên (Aside/Sidebar)';
      else if (tag === 'nav' || tag === 'header') summary = 'Thanh điều hướng Header/Menu';
      else if (tag === 'footer') summary = 'Khung chân trang Footer';
      else summary = textSnippet ? `Khối <${tag}> "${textSnippet}"` : `Khối đối tượng <${tag}>`;

      const classNameStr = typeof el.className === 'string' ? el.className : '';
      const firstClass = classNameStr ? classNameStr.split(' ').filter(Boolean)[0] : '';
      const suggestedSelector = el.id
        ? `#${el.id}`
        : `${tag}${firstClass ? '.' + firstClass : ''}`;

      // Find semantic parent container in DOM hierarchy
      let currentParent = el.parentElement;
      let parentTag = '';
      let parentSummary = '';
      let parentSelector = '';

      while (currentParent && currentParent !== document.body) {
        const pTag = currentParent.tagName.toLowerCase();
        const pClass = typeof currentParent.className === 'string' ? currentParent.className : '';
        
        if (
          ['article', 'header', 'nav', 'aside', 'section', 'footer', 'form', 'main'].includes(pTag) ||
          pClass.includes('card') ||
          pClass.includes('box') ||
          pClass.includes('container') ||
          pClass.includes('modal') ||
          pClass.includes('studio') ||
          currentParent.id
        ) {
          parentTag = pTag;
          const pText = (currentParent.innerText || currentParent.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 45);
          parentSummary = pText ? `Khung chứa <${pTag}> "${pText}"` : `Khung chứa <${pTag}>`;
          parentSelector = currentParent.id
            ? `#${currentParent.id}`
            : `${pTag}${pClass ? '.' + pClass.split(' ').filter(Boolean)[0] : ''}`;
          break;
        }
        currentParent = currentParent.parentElement;
      }

      // Determine Source File Mapping accurately
      const fileSourceMap: Record<number, string> = {
        0: 'components/TopSelection.tsx',
        1: 'components/HeroToolSection.tsx',
        2: 'components/VoiceStoryStudio/VoiceStoryStudio.tsx',
        3: 'components/VideoToGifStudio/VideoToGifStudio.tsx',
        4: 'components/BackgroundRemoverStudio/BackgroundRemoverStudio.tsx',
        5: 'components/ImageToPromptStudio/ImageToPromptStudio.tsx',
        6: 'components/CodePenAnalyzer/CodePenAnalyzerStudio.tsx',
      };

      let filePath = fileSourceMap[currentPageId] || 'app/page.tsx';

      // Smart override based on DOM tree
      if (el.closest('header') || tag === 'header' || classNameStr.includes('header')) {
        filePath = 'components/Header.tsx';
      } else if (el.closest('footer') || tag === 'footer') {
        filePath = 'components/Footer.tsx';
      } else if (el.closest('#news-section') || classNameStr.includes('news')) {
        filePath = 'components/NewsSection.tsx';
      } else if (el.closest('.sidebar') || classNameStr.includes('sidebar')) {
        filePath = 'components/SidebarRight.tsx';
      }

      return {
        tag,
        id: el.id,
        className: classNameStr,
        innerTextSummary: summary,
        rect: {
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        suggestedSelector,
        parentTag,
        parentSummary,
        parentSelector,
        filePath,
        role: el.getAttribute('role') || tag,
        ariaLabel: el.getAttribute('aria-label') || '',
        pageId: currentPageId,
        pageName: currentPageName,
      };
    },
    [currentPageId, currentPageName]
  );

  // Toggle X-Ray Inspect Mode
  const toggleXRayMode = useCallback(() => {
    const next = !isActive;
    setIsActive(next);
    if (!next) {
      setHoveredRect(null);
      setHoveredLabel('');
      setHoveredParent('');
    } else {
      showToast('Chế độ X-Ray đã bật: Di chuột & bấm trực tiếp vào đối tượng bất kỳ để chọn');
    }
  }, [isActive, showToast]);

  // Listen to custom events from Header button so user can also toggle via UI
  useEffect(() => {
    const handleToggleEvent = () => toggleXRayMode();
    const handleOpenLibraryEvent = () => setIsLibraryOpen(true);

    window.addEventListener('toggle-xray-mode', handleToggleEvent);
    window.addEventListener('open-xray-library', handleOpenLibraryEvent);
    return () => {
      window.removeEventListener('toggle-xray-mode', handleToggleEvent);
      window.removeEventListener('open-xray-library', handleOpenLibraryEvent);
    };
  }, [toggleXRayMode]);

  // Click & hover handlers when X-Ray is Active
  useEffect(() => {
    if (!isActive) return;

    const handlePointerMove = (e: MouseEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!target) return;

      // Ignore X-Ray UI elements
      if (target.closest('#xray-ui-root')) {
        setHoveredRect(null);
        setHoveredLabel('');
        setHoveredParent('');
        return;
      }

      const rect = target.getBoundingClientRect();
      setHoveredRect({
        top: rect.top,
        left: rect.left,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });

      const tag = target.tagName.toLowerCase();
      const text = (target.innerText || '').trim().replace(/\s+/g, ' ').substring(0, 28);
      const cls = typeof target.className === 'string' ? target.className.split(' ').filter(Boolean)[0] : '';
      const selectorText = `<${tag}${cls ? '.' + cls : ''}>`;

      setHoveredLabel(`${selectorText} ${text ? '· "' + text + '"' : ''}`);

      const parent = target.parentElement;
      if (parent && parent !== document.body) {
        const pTag = parent.tagName.toLowerCase();
        setHoveredParent(`Bao bởi: <${pTag}>`);
      } else {
        setHoveredParent('');
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!target) return;

      // Ignore clicks on X-Ray UI itself
      if (target.closest('#xray-ui-root')) return;

      // Stop native events to prevent unintended navigation or button clicks during inspection
      e.preventDefault();
      e.stopPropagation();

      const info = inspectElement(target);
      setSelectedElement(info);
      setTargetDepth('element');
      setTargetObject(info.innerTextSummary);
      setTargetPage(currentPageName);
      setGeneratedPrompt(''); // Clear previous prompt to prompt user to regenerate

      // Turn off inspect crosshair and open editor popup
      setIsActive(false);
      setHoveredRect(null);
      setHoveredLabel('');
      setHoveredParent('');
      setIsEditorPopupOpen(true);
    };

    window.addEventListener('mousemove', handlePointerMove, true);
    window.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove, true);
      window.removeEventListener('click', handleClick, true);
    };
  }, [isActive, currentPageId, currentPageName, inspectElement]);

  // Global keyboard shortcut: Bật / Tắt chế độ X-Ray bằng phím X, nhấn Escape để hủy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (isEditorPopupOpen || isLibraryOpen) {
        if (e.key === 'Escape') {
          setIsEditorPopupOpen(false);
          setIsLibraryOpen(false);
        }
        return;
      }

      if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        toggleXRayMode();
      } else if (e.key === 'Escape' && isActive) {
        setIsActive(false);
        setHoveredRect(null);
        setHoveredLabel('');
        setHoveredParent('');
        showToast('Đã tắt chế độ X-Ray');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isEditorPopupOpen, isLibraryOpen, toggleXRayMode, showToast]);

  // Switch target depth option (element vs parent card vs main section)
  const handleSelectTargetDepth = (depth: 'element' | 'parent' | 'section') => {
    setTargetDepth(depth);
    if (!selectedElement) return;

    if (depth === 'element') {
      setTargetObject(selectedElement.innerTextSummary);
    } else if (depth === 'parent') {
      setTargetObject(selectedElement.parentSummary || `Khung chứa <${selectedElement.parentTag || 'div'}>`);
    } else if (depth === 'section') {
      setTargetObject(`Khu vực lớn ${targetPage} (${selectedElement.filePath || 'Component'})`);
    }
  };

  // Generate 1-line concise Vietnamese prompt
  const handleGeneratePrompt = useCallback(() => {
    const actionObj = ACTION_OPTIONS.find((a) => a.type === actionType);
    const actionText = actionObj ? actionObj.label : 'Chỉnh sửa';

    const pageScopeText =
      scope === 'element'
        ? 'Chỉ áp dụng cho đối tượng này'
        : scope === 'page'
        ? `Áp dụng trong toàn bộ ${targetPage}`
        : 'Áp dụng trên toàn website';

    const objName = targetObject.trim() || 'Đối tượng được chọn';
    const tagInfo = selectedElement?.tag ? ` (<${selectedElement.tag}>)` : '';
    const selectorInfo = selectedElement?.suggestedSelector ? ` [Selector: ${selectedElement.suggestedSelector}]` : '';
    const noteWithTheme = ensureLightDarkNote(actionCustomNote);
    const noteSegment = ` - ${noteWithTheme}`;

    const currentFilePath = selectedElement?.filePath || 'app/page.tsx';

    const singleLinePrompt = `[Trang: ${targetPage} | File: ${currentFilePath}] Tại ${targetPage}, với ${objName}${tagInfo}${selectorInfo}: ${actionText}${noteSegment} (Phạm vi: ${pageScopeText} | Giao diện: ${LIGHT_DARK_NOTE}).`;

    setGeneratedPrompt(singleLinePrompt);
    showToast('Đã sinh prompt tiếng Việt 1 dòng (kèm ghi chú Sáng & Tối)!');
    return singleLinePrompt;
  }, [targetPage, targetObject, selectedElement, actionType, actionCustomNote, scope, showToast]);

  // Copy Prompt to clipboard & auto-close popup per user request
  const handleCopyPrompt = (textToCopy?: string) => {
    const text = textToCopy || generatedPrompt || handleGeneratePrompt();
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Đã sao chép Prompt vào clipboard và tự động đóng popup!');
    } else {
      showToast('Sao chép thành công!');
    }
    setTimeout(() => {
      setIsEditorPopupOpen(false);
      setIsLibraryOpen(false);
    }, 350);
  };

  // Save Prompt to persistent templates library
  const handleSavePrompt = () => {
    const promptText = generatedPrompt || handleGeneratePrompt();
    if (!promptText) return;

    const actionObj = ACTION_OPTIONS.find((a) => a.type === actionType);
    const finalNote = ensureLightDarkNote(actionCustomNote || 'Cập nhật theo yêu cầu');

    const newTemplate: XRayPromptTemplate = {
      id: `template-${Date.now()}`,
      createdAt: Date.now(),
      pageName: targetPage,
      pageId: currentPageId,
      elementSummary: targetObject || 'Đối tượng được chọn',
      elementTag: selectedElement?.tag || 'div',
      elementClasses: selectedElement?.className || '',
      actionType,
      actionLabel: actionObj ? actionObj.label : 'Chỉnh sửa',
      scope,
      userInstruction: finalNote,
      generatedPrompt: promptText,
      category,
      tags: [selectedElement?.tag || 'element', actionType, scope, 'light-dark'],
    };

    const updated = addTemplate(newTemplate);
    setTemplates(updated);
    setActionCustomNote(finalNote);
    showToast('Đã lưu mẫu mới kèm ghi chú áp dụng giao diện Sáng & Tối!');
  };

  // Select a template from library to populate editor
  const handleSelectTemplateFromLibrary = (t: XRayPromptTemplate) => {
    setTargetPage(t.pageName);
    setTargetObject(t.elementSummary);
    setActionType(t.actionType);
    setActionCustomNote(t.userInstruction);
    setScope(t.scope);
    setCategory(t.category);
    setGeneratedPrompt(t.generatedPrompt);
    setIsEditorPopupOpen(true);
  };

  return (
    <div id="xray-ui-root" className={`${isDark ? 'dark' : ''} fixed inset-0 pointer-events-none z-[9999] select-none`}>
      {/* ========================================================================= */}
      {/* 1. NÚT NỔI X-RAY VÀ THÔNG BÁO BẬT KHI DI CHUỘT (PHÍM X)                     */}
      {/* ========================================================================= */}
      {isActive && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2 rounded-full bg-slate-950/95 text-white shadow-2xl border border-indigo-400 backdrop-blur-md flex items-center gap-3 animate-fadeIn pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold font-play">
            Đang bật X-Ray: Di chuột & nhấp vào đối tượng bất kỳ để chọn
          </span>
          <button
            type="button"
            onClick={toggleXRayMode}
            className="px-2.5 py-0.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black font-mono transition cursor-pointer shadow-xs active:scale-95"
            title="Bấm để tắt hoặc nhấn phím X"
          >
            Tắt (Phím X)
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. KHUNG VIỀN HIGHLIGHT & TOOLTIP KHI DI CHUỘT TRÊN GIAO DIỆN               */}
      {/* ========================================================================= */}
      {isActive && hoveredRect && (
        <>
          {/* Overlay Box phát sáng theo đối tượng đang di chuột */}
          <div
            className="fixed pointer-events-none z-[9998] transition-all duration-75 border-2 border-indigo-500 bg-indigo-500/15 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.55)]"
            style={{
              top: `${hoveredRect.top}px`,
              left: `${hoveredRect.left}px`,
              width: `${hoveredRect.width}px`,
              height: `${hoveredRect.height}px`,
            }}
          />

          {/* Nhãn tag & kích thước hiển thị ngay phía trên đối tượng */}
          <div
            className="fixed pointer-events-none z-[9999] px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[11px] font-mono font-bold shadow-2xl border border-indigo-400 flex items-center gap-2 whitespace-nowrap"
            style={{
              top: `${Math.max(8, hoveredRect.top - 32)}px`,
              left: `${Math.max(8, hoveredRect.left)}px`,
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-indigo-300 font-extrabold">{hoveredLabel || 'Đối tượng được chọn'}</span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-200 text-[10px]">
              {hoveredRect.width}×{hoveredRect.height}px
            </span>
            {hoveredParent && <span className="text-slate-400 text-[10px]">({hoveredParent})</span>}
            <span className="text-[9px] text-amber-300 font-sans font-semibold">· Nhấp để chọn</span>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. POPUP NHẬP YÊU CẦU CHỈNH SỬA & HIỂN THỊ CHI TIẾT ĐỐI TƯỢNG              */}
      {/* ========================================================================= */}
      {isEditorPopupOpen && (
        <div
          onClick={() => setIsEditorPopupOpen(false)}
          className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn pointer-events-auto select-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[16px] shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 max-h-[92vh] pointer-events-auto select-auto"
          >
            {/* Header Popup */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-lg font-black shadow-inner">
                  🎯
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-wide font-play flex items-center gap-2">
                    <span>X-Ray Inspector</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-indigo-100 font-mono font-bold">
                      Xác định 100% đối tượng
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-100/90 font-medium">
                    Tự động nhận diện HTML tag, CSS selector, parent container & file mã nguồn
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Xem thư viện mẫu đã lưu"
                >
                  <span>📚 Thư viện</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditorPopupOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center text-sm transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body Form */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-left font-play">
              {/* 1. THÔNG TIN TRANG & 2. ĐỐI TƯỢNG ĐÃ CHỌN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. THÔNG TIN TRANG */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <label className="text-[11px] font-black tracking-wide text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <WebIcon name="compass" className="w-3.5 h-3.5" />
                    <span>1. Trang vị trí:</span>
                  </label>
                  <input
                    type="text"
                    value={targetPage}
                    onChange={(e) => setTargetPage(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-black rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tên trang..."
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>ID: #{currentPageId}</span>
                    <span className="text-indigo-500 font-bold">{selectedElement?.filePath || 'components/Header.tsx'}</span>
                  </div>
                </div>

                {/* 2. ĐỐI TƯỢNG CHỈNH SỬA */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <label className="text-[11px] font-black tracking-wide text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <WebIcon name="target" className="w-3.5 h-3.5" />
                    <span>2. Mô tả đối tượng:</span>
                  </label>
                  <input
                    type="text"
                    value={targetObject}
                    onChange={(e) => setTargetObject(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-black rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Mô tả đối tượng..."
                  />
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>Tag:</span>
                    <code className="font-mono bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded font-bold">
                      &lt;{selectedElement?.tag || 'element'}&gt;
                    </code>
                    {selectedElement?.suggestedSelector && (
                      <span className="truncate max-w-[150px] font-mono text-slate-500">
                        {selectedElement.suggestedSelector}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* BỘ LỌC TỰ ĐỘNG CHỌN CẤP ĐỘ ĐỐI TƯỢNG (ELEMENT / PARENT CARD / SECTION) */}
              <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <WebIcon name="layers" className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Chọn cấp độ đối tượng chính xác:</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Bấm để tự động cập nhật tên đối tượng</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTargetDepth('element')}
                    className={`p-2 rounded-xl text-xs font-bold border transition text-left flex flex-col gap-0.5 cursor-pointer ${
                      targetDepth === 'element'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1 text-[11px]">
                      <span>🎯 Phần tử nhỏ</span>
                    </span>
                    <span className="text-[10px] opacity-80 truncate font-mono">
                      &lt;{selectedElement?.tag || 'element'}&gt; {selectedElement?.innerTextSummary.substring(0, 20)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTargetDepth('parent')}
                    className={`p-2 rounded-xl text-xs font-bold border transition text-left flex flex-col gap-0.5 cursor-pointer ${
                      targetDepth === 'parent'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1 text-[11px]">
                      <span>📦 Khung chứa (Card/Box)</span>
                    </span>
                    <span className="text-[10px] opacity-80 truncate font-mono">
                      &lt;{selectedElement?.parentTag || 'div'}&gt; {selectedElement?.parentSelector || 'Parent Container'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTargetDepth('section')}
                    className={`p-2 rounded-xl text-xs font-bold border transition text-left flex flex-col gap-0.5 cursor-pointer ${
                      targetDepth === 'section'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1 text-[11px]">
                      <span>🏛️ Toàn bộ khu vực</span>
                    </span>
                    <span className="text-[10px] opacity-80 truncate font-mono">
                      {selectedElement?.filePath || 'Component Section'}
                    </span>
                  </button>
                </div>
              </div>

              {/* KHUNG THÔNG TIN KỸ THUẬT CHI TIẾT CỦA ĐỐI TƯỢNG */}
              {selectedElement && (
                <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-sans font-bold border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <WebIcon name="file-text" className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Thông tin kỹ thuật xác thực:</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Exact Match
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">Thẻ HTML:</span>
                      <span className="font-black text-purple-600 dark:text-purple-400">&lt;{selectedElement.tag}&gt;</span>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">Selector CSS:</span>
                      <span className="font-black text-indigo-600 dark:text-indigo-400 truncate block">
                        {selectedElement.suggestedSelector || `<${selectedElement.tag}>`}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">Kích thước:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {selectedElement.rect.width}×{selectedElement.rect.height}px
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">File mã nguồn:</span>
                      <span className="font-black text-amber-600 dark:text-amber-400 truncate block">
                        {selectedElement.filePath}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. HÀNH ĐỘNG (ACTION TYPE) */}
              <div className="space-y-2">
                <label className="text-[11px] font-black tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <WebIcon name="bolt" className="w-3.5 h-3.5 text-amber-500" />
                  <span>3. Hành động yêu cầu:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {ACTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setActionType(opt.type)}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer ${
                        actionType === opt.type
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30 scale-[1.02] shadow-sm font-black'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 font-semibold'
                      }`}
                    >
                      <WebIcon name={opt.icon} className="w-4 h-4" />
                      <span className="text-[11px] leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>

                {/* Chi tiết yêu cầu hành động */}
                <textarea
                  rows={2}
                  value={actionCustomNote}
                  onChange={(e) => setActionCustomNote(e.target.value)}
                  placeholder={
                    ACTION_OPTIONS.find((a) => a.type === actionType)?.placeholder ||
                    'Nhập chi tiết yêu cầu chỉnh sửa...'
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold placeholder:text-slate-400"
                />

                {/* Ghi chú tự động khi thêm mới: Đều áp dụng cho cả giao diện Sáng & Tối */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <span>🌓 Ghi chú giao diện:</span>
                    <span className="font-extrabold">{LIGHT_DARK_NOTE}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActionCustomNote((prev) => ensureLightDarkNote(prev))}
                    className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-bold text-[10px] transition cursor-pointer"
                  >
                    + Đính kèm ngay
                  </button>
                </div>
              </div>

              {/* 4. PHẠM VI ÁP DỤNG & PHÂN LOẠI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Scope selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <WebIcon name="layers" className="w-3.5 h-3.5 text-teal-500" />
                    <span>4. Phạm vi áp dụng:</span>
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {[
                      {
                        value: 'element',
                        label: 'Chỉ đối tượng này',
                        desc: 'Không ảnh hưởng các thành phần khác',
                      },
                      {
                        value: 'page',
                        label: 'Toàn bộ trang hiện tại',
                        desc: `Áp dụng cho tất cả phần tử tương tự trên ${targetPage}`,
                      },
                      {
                        value: 'global',
                        label: 'Toàn bộ website',
                        desc: 'Đồng bộ trên toàn bộ hệ thống',
                      },
                    ].map((s) => (
                      <label
                        key={s.value}
                        onClick={() => setScope(s.value as 'element' | 'page' | 'global')}
                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          scope === s.value
                            ? 'bg-teal-50 dark:bg-teal-950/80 border-teal-500 text-teal-800 dark:text-teal-300 font-bold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="xray-scope"
                            checked={scope === s.value}
                            onChange={() => setScope(s.value as 'element' | 'page' | 'global')}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-xs">{s.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{s.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Phân loại danh mục */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <WebIcon name="card" className="w-3.5 h-3.5 text-blue-500" />
                    <span>Phân loại danh mục lưu trữ:</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as XRayCategory)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Giao diện">Giao diện (Màu sắc, Font chữ, Hiệu ứng)</option>
                    <option value="Nội dung">Nội dung (Văn bản, Thông số, Hình ảnh)</option>
                    <option value="Bố cục & Lưới">Bố cục & Lưới (Cột, Hàng, Co giãn)</option>
                    <option value="Tính năng">Tính năng (Popup, Nút bấm, Âm thanh)</option>
                    <option value="Tối ưu khác">Tối ưu khác (Hiệu suất, Responsive)</option>
                  </select>

                  <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 mt-2 text-xs text-indigo-900 dark:text-indigo-300 space-y-1">
                    <span className="font-extrabold block">Quy tắc sinh prompt:</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Prompt được sinh ra chuẩn <strong>1 câu tiếng Việt</strong> ghi rõ trang, file mã nguồn, HTML tag &amp; CSS selector chính xác, loại hành động và <strong>áp dụng đồng bộ cho cả giao diện Sáng &amp; Tối</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* NÚT TẠO PROMPT */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleGeneratePrompt}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs font-black shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <WebIcon name="sparkles" className="w-4 h-4" />
                  <span>Tạo Prompt 1 dòng xác định 100%</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyPrompt()}
                    disabled={!generatedPrompt}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      generatedPrompt
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <WebIcon name="card" className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePrompt}
                    disabled={!generatedPrompt}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      generatedPrompt
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <WebIcon name="bookmark" className="w-3.5 h-3.5" />
                    <span>Lưu mẫu</span>
                  </button>
                </div>
              </div>

              {/* KHUNG HIỂN THỊ PROMPT ĐÃ TẠO (1 DÒNG) */}
              {generatedPrompt && (
                <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50 dark:bg-slate-950 border-2 border-indigo-500/40 shadow-inner space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-black text-indigo-700 dark:text-indigo-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Kết quả Prompt hoàn chỉnh (1 dòng xác định đối tượng):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt()}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <span>Sao chép ngay →</span>
                    </button>
                  </div>
                  <p className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 select-all break-words leading-relaxed">
                    {generatedPrompt}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Popup */}
            <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <WebIcon name="shield" className="w-3.5 h-3.5 text-emerald-500" />
                <span>X-Ray Inspector chỉ sinh prompt mô tả, không tự ý sửa mã trực tiếp.</span>
              </span>

              <button
                type="button"
                onClick={() => setIsEditorPopupOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL THƯ VIỆN LƯU TRỮ MẪU PROMPT                                      */}
      {/* ========================================================================= */}
      <XRayLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        templates={templates}
        currentPageName={currentPageName}
        currentPageId={currentPageId}
        onSelectTemplate={handleSelectTemplateFromLibrary}
        onAddTemplate={(newTpl) => {
          const updated = addTemplate(newTpl);
          setTemplates(updated);
          showToast('Đã thêm ghi chú mới kèm áp dụng giao diện Sáng & Tối!');
        }}
        onDeleteTemplate={(id) => {
          const updated = deleteTemplate(id);
          setTemplates(updated);
          showToast('Đã xóa mẫu khỏi thư viện!');
        }}
        onUpdateTemplate={(id, partial) => {
          const updated = updateTemplate(id, partial);
          setTemplates(updated);
          showToast('Đã cập nhật mẫu thành công!');
        }}
        onCopyPrompt={handleCopyPrompt}
      />
    </div>
  );
};
