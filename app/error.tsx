'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#0f0c1f] text-white">
      <h2 className="text-2xl font-bold mb-2 text-rose-400">Đã Xảy Ra Lỗi Hệ Thống</h2>
      <p className="text-slate-400 mb-6 text-xs max-w-md">{error.message || 'Lỗi không xác định'}</p>
      <button
        onClick={() => reset()}
        className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs hover:scale-105 transition-all shadow-md cursor-pointer"
      >
        Thử lại
      </button>
    </div>
  );
}
