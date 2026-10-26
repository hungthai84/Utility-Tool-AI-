import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#0f0c1f] text-white">
      <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        404 - Không Tìm Thấy Trang
      </h2>
      <p className="text-slate-400 mb-6 text-sm">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được cập nhật đường dẫn.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg hover:scale-105 transition-all text-xs"
      >
        Về Trang Chủ Utility Hub
      </Link>
    </div>
  );
}
