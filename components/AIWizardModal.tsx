'use client';

import React from 'react';
import { useTheme } from '@/components/ThemeContext';
import { ImageToolWizard } from '@/components/tools/ImageToolWizard';
import { VideoToolWizard } from '@/components/tools/VideoToolWizard';
import { VoiceToolWizard } from '@/components/tools/VoiceToolWizard';
import { CodeToolWizard } from '@/components/tools/CodeToolWizard';

export function AIWizardModal() {
  const { activeWizardTool, setActiveWizardTool } = useTheme();

  if (!activeWizardTool) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-lg animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl glass-card rounded-[32px] border border-white/20 shadow-2xl my-auto overflow-hidden">
        {activeWizardTool === 'image' && <ImageToolWizard onClose={() => setActiveWizardTool(null)} />}
        {activeWizardTool === 'video' && <VideoToolWizard onClose={() => setActiveWizardTool(null)} />}
        {activeWizardTool === 'speech' && <VoiceToolWizard onClose={() => setActiveWizardTool(null)} />}
        {activeWizardTool === 'code' && <CodeToolWizard onClose={() => setActiveWizardTool(null)} />}
      </div>
    </div>
  );
}
