'use client';

import React from 'react';
import { useTheme } from '@/components/ThemeContext';

export function NewsSection() {
  const { isDark, setActiveWizardTool } = useTheme();

  const newsList = [
    {
      key: 'code',
      title: 'Quy Trình Chuyển Đổi Code & Anti-Overflow',
      subTitle: 'Chuẩn 3 bước: HTML/CSS → React Next.js → Refactor Tối Ưu',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
      usage: '124.8K lượt dùng',
      stepCount: '3 Bước',
      category: 'Quy trình Step',
      tags: [{ text: 'Tự động Code', color: '#d94b87' }],
    },
    {
      key: 'image',
      title: 'Trích Xuất Văn Bản OCR & Tách Nền Ảnh AI',
      subTitle: 'Quét chữ từ hình ảnh & PDF tiếng Việt với độ chính xác 99.8%',
      image: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=400&q=80',
      usage: '89.2K lượt dùng',
      stepCount: '2 Bước',
      category: 'Trí tuệ AI',
      tags: [
        { text: 'Chính xác cao', color: '#6647bf' },
        { text: 'Bảo mật', color: '#4696b9' },
      ],
    },
  ];

  return (
    <div className="flex flex-col space-y-3.5 flex-1 min-w-[300px]">
      {newsList.map(({ key, title, subTitle, image, usage, stepCount, category, tags }) => (
        <div
          key={key}
          onClick={() => setActiveWizardTool(key)}
          className="glass-card rounded-[14px] p-3.5 cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <div className="flex space-x-3.5 items-center">
            <div className="relative flex-shrink-0 overflow-hidden rounded-[14px]">
              <img
                src={image}
                alt={title}
                className="w-24 h-20 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-1 right-1 glass-badge bg-black/70 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                {stepCount}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  {category}
                </span>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{usage}</span>
              </div>
              <div
                className={`text-sm font-semibold truncate group-hover:text-indigo-500 transition-colors ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {title}
              </div>
              <div className={`text-xs truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {subTitle}
              </div>
              <div className="flex space-x-1.5 mt-2.5">
                {tags.map(({ text, color }) => (
                  <span
                    key={text}
                    className="glass-badge text-[10px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-full"
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
  );
}
