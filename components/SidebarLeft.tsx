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
  Code2,
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
    {
      navId: 0,
      label: 'Kho tiện ích',
      icon: <Boxes size={20} />,
      colorGradient: 'from-indigo-600 via-indigo-500 to-purple-600',
      activeShadow: 'shadow-indigo-500/40',
      ringColor: 'ring-indigo-400',
    },
    {
      navId: 2,
      label: 'Giọng nói & Câu chuyện',
      icon: <Mic size={20} />,
      colorGradient: 'from-purple-600 via-fuchsia-500 to-pink-500',
      activeShadow: 'shadow-purple-500/40',
      ringColor: 'ring-purple-400',
    },
    {
      navId: 3,
      label: 'Video to GIF Studio',
      icon: <Film size={20} />,
      colorGradient: 'from-cyan-500 via-sky-500 to-blue-600',
      activeShadow: 'shadow-cyan-500/40',
      ringColor: 'ring-cyan-400',
    },
    {
      navId: 4,
      label: 'Background Remover Studio',
      icon: <Scissors size={20} />,
      colorGradient: 'from-rose-500 via-pink-500 to-red-500',
      activeShadow: 'shadow-rose-500/40',
      ringColor: 'ring-rose-400',
    },
    {
      navId: 5,
      label: 'Image-to-Prompt Studio',
      icon: <ScanEye size={20} />,
      colorGradient: 'from-emerald-500 via-teal-500 to-green-600',
      activeShadow: 'shadow-emerald-500/40',
      ringColor: 'ring-emerald-400',
    },
    {
      navId: 6,
      label: 'CodePen Analyzer Studio',
      icon: <Code2 size={20} />,
      colorGradient: 'from-amber-500 via-orange-500 to-yellow-500',
      activeShadow: 'shadow-amber-500/40',
      ringColor: 'ring-amber-400',
    },
  ];

  const themeOptions: { id: ThemeType; name: string }[] = [
    { id: 'dark', name: 'Dark Glass (Đêm)' },
    { id: 'light', name: 'Light Glass (Sáng)' },
    { id: 'cyber', name: 'Cyber Neon (Cyberpunk)' },
    { id: 'clay', name: 'Soft Clay (Gốm Mềm)' },
    { id: 'emerald', name: 'Emerald Forest (Bích Ngọc)' },
  ];

  return (
    <aside
      className={`w-20 sm:w-24 h-full flex flex-col items-center py-3 justify-between transition-colors duration-300 relative border-r flex-shrink-0 z-30 select-none ${
        isDark
          ? 'bg-[#1b1535]/90 border-white/10 text-white'
          : 'bg-white/90 border-slate-200/80 text-slate-900 shadow-sm'
      }`}
    >
      {/* ========================================================================= */}
      {/* KHU VỰC 1: BÊN TRÊN 10% - CHỨA LOGO & TRẠNG THÁI MẠNG                     */}
      {/* ========================================================================= */}
      <div className="h-[10%] min-h-[60px] max-h-[80px] flex flex-col items-center justify-center gap-1 shrink-0">
        <div
          onClick={() => setActiveNav(0)}
          title="Utility Hub - Tiện ích Step Flow"
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-black"
        >
          <Wrench size={21} className="text-white" />
        </div>

        {/* Network Status Badge */}
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

      {/* ========================================================================= */}
      {/* KHU VỰC 2: CENTER (90% FLEX-1) - CHỨA CÁC MENU ICON TIỆN ÍCH TRANG        */}
      {/* ========================================================================= */}
      <div className="flex-1 w-full my-auto flex flex-col items-center justify-center gap-3 py-3 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeNav === item.navId;

          return (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.navId)}
              title={item.label}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer ${
                isActive
                  ? `bg-gradient-to-tr ${item.colorGradient} text-white shadow-lg ${item.activeShadow} scale-105`
                  : isDark
                  ? 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/15 hover:text-white hover:scale-105'
                  : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-105 shadow-xs'
              }`}
            >
              <div className="transition-transform duration-200 group-hover:scale-110 flex items-center justify-center">
                {item.icon}
              </div>

              {isActive && (
                <span className="absolute -left-1.5 w-1.5 h-5 rounded-r-full bg-indigo-500 shadow-sm" />
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* KHU VỰC 3: BÊN DƯỚI - XẾP CHỒNG ICONS, BUNG NGANG KHI HOVER (HOVER EXPAND)   */}
      {/* ========================================================================= */}
      <div className="shrink-0 pt-1 flex flex-col items-center relative">
        <div
          className={`group/stack flex flex-col -space-y-6 hover:space-y-1 p-1.5 rounded-full backdrop-blur-md transition-all duration-300 ${
            isDark
              ? 'bg-white/5 border border-white/10 shadow-inner'
              : 'bg-slate-100/90 border border-slate-200/80 shadow-inner'
          }`}
          title="Xếp chồng icon tiện ích · Hover để bung sang phải"
        >
          {/* Container bọc danh sách icon bung ngang sang phải */}
          <div className="flex flex-col items-center group-hover/stack:flex-row group-hover/stack:space-x-1.5 transition-all duration-300">
            
            {/* 1. Search Icon */}
            <div className="relative z-10 hover:z-50 transition-transform duration-300">
              <button
                type="button"
                onClick={() => setIsSearchPopoverOpen((prev) => !prev)}
                title="Tìm kiếm tiện ích & dự án"
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer hover:scale-110 shadow-md ${
                  isDark
                    ? 'bg-slate-800 border-white/20 text-slate-200 hover:bg-slate-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
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

            {/* 2. X-Ray Inspector */}
            <div className="relative z-20 hover:z-50 transition-transform duration-300">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-xray-mode'))}
                title="Bật/Tắt chế độ X-Ray chọn phần tử (Phím tắt: X)"
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer hover:scale-110 shadow-md ${
                  isDark
                    ? 'border-indigo-400/60 bg-indigo-900/60 text-indigo-300 hover:bg-indigo-800'
                    : 'border-indigo-300 bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
              >
                <Crosshair size={16} />
              </button>
            </div>

            {/* 3. X-Ray Library */}
            <div className="relative z-30 hover:z-50 transition-transform duration-300">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-xray-library'))}
                title="Mở thư viện lưu trữ mẫu X-Ray Prompt"
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer hover:scale-110 shadow-md ${
                  isDark
                    ? 'bg-purple-900/60 border-purple-400/60 text-purple-300 hover:bg-purple-800'
                    : 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200'
                }`}
              >
                <BookOpen size={16} />
              </button>
            </div>

            {/* 4. Notifications */}
            <div className="relative z-40 hover:z-50 transition-transform duration-300">
              <button
                type="button"
                onClick={() => setSystemNoticeOpen((prev) => !prev)}
                title="Thông báo trạng thái hệ thống"
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer hover:scale-110 shadow-md ${
                  isDark
                    ? 'bg-amber-900/60 border-amber-400/60 text-amber-300 hover:bg-amber-800'
                    : 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                }`}
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

            {/* 5. AI Assistant Drawer Trigger */}
            <div className="relative z-50 hover:z-50 transition-transform duration-300">
              <button
                type="button"
                onClick={() => setIsAssistantOpen(true)}
                title="Mở Trợ lý AI Tiện ích"
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer hover:scale-110 shadow-md relative ${
                  isDark
                    ? 'bg-pink-900/60 border-pink-400/60 text-pink-300 hover:bg-pink-800'
                    : 'bg-pink-100 border-pink-300 text-pink-700 hover:bg-pink-200'
                }`}
              >
                <Sparkles size={16} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1" />
              </button>
            </div>

            {/* 6. Quick Light / Dark Toggle */}
            <div className="relative z-[60] hover:z-50 transition-transform duration-300">
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer hover:scale-110 shadow-md ${
                  isDark
                    ? 'bg-yellow-500/20 border-yellow-400/60 text-yellow-300 hover:bg-yellow-500/30'
                    : 'bg-sky-100 border-sky-300 text-sky-700 hover:bg-sky-200'
                }`}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            {/* 7. Multi-Theme Switcher Popover */}
            <div className="relative z-[70] hover:z-50 transition-transform duration-300">
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                title="Bảng chọn 5 chế độ giao diện (Theme Switcher)"
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer hover:scale-110 shadow-md ${
                  isDark
                    ? 'bg-indigo-600 border-indigo-400 text-white hover:bg-indigo-500'
                    : 'bg-indigo-500 border-indigo-400 text-white hover:bg-indigo-600'
                }`}
              >
                <Palette size={16} />
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
                    Chọn chế độ giao diện (5 Themes)
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
        </div>
      </div>
    </aside>
  );
}
