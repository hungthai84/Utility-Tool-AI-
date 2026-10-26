'use client';

import React, { useState } from 'react';
import { useTheme } from '@/components/ThemeContext';
import {
  FileText,
  Video,
  Image as ImageIcon,
  Terminal,
  CheckCircle2,
  Cloud,
  ChevronLeft,
  ChevronRight,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react';

export function SidebarRight() {
  const { user, isDark, setIsAuthModalOpen, setIsProjectsDrawerOpen, setActiveWizardTool } = useTheme();
  // Mặc định ẩn (thu gọn) thanh bên phải
  const [isExpanded, setIsExpanded] = useState(false);

  const sidebarRightIcons = [
    { name: 'Xử lý Code', background: '#8b5cf6', icon: <Terminal size={18} className="text-white" />, desc: 'Chuyển Code AI', toolKey: 'code' },
    { name: 'Nén Video', background: '#3b82f6', icon: <Video size={18} className="text-white" />, desc: 'Chuyển đổi Video', toolKey: 'video' },
    { name: 'Tối ưu Ảnh', background: '#10b981', icon: <ImageIcon size={18} className="text-white" />, desc: 'Xử lý hình ảnh', toolKey: 'image' },
    { name: 'Giọng nói AI', background: '#e14856', icon: <FileText size={18} className="text-white" />, desc: 'TTS Giọng đọc', toolKey: 'speech' },
  ];

  return (
    <div className="relative h-full flex items-center flex-shrink-0 z-30">
      {/* Nút Bung rộng / Thu gọn neo ở mép phải */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        title={isExpanded ? 'Thu gọn thanh bên phải' : 'Bung rộng thanh bên phải'}
        aria-label={isExpanded ? 'Thu gọn thanh bên phải' : 'Bung rộng thanh bên phải'}
        className={`group absolute ${
          isExpanded ? '-left-3.5' : 'right-0'
        } top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-7 h-16 rounded-[14px] border transition-all duration-300 cursor-pointer shadow-lg ${
          isDark
            ? 'bg-[#261e47]/95 hover:bg-indigo-600/90 border-white/15 text-slate-200 hover:text-white shadow-black/40'
            : 'bg-white/95 hover:bg-indigo-600 border-slate-200/90 text-slate-700 hover:text-white shadow-indigo-500/10'
        } ${isExpanded ? 'w-7 h-12' : 'w-7 h-16'}`}
      >
        {isExpanded ? (
          <ChevronRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        ) : (
          <ChevronLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
        )}
      </button>

      {/* Thanh công cụ bên phải */}
      <aside
        aria-hidden={!isExpanded}
        className={`h-full flex flex-col items-center justify-between transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded
            ? 'w-16 sm:w-20 py-6 border-l opacity-100'
            : 'w-0 py-6 border-l-0 opacity-0 pointer-events-none'
        } ${
          isDark ? 'bg-[#1a1433]/70 border-white/10' : 'bg-white/40 border-black/5'
        }`}
      >
        {/* Top group: Nút thu gọn nhanh + User Profile / Auth Modal trigger */}
        <div className="flex flex-col items-center space-y-3">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            title="Thu gọn thanh bên phải"
            className={`w-8 h-8 rounded-[14px] flex items-center justify-center transition-all cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white'
                : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-600 hover:text-slate-900'
            }`}
          >
            <PanelRightClose size={15} />
          </button>

          <div
            onClick={() => setIsAuthModalOpen(true)}
            title={user ? `Tài khoản: ${user.displayName || user.email}` : 'Đăng nhập Firebase Cloud'}
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full p-1 relative cursor-pointer group flex-shrink-0"
          >
            <div className="avatar-ring inset-0 absolute transition-transform duration-700 group-hover:rotate-180" />
            <div className="absolute inset-0 p-1">
              <img
                src={user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="flex flex-col space-y-3.5">
          {sidebarRightIcons.map(({ name, background, icon, desc, toolKey }) => (
            <button
              key={name}
              onClick={() => setActiveWizardTool(toolKey)}
              title={`${name} - ${desc}`}
              className="w-10 h-10 rounded-[14px] flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer text-base flex-shrink-0"
              style={{ backgroundColor: background }}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Cloud & Task Status */}
        <div className="flex flex-col space-y-3">
          <div
            onClick={() => setIsProjectsDrawerOpen(true)}
            title="Tiến trình xử lý Cloud: Hoàn thành"
            className="w-10 h-10 rounded-[14px] glass-card flex items-center justify-center relative cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all text-xs flex-shrink-0"
          >
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#1e1737] absolute top-0.5 right-0.5"></span>
          </div>

          <div
            onClick={() => setIsProjectsDrawerOpen(true)}
            title="Đồng bộ Cloud Firebase: Trực tuyến"
            className="w-10 h-10 rounded-[14px] glass-card flex items-center justify-center relative cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all text-xs flex-shrink-0"
          >
            <Cloud size={18} className="text-sky-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#1e1737] absolute top-0.5 right-0.5"></span>
          </div>
        </div>
      </aside>

      {/* Nút bung rộng phụ ở góc trên phải khi đang ẩn để dễ nhận biết hơn */}
      {!isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          title="Bung rộng thanh bên phải"
          className={`absolute top-5 right-2 z-40 w-8 h-8 rounded-[14px] border flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md ${
            isDark
              ? 'bg-[#261e47]/90 hover:bg-indigo-600 border-white/15 text-slate-300 hover:text-white'
              : 'bg-white/90 hover:bg-indigo-600 border-slate-200 text-slate-700 hover:text-white'
          }`}
        >
          <PanelRightOpen size={15} />
        </button>
      )}
    </div>
  );
}

