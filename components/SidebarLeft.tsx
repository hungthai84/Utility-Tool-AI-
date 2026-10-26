'use client';

import React, { useState } from 'react';
import { useTheme, ThemeType } from '@/components/ThemeContext';
import {
  Wrench,
  Boxes,
  Mic,
  Film,
  Scissors,
  ScanEye,
  Palette,
  Search,
  Crosshair,
  BookOpen,
  Bell,
  Sparkles,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  X,
} from 'lucide-react';

export function SidebarLeft() {
  const {
    activeNav,
    setActiveNav,
    isDark,
    theme,
    setTheme,
    isOnline,
    searchQuery,
    setSearchQuery,
    setIsAssistantOpen,
  } = useTheme();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const [systemNoticeOpen, setSystemNoticeOpen] = useState(false);

  const menuItems = [
    { navId: 0, label: 'Kho tiện ích', icon: <Boxes size={20} /> },
    { navId: 2, label: 'Giọng nói & Câu chuyện', icon: <Mic size={20} /> },
    { navId: 3, label: 'Video to GIF Studio', icon: <Film size={20} /> },
    { navId: 4, label: 'Background Remover Studio', icon: <Scissors size={20} /> },
    { navId: 5, label: 'Image-to-Prompt Studio', icon: <ScanEye size={20} /> },
  ];

  const themeOptions: { id: ThemeType; name: string }[] = [
    { id: 'dark', name: 'Dark Glass (Đêm)' },
    { id: 'light', name: 'Light Glass (Sáng)' },
    { id: 'cyber', name: 'Cyber Neon (Cyberpunk)' },
    { id: 'clay', name: 'Soft Clay (Gốm Mềm)' },
    { id: 'emerald', name: 'Emerald Forest (Bích Ngọc)' },
  ];

  const iconBtnClass = isDark
    ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/15'
    : 'bg-white/85 border-slate-200/90 text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 shadow-sm';

  return (
    <aside
      className={`w-20 sm:w-24 h-full flex flex-col items-center py-4 justify-between transition-colors duration-300 relative border-r flex-shrink-0 z-30 ${
        isDark
          ? 'bg-[#251d42]/75 border-white/10 text-white'
          : 'bg-white/75 border-slate-200/80 text-slate-900 shadow-sm'
      }`}
    >
      {/* Top Group: Brand Logo + Online Status Badge */}
      <div className="flex flex-col items-center gap-2">
        <div
          onClick={() => setActiveNav(0)}
          title="Utility Hub - Tiện ích Step Flow"
          className="w-11 h-11 rounded-[14px] flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-black"
        >
          <Wrench size={20} className="text-white" />
        </div>

        {/* Network Status Indicator (Moved from Header) */}
        <div
          title={
            isOnline
              ? 'Trực tuyến: Đã kết nối mạng & Cloud Firebase'
              : 'Ngoại tuyến (Offline Mode)'
          }
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
            isOnline
              ? isDark
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : isDark
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-amber-50 text-amber-700 border-amber-300'
          }`}
        >
          {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Center Group: Main Navigation Pages */}
      <div
        className={`flex flex-col space-y-2.5 p-2 rounded-[14px] backdrop-blur-md transition-all ${
          isDark
            ? 'bg-white/5 border border-white/10 shadow-inner'
            : 'bg-slate-100/90 border border-slate-200/80 shadow-inner'
        }`}
      >
        {menuItems.map((item) => {
          const isActive = activeNav === item.navId;
          return (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.navId)}
              title={item.label}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] flex items-center justify-center transition-all duration-300 relative group cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-b from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-600/40 scale-105'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-white shadow-sm'
              }`}
            >
              <div className="transition-transform group-hover:scale-110 flex items-center justify-center">
                {item.icon}
              </div>

              {isActive && (
                <span className="absolute -left-1 w-1.5 h-6 rounded-r-full bg-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Header Controls Integrated into Sidebar (Search, X-Ray, Library, Bell, AI Assistant, Theme) */}
      <div className="flex flex-col items-center gap-2 relative">
        {/* Search Trigger & Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSearchPopoverOpen((prev) => !prev)}
            title="Tìm kiếm tiện ích & dự án"
            className={`w-10 h-10 rounded-[14px] flex items-center justify-center border transition-all cursor-pointer ${iconBtnClass}`}
          >
            <Search size={16} />
          </button>

          {isSearchPopoverOpen && (
            <div
              className={`absolute bottom-0 left-14 w-64 p-3 rounded-[14px] border shadow-2xl z-50 space-y-2 ${
                isDark
                  ? 'bg-[#1e1737]/95 border-white/20 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Tìm kiếm nhanh</span>
                <button
                  type="button"
                  onClick={() => setIsSearchPopoverOpen(false)}
                  className="p-1 rounded hover:bg-white/10 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tiện ích, GIF, Giọng nói..."
                className={`w-full px-3 py-1.5 text-xs rounded-[10px] border outline-none ${
                  isDark
                    ? 'bg-white/10 border-white/15 text-white placeholder-gray-400'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          )}
        </div>

        {/* X-Ray Inspector Trigger */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-xray-mode'))}
          title="Bật/Tắt chế độ X-Ray chọn phần tử (Phím tắt: X)"
          className={`w-10 h-10 rounded-[14px] flex items-center justify-center border transition-all cursor-pointer ${
            isDark
              ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 hover:text-white'
              : 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <Crosshair size={16} />
        </button>

        {/* X-Ray Library Trigger */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-xray-library'))}
          title="Mở thư viện lưu trữ mẫu X-Ray Prompt"
          className={`w-10 h-10 rounded-[14px] flex items-center justify-center border transition-all cursor-pointer ${iconBtnClass}`}
        >
          <BookOpen size={16} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSystemNoticeOpen((prev) => !prev)}
            title="Thông báo trạng thái hệ thống"
            className={`w-10 h-10 rounded-[14px] flex items-center justify-center border transition-all cursor-pointer ${iconBtnClass}`}
          >
            <Bell size={16} />
          </button>
          {systemNoticeOpen && (
            <div
              className={`absolute bottom-0 left-14 w-64 p-3 rounded-[14px] border shadow-2xl z-50 text-xs space-y-1.5 ${
                isDark
                  ? 'bg-[#1e1737]/95 border-white/20 text-white'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-emerald-500">
                <span>Hệ thống hoạt động 100%</span>
                <button
                  type="button"
                  onClick={() => setSystemNoticeOpen(false)}
                  className="p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
              <p className="text-[11px] opacity-80">
                Tất cả công cụ AI (Giọng nói Song ngữ, Avatar 3D, Video to GIF Studio, Firebase) đều
                đang sẵn sàng!
              </p>
            </div>
          )}
        </div>

        {/* AI Assistant Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsAssistantOpen(true)}
          title="Mở Trợ lý AI Tiện ích"
          className={`w-10 h-10 rounded-[14px] flex items-center justify-center border transition-all cursor-pointer relative ${iconBtnClass}`}
        >
          <Sparkles size={16} className={isDark ? 'text-purple-300' : 'text-purple-600'} />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
        </button>

        {/* Quick Light / Dark Toggle */}
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
          className={`w-10 h-10 rounded-[14px] flex items-center justify-center border transition-all cursor-pointer ${
            isDark
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
              : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Multi-Theme Switcher Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            title="Bảng chọn 5 chế độ giao diện (Theme Switcher)"
            className={`w-10 h-10 rounded-[14px] flex items-center justify-center border transition-all duration-300 cursor-pointer shadow-md ${
              isDark
                ? 'bg-white/10 border-white/20 text-yellow-300 hover:bg-white/15'
                : 'bg-white border-purple-200 text-indigo-700 hover:bg-purple-50'
            }`}
          >
            <Palette size={17} />
          </button>

          {isThemeMenuOpen && (
            <div
              className={`absolute bottom-0 left-14 w-56 glass-card rounded-[14px] p-2 z-50 shadow-2xl border space-y-1 ${
                isDark
                  ? 'bg-[#1e1737]/95 border-white/20 text-white'
                  : 'bg-white/95 border-slate-200 text-slate-800'
              }`}
            >
              <div
                className={`px-3 py-1.5 text-[11px] font-bold border-b mb-1 ${
                  isDark ? 'text-slate-300 border-white/10' : 'text-slate-500 border-slate-200'
                }`}
              >
                Chọn chế độ giao diện
              </div>
              {themeOptions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    theme === t.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isDark
                      ? 'hover:bg-white/10 text-slate-200'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{t.name}</span>
                  {theme === t.id && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
