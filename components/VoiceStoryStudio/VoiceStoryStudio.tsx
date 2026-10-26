'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  BookOpen,
  Users,
  FileText,
  Sparkles,
  Volume2,
  Play,
  Save,
  Download,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Loader2,
  Cloud,
  Search,
  Filter,
  Layers,
  FolderPlus,
  RefreshCw,
  Code2,
  Clock,
  Subtitles,
  Tv,
  Wand2,
  Bot,
  Globe,
  Sun,
  Moon,
  MapPin,
  Columns,
  Maximize2,
  EyeOff,
} from 'lucide-react';
import type {
  VoiceStoryProject,
  StoryCharacter,
  ContentType,
  DialogueLine,
  StoryScene,
} from '@/types/story';
import { CharacterStudioModal, type CastModalTab } from './CharacterStudioModal';
import { AudioPlayer } from './AudioPlayer';
import { InteractiveCharacterStage } from './InteractiveCharacterStage';
import { useTheme } from '@/components/ThemeContext';
import {
  saveVoiceStoryProject,
  deleteVoiceStoryProject,
  subscribeVoiceStoryProjects,
} from '@/lib/firebase';
import {
  createDemoStoryPackage,
  generateSRTSubtitles,
  getRegionalDialectMeta,
  normalizeBilingualLang,
  normalizePitchMultiplier,
  synthesizeOrSpeakBilingual,
  VN_MACRO_REGIONS,
  getMacroRegionForDialect,
  getMacroRegionRecommendation,
  autoCastCharactersByScriptContext,
  type AutoCastAssignmentReport,
  type MacroRegionVN,
} from '@/lib/bilingualVoiceEngine';

const CONTENT_TYPES: { value: ContentType; label: string; desc: string }[] = [
  { value: 'truyen_ngan', label: 'Truyện ngắn', desc: 'Truyện giả tưởng, văn học, tiểu thuyết ngắn' },
  { value: 'truyen_thieu_nhi', label: 'Truyện thiếu nhi & cổ tích', desc: 'Giọng đọc hồn nhiên, sinh động, giáo dục' },
  { value: 'podcast', label: 'Podcast & Đàm thoại', desc: 'Cuộc trò chuyện đa nhân vật, host và khách mời' },
  { value: 'sach_noi', label: 'Sách nói (Audiobook)', desc: 'Đọc diễn cảm sách kỹ năng, kiến thức, tiểu thuyết' },
  { value: 'kich_ban_video', label: 'Kịch bản Video / Shorts', desc: 'Thuyết minh ngắn gọn, lôi cuốn cho TikTok, YouTube' },
  { value: 'tuy_chinh', label: 'Tùy chỉnh tự do', desc: 'Tự biên kịch kịch bản theo nhu cầu riêng' },
];

const STEPS = [
  { step: 1, title: 'Thông tin dự án', icon: BookOpen },
  { step: 2, title: 'Nhân vật & Giọng đọc', icon: Users },
  { step: 3, title: 'Sáng tác kịch bản', icon: FileText },
  { step: 4, title: 'Phân cảnh & Lời thoại', icon: Layers },
  { step: 5, title: 'Phòng thu & Sân khấu', icon: Mic },
  { step: 6, title: 'Biểu diễn & Kiểm định', icon: Play },
  { step: 7, title: 'Xuất SRT & Lưu trữ', icon: Save },
];

