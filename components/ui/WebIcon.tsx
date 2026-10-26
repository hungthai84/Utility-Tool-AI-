'use client';

import React from 'react';
import {
  Search,
  Copy,
  Zap,
  Palette,
  FileText,
  Layers,
  Sparkles,
  Trash2,
  Compass,
  Target,
  Bookmark,
  ShieldCheck,
  Box,
} from 'lucide-react';

export interface WebIconProps {
  name: string;
  className?: string;
}

export const WebIcon: React.FC<WebIconProps> = ({ name, className = 'w-4 h-4' }) => {
  switch (name) {
    case 'search':
      return <Search className={className} />;
    case 'card':
      return <Copy className={className} />;
    case 'bolt':
      return <Zap className={className} />;
    case 'palette':
      return <Palette className={className} />;
    case 'file-text':
      return <FileText className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'trash':
      return <Trash2 className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'target':
      return <Target className={className} />;
    case 'bookmark':
      return <Bookmark className={className} />;
    case 'shield':
      return <ShieldCheck className={className} />;
    default:
      return <Box className={className} />;
  }
};
