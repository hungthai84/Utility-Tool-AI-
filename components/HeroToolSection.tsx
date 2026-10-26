'use client';

import React from 'react';
import { useTheme } from '@/components/ThemeContext';
import { Zap, FolderUp } from 'lucide-react';

export function HeroToolSection() {
  const { isDark, setActiveWizardTool } = useTheme();

  return (
    <div className="relative flex-[1.4] min-w-0">
      <div className="glass-card rounded-[14px] p-2.5 transition-all duration-300">
        <div
          onClick={() => setActiveWizardTool('image')}
          className="relative rounded-[14px] overflow-hidden group cursor-pointer"
        >
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80"
            alt="Tiện ích nổi bật"
            className="w-full h-[230px] object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Step-by-step glass badge */}
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <span className="glass-badge bg-indigo-600/85 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Step-by-step Flow</span>
            </span>
            <span className="glass-badge bg-black/50 text-slate-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
              <Zap size={13} className="text-amber-300" />
              <span>3 bước hoàn thành</span>
            </span>
          </div>

          {/* Title overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4">
            <span className="text-white text-lg font-bold line-clamp-1 group-hover:text-indigo-300 transition-colors">
              Bộ xử lý đa năng: Tạo ảnh, Chuyển code, Giọng nói & Video AI
            </span>
            <div className="flex items-center space-x-3 text-slate-300 text-xs mt-1">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1"></span>
                <span>Sẵn sàng kết nối Firebase Cloud</span>
              </span>
              <span>•</span>
              <span>Kéo thả tệp hoặc chọn quy trình mẫu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Widget PiP */}
      <div className="absolute -left-3 -bottom-5 z-20 hidden sm:block">
        <div
          onClick={() => setActiveWizardTool('code')}
          className="relative cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="ping-outer" />
          <div
            className={`glass-card rounded-[14px] p-2 shadow-2xl flex items-center space-x-3 w-44 ${
              isDark ? 'bg-[#1e1737]/95' : 'bg-white/95'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <FolderUp size={20} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Thả tệp xử lý
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold truncate">
                Bắt đầu Bước 1/3
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
