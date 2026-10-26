'use client';

import React, { useState } from 'react';
import { useTheme } from '@/components/ThemeContext';
import { saveCloudProject, logToolHistory } from '@/lib/firebase';
import {
  Video,
  Film,
  Sliders,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  CloudUpload,
  RefreshCw,
  X,
} from 'lucide-react';

export function VideoToolWizard({ onClose }: { onClose: () => void }) {
  const { user, isDark, setIsAuthModalOpen } = useTheme();
  const [activeTab, setActiveTab] = useState<'prompt' | 'compress'>('prompt');
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Inputs
  const [concept, setConcept] = useState<string>('Một chú robot thông minh đang vẽ tranh sơn dầu phong cách Glassmorphism trong phòng lab lung linh');
  const [duration, setDuration] = useState<string>('5s');
  const [resolution, setResolution] = useState<string>('1080p');
  const [style, setStyle] = useState<string>('Cinematic, Hyper-realistic 8K, Photorealistic, Motion blur');
  const [fps, setFps] = useState<string>('60');

  // Output
  const [outputResult, setOutputResult] = useState<string | null>(null);

  const handleRunTool = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: activeTab === 'compress' ? 'compress_plan' : 'prompt',
          concept,
          duration,
          resolution,
          style,
          fps,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setOutputResult(data.result);
        setStep(3);
      } else {
        alert(data.error || 'Lỗi khi tạo kịch bản/nén video');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối AI Video Tool');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      await saveCloudProject(user.uid, {
        title: activeTab === 'prompt' ? `Kịch bản Video AI: ${concept.slice(0, 30)}...` : `Kế hoạch nén Video 4K (${resolution})`,
        toolCategory: 'video',
        stepData: JSON.stringify({ duration, resolution, style }),
        outputContent: outputResult || '',
        tags: ['Video', activeTab.toUpperCase(), 'AI Studio'],
      });

      await logToolHistory(user.uid, 'video_tool', 'Công cụ Video AI', concept.slice(0, 40), 'Hoàn thành');

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Không thể lưu vào Cloud. Kiểm tra kết nối mạng.');
    }
  };

  return (
    <div className="p-6 max-w-4xl w-full mx-auto">
      {/* Wizard Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Video size={22} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Bộ Công Cụ Video AI & Nén Codec
            </h3>
            <p className={`text-xs ${isDark ? 'opacity-70' : 'text-slate-600'}`}>Quy trình từng bước (Step-by-Step Flow)</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-slate-800'
          }`}
        >
          <X size={18} />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8 px-4">
        {[
          { num: 1, label: 'Chọn Chế Độ' },
          { num: 2, label: 'Thông Số & Ý Tưởng' },
          { num: 3, label: 'Kịch Bản & Cloud Sync' },
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= s.num
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : isDark
                  ? 'bg-white/10 text-slate-400'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {s.num}
            </div>
            <span className={`text-xs font-semibold ${step >= s.num ? (isDark ? 'text-blue-400' : 'text-blue-700') : (isDark ? 'text-slate-500' : 'text-slate-600')}`}>
              {s.label}
            </span>
            {s.num < 3 && <div className="w-12 h-0.5 bg-white/10 mx-2 hidden sm:block"></div>}
          </div>
        ))}
      </div>

      {/* STEP 1: Select Sub-Tool */}
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <button
            onClick={() => {
              setActiveTab('prompt');
              setStep(2);
            }}
            className={`p-6 rounded-3xl glass-card text-left transition-all cursor-pointer hover:border-blue-400 ${
              activeTab === 'prompt' ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''
            }`}
          >
            <Film className="w-9 h-9 text-blue-500 mb-3" />
            <h4 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Tạo Kịch Bản & Prompt Video AI</h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tự động chuyển ý tưởng tiếng Việt thành Prompt chuẩn điện ảnh cho Veo/Omni AI Video</p>
          </button>

          <button
            onClick={() => {
              setActiveTab('compress');
              setStep(2);
            }}
            className={`p-6 rounded-3xl glass-card text-left transition-all cursor-pointer hover:border-blue-400 ${
              activeTab === 'compress' ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''
            }`}
          >
            <Sliders className="w-9 h-9 text-indigo-500 mb-3" />
            <h4 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Lập Kế Hoạch Nén Video Web 4K</h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tối ưu hóa Codec H.265/AV1/WebM, giảm 85% dung lượng giữ nguyên 60 FPS cho trang web</p>
          </button>
        </div>
      )}

      {/* STEP 2: Configure Inputs */}
      {step === 2 && (
        <div className="glass-card p-6 rounded-3xl space-y-5 mb-6">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Ý tưởng video / Dự án:
            </label>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              rows={3}
              className={`w-full p-3 rounded-2xl border text-sm focus:outline-none focus:border-blue-500 ${
                isDark ? 'bg-black/30 border-white/10 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 shadow-sm'
              }`}
              placeholder="Nhập ý tưởng video..."
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Thời lượng:
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="5s">5 giây</option>
                <option value="10s">10 giây</option>
                <option value="30s">30 giây</option>
                <option value="60s">60 giây</option>
              </select>
            </div>

            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Độ phân giải:
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="1080p">1080p (Full HD)</option>
                <option value="4K">4K Ultra HD</option>
                <option value="720p">720p (HD Web)</option>
              </select>
            </div>

            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Tỷ lệ khung hình:
              </label>
              <select
                value={fps}
                onChange={(e) => setFps(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="60">60 FPS (Mượt)</option>
                <option value="30">30 FPS (Chuẩn)</option>
                <option value="24">24 FPS (Điện ảnh)</option>
              </select>
            </div>

            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Phong cách:
              </label>
              <input
                type="text"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={() => setStep(1)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              Quay lại Bước 1
            </button>

            <button
              onClick={handleRunTool}
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Đang Xử Lý...</span>
                </>
              ) : (
                <>
                  <span>Thực Hiện Bước 3</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Results */}
      {step === 3 && outputResult && (
        <div className="glass-card p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500 flex items-center space-x-1.5">
              <CheckCircle2 size={16} />
              <span>Đã hoàn tất kịch bản video!</span>
            </span>
            <button
              onClick={() => setStep(2)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              <RefreshCw size={14} />
              <span>Tạo lại</span>
            </button>
          </div>

          <div className={`p-4 rounded-2xl border font-mono text-xs whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed ${
            isDark ? 'bg-black/40 border-white/10 text-emerald-300' : 'bg-slate-900 border-slate-700 text-emerald-400'
          }`}>
            {outputResult}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(outputResult);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
                isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép kịch bản'}</span>
            </button>

            <button
              onClick={handleSaveToCloud}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <CloudUpload size={14} />
              <span>Lưu Cloud Firebase</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 font-bold text-xs text-center">
              ✓ Đã lưu kịch bản vào Cloud Firebase thành công!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
