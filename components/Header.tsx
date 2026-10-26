'use client';

import React from 'react';
import { useTheme } from '@/components/ThemeContext';
import { Search, Bell, Sparkles, Wifi, WifiOff, Crosshair, BookOpen } from 'lucide-react';

export function Header() {
  const {
    isDark,
    isOnline,
    activeNav,
    searchQuery,
    setSearchQuery,
    setIsAssistantOpen,
  } = useTheme();

  // Tại trang Giọng nói & Câu chuyện (activeNav === 2), xóa <header> và chuyển các nội dung qua Sidebar
  if (activeNav === 2) {
    return null;
  }

  return (
    <header className="h-20 flex items-center justify-between border-b border-white/10 pr-4 flex-shrink-0 gap-4">
      {/* Brand Title */}
      <div className="flex items-center space-x-3">
        <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
          Utility Hub
        </span>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border glass-badge hidden sm:inline-block ${
            isDark ? 'bg-purple-900/30 text-purple-300 border-purple-500/30' : 'bg-purple-100/80 text-purple-700 border-purple-200'
          }`}
        >
          Tiện ích Step Flow
        </span>

        {/* Network Status Badge */}
        <div
          title={isOnline ? 'Đã kết nối mạng & Cloud Firebase' : 'Chế độ Ngoại tuyến (Offline Mode)'}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}
        >
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden md:inline">{isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative flex-1 max-w-xs sm:max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm tiện ích: Nén ảnh, chuyển PDF, Code, Giọng nói..."
          className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full outline-none transition-all duration-300 backdrop-blur-md border shadow-sm ${
            isDark
              ? 'bg-white/5 border-white/10 text-white placeholder-slate-400 focus:bg-white/10 focus:border-indigo-400'
              : 'bg-black/5 border-black/10 text-slate-800 placeholder-slate-500 focus:bg-white focus:border-indigo-500'
          }`}
        />
        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Search size={16} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* X-Ray Inspector Trigger */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-xray-mode'))}
          title="Bật/Tắt chế độ X-Ray chọn phần tử & tạo Prompt 1 dòng (Phím tắt: X)"
          className={`h-9 px-3 rounded-full flex items-center space-x-1.5 border transition-colors cursor-pointer text-xs font-bold ${
            isDark
              ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 hover:text-white'
              : 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <Crosshair size={15} />
          <span className="hidden lg:inline">X-Ray (Phím X)</span>
        </button>

        {/* X-Ray Library Trigger */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-xray-library'))}
          title="Mở thư viện lưu trữ mẫu X-Ray Prompt"
          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
            isDark ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/10' : 'border-black/10 text-slate-600 hover:text-slate-900 hover:bg-black/5'
          }`}
        >
          <BookOpen size={16} />
        </button>

        {/* Notifications */}
        <button
          onClick={() => alert('Thông báo: Tất cả hệ thống AI (Hình ảnh, Video, Giọng nói, Code, Firebase, X-Ray Prompt) đều đang hoạt động 100% bình thường!')}
          title="Thông báo tiện ích mới"
          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
            isDark ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/10' : 'border-black/10 text-slate-600 hover:text-slate-900 hover:bg-black/5'
          }`}
        >
          <Bell size={16} />
        </button>

        {/* AI Assistant Drawer Trigger */}
        <button
          onClick={() => setIsAssistantOpen(true)}
          title="Mở Trợ lý AI Tiện ích"
          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer relative ${
            isDark ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/10' : 'border-black/10 text-slate-600 hover:text-slate-900 hover:bg-black/5'
          }`}
        >
          <Sparkles size={16} className={isDark ? 'text-purple-300' : 'text-purple-600'} />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5"></span>
        </button>
      </div>
    </header>
  );
}
