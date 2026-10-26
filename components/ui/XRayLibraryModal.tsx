'use client';

import React, { useState, useMemo } from 'react';
import { XRayPromptTemplate, XRayCategory } from '@/types/xray';
import { WebIcon } from '@/components/ui/WebIcon';
import { LIGHT_DARK_NOTE, ensureLightDarkNote } from '@/utils/xrayStorage';

interface XRayLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: XRayPromptTemplate[];
  currentPageName?: string;
  currentPageId?: number;
  onSelectTemplate: (t: XRayPromptTemplate) => void;
  onAddTemplate?: (t: XRayPromptTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onUpdateTemplate: (id: string, partial: Partial<XRayPromptTemplate>) => void;
  onCopyPrompt: (promptText: string) => void;
}

export const XRayLibraryModal: React.FC<XRayLibraryModalProps> = ({
  isOpen,
  onClose,
  templates,
  currentPageName = 'Kho tiện ích',
  currentPageId = 0,
  onSelectTemplate,
  onAddTemplate,
  onDeleteTemplate,
  onUpdateTemplate,
  onCopyPrompt,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState('');

  // State cho form Thêm mới ghi chú trực tiếp trong thư viện
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newElementSummary, setNewElementSummary] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [newCategory, setNewCategory] = useState<XRayCategory>('Giao diện');

  const categories = ['all', 'Giao diện', 'Nội dung', 'Bố cục & Lưới', 'Tính năng', 'Tối ưu khác'];

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchCat = selectedCategory === 'all' || t.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.pageName.toLowerCase().includes(q) ||
        t.elementSummary.toLowerCase().includes(q) ||
        t.userInstruction.toLowerCase().includes(q) ||
        t.generatedPrompt.toLowerCase().includes(q) ||
        t.actionLabel.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [templates, selectedCategory, search]);

  if (!isOpen) return null;

  const startEdit = (t: XRayPromptTemplate) => {
    setEditingId(t.id);
    setEditInstruction(t.userInstruction);
  };

  const saveEdit = (t: XRayPromptTemplate) => {
    if (!editInstruction.trim()) return;
    const scopeLabel =
      t.scope === 'element'
        ? 'Chỉ áp dụng cho đối tượng này'
        : t.scope === 'page'
        ? 'Áp dụng trong toàn bộ trang này'
        : 'Áp dụng trên toàn website';

    const finalNote = ensureLightDarkNote(editInstruction);
    const newPrompt = `Tại ${t.pageName}, với ${t.elementSummary} (<${t.elementTag}>): ${t.actionLabel} - ${finalNote} (Phạm vi: ${scopeLabel} | Giao diện: ${LIGHT_DARK_NOTE}).`;

    onUpdateTemplate(t.id, {
      userInstruction: finalNote,
      generatedPrompt: newPrompt,
    });
    setEditingId(null);
  };

  const handleCreateNewNote = () => {
    if (!newInstruction.trim() || !onAddTemplate) return;
    const objSummary = newElementSummary.trim() || 'Thành phần giao diện';
    const finalNote = ensureLightDarkNote(newInstruction);
    const promptText = `[Trang: ${currentPageName}] Tại ${currentPageName}, với ${objSummary} (<div>): Kiểu dáng - ${finalNote} (Phạm vi: Áp dụng trong toàn bộ ${currentPageName} | Giao diện: ${LIGHT_DARK_NOTE}).`;

    const created: XRayPromptTemplate = {
      id: `template-${Date.now()}`,
      createdAt: Date.now(),
      pageName: currentPageName,
      pageId: currentPageId,
      elementSummary: objSummary,
      elementTag: 'div',
      elementClasses: '',
      actionType: 'restyle',
      actionLabel: 'Kiểu dáng',
      scope: 'page',
      userInstruction: finalNote,
      generatedPrompt: promptText,
      category: newCategory,
      tags: ['div', 'restyle', 'page', 'light-dark'],
    };

    onAddTemplate(created);
    setNewElementSummary('');
    setNewInstruction('');
    setIsAddingNew(false);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn pointer-events-auto select-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[88vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[14px] shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 pointer-events-auto select-auto"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-lg font-black shadow-inner">
              📚
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-wide font-play">
                Thư viện lưu trữ mẫu X-Ray Prompt
              </h3>
              <p className="text-xs text-indigo-100/90 font-medium">
                Quản lý, tìm kiếm, tái sử dụng các mẫu yêu cầu chỉnh sửa đã lưu ({templates.length} mẫu)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAddTemplate && (
              <button
                type="button"
                onClick={() => setIsAddingNew((prev) => !prev)}
                className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/25"
              >
                <span>{isAddingNew ? 'Đóng thêm mới' : '+ Thêm ghi chú mới'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center text-sm transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form Thêm mới ghi chú (Tự động đính kèm ghi chú áp dụng giao diện Sáng & Tối) */}
        {isAddingNew && (
          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/35 border-b border-indigo-200/80 dark:border-indigo-800/60 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                ✨ Thêm mới ghi chú chỉnh sửa (Mặc định: {LIGHT_DARK_NOTE})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300/60">
                🌓 Tự động áp dụng Sáng &amp; Tối
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newElementSummary}
                onChange={(e) => setNewElementSummary(e.target.value)}
                placeholder="Đối tượng (VD: Thẻ Card, Nút bấm...)"
                className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={newInstruction}
                onChange={(e) => setNewInstruction(e.target.value)}
                placeholder="Nhập nội dung ghi chú yêu cầu..."
                className="sm:col-span-2 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as XRayCategory)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                <option value="Giao diện">Giao diện</option>
                <option value="Nội dung">Nội dung</option>
                <option value="Bố cục & Lưới">Bố cục &amp; Lưới</option>
                <option value="Tính năng">Tính năng</option>
                <option value="Tối ưu khác">Tối ưu khác</option>
              </select>
              <button
                type="button"
                onClick={handleCreateNewNote}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition cursor-pointer shadow-sm"
              >
                Lưu ghi chú mới (Áp dụng Sáng &amp; Tối)
              </button>
            </div>
          </div>
        )}

        {/* Toolbar: Search & Categories */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Search box */}
          <div className="relative flex-1">
            <WebIcon
              name="search"
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo trang, đối tượng, hành động hoặc nội dung..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat === 'all' ? `Tất cả (${templates.length})` : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {filtered.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center text-slate-400">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl mb-2">
                🔍
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 font-play">
                Không tìm thấy mẫu phù hợp
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Hãy thử tìm kiếm với từ khóa khác hoặc dùng công cụ X-Ray để chọn đối tượng và nhấn &quot;Lưu mẫu&quot;.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isEditing = editingId === item.id;
              const dateStr = new Date(item.createdAt).toLocaleString('vi-VN', {
                dateStyle: 'short',
                timeStyle: 'short',
              });

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all flex flex-col gap-3 group text-left"
                >
                  {/* Top info row */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
                        {item.pageName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/50">
                        {item.actionLabel}
                      </span>
                      <span className="text-[10px] text-slate-400">{dateStr}</span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => onCopyPrompt(item.generatedPrompt)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1 cursor-pointer"
                        title="Sao chép câu Prompt"
                      >
                        <WebIcon name="card" className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectTemplate(item);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1 cursor-pointer"
                        title="Tải lại vào popup chỉnh sửa"
                      >
                        <WebIcon name="bolt" className="w-3.5 h-3.5" />
                        <span>Nạp</span>
                      </button>

                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => saveEdit(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
                        >
                          Lưu
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Sửa nội dung yêu cầu"
                        >
                          Sửa
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteTemplate(item.id)}
                        className="px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                        title="Xóa mẫu này"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  {/* Element & Instruction */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">
                        {item.elementSummary}
                      </span>
                      <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        &lt;{item.elementTag}&gt;
                      </code>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={editInstruction}
                          onChange={(e) => setEditInstruction(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-xs rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {item.userInstruction}
                      </p>
                    )}
                  </div>

                  {/* One-line Prompt Preview box */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200 select-all break-words leading-relaxed">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold select-none mr-1.5">
                      Prompt 1 dòng:
                    </span>
                    {item.generatedPrompt}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500">
          <span>Dữ liệu lưu bền vững trong LocalStorage của trình duyệt.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition cursor-pointer"
          >
            Đóng thư viện
          </button>
        </div>
      </div>
    </div>
  );
};
