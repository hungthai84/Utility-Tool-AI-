'use client';

import React, { useState } from 'react';
import { useTheme } from '@/components/ThemeContext';
import { saveCloudProject, logToolHistory } from '@/lib/firebase';
import {
  Code2,
  Terminal,
  Layers,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  CloudUpload,
  RefreshCw,
  X,
  FileCode2,
} from 'lucide-react';

export function CodeToolWizard({ onClose }: { onClose: () => void }) {
  const { user, isDark, setIsAuthModalOpen } = useTheme();
  const [activeTab, setActiveTab] = useState<'convert' | 'refactor'>('convert');
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Form Inputs
  const [sourceCode, setSourceCode] = useState<string>(
    `<div class="profile-card" style="width: 300px; height: 150px; background: white; padding: 20px;">\n  <h2>Hồ sơ Chuyên gia & Thông tin cá nhân</h2>\n  <p>Email: hungthai84@gmail.com - Điện thoại: 0987654321 - Lĩnh vực: Full-stack AI Engineer</p>\n</div>`
  );
  const [fromLang, setFromLang] = useState<string>('HTML5/CSS3');
  const [toLang, setToLang] = useState<string>('React 19 + Next.js App Router + Tailwind CSS v4');

  // Output
  const [convertedCode, setConvertedCode] = useState<string | null>(null);

  const handleRunTool = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCode,
          fromLang,
          toLang,
          action: activeTab,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setConvertedCode(data.result);
        setStep(3);
      } else {
        alert(data.error || 'Lỗi khi chuyển đổi code');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối AI Code Converter');
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
        title: `Chuyển Code: ${fromLang} ➔ ${toLang.slice(0, 15)}...`,
        toolCategory: 'code',
        stepData: JSON.stringify({ fromLang, toLang }),
        outputContent: convertedCode || '',
        tags: ['Code', 'React', 'Next.js', 'Tailwind'],
      });

      await logToolHistory(user.uid, 'code_tool', 'Chuyển đổi Code AI', `Từ ${fromLang} sang ${toLang}`, 'Hoàn thành');

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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
            <Code2 size={22} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Bộ chuyển đổi & Refactor code AI
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
          { num: 1, label: 'Chọn loại chuyển đổi' },
          { num: 2, label: 'Dán code nguồn & cấu hình' },
          { num: 3, label: 'Code hoàn chỉnh & Cloud Sync' },
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= s.num
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                  : isDark
                  ? 'bg-white/10 text-slate-400'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {s.num}
            </div>
            <span className={`text-xs font-semibold ${step >= s.num ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-slate-500' : 'text-slate-600')}`}>
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
              setActiveTab('convert');
              setStep(2);
            }}
            className={`p-6 rounded-3xl glass-card text-left transition-all cursor-pointer hover:border-emerald-400 ${
              activeTab === 'convert' ? 'ring-2 ring-emerald-500 bg-emerald-500/10' : ''
            }`}
          >
            <FileCode2 className="w-9 h-9 text-emerald-500 mb-3" />
            <h4 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Chuyển đổi Framework & Ngôn ngữ</h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Chuyển HTML/CSS/JS thuần sang React 19, Next.js JSX và Tailwind CSS v4 giữ nguyên 100% dữ liệu</p>
          </button>

          <button
            onClick={() => {
              setActiveTab('refactor');
              setStep(2);
            }}
            className={`p-6 rounded-3xl glass-card text-left transition-all cursor-pointer hover:border-emerald-400 ${
              activeTab === 'refactor' ? 'ring-2 ring-emerald-500 bg-emerald-500/10' : ''
            }`}
          >
            <Layers className="w-9 h-9 text-teal-500 mb-3" />
            <h4 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Tối ưu hiệu năng & Anti-overflow UI</h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tự động kiểm tra lỗi overflow, ngắt chữ word-break, tối ưu responsive trên mọi màn hình</p>
          </button>
        </div>
      )}

      {/* STEP 2: Configure Inputs */}
      {step === 2 && (
        <div className="glass-card p-6 rounded-3xl space-y-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Mã nguồn từ (From):</label>
              <select
                value={fromLang}
                onChange={(e) => setFromLang(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="HTML5/CSS3">HTML5 / CSS3 Thuần</option>
                <option value="JavaScript ES6">JavaScript (ES6+)</option>
                <option value="Python">Python Script</option>
                <option value="Vue">Vue Component</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Chuyển đổi sang (To):</label>
              <select
                value={toLang}
                onChange={(e) => setToLang(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="React 19 + Next.js App Router + Tailwind CSS v4">React 19 + Next.js App Router + Tailwind v4</option>
                <option value="TypeScript Standard">TypeScript Type-Safe Component</option>
                <option value="Clean Tailwind Utility HTML">Clean Tailwind Utility Classes</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Dán mã nguồn vào đây:</label>
            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              rows={6}
              className={`w-full p-3 rounded-2xl border font-mono text-xs focus:outline-none focus:border-emerald-500 ${
                isDark ? 'bg-black/40 border-white/10 text-emerald-300' : 'bg-slate-900 border-slate-700 text-emerald-400'
              }`}
              placeholder="Dán code nguồn..."
            />
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
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Đang Biên Dịch Code...</span>
                </>
              ) : (
                <>
                  <span>Biên dịch ở bước 3</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Results */}
      {step === 3 && convertedCode && (
        <div className="glass-card p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500 flex items-center space-x-1.5">
              <CheckCircle2 size={16} />
              <span>Đã chuyển đổi mã nguồn thành công!</span>
            </span>
            <button
              onClick={() => setStep(2)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              <RefreshCw size={14} />
              <span>Thực hiện lại</span>
            </button>
          </div>

          <div className={`p-4 rounded-2xl border font-mono text-xs whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed ${
            isDark ? 'bg-black/40 border-white/10 text-emerald-300' : 'bg-slate-900 border-slate-700 text-emerald-400'
          }`}>
            {convertedCode}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(convertedCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
                isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép Code'}</span>
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
              ✓ Đã lưu mã nguồn vào Cloud Firebase thành công!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