const DEFAULT_NARRATOR: StoryCharacter = {
  id: 'narrator_default',
  name: 'Người dẫn chuyện',
  role: 'narrator',
  gender: 'female',
  ageGroup: 'truong_thanh',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
  description: 'Giọng dẫn chính cho toàn bộ tác phẩm',
  personality: 'Truyền cảm, điềm tĩnh, ấm áp',
  voiceProfile: {
    voiceName: 'Kore',
    language: 'vi-VN',
    speed: 1.0,
    pitch: 0,
    pitchMultiplier: 1.0,
    style: 'Truyền cảm, rõ ràng',
    pauseDurationMs: 400,
    vnDialect: 'bac_chuan',
    regionalNuance: 'Truyền cảm, điềm tĩnh, phát âm chuẩn Hà Nội',
    intonationLevel: 1.0,
  },
  sampleDialogue: 'Ngày xửa ngày xưa, tại một vùng đất bình yên xa xôi...',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const VoiceStoryStudio: React.FC = () => {
  const [projects, setProjects] = useState<VoiceStoryProject[]>([]);
  const [currentProject, setCurrentProject] = useState<VoiceStoryProject | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterType, setSelectedFilterType] = useState<string>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Interactive Stage visibility & Workspace Layout Mode ('split' | 'stacked' | 'hidden')
  const [showInteractiveStage, setShowInteractiveStage] = useState(true);
  const [stageLayoutMode, setStageLayoutMode] = useState<'split' | 'stacked' | 'hidden'>('split');
  const [activeStageLineId, setActiveStageLineId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal State (3-Tab Cast Roster & Prompt Code Modal)
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [charModalTab, setCharModalTab] = useState<CastModalTab>('roster');
  const [editingCharacter, setEditingCharacter] = useState<StoryCharacter | null>(null);

  // AI Script Generation state
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [isGeneratingAiScript, setIsGeneratingAiScript] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Scene parsing state
  const [isParsingScenes, setIsParsingScenes] = useState(false);

  // Batch TTS Processing State
  const [isProcessingBatchTTS, setIsProcessingBatchTTS] = useState(false);
  const [ttsProgressMsg, setTtsProgressMsg] = useState('');

  const { setTheme, isDark, user, setIsAuthModalOpen } = useTheme();

  // Load and sync projects (Firestore if logged in, LocalStorage if guest)
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeVoiceStoryProjects(user.uid, (fetchedProjects) => {
        setProjects(fetchedProjects);
      });
      return () => unsubscribe();
    } else {
      const animId = requestAnimationFrame(() => {
        try {
          const localData = localStorage.getItem('utility_hub_local_story_projects');
          if (localData) {
            setProjects(JSON.parse(localData));
          } else {
            setProjects([]);
          }
        } catch (e) {
          console.warn('Lỗi đọc local projects:', e);
          setProjects([]);
        }
      });
      return () => cancelAnimationFrame(animId);
    }
  }, [user]);

  const saveLocalProjects = (updatedProjects: VoiceStoryProject[]) => {
    setProjects(updatedProjects);
    if (!user && typeof window !== 'undefined') {
      try {
        localStorage.setItem('utility_hub_local_story_projects', JSON.stringify(updatedProjects));
      } catch (e) {
        console.warn('Lỗi lưu local projects:', e);
      }
    }
  };

  // Compute Bento Metrics dynamically (for active project if editing, or across all projects on dashboard)
  const bentoStats = useMemo(() => {
    const targetCharacters = currentProject
      ? currentProject.characters
      : projects.length > 0
      ? projects.flatMap((p) => p.characters)
      : [DEFAULT_NARRATOR];

    const targetLines: DialogueLine[] = currentProject
      ? currentProject.chapters.flatMap((c) => c.scenes).flatMap((s) => s.lines)
      : projects.flatMap((p) => p.chapters.flatMap((c) => c.scenes).flatMap((s) => s.lines));

    const castCount = targetCharacters.length;
    const robotCount = targetCharacters.filter(
      (c) => c.gender === 'robot' || c.ageGroup === 'ai_robot' || c.role === 'ai_robot'
    ).length;

    const dialogueTurns = targetLines.length;

    // Calculate estimated duration from word count (~2.6 words/sec + pauseAfterMs)
    const totalSeconds = targetLines.reduce((acc, line) => {
      const words = Math.max(1, line.text.trim().split(/\s+/).length);
      const speakSec = Math.max(2.0, words / 2.6);
      const pauseSec = (line.pauseAfterMs || 300) / 1000;
      return acc + speakSec + pauseSec;
    }, 0);

    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.round(totalSeconds % 60);
    const durationFormatted =
      totalSeconds === 0
        ? '00:00'
        : `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

    const completedLines = targetLines.filter((l) => l.status === 'completed').length;
    const audioReadyPercent =
      dialogueTurns > 0 ? Math.round((completedLines / dialogueTurns) * 100) : 0;

    return {
      castCount,
      robotCount,
      dialogueTurns,
      durationFormatted,
      completedLines,
      audioReadyPercent,
    };
  }, [currentProject, projects]);

  const createNewProject = () => {
    const activeUserId = user?.uid || 'guest';

    const newProj: VoiceStoryProject = {
      id: 'story_' + Date.now(),
      userId: activeUserId,
      title: 'Dự án câu chuyện mới',
      contentType: 'truyen_ngan',
      description: '',
      language: 'vi-VN',
      targetAudience: 'Tất cả mọi người',
      author: user?.displayName || 'Tác giả AI Studio',
      characters: [DEFAULT_NARRATOR],
      storyText: '',
      chapters: [],
      currentStep: 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(newProj);
    setIsEditing(true);

    if (!user) {
      saveLocalProjects([newProj, ...projects]);
    }
  };

  // 1-Click Demo Script Loader (Quick Tool #1)
  const handleLoadDemoScript = () => {
    const activeUserId = user?.uid || 'guest';
    const demoPkg = createDemoStoryPackage();
    const now = new Date().toISOString();

    const demoProject: VoiceStoryProject = {
      id: currentProject?.id || 'story_demo_' + Date.now(),
      userId: activeUserId,
      title: demoPkg.title,
      contentType: 'podcast',
      description: 'Kịch bản mẫu đa nhân vật tích hợp AI Robot và giọng đọc Song ngữ VI - EN',
      language: 'vi-VN',
      targetAudience: 'Mọi đối tượng yêu thích công nghệ & kể chuyện',
      author: user?.displayName || 'Voice & Story Studio',
      characters: demoPkg.characters,
      storyText: demoPkg.storyText,
      chapters: [
        {
          id: 'chap_demo_1',
          chapterNumber: 1,
          title: 'Chương 1: Tần Số Bí Ẩn',
          scenes: demoPkg.scenes,
        },
      ],
      currentStep: 5,
      status: 'in_progress',
      createdAt: currentProject?.createdAt || now,
      updatedAt: now,
    };

    setCurrentProject(demoProject);
    setIsEditing(true);
    setShowInteractiveStage(true);

    if (!user) {
      const exists = projects.some((p) => p.id === demoProject.id);
      const updatedList = exists
        ? projects.map((p) => (p.id === demoProject.id ? demoProject : p))
        : [demoProject, ...projects];
      saveLocalProjects(updatedList);
    }
  };

  // Open Cast Roster Modal on specific tab (Quick Tools #2 & #3)
  const openCastModalWithTab = (tab: CastModalTab, charToEdit: StoryCharacter | null = null) => {
    if (!currentProject) {
      // Auto-initialize a project if user clicks from dashboard
      const activeUserId = user?.uid || 'guest';
      const newProj: VoiceStoryProject = {
        id: 'story_' + Date.now(),
        userId: activeUserId,
        title: 'Dự án câu chuyện mới',
        contentType: 'truyen_ngan',
        description: '',
        language: 'vi-VN',
        targetAudience: 'Tất cả mọi người',
        author: user?.displayName || 'Tác giả AI Studio',
        characters: [DEFAULT_NARRATOR],
        storyText: '',
        chapters: [],
        currentStep: 2,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentProject(newProj);
      setIsEditing(true);
    }
    setEditingCharacter(charToEdit);
    setCharModalTab(tab);
    setIsCharModalOpen(true);
  };

  const handleSaveToCloud = async () => {
    if (!currentProject) return;
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const saved = await saveVoiceStoryProject(user.uid, { ...currentProject, userId: user.uid });
      setCurrentProject(saved);
    } catch (err) {
      console.error('Lỗi khi lưu dự án:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (user) {
      try {
        await deleteVoiceStoryProject(user.uid, projectId);
      } catch (err) {
        console.error('Lỗi khi xóa dự án:', err);
      }
    } else {
      const updated = projects.filter((p) => p.id !== projectId);
      saveLocalProjects(updated);
    }

    if (currentProject?.id === projectId) {
      setCurrentProject(null);
      setIsEditing(false);
    }
  };

  // Character Management
  const handleSaveCharacter = (character: StoryCharacter) => {
    if (!currentProject) return;
    const existingIndex = currentProject.characters.findIndex((c) => c.id === character.id);
    const updatedChars = [...currentProject.characters];

    if (existingIndex >= 0) {
      updatedChars[existingIndex] = character;
    } else {
      updatedChars.push(character);
    }

    const updatedProj: VoiceStoryProject = {
      ...currentProject,
      characters: updatedChars,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProj);
    if (!user) {
      const updatedList = projects.some((p) => p.id === updatedProj.id)
        ? projects.map((p) => (p.id === updatedProj.id ? updatedProj : p))
        : [updatedProj, ...projects];
      saveLocalProjects(updatedList);
    }
  };

  const handleDeleteCharacter = (charId: string) => {
    if (!currentProject) return;
    const updatedChars = currentProject.characters.filter((c) => c.id !== charId);
    setCurrentProject({
      ...currentProject,
      characters: updatedChars,
    });
  };

  // AI Script Outline Generation
  const handleGenerateAiStory = async () => {
    if (!aiTopicInput.trim() || !currentProject) return;
    setIsGeneratingAiScript(true);
    try {
      const res = await fetch('/api/gemini/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_outline',
          title: currentProject.title,
          contentType: currentProject.contentType,
          topic: aiTopicInput,
          targetAudience: currentProject.targetAudience,
          characters: currentProject.characters,
        }),
      });

      const data = await res.json();
      if (data.generatedStoryText) {
        setCurrentProject({
          ...currentProject,
          storyText: data.generatedStoryText,
          title: data.suggestedTitle || currentProject.title,
        });
        setIsAiDrawerOpen(false);
        setAiTopicInput('');
      }
    } catch (err) {
      console.error('Lỗi tạo kịch bản với AI:', err);
    } finally {
      setIsGeneratingAiScript(false);
    }
  };

  // Auto Parse Scenes with AI (with offline regex fallback so it never fails)
  const [autoCastReports, setAutoCastReports] = useState<AutoCastAssignmentReport[]>([]);

  const handleAutoCastByScript = () => {
    if (!currentProject) return;
    const allLines = currentProject.chapters.flatMap((c) => c.scenes.flatMap((s) => s.lines));
    const { updatedCharacters, reports } = autoCastCharactersByScriptContext(
      currentProject.characters,
      currentProject.storyText || '',
      allLines
    );
    setAutoCastReports(reports);
    setCurrentProject({
      ...currentProject,
      characters: updatedCharacters,
    });
  };

  const handleQuickSelectCharacterMacroRegion = (charId: string, macroRegion: MacroRegionVN) => {
    if (!currentProject) return;
    const updatedChars = currentProject.characters.map((c) => {
      if (c.id !== charId) return c;
      const rec = getMacroRegionRecommendation(macroRegion, c.gender);
      const meta = getRegionalDialectMeta(rec.defaultDialect);
      return {
        ...c,
        voiceProfile: {
          ...c.voiceProfile,
          language: 'vi-VN' as const,
          vnDialect: rec.defaultDialect,
          regionalNuance: meta.defaultNuance,
          pitchMultiplier: rec.recommendedPitch,
          pitch: Math.round((rec.recommendedPitch - 1.0) * 15),
          speed: rec.recommendedRate,
        },
      };
    });
    setCurrentProject({
      ...currentProject,
      characters: updatedChars,
    });
  };

  const handleParseScenes = async () => {
    if (!currentProject || !currentProject.storyText.trim()) return;
    setIsParsingScenes(true);
    try {
      const res = await fetch('/api/gemini/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parse_scenes',
          storyText: currentProject.storyText,
          characters: currentProject.characters,
        }),
      });

      const data = await res.json();
      if (data.scenes && Array.isArray(data.scenes) && data.scenes.length > 0) {
        const parsedScenes: StoryScene[] = data.scenes.map((s: any, idx: number) => ({
          id: 'scene_' + (idx + 1) + '_' + Date.now(),
          sceneNumber: s.sceneNumber || idx + 1,
          title: s.title || `Cảnh ${idx + 1}`,
          description: s.description || '',
          setting: s.setting || 'Phòng thu Studio',
          status: 'unprocessed',
          lines: (s.lines || []).map((l: any, lIdx: number) => {
            const matchedChar = currentProject.characters.find(
              (c) => c.name.toLowerCase() === (l.characterName || '').toLowerCase()
            );
            return {
              id: `line_${idx + 1}_${lIdx + 1}_${Date.now()}`,
              characterId: matchedChar ? matchedChar.id : 'narrator_default',
              characterName: l.characterName || 'Người dẫn chuyện',
              text: l.text,
              emotionStyle: l.emotionStyle || 'Truyền cảm',
              pauseAfterMs: l.pauseAfterMs || 300,
              status: 'unprocessed',
            };
          }),
        }));

        const allParsedLines = parsedScenes.flatMap((s) => s.lines);
        const { updatedCharacters, reports } = autoCastCharactersByScriptContext(
          currentProject.characters,
          currentProject.storyText,
          allParsedLines
        );
        setAutoCastReports(reports);

        setCurrentProject({
          ...currentProject,
          characters: updatedCharacters,
          chapters: [
            {
              id: 'chap_1',
              chapterNumber: 1,
              title: 'Chương 1',
              scenes: parsedScenes,
            },
          ],
          currentStep: 4,
        });
        return;
      }
      throw new Error('Fallback to local line parser');
    } catch {
      // Local smart line parser fallback
      const rawLines = currentProject.storyText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const parsedLines: DialogueLine[] = rawLines.map((raw, idx) => {
        const colonIdx = raw.indexOf(':');
        if (colonIdx > 0 && colonIdx < 35) {
          const speakerName = raw.slice(0, colonIdx).trim();
          const textContent = raw.slice(colonIdx + 1).trim();
          const matchedChar = currentProject.characters.find(
            (c) => c.name.toLowerCase() === speakerName.toLowerCase()
          );
          return {
            id: `line_local_${idx + 1}_${Date.now()}`,
            characterId: matchedChar ? matchedChar.id : 'narrator_default',
            characterName: speakerName,
            text: textContent,
            emotionStyle: 'Tự nhiên',
            pauseAfterMs: 300,
            status: 'unprocessed',
          };
        }
        return {
          id: `line_local_${idx + 1}_${Date.now()}`,
          characterId: 'narrator_default',
          characterName: 'Người dẫn chuyện',
          text: raw,
          emotionStyle: 'Truyền cảm',
          pauseAfterMs: 350,
          status: 'unprocessed',
        };
      });

      const { updatedCharacters, reports } = autoCastCharactersByScriptContext(
        currentProject.characters,
        currentProject.storyText,
        parsedLines
      );
      setAutoCastReports(reports);

      setCurrentProject({
        ...currentProject,
        characters: updatedCharacters,
        chapters: [
          {
            id: 'chap_1',
            chapterNumber: 1,
            title: 'Chương 1',
            scenes: [
              {
                id: 'scene_1_' + Date.now(),
                sceneNumber: 1,
                title: 'Cảnh 1: Toàn cảnh câu chuyện',
                description: 'Phân cảnh tự động từ văn bản gốc',
                setting: 'Sân khấu chính',
                status: 'unprocessed',
                lines: parsedLines,
              },
            ],
          },
        ],
        currentStep: 4,
      });
    } finally {
      setIsParsingScenes(false);
    }
  };

  // Batch TTS Generation with Bilingual Engine (vi-VN & en-US) + Safe Fallback
  const handleBatchGenerateTTS = async () => {
    if (!currentProject) {
      handleLoadDemoScript();
      return;
    }
    const allScenes = currentProject.chapters.flatMap((c) => c.scenes);
    const allLines = allScenes.flatMap((s) => s.lines);

    if (allLines.length === 0) {
      return;
    }

    const pendingLines = allLines.filter((l) => l.status !== 'completed' || !l.audioUrl);
    if (pendingLines.length === 0) {
      return;
    }

    setIsProcessingBatchTTS(true);
    let updatedProject = { ...currentProject };

    for (let i = 0; i < pendingLines.length; i++) {
      const line = pendingLines[i];
      const matchedChar = updatedProject.characters.find(
        (c) => c.id === line.characterId || c.name === line.characterName
      );
      const lang = normalizeBilingualLang(matchedChar?.voiceProfile?.language);

      setTtsProgressMsg(
        `Đang tổng hợp (${lang}) câu ${i + 1}/${pendingLines.length}: \u201C${line.text.slice(0, 35)}...\u201D`
      );

      const result = await synthesizeOrSpeakBilingual({
        text: line.text,
        character: matchedChar,
        emotionStyle: line.emotionStyle,
      });

      const resolvedAudioUrl = result.audioUrl || 'browser_tts_ready';

      updatedProject = {
        ...updatedProject,
        chapters: updatedProject.chapters.map((chap) => ({
          ...chap,
          scenes: chap.scenes.map((scene) => ({
            ...scene,
            lines: scene.lines.map((l) =>
              l.id === line.id ? { ...l, audioUrl: resolvedAudioUrl, status: 'completed' } : l
            ),
          })),
        })),
      };
      setCurrentProject(updatedProject);
    }

    setIsProcessingBatchTTS(false);
    setTtsProgressMsg('');
  };

  // Individual Line TTS Generation with Bilingual Engine
  const handleSingleLineTTS = async (sceneId: string, lineId: string) => {
    if (!currentProject) return;
    const allLines = currentProject.chapters.flatMap((c) => c.scenes).flatMap((s) => s.lines);
    const line = allLines.find((l) => l.id === lineId);
    if (!line) return;

    const matchedChar = currentProject.characters.find(
      (c) => c.id === line.characterId || c.name === line.characterName
    );

    let updatedProject = {
      ...currentProject,
      chapters: currentProject.chapters.map((chap) => ({
        ...chap,
        scenes: chap.scenes.map((scene) => ({
          ...scene,
          lines: scene.lines.map((l) =>
            l.id === lineId ? { ...l, status: 'processing' as const } : l
          ),
        })),
      })),
    };
    setCurrentProject(updatedProject);

    const result = await synthesizeOrSpeakBilingual({
      text: line.text,
      character: matchedChar,
      emotionStyle: line.emotionStyle,
    });

    const resolvedAudioUrl = result.audioUrl || 'browser_tts_ready';

    updatedProject = {
      ...updatedProject,
      chapters: updatedProject.chapters.map((chap) => ({
        ...chap,
        scenes: chap.scenes.map((scene) => ({
          ...scene,
          lines: scene.lines.map((l) =>
            l.id === lineId
              ? { ...l, audioUrl: resolvedAudioUrl, status: 'completed' as const }
              : l
          ),
        })),
      })),
    };
    setCurrentProject(updatedProject);
  };

  // Filter projects for dashboard
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedFilterType === 'all' || p.contentType === selectedFilterType;
    return matchesSearch && matchesType;
  });

  // Export TXT Script
  const handleExportTextScript = () => {
    if (!currentProject) return;
    const content =
      `TIÊU ĐỀ: ${currentProject.title}\nTÁC GIẢ: ${currentProject.author}\nTHỂ LOẠI: ${currentProject.contentType}\n\n` +
      currentProject.chapters
        .flatMap((c) => c.scenes)
        .map(
          (s) =>
            `--- CẢNH ${s.sceneNumber}: ${s.title} ---\n` +
            s.lines.map((l) => `${l.characterName}: ${l.text}`).join('\n')
        )
        .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProject.title.replace(/\s+/g, '_')}_kich_ban.txt`;
    link.click();
  };

  // Export SRT Subtitles (Quick Tool #4)
  const handleExportSRT = () => {
    const linesToExport = currentProject
      ? currentProject.chapters.flatMap((c) => c.scenes).flatMap((s) => s.lines)
      : createDemoStoryPackage().scenes.flatMap((s) => s.lines);

    if (linesToExport.length === 0) return;

    const srtContent = generateSRTSubtitles(linesToExport);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = (currentProject?.title || 'Voice_Story_Subtitles').replace(/\s+/g, '_');
    link.download = `${baseName}.srt`;
    link.click();
  };

  const activeLinesForStage = useMemo(() => {
    if (currentProject) {
      const lines = currentProject.chapters.flatMap((c) => c.scenes).flatMap((s) => s.lines);
      if (lines.length > 0) return lines;
    }
    return createDemoStoryPackage().scenes.flatMap((s) => s.lines);
  }, [currentProject]);

  const activeCharsForStage = useMemo(() => {
    if (currentProject && currentProject.characters.length > 0) {
      return currentProject.characters;
    }
    return createDemoStoryPackage().characters;
  }, [currentProject]);

  // Shared Dynamic Theme Classes for Light & Dark Modes
  const panelClass = isDark
    ? 'bg-gray-900/80 border-white/10 text-white'
    : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-lg shadow-indigo-500/5';

  const subCardClass = isDark
    ? 'bg-white/5 border-white/10 text-gray-200'
    : 'bg-slate-50/90 border-slate-200/90 text-slate-800';

  const inputFieldClass = isDark
    ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-purple-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-purple-600 shadow-sm';

  return (
    <div
      className={`w-full space-y-5 max-w-7xl mx-auto pb-8 transition-colors duration-300 ${
        isDark ? 'text-gray-100' : 'text-slate-900'
      }`}
    >
      {/* Header Banner & Workspace Command Bar */}
      <div
        className={`relative overflow-hidden rounded-[14px] border p-5 md:p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          isDark
            ? 'bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-blue-900/80 border-white/15'
            : 'bg-gradient-to-r from-purple-100 via-indigo-50 to-blue-100 border-purple-200/80 shadow-purple-500/10'
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -z-10 pointer-events-none ${
            isDark ? 'bg-purple-500/10' : 'bg-purple-400/20'
          }`}
        />
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${
                  isDark
                    ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                    : 'bg-white/90 border-purple-300 text-purple-700 shadow-sm'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Giọng Đọc Đa Nhân Vật • Song Ngữ VI / EN
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${
                  isDark
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                    : 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> Chuẩn Giọng Vùng Miền Bắc • Trung • Nam • Tây Nguyên
              </span>
            </div>
            <h1
              className={`text-xl md:text-2xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Phòng sáng tạo giọng nói và kể chuyện
            </h1>
            <p
              className={`text-xs md:text-sm leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-slate-700'
              }`}
            >
              Tạo câu chuyện, podcast, kịch bản đa nhân vật (Con người & AI Robot) với giọng vùng miền
              đặc trưng và biểu diễn trực tiếp trên sân khấu 3D/2D Lip-sync thời gian thực.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Workspace Layout Switcher: Split Studio | Full Stage | Focus Editor */}
            <div
              className={`inline-flex items-center p-1 rounded-[14px] border transition-colors ${
                isDark
                  ? 'bg-black/35 border-white/15'
                  : 'bg-white/90 border-slate-200 shadow-sm'
              }`}
              role="group"
              aria-label="Chế độ bố cục không gian làm việc"
            >
              <button
                type="button"
                onClick={() => {
                  setShowInteractiveStage(true);
                  setStageLayoutMode('split');
                }}
                className={`px-2.5 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showInteractiveStage && stageLayoutMode === 'split'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : isDark
                    ? 'text-gray-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Bố cục Song Song: Vừa biên tập kịch bản vừa xem Sân khấu 3D/2D bên cạnh"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Song Song</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInteractiveStage(true);
                  setStageLayoutMode('stacked');
                }}
                className={`px-2.5 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showInteractiveStage && stageLayoutMode === 'stacked'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : isDark
                    ? 'text-gray-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Bố cục Toàn Khung: Sân khấu 3D/2D rộng toàn màn hình phía trên"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Toàn Khung</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInteractiveStage(false);
                  setStageLayoutMode('hidden');
                }}
                className={`px-2.5 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  !showInteractiveStage || stageLayoutMode === 'hidden'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : isDark
                    ? 'text-gray-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tập trung biên tập: Ẩn sân khấu để mở rộng tối đa vùng soạn thảo"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Ẩn Sân Khấu</span>
              </button>
            </div>

            {/* Light / Dark Mode Segmented Switcher */}
            <div
              className={`inline-flex items-center p-1 rounded-[14px] border transition-colors ${
                isDark
                  ? 'bg-black/35 border-white/15'
                  : 'bg-white/90 border-slate-200 shadow-sm'
              }`}
              role="group"
              aria-label="Chuyển đổi giao diện Sáng và Tối"
            >
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-2.5 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
                title="Chuyển sang Giao diện Sáng (Light Mode)"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sáng</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-2.5 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chuyển sang Giao diện Tối (Dark Mode)"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tối</span>
              </button>
            </div>

            {isEditing ? (
              <button
                onClick={() => setIsEditing(false)}
                className={`px-3.5 py-2 rounded-[14px] text-xs font-medium backdrop-blur-sm border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                }`}
              >
                <FolderPlus className="w-4 h-4" /> Danh sách dự án
              </button>
            ) : (
              <button
                onClick={createNewProject}
                className="px-4 py-2 rounded-[14px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tạo dự án mới
              </button>
            )}
          </div>
        </div>
      </div>

      {/* UNIFIED COMMAND DECK: 4 BENTO STATS + 4 QUICK ACTION TOOLS */}
      <div
        className={`p-4 rounded-[14px] border backdrop-blur-xl shadow-xl space-y-4 transition-colors ${
          isDark
            ? 'bg-gray-900/85 border-white/15'
            : 'bg-white/95 border-slate-200/90 shadow-indigo-500/5'
        }`}
      >
        {/* Row 1: 4 Compact Bento Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Cast Count */}
          <div
            className={`p-3.5 rounded-[14px] border flex items-center justify-between transition-colors ${
              isDark
                ? 'bg-gradient-to-br from-gray-900/90 to-purple-950/30 border-white/10'
                : 'bg-gradient-to-br from-white to-purple-50/70 border-purple-200/80'
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <p className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Nhân vật (Cast Roster)
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {bentoStats.castCount}
                </h3>
                {bentoStats.robotCount > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-medium ${
                      isDark
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                    }`}
                  >
                    <Bot className="w-2.5 h-2.5" /> {bentoStats.robotCount} Robot
                  </span>
                )}
              </div>
              <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                Nam, Nữ, Robot & 9 vùng miền
              </p>
            </div>
            <div
              className={`p-2.5 rounded-[12px] border shrink-0 ${
                isDark
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                  : 'bg-purple-100 border-purple-200 text-purple-700'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Dialogue Turns */}
          <div
            className={`p-3.5 rounded-[14px] border flex items-center justify-between transition-colors ${
              isDark
                ? 'bg-gradient-to-br from-gray-900/90 to-indigo-950/30 border-white/10'
                : 'bg-gradient-to-br from-white to-indigo-50/70 border-indigo-200/80'
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <p className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Lượt thoại (Dialogue Turns)
              </p>
              <h3 className={`text-xl font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>
                {bentoStats.dialogueTurns}
              </h3>
              <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                Song ngữ chuẩn vi-VN & en-US
              </p>
            </div>
            <div
              className={`p-2.5 rounded-[12px] border shrink-0 ${
                isDark
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                  : 'bg-indigo-100 border-indigo-200 text-indigo-700'
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Estimated Duration */}
          <div
            className={`p-3.5 rounded-[14px] border flex items-center justify-between transition-colors ${
              isDark
                ? 'bg-gradient-to-br from-gray-900/90 to-cyan-950/30 border-white/10'
                : 'bg-gradient-to-br from-white to-cyan-50/70 border-cyan-200/80'
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <p className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Thời lượng ước tính
              </p>
              <h3
                className={`text-xl font-bold font-mono ${
                  isDark ? 'text-cyan-400' : 'text-cyan-700'
                }`}
              >
                {bentoStats.durationFormatted}
              </h3>
              <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                Tính tự động nhịp nghỉ & tốc độ
              </p>
            </div>
            <div
              className={`p-2.5 rounded-[12px] border shrink-0 ${
                isDark
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                  : 'bg-cyan-100 border-cyan-200 text-cyan-700'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Audio Ready % */}
          <div
            className={`p-3.5 rounded-[14px] border space-y-1.5 transition-colors ${
              isDark
                ? 'bg-gradient-to-br from-gray-900/90 to-emerald-950/30 border-white/10'
                : 'bg-gradient-to-br from-white to-emerald-50/70 border-emerald-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Trạng thái âm thanh
              </p>
              <span
                className={`text-xs font-bold font-mono ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              >
                {bentoStats.audioReadyPercent}% Ready
              </span>
            </div>
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden ${
                isDark ? 'bg-white/10' : 'bg-emerald-100'
              }`}
            >
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${Math.max(8, bentoStats.audioReadyPercent)}%` }}
              />
            </div>
            <div
              className={`flex items-center justify-between text-[10px] ${
                isDark ? 'text-gray-400' : 'text-slate-600'
              }`}
            >
              <span>
                {bentoStats.completedLines}/{bentoStats.dialogueTurns} câu thoại
              </span>
              <span
                className={`flex items-center gap-1 font-medium ${
                  isDark ? 'text-emerald-300' : 'text-emerald-700'
                }`}
              >
                <Globe className="w-3 h-3" /> Cloud + Fallback
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: 4 Quick Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-white/5">
          {/* Tool 1: 1-Click Demo Script Loader */}
          <button
            type="button"
            onClick={handleLoadDemoScript}
            className={`p-3 rounded-[14px] border text-left transition-all flex items-center gap-3 group cursor-pointer ${
              isDark
                ? 'bg-gradient-to-br from-purple-600/25 to-indigo-600/20 hover:from-purple-600/40 hover:to-indigo-600/35 border-purple-500/40'
                : 'bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-purple-200 shadow-sm'
            }`}
          >
            <div
              className={`p-2 rounded-[12px] group-hover:scale-110 transition-transform shrink-0 ${
                isDark
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-purple-600 text-white shadow-sm'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div
                className={`text-xs font-bold truncate ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Nạp Kịch Bản Mẫu 1-Chạm
              </div>
              <div
                className={`text-[10px] truncate ${
                  isDark ? 'text-purple-300' : 'text-purple-700'
                }`}
              >
                Đầy đủ Con người + AI Robot (VI/EN)
              </div>
            </div>
          </button>

          {/* Tool 2: Open Cast Roster Modal */}
          <button
            type="button"
            onClick={() => openCastModalWithTab('roster', null)}
            className={`p-3 rounded-[14px] border text-left transition-all flex items-center gap-3 group cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/15'
                : 'bg-slate-50 hover:bg-indigo-50/60 border-slate-200 shadow-sm'
            }`}
          >
            <div
              className={`p-2 rounded-[12px] group-hover:scale-110 transition-transform shrink-0 ${
                isDark
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div
                className={`text-xs font-bold truncate ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Quản Lý Dàn Nhân Vật & Vùng Miền
              </div>
              <div
                className={`text-[10px] truncate ${
                  isDark ? 'text-gray-400' : 'text-slate-600'
                }`}
              >
                Chỉnh giọng Bắc/Trung/Nam & Avatar 3D
              </div>
            </div>
          </button>

          {/* Tool 3: AI Character Prompt Code Creator */}
          <button
            type="button"
            onClick={() => openCastModalWithTab('prompt_code', null)}
            className={`p-3 rounded-[14px] border text-left transition-all flex items-center gap-3 group cursor-pointer ${
              isDark
                ? 'bg-gradient-to-br from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/35 hover:to-blue-600/35 border-cyan-500/35'
                : 'bg-gradient-to-br from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 border-cyan-200 shadow-sm'
            }`}
          >
            <div
              className={`p-2 rounded-[12px] group-hover:scale-110 transition-transform shrink-0 ${
                isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-600 text-white shadow-sm'
              }`}
            >
              <Code2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div
                className={`text-xs font-bold truncate ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Tạo Bằng Prompt Code
              </div>
              <div
                className={`text-[10px] truncate ${
                  isDark ? 'text-cyan-300' : 'text-cyan-700'
                }`}
              >
                Preset CyberBot-X9, Bác Ba, Bé Su...
              </div>
            </div>
          </button>

          {/* Tool 4: Batch Synthesize & Export SRT */}
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={handleBatchGenerateTTS}
              disabled={isProcessingBatchTTS}
              className={`flex-1 p-3 rounded-[14px] border text-left transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-gradient-to-br from-emerald-600/25 to-teal-600/20 hover:from-emerald-600/40 hover:to-teal-600/35 border-emerald-500/40'
                  : 'bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-200 shadow-sm'
              }`}
            >
              <div
                className={`p-2 rounded-[12px] shrink-0 ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-emerald-600 text-white shadow-sm'
                }`}
              >
                {isProcessingBatchTTS ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div
                  className={`text-xs font-bold truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Tổng Hợp Giọng
                </div>
                <div
                  className={`text-[10px] truncate ${
                    isDark ? 'text-emerald-300' : 'text-emerald-700'
                  }`}
                >
                  Bilingual TTS
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleExportSRT}
              className={`px-3 rounded-[14px] border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/15 border-white/15 text-gray-200 hover:text-white'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900 shadow-sm'
              }`}
              title="Xuất tệp phụ đề chuẩn .SRT"
            >
              <Subtitles className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              <span className="text-[10px] font-bold">Xuất SRT</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODULE D (STACKED MODE): SÂN KHẤU BIỂU DIỄN TOÀN KHUNG PHÍA TRÊN */}
      {showInteractiveStage && stageLayoutMode === 'stacked' && (
        <InteractiveCharacterStage
          characters={activeCharsForStage}
          lines={activeLinesForStage}
          activeLineId={activeStageLineId}
          onSelectLine={(id) => setActiveStageLineId(id)}
          projectTitle={
            currentProject
              ? `Sân Khấu: ${currentProject.title}`
              : 'Sân Khấu Biểu Diễn Đa Nhân Vật (Chế Độ Toàn Khung)'
          }
        />
      )}

      {/* MAIN WORKSPACE GRID: Supports Split-Screen (Editor Left + Stage Right) or Full-Width */}
      <div
        className={
          showInteractiveStage && stageLayoutMode === 'split'
            ? 'grid grid-cols-1 xl:grid-cols-12 gap-6 items-start'
            : 'space-y-6'
        }
      >
        <div
          className={
            showInteractiveStage && stageLayoutMode === 'split'
              ? 'xl:col-span-7 space-y-5 min-w-0'
              : 'w-full space-y-5 min-w-0'
          }
        >
          {/* VIEW 1: PROJECT WIZARD / EDITOR */}
          {isEditing && currentProject ? (
            <div className="space-y-5">
              {/* Responsive 7-Step Progress Grid Bar (No Horizontal Scroll Needed) */}
              <div
                className={`p-3 rounded-[14px] border backdrop-blur-xl transition-colors ${panelClass}`}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                  {STEPS.map((s) => {
                    const isActive = currentProject.currentStep === s.step;
                    const isDone = currentProject.currentStep > s.step;

                    return (
                      <button
                        key={s.step}
                        onClick={() => setCurrentProject({ ...currentProject, currentStep: s.step })}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-[12px] text-[11px] font-medium transition-all cursor-pointer min-w-0 ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-semibold'
                            : isDone
                            ? isDark
                              ? 'bg-purple-950/40 text-purple-300 border border-purple-500/30'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                            : isDark
                            ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                            isActive
                              ? 'bg-white text-purple-600 font-bold'
                              : isDone
                              ? isDark
                                ? 'bg-purple-500/30 text-purple-300'
                                : 'bg-purple-200 text-purple-700'
                              : isDark
                              ? 'bg-white/10 text-gray-400'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2
                              className={`w-3 h-3 ${
                                isDark ? 'text-purple-400' : 'text-purple-600'
                              }`}
                            />
                          ) : (
                            s.step
                          )}
                        </div>
                        <span className="truncate">{s.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 1: PROJECT INFO */}
              {currentProject.currentStep === 1 && (
                <div className={`p-6 rounded-[14px] border space-y-6 transition-colors ${panelClass}`}>
                  <div
                    className={`border-b pb-4 ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    }`}
                  >
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Bước 1: Khởi tạo thông tin dự án
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                      Xác định thể loại, tiêu đề và đối tượng thưởng thức để AI tối ưu giọng đọc và nhịp điệu.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-slate-700'
                        }`}
                      >
                        Tên dự án / Tiêu đề kịch bản *
                      </label>
                      <input
                        type="text"
                        value={currentProject.title}
                        onChange={(e) => setCurrentProject({ ...currentProject, title: e.target.value })}
                        placeholder="e.g. Chuyến phiêu lưu của Dế Mèn, Khám phá vũ trụ..."
                        className={`w-full px-4 py-2.5 border rounded-[14px] text-sm focus:outline-none ${inputFieldClass}`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-slate-700'
                        }`}
                      >
                        Tác giả / Người thực hiện
                      </label>
                      <input
                        type="text"
                        value={currentProject.author}
                        onChange={(e) => setCurrentProject({ ...currentProject, author: e.target.value })}
                        className={`w-full px-4 py-2.5 border rounded-[14px] text-sm focus:outline-none ${inputFieldClass}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-slate-700'
                      }`}
                    >
                      Chọn thể loại nội dung
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {CONTENT_TYPES.map((ct) => (
                        <button
                          key={ct.value}
                          onClick={() => setCurrentProject({ ...currentProject, contentType: ct.value })}
                          className={`p-4 rounded-[14px] border text-left transition-all cursor-pointer ${
                            currentProject.contentType === ct.value
                              ? isDark
                                ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg'
                                : 'bg-purple-50 border-purple-500 text-slate-900 shadow-sm'
                              : isDark
                              ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50/40'
                          }`}
                        >
                          <h4
                            className={`text-sm font-semibold mb-1 ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {ct.label}
                          </h4>
                          <p
                            className={`text-xs line-clamp-2 ${
                              isDark ? 'text-gray-400' : 'text-slate-600'
                            }`}
                          >
                            {ct.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${
                        isDark ? 'text-gray-300' : 'text-slate-700'
                      }`}
                    >
                      Đối tượng khán giả mục tiêu
                    </label>
                    <input
                      type="text"
                      value={currentProject.targetAudience}
                      onChange={(e) =>
                        setCurrentProject({ ...currentProject, targetAudience: e.target.value })
                      }
                      placeholder="e.g. Trẻ em từ 6-12 tuổi, Giới trẻ mê công nghệ, Người trưởng thành..."
                      className={`w-full px-4 py-2.5 border rounded-[14px] text-sm focus:outline-none ${inputFieldClass}`}
                    />
                  </div>

                  <div
                    className={`flex justify-end gap-3 pt-4 border-t ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => setCurrentProject({ ...currentProject, currentStep: 2 })}
                      className="px-5 py-2.5 rounded-[14px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      Tiếp theo: Quản lý nhân vật <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CHARACTER & VOICE STUDIO */}
              {currentProject.currentStep === 2 && (
                <div className={`p-6 rounded-[14px] border space-y-6 transition-colors ${panelClass}`}>
                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Bước 2: Nhân vật, Giọng vùng miền & Song ngữ (VI / EN)
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                        Cấu hình giọng đọc tiếng Việt theo 9 vùng miền, sắc thái ngữ điệu, hoặc khởi tạo bằng AI Prompt Code.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutoCastByScript}
                        title="Tự động gán giọng vùng miền (Huế, Miền Tây, Sài Gòn, Bắc Bộ...) theo bối cảnh kịch bản"
                        className={`px-3.5 py-2 rounded-[14px] border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isDark
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
                            : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                        }`}
                      >
                        <Wand2 className="w-3.5 h-3.5" /> Auto Cast Đa Vùng Miền
                      </button>
                      <button
                        onClick={() => openCastModalWithTab('prompt_code', null)}
                        className={`px-4 py-2 rounded-[14px] border text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                          isDark
                            ? 'bg-indigo-600/30 hover:bg-indigo-600 border-indigo-500/40 text-indigo-200 hover:text-white'
                            : 'bg-indigo-50 hover:bg-indigo-600 border-indigo-200 text-indigo-700 hover:text-white'
                        }`}
                      >
                        <Code2 className="w-4 h-4" /> + Tạo bằng Prompt Code
                      </button>
                      <button
                        onClick={() => openCastModalWithTab('manual', null)}
                        className="px-4 py-2 rounded-[14px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Thêm nhân vật mới
                      </button>
                    </div>
                  </div>

                  {autoCastReports.length > 0 && (
                    <div
                      className={`p-3.5 rounded-[14px] border text-xs space-y-2 ${
                        isDark
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-amber-50/90 border-amber-300 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Kết quả Phân vai Đa vùng miền tự động (Multi-Region Auto Cast):
                        </span>
                        <button
                          type="button"
                          onClick={() => setAutoCastReports([])}
                          className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
                        >
                          Ẩn
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {autoCastReports.map((rep) => (
                          <div
                            key={rep.characterId}
                            className={`p-2 rounded-[10px] border text-[11px] ${
                              isDark ? 'bg-black/25 border-white/10' : 'bg-white border-amber-200'
                            }`}
                          >
                            <div className="font-bold">
                              {rep.characterName} → <span className="text-amber-500">{rep.dialectLabel}</span>
                            </div>
                            <div className="opacity-80 mt-0.5">
                              {rep.reason} • Pitch {rep.pitchMultiplier}x • Tốc độ {rep.speed}x
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentProject.characters.map((char) => {
                      const isRobot =
                        char.gender === 'robot' ||
                        char.ageGroup === 'ai_robot' ||
                        char.role === 'ai_robot';
                      const lang = normalizeBilingualLang(char.voiceProfile?.language);
                      const pitchMult = normalizePitchMultiplier(
                        char.voiceProfile?.pitch,
                        char.voiceProfile?.pitchMultiplier
                      );
                      const dialectMeta = getRegionalDialectMeta(char.voiceProfile?.vnDialect);
                      const currentMacro = getMacroRegionForDialect(char.voiceProfile?.vnDialect);

                      return (
                        <div
                          key={char.id}
                          className={`p-4 rounded-[14px] border space-y-3 relative group transition-colors backdrop-blur-xl ${
                            isRobot
                              ? isDark
                                ? 'bg-cyan-950/25 border-cyan-500/30 hover:border-cyan-400'
                                : 'bg-cyan-50/70 border-cyan-300 hover:border-cyan-500 shadow-sm'
                              : isDark
                              ? 'bg-white/5 border-white/10 hover:border-purple-500/50'
                              : 'bg-slate-50/80 border-slate-200 hover:border-purple-400 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={char.avatarUrl}
                              alt={char.name}
                              className="w-12 h-12 rounded-full object-cover border border-purple-500/30 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h4
                                className={`text-sm font-semibold flex items-center gap-1.5 flex-wrap ${
                                  isDark ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                <span className="truncate">{char.name}</span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-normal ${
                                    isDark
                                      ? 'bg-purple-500/20 text-purple-300'
                                      : 'bg-purple-100 text-purple-700 border border-purple-200'
                                  }`}
                                >
                                  {isRobot ? 'AI Robot' : char.role}
                                </span>
                              </h4>
                              <p
                                className={`text-xs mt-0.5 ${
                                  isDark ? 'text-gray-400' : 'text-slate-600'
                                }`}
                              >
                                Giọng:{' '}
                                <span
                                  className={`font-medium ${
                                    isDark ? 'text-purple-400' : 'text-purple-700'
                                  }`}
                                >
                                  {char.voiceProfile?.voiceName}
                                </span>{' '}
                                •{' '}
                                <span
                                  className={`font-mono ${
                                    isDark ? 'text-emerald-400' : 'text-emerald-700 font-semibold'
                                  }`}
                                >
                                  {lang}
                                </span>{' '}
                                • Pitch {pitchMult}x • Rate {char.voiceProfile?.speed || 1}x
                              </p>

                              {/* Regional Dialect Badge */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                                    isDark
                                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                      : 'bg-amber-50 border-amber-300 text-amber-800'
                                  }`}
                                >
                                  <MapPin className="w-2.5 h-2.5" /> {dialectMeta.shortBadge}
                                </span>
                                {char.voiceProfile?.regionalNuance && (
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full border truncate max-w-[180px] ${
                                      isDark
                                        ? 'bg-white/5 border-white/10 text-gray-300'
                                        : 'bg-white border-slate-200 text-slate-600'
                                    }`}
                                    title={char.voiceProfile.regionalNuance}
                                  >
                                    {char.voiceProfile.regionalNuance}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Trường chọn nhanh 'Vùng miền' (Bắc / Trung / Nam) cho nhân vật Tiếng Việt */}
                          {lang === 'vi-VN' && (
                            <div
                              className={`p-2.5 rounded-[12px] border flex flex-wrap items-center justify-between gap-2 ${
                                isDark
                                  ? 'bg-black/25 border-white/10'
                                  : 'bg-white/90 border-slate-200/90'
                              }`}
                            >
                              <span
                                className={`text-[11px] font-semibold flex items-center gap-1 ${
                                  isDark ? 'text-amber-300' : 'text-amber-800'
                                }`}
                              >
                                <MapPin className="w-3 h-3" /> Vùng miền (Gợi ý Pitch/Rate):
                              </span>
                              <div className="flex items-center gap-1">
                                {VN_MACRO_REGIONS.map((macro) => {
                                  const isSelected = currentMacro === macro.id;
                                  return (
                                    <button
                                      key={macro.id}
                                      type="button"
                                      onClick={() =>
                                        handleQuickSelectCharacterMacroRegion(char.id, macro.id)
                                      }
                                      className={`px-2.5 py-1 rounded-[8px] text-[10px] font-bold transition-all cursor-pointer border ${
                                        isSelected
                                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                          : isDark
                                          ? 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-amber-50'
                                      }`}
                                      title={`${macro.label}: ${macro.accentSummary}`}
                                    >
                                      {macro.shortLabel}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <p
                            className={`text-xs italic line-clamp-2 break-words ${
                              isDark ? 'text-gray-300' : 'text-slate-600'
                            }`}
                          >
                            &ldquo;{char.sampleDialogue}&rdquo;
                          </p>

                          <div
                            className={`flex items-center justify-end gap-2 pt-2 border-t ${
                              isDark ? 'border-white/5' : 'border-slate-200/80'
                            }`}
                          >
                            <button
                              onClick={() => openCastModalWithTab('manual', char)}
                              className={`p-1.5 rounded-[14px] text-xs transition-colors flex items-center gap-1 cursor-pointer ${
                                isDark
                                  ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa & Vùng miền
                            </button>
                            {char.role !== 'narrator' && (
                              <button
                                onClick={() => handleDeleteCharacter(char.id)}
                                className={`p-1.5 rounded-[14px] text-xs transition-colors cursor-pointer ${
                                  isDark
                                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                    : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className={`flex justify-between items-center pt-4 border-t ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => setCurrentProject({ ...currentProject, currentStep: 1 })}
                      className={`px-4 py-2.5 rounded-[14px] text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                        isDark
                          ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" /> Quay lại
                    </button>
                    <button
                      onClick={() => setCurrentProject({ ...currentProject, currentStep: 3 })}
                      className="px-5 py-2.5 rounded-[14px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      Tiếp theo: Sáng tác kịch bản <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

          {/* STEP 3: SÁNG TÁC & KỊCH BẢN */}
          {currentProject.currentStep === 3 && (
            <div className={`p-6 rounded-[14px] border space-y-6 transition-colors ${panelClass}`}>
              <div
                className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Bước 3: Biên soạn kịch bản & nội dung
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                    Tự dán nội dung văn bản, nạp kịch bản mẫu 1-chạm hoặc dùng trợ lý AI sáng tạo tự động.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLoadDemoScript}
                    className={`px-3.5 py-2 rounded-[14px] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'bg-white/10 hover:bg-white/15 text-purple-300'
                        : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                    }`}
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Nạp kịch bản mẫu
                  </button>
                  <button
                    onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
                    className="px-4 py-2 rounded-[14px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-medium transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" /> Sáng tạo kịch bản với AI
                  </button>
                </div>
              </div>

              {/* AI Assistant Generator Panel */}
              {isAiDrawerOpen && (
                <div
                  className={`p-4 rounded-[14px] border space-y-3 ${
                    isDark
                      ? 'bg-purple-950/30 border-purple-500/30'
                      : 'bg-purple-50/80 border-purple-200'
                  }`}
                >
                  <h4
                    className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                      isDark ? 'text-purple-300' : 'text-purple-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Trợ lý viết câu chuyện Gemini AI
                  </h4>
                  <textarea
                    rows={3}
                    value={aiTopicInput}
                    onChange={(e) => setAiTopicInput(e.target.value)}
                    placeholder="Mô tả ý tưởng kịch bản, tình huống, bài học cốt lõi hoặc câu chuyện muốn viết..."
                    className={`w-full px-3 py-2 border rounded-[14px] text-xs focus:outline-none ${inputFieldClass}`}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsAiDrawerOpen(false)}
                      className={`px-3 py-1.5 rounded-[14px] text-xs cursor-pointer ${
                        isDark
                          ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      Đóng
                    </button>
                    <button
                      onClick={handleGenerateAiStory}
                      disabled={isGeneratingAiScript || !aiTopicInput.trim()}
                      className="px-4 py-1.5 rounded-[14px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isGeneratingAiScript ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang sáng tác...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> Tạo kịch bản ngay
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Main Script Textarea */}
              <div>
                <label
                  className={`block text-xs font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-slate-700'
                  }`}
                >
                  Nội dung kịch bản văn bản gốc
                </label>
                <textarea
                  rows={12}
                  value={currentProject.storyText}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, storyText: e.target.value })
                  }
                  placeholder={`Định dạng mẫu:\n\nNgười dẫn chuyện: Ngày xửa ngày xưa ở một ngôi làng nhỏ...\nCyberBot-X9: Hệ thống khởi động hoàn tất!\nBé Su: Chào bạn Robot thông minh nhé!`}
                  className={`w-full p-4 border rounded-[14px] text-sm focus:outline-none font-sans leading-relaxed ${inputFieldClass}`}
                />
              </div>

              <div
                className={`flex justify-between items-center pt-4 border-t ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => setCurrentProject({ ...currentProject, currentStep: 2 })}
                  className={`px-4 py-2.5 rounded-[14px] text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>
                <button
                  onClick={handleParseScenes}
                  disabled={isParsingScenes || !currentProject.storyText.trim()}
                  className="px-5 py-2.5 rounded-[14px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isParsingScenes ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang phân tích kịch bản...
                    </>
                  ) : (
                    <>
                      Phân cảnh tự động & Tiếp tục <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PHÂN CẢNH & LỜI THOẠI */}
          {currentProject.currentStep === 4 && (
            <div className={`p-6 rounded-[14px] border space-y-6 transition-colors ${panelClass}`}>
              <div
                className={`flex items-center justify-between border-b pb-4 ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Bước 4: Phân cảnh & Biên tập lời thoại
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                    Xem và chỉnh sửa người phát ngôn, sắc thái cảm xúc cho từng phân cảnh.
                  </p>
                </div>
                <button
                  onClick={handleParseScenes}
                  disabled={isParsingScenes}
                  className={`px-3 py-1.5 rounded-[14px] text-xs flex items-center gap-1.5 cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Phân tích lại với AI
                </button>
              </div>

              {currentProject.chapters.flatMap((c) => c.scenes).length === 0 ? (
                <div className={`p-8 text-center rounded-[14px] border ${subCardClass}`}>
                  Chưa có phân cảnh nào. Hãy quay lại Bước 3 và nhấn &ldquo;Phân cảnh tự động&rdquo; hoặc nhấn &ldquo;Nạp Kịch Bản Mẫu 1-Chạm&rdquo;.
                </div>
              ) : (
                <div className="space-y-6">
                  {currentProject.chapters
                    .flatMap((c) => c.scenes)
                    .map((scene) => (
                      <div
                        key={scene.id}
                        className={`p-5 rounded-[14px] border space-y-4 ${subCardClass}`}
                      >
                        <div
                          className={`flex items-center justify-between border-b pb-3 ${
                            isDark ? 'border-white/10' : 'border-slate-200'
                          }`}
                        >
                          <h4
                            className={`text-sm font-semibold ${
                              isDark ? 'text-purple-300' : 'text-purple-700'
                            }`}
                          >
                            Cảnh {scene.sceneNumber}: {scene.title}
                          </h4>
                          <span
                            className={`text-xs italic ${
                              isDark ? 'text-gray-400' : 'text-slate-500'
                            }`}
                          >
                            {scene.setting}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {scene.lines.map((line) => (
                            <div
                              key={line.id}
                              onClick={() => setActiveStageLineId(line.id)}
                              className={`p-3 rounded-[14px] border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                                isDark
                                  ? 'bg-black/30 hover:bg-black/50 border-white/5'
                                  : 'bg-white hover:bg-purple-50/50 border-slate-200 shadow-sm'
                              }`}
                            >
                              <div className="flex items-center gap-2 w-full md:w-1/4">
                                <span
                                  className={`font-semibold shrink-0 ${
                                    isDark ? 'text-purple-400' : 'text-purple-700'
                                  }`}
                                >
                                  {line.characterName}:
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] ${
                                    isDark
                                      ? 'bg-white/5 text-gray-400'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {line.emotionStyle || 'Tự nhiên'}
                                </span>
                              </div>

                              <p
                                className={`flex-1 break-words ${
                                  isDark ? 'text-gray-200' : 'text-slate-800'
                                }`}
                              >
                                {line.text}
                              </p>

                              <div className="flex items-center gap-2 shrink-0">
                                {line.status === 'completed' && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 ${
                                      isDark
                                        ? 'bg-green-500/20 text-green-300'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Đã có âm thanh
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div
                className={`flex justify-between items-center pt-4 border-t ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => setCurrentProject({ ...currentProject, currentStep: 3 })}
                  className={`px-4 py-2.5 rounded-[14px] text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>
                <button
                  onClick={() => setCurrentProject({ ...currentProject, currentStep: 5 })}
                  className="px-5 py-2.5 rounded-[14px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                  Tiếp theo: Phòng thu giọng đọc <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: PHÒNG THU GIỌNG NÓI TTS */}
          {currentProject.currentStep === 5 && (
            <div className={`p-6 rounded-[14px] border space-y-6 transition-colors ${panelClass}`}>
              <div
                className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Bước 5: Phòng thu tổng hợp giọng đọc Song ngữ (VI / EN)
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                    Kết hợp Gemini Cloud TTS và trình đọc bản địa an toàn với thông số Pitch & Rate riêng cho từng nhân vật.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportSRT}
                    className={`px-4 py-2.5 rounded-[14px] text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'bg-white/10 hover:bg-white/15 text-amber-300'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <Subtitles className="w-4 h-4" /> Xuất phụ đề .SRT
                  </button>
                  <button
                    onClick={handleBatchGenerateTTS}
                    disabled={isProcessingBatchTTS}
                    className="px-5 py-2.5 rounded-[14px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-medium flex items-center gap-2 shadow-lg shadow-purple-500/30 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessingBatchTTS ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang tổng hợp hàng loạt...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" /> Tổng hợp toàn bộ câu chuyện
                      </>
                    )}
                  </button>
                </div>
              </div>

              {ttsProgressMsg && (
                <div
                  className={`p-4 rounded-[14px] border text-xs flex items-center gap-3 ${
                    isDark
                      ? 'bg-purple-950/40 border-purple-500/30 text-purple-200'
                      : 'bg-purple-50 border-purple-200 text-purple-800'
                  }`}
                >
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  <span>{ttsProgressMsg}</span>
                </div>
              )}

              {/* Line Studio Table */}
              <div className="space-y-4">
                {currentProject.chapters
                  .flatMap((c) => c.scenes)
                  .map((scene) => (
                    <div
                      key={scene.id}
                      className={`p-4 rounded-[14px] border space-y-3 ${subCardClass}`}
                    >
                      <h4
                        className={`text-xs font-semibold ${
                          isDark ? 'text-purple-300' : 'text-purple-700'
                        }`}
                      >
                        Cảnh {scene.sceneNumber}: {scene.title}
                      </h4>
                      <div className="space-y-2">
                        {scene.lines.map((line) => (
                          <div
                            key={line.id}
                            onClick={() => setActiveStageLineId(line.id)}
                            className={`p-3 rounded-[14px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                              isDark
                                ? 'bg-black/30 border-white/5 hover:border-purple-500/30'
                                : 'bg-white border-slate-200 hover:border-purple-400 shadow-sm'
                            }`}
                          >
                            <div className="space-y-1 flex-1">
                              <span
                                className={`font-semibold ${
                                  isDark ? 'text-purple-400' : 'text-purple-700'
                                }`}
                              >
                                {line.characterName}:{' '}
                              </span>
                              <span
                                className={`break-words ${
                                  isDark ? 'text-gray-200' : 'text-slate-800'
                                }`}
                              >
                                {line.text}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {line.audioUrl && line.audioUrl.startsWith('data:audio') ? (
                                <audio src={line.audioUrl} controls className="h-8 max-w-[200px]" />
                              ) : line.audioUrl === 'browser_tts_ready' ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSingleLineTTS(scene.id, line.id);
                                  }}
                                  className={`px-3 py-1.5 rounded-[14px] border text-xs flex items-center gap-1.5 cursor-pointer ${
                                    isDark
                                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Phát giọng Song Ngữ
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSingleLineTTS(scene.id, line.id);
                                  }}
                                  disabled={line.status === 'processing'}
                                  className={`px-3 py-1.5 rounded-[14px] text-xs flex items-center gap-1.5 cursor-pointer ${
                                    isDark
                                      ? 'bg-white/10 hover:bg-white/20 text-white'
                                      : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                                  }`}
                                >
                                  {line.status === 'processing' ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Volume2 className="w-3.5 h-3.5" />
                                  )}
                                  Tạo giọng
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              <div
                className={`flex justify-between items-center pt-4 border-t ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => setCurrentProject({ ...currentProject, currentStep: 4 })}
                  className={`px-4 py-2.5 rounded-[14px] text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>
                <button
                  onClick={() => setCurrentProject({ ...currentProject, currentStep: 6 })}
                  className="px-5 py-2.5 rounded-[14px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                  Tiếp theo: Nghe thử & Đánh giá <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: NGHE THỬ & KIỂM ĐỊNH */}
          {currentProject.currentStep === 6 && (
            <div className={`p-6 rounded-[14px] border space-y-6 transition-colors ${panelClass}`}>
              <div
                className={`border-b pb-4 ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Bước 6: Nghe thử & Biểu diễn Sân khấu
                </h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                  Thưởng thức câu chuyện phát liên tục đa giọng đọc thời gian thực đồng bộ với Sân khấu 3D/2D phía trên.
                </p>
              </div>

              <AudioPlayer
                lines={currentProject.chapters.flatMap((c) => c.scenes).flatMap((s) => s.lines)}
                onActiveLineChange={(lineId) => setActiveStageLineId(lineId)}
                title={`Thưởng thức: ${currentProject.title}`}
              />

              <div
                className={`flex justify-between items-center pt-4 border-t ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => setCurrentProject({ ...currentProject, currentStep: 5 })}
                  className={`px-4 py-2.5 rounded-[14px] text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>
                <button
                  onClick={() => setCurrentProject({ ...currentProject, currentStep: 7 })}
                  className="px-5 py-2.5 rounded-[14px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                  Tiếp theo: Xuất & Lưu trữ <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: XUẤT & LƯU TRỮ */}
          {currentProject.currentStep === 7 && (
            <div className={`p-6 rounded-[14px] border space-y-6 transition-colors ${panelClass}`}>
              <div
                className={`border-b pb-4 ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Bước 7: Xuất dữ liệu Phụ đề SRT, Kịch bản & Đồng bộ Đám mây
                </h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                  Lưu dự án an toàn lên Firebase Firestore và xuất kịch bản văn bản / phụ đề SRT chuẩn thời gian.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-[14px] border space-y-3 ${subCardClass}`}>
                  <Cloud className="w-8 h-8 text-purple-500" />
                  <h4
                    className={`text-sm font-semibold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Lưu trữ trên Firebase Cloud
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                    Đồng bộ thời gian thực toàn bộ dự án, nhân vật và câu thoại lên tài khoản của bạn.
                  </p>
                  <button
                    onClick={handleSaveToCloud}
                    className="w-full py-2.5 rounded-[14px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Lưu dự án đám mây
                  </button>
                </div>

                <div className={`p-5 rounded-[14px] border space-y-3 ${subCardClass}`}>
                  <Subtitles className="w-8 h-8 text-amber-500" />
                  <h4
                    className={`text-sm font-semibold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Xuất Phụ Đề Chuẩn (.SRT)
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                    Tự động tính toán Timecode cho từng lượt thoại để ghép vào CapCut, Premiere, YouTube.
                  </p>
                  <button
                    onClick={handleExportSRT}
                    className="w-full py-2.5 rounded-[14px] bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Subtitles className="w-4 h-4" /> Tải về Phụ đề .SRT
                  </button>
                </div>

                <div className={`p-5 rounded-[14px] border space-y-3 ${subCardClass}`}>
                  <Download className="w-8 h-8 text-indigo-500" />
                  <h4
                    className={`text-sm font-semibold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Xuất kịch bản văn bản (TXT)
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                    Tải về tệp kịch bản được định dạng phân cảnh và lời thoại đầy đủ.
                  </p>
                  <button
                    onClick={handleExportTextScript}
                    className="w-full py-2.5 rounded-[14px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> Tải về Kịch bản TXT
                  </button>
                </div>
              </div>

              <div
                className={`flex justify-between items-center pt-4 border-t ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => setCurrentProject({ ...currentProject, currentStep: 6 })}
                  className={`px-4 py-2.5 rounded-[14px] text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-[14px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                  Hoàn tất & Về Dashboard <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: DASHBOARD VIEW */
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-[14px] border transition-colors ${panelClass}`}
          >
            <div className="relative w-full sm:w-80">
              <Search
                className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-slate-400'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm dự án kịch bản..."
                className={`w-full pl-9 pr-4 py-2 border rounded-[14px] text-xs focus:outline-none ${inputFieldClass}`}
              />
            </div>

            <div ref={filterDropdownRef} className="relative w-full sm:w-64">
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                className={`w-full px-3.5 py-2 rounded-[14px] border text-xs font-medium flex items-center justify-between gap-2 transition-colors focus:outline-none focus:border-purple-500 cursor-pointer ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900 shadow-sm'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Filter className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="truncate">
                    {selectedFilterType === 'all'
                      ? 'Tất cả'
                      : CONTENT_TYPES.find((ct) => ct.value === selectedFilterType)?.label ||
                        'Tất cả'}
                  </span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isFilterDropdownOpen
                      ? 'rotate-180 text-purple-500'
                      : isDark
                      ? 'text-gray-400'
                      : 'text-slate-400'
                  }`}
                />
              </button>

              {isFilterDropdownOpen && (
                <div
                  className={`absolute right-0 mt-2 w-full sm:w-64 rounded-[14px] backdrop-blur-xl border shadow-2xl py-1.5 z-30 space-y-0.5 ${
                    isDark
                      ? 'bg-gray-900/95 border-white/15'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFilterType('all');
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      selectedFilterType === 'all'
                        ? 'bg-purple-600 text-white'
                        : isDark
                        ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                        : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    <span>Tất cả</span>
                    {selectedFilterType === 'all' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                  {CONTENT_TYPES.map((ct) => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => {
                        setSelectedFilterType(ct.value);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        selectedFilterType === ct.value
                          ? 'bg-purple-600 text-white'
                          : isDark
                          ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                          : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700'
                      }`}
                    >
                      <span className="truncate">{ct.label}</span>
                      {selectedFilterType === ct.value && (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Projects List Grid */}
          {filteredProjects.length === 0 ? (
            <div
              className={`p-12 text-center rounded-[14px] border space-y-4 transition-colors ${panelClass}`}
            >
              <BookOpen
                className={`w-12 h-12 mx-auto ${
                  isDark ? 'text-gray-500' : 'text-purple-400'
                }`}
              />
              <div className="space-y-1">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Chưa có dự án kịch bản nào
                </h3>
                <p
                  className={`text-xs max-w-md mx-auto ${
                    isDark ? 'text-gray-400' : 'text-slate-600'
                  }`}
                >
                  Hãy bắt đầu sáng tạo tác phẩm đầu tiên của bạn hoặc nhấn &ldquo;Nạp Kịch Bản Mẫu 1-Chạm&rdquo; để trải nghiệm ngay.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleLoadDemoScript}
                  className="px-5 py-2.5 rounded-[14px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> Nạp Kịch Bản Mẫu 1-Chạm
                </button>
                <button
                  onClick={createNewProject}
                  className={`px-5 py-2.5 rounded-[14px] text-xs font-medium inline-flex items-center gap-2 cursor-pointer border ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Tạo dự án trống
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  className={`p-5 rounded-[14px] border space-y-4 transition-all flex flex-col justify-between group shadow-xl ${
                    isDark
                      ? 'bg-gray-900/90 border-white/10 hover:border-purple-500/40'
                      : 'bg-white border-slate-200 hover:border-purple-400 shadow-indigo-500/5'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full border text-[10px] font-medium ${
                          isDark
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {CONTENT_TYPES.find((c) => c.value === proj.contentType)?.label ||
                          proj.contentType}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isDark ? 'text-gray-400' : 'text-slate-500'
                        }`}
                      >
                        {new Date(proj.updatedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div>
                      <h3
                        className={`text-base font-bold transition-colors line-clamp-1 ${
                          isDark
                            ? 'text-white group-hover:text-purple-300'
                            : 'text-slate-900 group-hover:text-purple-700'
                        }`}
                      >
                        {proj.title}
                      </h3>
                      <p
                        className={`text-xs mt-1 line-clamp-2 ${
                          isDark ? 'text-gray-400' : 'text-slate-600'
                        }`}
                      >
                        Tác giả: {proj.author} • {proj.characters.length} nhân vật
                      </p>
                    </div>

                    {/* Avatar stack */}
                    <div className="flex items-center gap-1 pt-1">
                      {proj.characters.slice(0, 4).map((c, i) => (
                        <img
                          key={i}
                          src={c.avatarUrl}
                          alt={c.name}
                          className="w-7 h-7 rounded-full object-cover border border-purple-500/30"
                        />
                      ))}
                      {proj.characters.length > 4 && (
                        <span
                          className={`w-7 h-7 rounded-full text-[10px] flex items-center justify-center font-bold ${
                            isDark
                              ? 'bg-white/10 text-gray-300'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          +{proj.characters.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between pt-3 border-t ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setCurrentProject(proj);
                        setIsEditing(true);
                      }}
                      className={`px-3.5 py-1.5 rounded-[14px] text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                        isDark
                          ? 'bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border-purple-500/30'
                          : 'bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border-purple-200'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Tiếp tục chỉnh sửa
                    </button>

                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className={`p-2 rounded-[14px] text-xs transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                          : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                      }`}
                      title="Xóa dự án"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
        </div>

        {/* MODULE D (SPLIT STUDIO MODE): SÂN KHẤU BIỂU DIỄN DOCK BÊN PHẢI (CỘT 5/12) */}
        {showInteractiveStage && stageLayoutMode === 'split' && (
          <div className="xl:col-span-5 xl:sticky xl:top-2 min-w-0">
            <InteractiveCharacterStage
              characters={activeCharsForStage}
              lines={activeLinesForStage}
              activeLineId={activeStageLineId}
              onSelectLine={(id) => setActiveStageLineId(id)}
              projectTitle={
                currentProject
                  ? `Sân Khấu: ${currentProject.title}`
                  : 'Sân Khấu Biểu Diễn 3D/2D (Song Song)'
              }
            />
          </div>
        )}
      </div>

      {/* 3-Tab Cast Roster & AI Prompt Code Studio Modal */}
      <CharacterStudioModal
        isOpen={isCharModalOpen}
        onClose={() => setIsCharModalOpen(false)}
        onSave={handleSaveCharacter}
        initialCharacter={editingCharacter}
        characters={currentProject ? currentProject.characters : [DEFAULT_NARRATOR]}
        onDeleteCharacter={handleDeleteCharacter}
        initialTab={charModalTab}
      />
    </div>
  );
};
