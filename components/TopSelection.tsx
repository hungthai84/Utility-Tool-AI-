'use client';

import React, { useState } from 'react';
import { useTheme } from '@/components/ThemeContext';
import {
  Boxes,
  FileText,
  Image as ImageIcon,
  Sliders,
  Code2,
  ArrowRight,
  Zap,
  Mic,
  Film,
  Scissors,
  ScanEye,
  Sparkles,
  Volume2,
  Play,
  CheckCircle2,
  Layers,
  Cpu,
  Maximize2,
} from 'lucide-react';
import { StudioShowcaseCards } from '@/components/Lucian/StudioShowcaseCards';


export function TopSelection() {
  const { isDark, searchQuery, setActiveWizardTool, setActiveNav } = useTheme();
  const [selectedCat, setSelectedCat] = useState(0);

  const topSelectionCategories = [
    'Tiện ích đề xuất',
    'Xử lý code & chuyển đổi',
    'Đồ họa & hình ảnh AI',
    'Giọng nói & âm thanh',
    'Video & media codec',
  ];

  const topSelectIcons = [
    <Boxes key="grid" size={16} />,
    <Code2 key="code" size={16} />,
    <ImageIcon key="media" size={16} />,
    <Sliders key="audio" size={16} />,
    <FileText key="video" size={16} />,
  ];

  const stackedStudioIcons = [
    {
      key: 'hub',
      label: 'Kho tiện ích',
      icon: <Boxes size={14} />,
      bg: 'from-indigo-500 to-purple-600',
      onClick: () => setSelectedCat(0),
    },
    {
      key: 'code',
      label: 'Xử lý code & chuyển đổi',
      icon: <Code2 size={14} />,
      bg: 'from-pink-500 to-rose-600',
      onClick: () => setSelectedCat(1),
    },
    {
      key: 'image_ai',
      label: 'Đồ họa & hình ảnh AI',
      icon: <ImageIcon size={14} />,
      bg: 'from-violet-500 to-indigo-600',
      onClick: () => setSelectedCat(2),
    },
    {
      key: 'voice',
      label: 'Giọng nói & Câu chuyện',
      icon: <Mic size={14} />,
      bg: 'from-purple-500 to-fuchsia-600',
      onClick: () => setActiveNav(2),
    },
    {
      key: 'gif',
      label: 'Video to GIF Studio',
      icon: <Film size={14} />,
      bg: 'from-cyan-500 to-blue-600',
      onClick: () => setActiveNav(3),
    },
    {
      key: 'bg_remove',
      label: 'Background Remover Studio',
      icon: <Scissors size={14} />,
      bg: 'from-rose-500 to-pink-600',
      onClick: () => setActiveNav(4),
    },
    {
      key: 'img_prompt',
      label: 'Image-to-Prompt Studio',
      icon: <ScanEye size={14} />,
      bg: 'from-emerald-500 to-teal-600',
      onClick: () => setActiveNav(5),
    },
    {
      key: 'codepen',
      label: 'CodePen Analyzer Studio',
      icon: <Code2 size={14} />,
      bg: 'from-amber-500 to-orange-600',
      onClick: () => setActiveNav(6),
    },
  ];

  const allTools = [
    {
      key: 'code',
      toolType: 'code',
      title: 'Trình chuyển đổi code & Anti-overflow',
      subTitle: 'Chuyển HTML/CSS/JS sang React 19, Next.js JSX, Tailwind v4',
      image: 'https://images.unsplash.com/photo-1544396821-4dd40b938ad3?w=500&q=80',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
      author: 'Dev Suite VN',
      usage: '142.5K sử dụng',
      stepBadge: 'Quy trình 3 bước',
      catIndex: 1,
      tags: [
        { text: 'Code Suite', color: '#d94b87' },
        { text: 'React 19', color: '#eb8052' },
      ],
    },
    {
      key: 'image',
      toolType: 'image',
      title: 'Tối ưu, tách nền & tạo ảnh AI',
      subTitle: 'Tạo ảnh từ văn bản, OCR trích xuất chữ và chuyển định dạng WebP',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
      author: 'AI Design Tool',
      usage: '168.4K sử dụng',
      stepBadge: 'Quy trình 3 bước',
      catIndex: 2,
      tags: [{ text: 'Tự động AI', color: '#6647bf' }],
    },
    {
      key: 'speech',
      toolType: 'speech',
      title: 'Chuyển văn bản thành giọng nói (TTS)',
      subTitle: 'Đa giọng đọc AI chuẩn tiếng Việt (Kore, Puck, Zephyr, Fenrir)',
      image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&q=80',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
      author: 'Voice AI Lab',
      usage: '98.2K sử dụng',
      stepBadge: 'Quy trình 3 bước',
      catIndex: 3,
      tags: [{ text: 'Audio AI', color: '#8b5cf6' }],
    },
    {
      key: 'video',
      toolType: 'video',
      title: 'Nén video 4K & tạo kịch bản Veo AI',
      subTitle: 'Tối ưu hóa Codec WebM/AV1, tạo Prompt kịch bản video AI',
      image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=500&q=80',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
      author: 'Media Lab VN',
      usage: '116.1K sử dụng',
      stepBadge: 'Quy trình 3 bước',
      catIndex: 4,
      tags: [{ text: 'Media Web', color: '#70b944' }],
    },
    {
      key: 'voice_story',
      toolType: 'voice_story',
      title: 'Voice & Story Studio - Kể chuyện AI',
      subTitle: 'Sáng tạo kịch bản, quản lý nhân vật, tổng hợp âm thanh đa giọng đọc',
      image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&q=80',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
      author: 'Voice AI Studio',
      usage: '210.5K sử dụng',
      stepBadge: 'Quy trình 7 bước',
      catIndex: 3,
      tags: [{ text: 'Voice Studio', color: '#a855f7' }],
    },
    {
      key: 'video_to_gif',
      toolType: 'video_to_gif',
      title: 'Video to GIF Studio — Chuyển Video thành GIF động',
      subTitle: 'Cắt đoạn Timeline, tối ưu bảng màu PaletteGen 256 màu, Dithering & Batch GIF',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
      author: 'Multimedia Engine',
      usage: '185.4K sử dụng',
      stepBadge: 'GIF89a LZW Studio',
      catIndex: 4,
      tags: [
        { text: 'GIF89a Engine', color: '#06b6d4' },
        { text: 'PaletteGen', color: '#8b5cf6' },
      ],
    },
    {
      key: 'background_remover',
      toolType: 'background_remover',
      title: 'Background Remover Studio — AI Remove Background',
      subTitle: 'Xóa nền ảnh AI, tinh chỉnh tóc/viền, cọ Mask, thay nền & xử lý hàng loạt ZIP',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
      author: 'AI Vision Studio',
      usage: '245.8K sử dụng',
      stepBadge: 'AI Alpha Matting',
      catIndex: 2,
      tags: [
        { text: 'AI Remove BG', color: '#ec4899' },
        { text: 'Batch ZIP', color: '#6366f1' },
      ],
    },
    {
      key: 'image_to_prompt',
      toolType: 'image_to_prompt',
      title: 'Image-to-Prompt Studio — AI Image Analysis & Prompt Generator',
      subTitle: 'Phân tích thị giác chuyên sâu, tạo 5 biến thể Prompt, Negative Prompt & Batch Export',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
      author: 'AI Prompt Lab',
      usage: '198.6K sử dụng',
      stepBadge: 'Vision AI Studio',
      catIndex: 2,
      tags: [
        { text: 'Gemini Vision', color: '#8b5cf6' },
        { text: 'Multi-Prompt', color: '#06b6d4' },
      ],
    },
    {
      key: 'codepen_analyzer',
      toolType: 'codepen_analyzer',
      title: 'CodePen Analyzer Studio — Dịch ngược & Xuất Code',
      subTitle: 'Phân tích URL CodePen, 21 mục UI/UX & Keyframe, tạo Master Prompt & React 19',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
      author: 'CodePen Reverse Suite',
      usage: '215.3K sử dụng',
      stepBadge: 'Reverse Engineer AI',
      catIndex: 1,
      tags: [
        { text: 'CodePen', color: '#f59e0b' },
        { text: 'React 19', color: '#10b981' },
      ],
    },
  ];

  const getToolTypeBadgeIcon = (toolType: string) => {
    switch (toolType) {
      case 'code':
        return <Code2 size={13} className="text-white" />;
      case 'image':
        return <ImageIcon size={13} className="text-white" />;
      case 'speech':
        return <Sliders size={13} className="text-white" />;
      case 'video':
        return <FileText size={13} className="text-white" />;
      case 'voice_story':
        return <Mic size={13} className="text-white" />;
      case 'video_to_gif':
        return <Film size={13} className="text-white" />;
      case 'background_remover':
        return <Scissors size={13} className="text-white" />;
      case 'image_to_prompt':
        return <ScanEye size={13} className="text-white" />;
      case 'codepen_analyzer':
        return <Code2 size={13} className="text-white" />;
      default:
        return <Sparkles size={13} className="text-white" />;
    }
  };

  // Filter tools based on category & search query
  const filteredTools = allTools.filter((tool) => {
    const matchesCat = selectedCat === 0 || tool.catIndex === selectedCat;
    const matchesSearch =
      !searchQuery ||
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.subTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="mt-4 pt-2">
      {/* Header with Stacked Overlapping Icon Group */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Kho tiện ích Step-by-step
          </h2>

          {/* Group các icon lại xếp chồng (Overlapping Icon Stack đồng bộ Sáng / Tối) */}
          <div
            className={`flex items-center -space-x-2.5 px-2.5 py-1 rounded-full border backdrop-blur-md transition-all ${
              isDark
                ? 'bg-white/5 border-white/10 shadow-inner'
                : 'bg-white/85 border-slate-200/90 shadow-sm'
            }`}
            title="Nhóm công cụ & AI Studio tích hợp"
          >
            {stackedStudioIcons.map((item, idx) => (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                title={item.label}
                style={{ zIndex: stackedStudioIcons.length - idx }}
                className={`w-7 h-7 rounded-full bg-gradient-to-tr ${item.bg} text-white flex items-center justify-center ring-2 transition-all duration-200 hover:scale-110 hover:z-20 cursor-pointer shadow-sm ${
                  isDark ? 'ring-[#1e1737]' : 'ring-white'
                }`}
              >
                {item.icon}
              </button>
            ))}
            <span
              className={`pl-3.5 pr-1 text-[10px] font-bold whitespace-nowrap ${
                isDark ? 'text-indigo-200' : 'text-indigo-700'
              }`}
            >
              +{allTools.length} Studio
            </span>
          </div>
        </div>

        <div className="glass-badge flex items-center space-x-2 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md shadow-emerald-600/20">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          <span>Sẵn sàng sử dụng</span>
        </div>
      </div>

      {/* Bộ Thẻ Studio Chuyên Sâu Tương Ứng Với Demo Trực Quan (Lucian UX/UI #050 Spotlight Tilt) */}
      <StudioShowcaseCards />

      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Category List */}
        <div className="w-full lg:w-56 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 flex-shrink-0">
          {/* Khối xếp chồng các icon danh mục nhanh (Overlapping Category Icon Stack) */}
          <div
            className={`hidden lg:flex items-center justify-between px-3 py-2 rounded-[14px] border mb-1 ${
              isDark
                ? 'bg-white/5 border-white/10 text-slate-300'
                : 'bg-slate-100/90 border-slate-200/80 text-slate-700'
            }`}
          >
            <div className="flex items-center -space-x-2">
              {topSelectIcons.map((icon, idx) => {
                const active = selectedCat === idx;
                return (
                  <button
                    key={topSelectionCategories[idx]}
                    type="button"
                    onClick={() => setSelectedCat(idx)}
                    title={topSelectionCategories[idx]}
                    style={{ zIndex: active ? 20 : topSelectIcons.length - idx }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center ring-2 transition-all duration-200 hover:scale-110 hover:z-30 cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white shadow-md scale-105'
                        : isDark
                        ? 'bg-[#2a214a] text-slate-300 hover:bg-indigo-500/40 hover:text-white'
                        : 'bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                    } ${isDark ? 'ring-[#1e1737]' : 'ring-white'}`}
                  >
                    {icon}
                  </button>
                );
              })}
            </div>
            <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {filteredTools.length} công cụ
            </span>
          </div>

          {topSelectionCategories.map((category, idx) => {
            const isActive = selectedCat === idx;
            return (
              <button
                key={category}
                onClick={() => setSelectedCat(idx)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-[14px] text-xs font-bold transition-all duration-200 text-left cursor-pointer border glass-badge flex-shrink-0 ${
                  isActive
                    ? isDark
                      ? 'bg-indigo-500/25 text-indigo-300 border-indigo-500/40 shadow-sm'
                      : 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : isDark
                    ? 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                    : 'text-slate-700 border-slate-200 hover:text-slate-950 hover:bg-black/5 font-semibold'
                }`}
              >
                {topSelectIcons[idx]}
                <span className="truncate">{category}</span>
              </button>
            );
          })}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 w-full">
          {filteredTools.map((item) => (
            <div
              key={item.key}
              onClick={() => {
                if (item.toolType === 'voice_story') {
                  setActiveNav(2);
                } else if (item.toolType === 'video_to_gif') {
                  setActiveNav(3);
                } else if (item.toolType === 'background_remover') {
                  setActiveNav(4);
                } else if (item.toolType === 'image_to_prompt') {
                  setActiveNav(5);
                } else if (item.toolType === 'codepen_analyzer') {
                  setActiveNav(6);
                } else {
                  setActiveWizardTool(item.toolType);
                }
              }}
              className="glass-card rounded-[14px] p-3 cursor-pointer group hover:scale-[1.02] transition-transform"
            >
              <div className="overflow-hidden rounded-[14px] relative mb-3">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-28 object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute top-2 right-2 glass-badge bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Zap size={10} className="text-amber-300" />
                  <span>{item.usage}</span>
                </div>

                <div className="absolute bottom-2 left-2 glass-badge bg-indigo-950/80 text-indigo-200 text-[9px] font-semibold px-2 py-0.5 rounded-md">
                  {item.stepBadge}
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="px-3.5 py-1.5 rounded-full glass-badge bg-white/30 text-white flex items-center space-x-1.5 text-xs font-bold shadow-xl hover:scale-105 transition-transform">
                    <span>Bắt đầu</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                {/* Group các icon & avatar xếp chồng (Overlapping Avatar + Tool Icon Stack) */}
                <div className="flex items-center -space-x-3 flex-shrink-0">
                  <img
                    src={item.avatar}
                    alt={item.author}
                    className={`w-9 h-9 rounded-full object-cover ring-2 relative z-10 transition-transform duration-200 group-hover:-translate-x-0.5 ${
                      isDark ? 'ring-[#1e1737]' : 'ring-white'
                    }`}
                  />
                  <div
                    className={`w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center ring-2 relative z-20 shadow-md transition-transform duration-200 group-hover:translate-x-0.5 ${
                      isDark ? 'ring-[#1e1737]' : 'ring-white'
                    }`}
                    title={item.author}
                  >
                    {getToolTypeBadgeIcon(item.toolType)}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs font-bold truncate group-hover:text-indigo-500 transition-colors ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                    {item.subTitle}
                  </div>
                  <div className="flex space-x-1 mt-1.5">
                    {item.tags.map(({ text, color }) => (
                      <span
                        key={text}
                        className="glass-badge text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: color }}
                      >
                        {text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
