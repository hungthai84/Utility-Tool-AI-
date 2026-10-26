export type XRayActionType = 'modify' | 'delete' | 'add' | 'restyle' | 'optimize';

export type XRayScope = 'element' | 'page' | 'global';

export type XRayCategory =
  | 'Giao diện'
  | 'Nội dung'
  | 'Bố cục & Lưới'
  | 'Tính năng'
  | 'Tối ưu khác';

export interface XRaySelectedElementInfo {
  tag: string;
  id: string;
  className: string;
  innerTextSummary: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  suggestedSelector: string;
  parentTag?: string;
  parentSummary?: string;
  parentSelector?: string;
  role?: string;
  ariaLabel?: string;
  filePath?: string;
  pageId: number;
  pageName: string;
}

export interface XRayPromptTemplate {
  id: string;
  createdAt: number;
  pageName: string;
  pageId: number;
  elementSummary: string;
  elementTag: string;
  elementClasses: string;
  actionType: XRayActionType;
  actionLabel: string;
  scope: XRayScope;
  userInstruction: string;
  generatedPrompt: string;
  category: XRayCategory;
  tags: string[];
}
