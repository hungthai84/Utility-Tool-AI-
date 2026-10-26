'use client';

import React, { useState } from 'react';
import { useTheme } from '@/components/ThemeContext';
import { deleteCloudProject, SavedProject } from '@/lib/firebase';
import { X, Cloud, Trash2, Copy, Check, FolderOpen, Image as ImageIcon, Video, Mic, Code2 } from 'lucide-react';

export function SavedProjectsDrawer() {
  const { user, userProjects, isProjectsDrawerOpen, setIsProjectsDrawerOpen } = useTheme();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isProjectsDrawerOpen) return null;

  const handleDelete = async (projectId: string) => {
    if (!user) return;
    if (confirm('Bạn có chắc chắn muốn xóa dự án lưu trữ Cloud này?')) {
      await deleteCloudProject(user.uid, projectId);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <ImageIcon size={16} className="text-pink-400" />;
      case 'video':
        return <Video size={16} className="text-blue-400" />;
      case 'speech':
        return <Mic size={16} className="text-purple-400" />;
      case 'code':
        return <Code2 size={16} className="text-emerald-400" />;
      default:
        return <FolderOpen size={16} className="text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full glass-card border-l border-white/20 p-6 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Cloud className="text-indigo-400 animate-pulse" size={20} />
              <h3 className="font-bold text-lg">Dự án lưu Cloud Firebase</h3>
            </div>
            <button
              onClick={() => setIsProjectsDrawerOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {!user ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Vui lòng đăng nhập tài khoản để xem các dự án được đồng bộ hóa thời gian thực trên Cloud Firebase.
            </div>
          ) : userProjects.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <FolderOpen className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">Chưa có dự án nào được lưu. Hãy thực hiện một công cụ và lưu vào Cloud!</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[75vh] pr-1">
              {userProjects.map((proj: SavedProject) => (
                <div key={proj.id} className="p-4 rounded-2xl glass-card bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(proj.toolCategory)}
                      <span className="font-bold text-sm truncate max-w-[200px]">{proj.title}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(proj.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      title="Xóa dự án"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 font-mono mb-2 bg-black/20 p-2 rounded-lg">
                    {proj.outputContent}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{new Date(proj.createdAt).toLocaleDateString('vi-VN')}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(proj.outputContent);
                        setCopiedId(proj.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="flex items-center space-x-1 text-indigo-400 hover:underline cursor-pointer"
                    >
                      {copiedId === proj.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedId === proj.id ? 'Đã chép' : 'Sao chép kết quả'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-white/10 text-center">
          <p className="text-[10px] text-slate-400">
            Tự động đồng bộ hóa với Firebase Firestore ngay khi trực tuyến
          </p>
        </div>
      </div>
    </div>
  );
}
