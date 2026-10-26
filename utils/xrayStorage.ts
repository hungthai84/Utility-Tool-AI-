import { XRayPromptTemplate } from '@/types/xray';

const STORAGE_KEY = 'utility_hub_xray_prompt_templates_v1';

export const LIGHT_DARK_NOTE = 'Đều áp dụng đồng bộ cho cả giao diện Sáng và Tối';

export function ensureLightDarkNote(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return LIGHT_DARK_NOTE;
  const lower = trimmed.toLowerCase();
  if (lower.includes('giao diện sáng và tối') || lower.includes('sáng và tối') || lower.includes('light & dark')) {
    return trimmed;
  }
  return `${trimmed} (${LIGHT_DARK_NOTE})`;
}

export const DEFAULT_TEMPLATES: XRayPromptTemplate[] = [
  {
    id: 'default-xray-1',
    createdAt: 1730000000000,
    pageName: 'Kho tiện ích',
    pageId: 0,
    elementSummary: 'Thẻ nội dung (Card) Kho tiện ích Step-by-step',
    elementTag: 'div',
    elementClasses: 'glass-card rounded-3xl p-3',
    actionType: 'restyle',
    actionLabel: 'Kiểu dáng',
    scope: 'page',
    userInstruction:
      'Thêm hiệu ứng viền phát sáng nhẹ màu tím indigo khi di chuột vào thẻ và bo góc mềm mại hơn (Đều áp dụng đồng bộ cho cả giao diện Sáng và Tối)',
    generatedPrompt:
      '[Trang: Kho tiện ích | File: components/TopSelection.tsx] Tại Kho tiện ích, với Thẻ nội dung (Card) Kho tiện ích Step-by-step (<div>): Kiểu dáng - Thêm hiệu ứng viền phát sáng nhẹ màu tím indigo khi di chuột vào thẻ và bo góc mềm mại hơn (Ghi chú: Đều áp dụng đồng bộ cho cả giao diện Sáng và Tối | Phạm vi: Áp dụng trong toàn bộ Kho tiện ích).',
    category: 'Giao diện',
    tags: ['div', 'restyle', 'page', 'light-dark'],
  },
  {
    id: 'default-xray-2',
    createdAt: 1730000100000,
    pageName: 'Giọng nói & Câu chuyện',
    pageId: 2,
    elementSummary: 'Khối cấu hình giọng đọc nhân vật',
    elementTag: 'section',
    elementClasses: 'glass-card rounded-2xl p-4',
    actionType: 'optimize',
    actionLabel: 'Bố cục',
    scope: 'element',
    userInstruction:
      'Tối ưu khoảng cách lưới 2 cột trên màn hình tablet và chống tràn chữ tên nhân vật dài (Đều áp dụng đồng bộ cho cả giao diện Sáng và Tối)',
    generatedPrompt:
      '[Trang: Giọng nói & Câu chuyện | File: components/VoiceStoryStudio/VoiceStoryStudio.tsx] Tại Giọng nói & Câu chuyện, với Khối cấu hình giọng đọc nhân vật (<section>): Bố cục - Tối ưu khoảng cách lưới 2 cột trên màn hình tablet và chống tràn chữ tên nhân vật dài (Ghi chú: Đều áp dụng đồng bộ cho cả giao diện Sáng và Tối | Phạm vi: Chỉ áp dụng cho đối tượng này).',
    category: 'Bố cục & Lưới',
    tags: ['section', 'optimize', 'element', 'light-dark'],
  },
  {
    id: 'default-xray-3',
    createdAt: 1730000200000,
    pageName: 'Quy trình Step-by-Step',
    pageId: 1,
    elementSummary: 'Nút bấm "Mở công cụ ngay"',
    elementTag: 'button',
    elementClasses: 'px-4 py-2 rounded-full',
    actionType: 'add',
    actionLabel: 'Bổ sung',
    scope: 'global',
    userInstruction:
      'Thêm hiệu ứng chuyển động icon mũi tên dịch sang phải 4px khi hover trên toàn bộ nút CTA (Đều áp dụng đồng bộ cho cả giao diện Sáng và Tối)',
    generatedPrompt:
      '[Trang: Quy trình Step-by-Step | File: components/HeroToolSection.tsx] Tại Quy trình Step-by-Step, với Nút bấm "Mở công cụ ngay" (<button>): Bổ sung - Thêm hiệu ứng chuyển động icon mũi tên dịch sang phải 4px khi hover trên toàn bộ nút CTA (Ghi chú: Đều áp dụng đồng bộ cho cả giao diện Sáng và Tối | Phạm vi: Áp dụng trên toàn website).',
    category: 'Tính năng',
    tags: ['button', 'add', 'global', 'light-dark'],
  },
];

export function loadSavedTemplates(): XRayPromptTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
      return DEFAULT_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveTemplates(templates: XRayPromptTemplate[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save X-Ray templates:', err);
  }
}

export function addTemplate(newTemplate: XRayPromptTemplate): XRayPromptTemplate[] {
  const current = loadSavedTemplates();
  const normalizedTemplate: XRayPromptTemplate = {
    ...newTemplate,
    userInstruction: ensureLightDarkNote(newTemplate.userInstruction),
    generatedPrompt: ensureLightDarkNote(newTemplate.generatedPrompt),
    tags: Array.from(new Set([...(newTemplate.tags || []), 'light-dark'])),
  };
  const updated = [normalizedTemplate, ...current];
  saveTemplates(updated);
  return updated;
}

export function deleteTemplate(id: string): XRayPromptTemplate[] {
  const current = loadSavedTemplates();
  const updated = current.filter((t) => t.id !== id);
  saveTemplates(updated);
  return updated;
}

export function updateTemplate(
  id: string,
  partial: Partial<XRayPromptTemplate>
): XRayPromptTemplate[] {
  const current = loadSavedTemplates();
  const updated = current.map((t) => (t.id === id ? { ...t, ...partial } : t));
  saveTemplates(updated);
  return updated;
}

