'use client';

import React from 'react';
import { ThemeProvider, useTheme } from '@/components/ThemeContext';
import { SidebarLeft } from '@/components/SidebarLeft';
import { Header } from '@/components/Header';
import { HeroToolSection } from '@/components/HeroToolSection';
import { NewsSection } from '@/components/NewsSection';
import { TopSelection } from '@/components/TopSelection';
import { SidebarRight } from '@/components/SidebarRight';
import { AIWizardModal } from '@/components/AIWizardModal';
import { AuthModal } from '@/components/AuthModal';
import { SavedProjectsDrawer } from '@/components/SavedProjectsDrawer';
import { AIAssistantDrawer } from '@/components/AIAssistantDrawer';
import { VoiceStoryStudio } from '@/components/VoiceStoryStudio/VoiceStoryStudio';
import { VideoToGifStudio } from '@/components/VideoToGifStudio/VideoToGifStudio';
import { BackgroundRemoverStudio } from '@/components/BackgroundRemoverStudio/BackgroundRemoverStudio';
import { ImageToPromptStudio } from '@/components/ImageToPromptStudio/ImageToPromptStudio';
import { CodePenAnalyzerStudio } from '@/components/CodePenAnalyzer/CodePenAnalyzerStudio';
import { LucianAuroraBackground } from '@/components/Lucian/LucianAuroraBackground';
import { ToastProvider } from '@/components/ui/Toast';
import { XRayEditor } from '@/components/ui/XRayEditor';

const PAGE_NAME_MAP: Record<number, string> = {
  0: 'Kho tiện ích',
  2: 'Giọng nói & Câu chuyện',
  3: 'Video to GIF Studio',
  4: 'Background Remover Studio',
  5: 'Image-to-Prompt Studio',
  6: 'CodePen Analyzer Studio',
};

function MainAppContent() {
  const { isDark, activeNav } = useTheme();
  const currentPageName = PAGE_NAME_MAP[activeNav] || 'Kho tiện ích';

  return (
    <div className="relative z-10 w-full h-full flex justify-center items-center overflow-hidden p-2 sm:p-5">
      {/* Lucian UX/UI #319 Cursor-Following Living Aurora Background */}
      <LucianAuroraBackground />

      {/* Ambient background glows */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      {/* Main Glassmorphic Outer Chassis */}
      <div
        className={`w-full h-full max-w-[1600px] rounded-[14px] flex overflow-hidden transition-all duration-300 relative border ${
          isDark
            ? 'bg-[#1e1737]/75 backdrop-blur-2xl border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] text-slate-100'
            : 'bg-white/70 backdrop-blur-2xl border-white/80 shadow-[0_25px_60px_-15px_rgba(80,60,140,0.18)] text-slate-800'
        }`}
      >
        {/* Left Sidebar */}
        <SidebarLeft />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full pl-3 sm:pl-6 pr-2 sm:pr-4 overflow-hidden min-w-0">
          <Header />

          <div className="flex-1 overflow-y-auto pr-2 sm:pr-3 pb-6 space-y-6 pt-4">
            {activeNav === 2 ? (
              <VoiceStoryStudio />
            ) : activeNav === 3 ? (
              <VideoToGifStudio />
            ) : activeNav === 4 ? (
              <BackgroundRemoverStudio />
            ) : activeNav === 5 ? (
              <ImageToPromptStudio />
            ) : activeNav === 6 ? (
              <CodePenAnalyzerStudio />
            ) : (
              <>
                {/* Top Row: Hero Section + Step-by-Step Flow List */}
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                  <HeroToolSection />
                  <NewsSection />
                </div>

                {/* Bottom Row: Utilities Catalog Grid */}
                <TopSelection />
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar Shortcuts */}
        <SidebarRight />
      </div>

      {/* Interactive Modals & Drawers */}
      <AIWizardModal />
      <AuthModal />
      <SavedProjectsDrawer />
      <AIAssistantDrawer />

      {/* X-Ray Inspector & Prompt Library */}
      <XRayEditor currentPageId={activeNav} currentPageName={currentPageName} />
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
