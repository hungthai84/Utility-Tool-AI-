'use client';

import React, { useState } from 'react';
import { useTheme } from '@/components/ThemeContext';
import { saveCloudProject, logToolHistory } from '@/lib/firebase';
import {
  Sparkles,
  Image as ImageIcon,
  ScanText,
  Scissors,
  CheckCircle2,
  ArrowRight,
  Download,
  CloudUpload,
  Copy,
  Check,
  RefreshCw,
  X,
} from 'lucide-react';

export function ImageToolWizard({ onClose }: { onClose: () => void }) {
  const { user, isDark, setIsAuthModalOpen } = useTheme();
  const [activeTab, setActiveTab] = useState<'generate' | 'ocr' | 'optimize'>('generate');
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Form State
  const [prompt, setPrompt] = useState<string>('Một khung cảnh thành phố tương lai rực rỡ với kiến trúc kính mờ Glassmorphic');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Output State
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [ocrResultText, setOcrResultText] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunTool = async () => {
    setLoading(true);
    try {
      if (activeTab === 'generate') {
        const res = await fetch('/api/gemini/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate', prompt, aspectRatio }),
        });
        const data = await res.json();
        if (data.imageUrl) {
          setGeneratedImageUrl(data.imageUrl);
          setStep(3);
        } else {
          alert(data.error || 'Không tạo được hình ảnh. Vui lòng thử lại.');
        }
      } else if (activeTab === 'ocr' || activeTab === 'optimize') {
        if (!uploadedImage) {
          alert('Vui lòng tải lên một hình ảnh trước khi thực hiện.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/gemini/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: activeTab === 'ocr' ? 'ocr' : 'analyze',
            base64Image: uploadedImage,
            prompt: activeTab === 'optimize' ? 'Hãy phân tích chi tiết hình ảnh này, đề xuất các bước tách nền, tối ưu kích thước file WebP/AVIF và cân bằng màu sắc cho web.' : undefined,
          }),
        });
        const data = await res.json();
        if (data.result) {
          setOcrResultText(data.result);
          setStep(3);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('Đã xảy ra lỗi khi kết nối AI xử lý hình ảnh.');
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
      const contentToSave = generatedImageUrl || ocrResultText || 'No content';
      await saveCloudProject(user.uid, {
        title: activeTab === 'generate' ? `Ảnh AI: ${prompt.slice(0, 30)}...` : `Phân tích/OCR Ảnh (${new Date().toLocaleDateString('vi-VN')})`,
        toolCategory: 'image',
        stepData: JSON.stringify({ tab: activeTab, aspectRatio }),
        outputContent: contentToSave,
        tags: ['Hình Ảnh', activeTab.toUpperCase(), 'AI Glass'],
      });

      await logToolHistory(user.uid, 'image_tool', 'Xử lý Hình ảnh AI', prompt.slice(0, 40), 'Hoàn thành');

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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <ImageIcon size={22} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Bộ Xử Lý Hình Ảnh AI & OCR
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
          { num: 1, label: 'Chọn Chức Năng' },
          { num: 2, label: 'Cấu Hình & Tải Lên' },
          { num: 3, label: 'Kết Quả & Cloud Sync' },
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= s.num
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : isDark
                  ? 'bg-white/10 text-slate-400'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {s.num}
            </div>
            <span className={`text-xs font-semibold ${step >= s.num ? (isDark ? 'text-indigo-400' : 'text-indigo-700') : (isDark ? 'text-slate-500' : 'text-slate-600')}`}>
              {s.label}
            </span>
            {s.num < 3 && <div className="w-12 h-0.5 bg-white/10 mx-2 hidden sm:block"></div>}
          </div>
        ))}
      </div>

      {/* STEP 1: Select Sub-Tool */}
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => {
              setActiveTab('generate');
              setStep(2);
            }}
            className={`p-5 rounded-3xl glass-card text-left transition-all cursor-pointer hover:border-indigo-400 ${
              activeTab === 'generate' ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : ''
            }`}
          >
            <Sparkles className="w-8 h-8 text-pink-500 mb-3" />
            <h4 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Tạo Ảnh Nghệ Thuật AI</h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tạo hình ảnh chất lượng cao từ mô tả văn bản tiếng Việt</p>
          </button>

          <button
            onClick={() => {
              setActiveTab('ocr');
              setStep(2);
            }}
            className={`p-5 rounded-3xl glass-card text-left transition-all cursor-pointer hover:border-indigo-400 ${
              activeTab === 'ocr' ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : ''
            }`}
          >
            <ScanText className="w-8 h-8 text-purple-500 mb-3" />
            <h4 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Trích Xuất Văn Bản OCR</h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Quét chữ tiếng Việt/Anh từ tệp ảnh với độ chính xác 99%</p>
          </button>

          <button
            onClick={() => {
              setActiveTab('optimize');
              setStep(2);
            }}
            className={`p-5 rounded-3xl glass-card text-left transition-all cursor-pointer hover:border-indigo-400 ${
              activeTab === 'optimize' ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : ''
            }`}
          >
            <Scissors className="w-8 h-8 text-emerald-500 mb-3" />
            <h4 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Phân Tích & Tối Ưu Tách Nền</h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Chuyển định dạng WebP, phân tích bố cục và cắt phông nền</p>
          </button>
        </div>
      )}

      {/* STEP 2: Configure Inputs */}
      {step === 2 && (
        <div className="glass-card p-6 rounded-3xl space-y-5 mb-6">
          {activeTab === 'generate' ? (
            <>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Mô tả hình ảnh (Prompt):
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className={`w-full p-3 rounded-2xl border text-sm focus:outline-none focus:border-indigo-500 ${
                    isDark ? 'bg-black/30 border-white/10 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 shadow-sm'
                  }`}
                  placeholder="Nhập mô tả hình ảnh bằng tiếng Việt..."
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Tỷ lệ khung hình (Aspect Ratio):
                </label>
                <div className="flex space-x-3">
                  {['1:1', '16:9', '9:16', '4:3'].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        aspectRatio === ratio
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                          : isDark
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                          : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Tải ảnh đầu vào lên:
              </label>
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                isDark ? 'border-white/20 bg-black/20 hover:border-indigo-400' : 'border-slate-300 bg-slate-50 hover:border-indigo-500'
              }`}>
                {uploadedImage ? (
                  <div className="space-y-3">
                    <img src={uploadedImage} alt="Uploaded" className="max-h-48 mx-auto rounded-xl object-cover shadow-lg" />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="text-xs text-rose-500 font-semibold hover:underline"
                    >
                      Xóa ảnh chọn lại
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer space-y-2 block">
                    <CloudUpload className="w-10 h-10 text-indigo-500 mx-auto animate-bounce" />
                    <span className={`text-sm font-semibold block ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Kéo thả hoặc nhấp để chọn tệp hình ảnh
                    </span>
                    <span className={`text-xs block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      (Hỗ trợ PNG, JPG, WEBP - Tối đa 10MB)
                    </span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          )}

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
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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

      {/* STEP 3: Results & Cloud Actions */}
      {step === 3 && (
        <div className="glass-card p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500 flex items-center space-x-1.5">
              <CheckCircle2 size={16} />
              <span>Xử lý hoàn tất thành công!</span>
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

          {activeTab === 'generate' && generatedImageUrl && (
            <div className="space-y-4 text-center">
              <img
                src={generatedImageUrl}
                alt="AI Generated"
                className="max-h-80 mx-auto rounded-2xl shadow-2xl border border-white/20 object-contain"
              />
              <div className="flex items-center justify-center space-x-3 pt-2">
                <a
                  href={generatedImageUrl}
                  download="ai-generated-image.png"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <Download size={14} />
                  <span>Tải Ảnh Về</span>
                </a>
                <button
                  onClick={handleSaveToCloud}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <CloudUpload size={14} />
                  <span>Lưu Vào Cloud Firebase</span>
                </button>
              </div>
            </div>
          )}

          {(activeTab === 'ocr' || activeTab === 'optimize') && ocrResultText && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border font-mono text-xs whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed ${
                isDark ? 'bg-black/40 border-white/10 text-emerald-300' : 'bg-slate-900 border-slate-700 text-emerald-400'
              }`}>
                {ocrResultText}
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(ocrResultText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
                    isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copied ? 'Đã sao chép!' : 'Sao chép kết quả'}</span>
                </button>
                <button
                  onClick={handleSaveToCloud}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <CloudUpload size={14} />
                  <span>Lưu Cloud Firebase</span>
                </button>
              </div>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 font-bold text-xs text-center">
              ✓ Đã lưu thành công vào Cloud Firebase & đồng bộ thời gian thực!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
