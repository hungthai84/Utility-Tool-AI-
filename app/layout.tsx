import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Utility Hub AI Glassmorphism - Trung Tâm Tiện Ích Đa Năng',
  description: 'Nền tảng tiện ích AI đa năng tích hợp xử lý Hình ảnh, Video, Giọng nói, Chuyển đổi Code, đồng bộ Cloud Firebase thời gian thực và chế độ ngoại tuyến.',
  openGraph: {
    title: 'Utility Hub AI Glassmorphism',
    description: 'Nền tảng tiện ích AI đa năng tích hợp Hình ảnh, Video, Giọng nói, Chuyển đổi Code.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Utility Hub AI Glassmorphism',
    description: 'Nền tảng tiện ích AI đa năng tích hợp Hình ảnh, Video, Giọng nói, Chuyển đổi Code.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning className="theme-dark min-h-screen antialiased selection:bg-purple-500 selection:text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
