'use client';

import React, { useState } from 'react';
import { useTheme } from '@/components/ThemeContext';
import { X, Sparkles, Send, Bot, User, RefreshCw } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export function AIAssistantDrawer() {
  const { isAssistantOpen, setIsAssistantOpen } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Xin chào! Tôi là Trợ lý AI Tiện ích Đa năng. Tôi có thể giúp bạn giải đáp thắc mắc, tư vấn viết code, tạo kịch bản video hoặc hướng dẫn sử dụng các công cụ AI trên hệ thống!',
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isAssistantOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: newMessages.slice(0, -1),
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages([...newMessages, { role: 'model', text: data.reply }]);
      } else {
        setMessages([
          ...newMessages,
          { role: 'model', text: 'Rất tiếc, đã xảy ra lỗi kết nối với Trợ lý AI.' },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        { role: 'model', text: 'Lỗi mạng khi phản hồi câu hỏi.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full glass-card border-l border-white/20 p-6 flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <h3 className="font-bold text-lg">Trợ lý AI Tiện ích</h3>
          </div>
          <button
            onClick={() => setIsAssistantOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'model' && (
                <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-1">
                  <Bot size={15} />
                </div>
              )}

              <div
                className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white/10 border border-white/10 text-slate-100 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0 mt-1">
                  <User size={15} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-purple-300">
              <RefreshCw size={14} className="animate-spin" />
              <span>Trợ lý AI đang suy nghĩ...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Hỏi trợ lý AI về công cụ, viết code, video..."
            className="flex-1 p-2.5 rounded-2xl bg-black/20 border border-white/10 text-xs focus:outline-none focus:border-purple-400"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
