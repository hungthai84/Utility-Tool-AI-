'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/ThemeContext';
import { saveCloudProject, logToolHistory } from '@/lib/firebase';
import {
  Mic,
  Volume2,
  FileAudio,
  CheckCircle2,
  ArrowRight,
  Download,
  CloudUpload,
  RefreshCw,
  X,
  Play,
  Pause,
  Users,
  Sparkles,
  Plus,
  Trash2,
  Sliders,
  Square,
  History,
  BookOpen,
  Copy,
  Check,
  Wand2,
} from 'lucide-react';

interface DialogueTurn {
  id: string;
  speaker: string;
  text: string;
  style: string;
}

interface GeneratedAudioTake {
  id: string;
  title: string;
  mode: 'single' | 'multi';
  voiceInfo: string;
  audioUrl: string;
  scriptText: string;
  createdAt: string;
}

const VOICE_PERSONAS = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Nữ',
    style: 'Rõ ràng, truyền cảm, tự nhiên',
    sample: 'Xin chào, tôi là Kore với chất giọng nữ ấm áp và truyền cảm.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Nam',
    style: 'Trẻ trung, năng động, thân thiện',
    sample: 'Chào bạn! Tôi là Puck, sẵn sàng mang năng lượng tích cực vào bản thu của bạn.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Nữ',
    style: 'Nhẹ nhàng, trong trẻo, tinh tế',
    sample: 'Tôi là Zephyr, giọng đọc nhẹ nhàng phù hợp cho kể chuyện và thư giãn.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Nam',
    style: 'Trầm ấm, uy lực, chiều sâu',
    sample: 'Tôi là Fenrir, chất giọng trầm dày cho thuyết minh phim và sách nói.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Nam',
    style: 'Điềm tĩnh, chuẩn mực, tin tức',
    sample: 'Xin chào quý vị, tôi là Charon với phong cách đọc bản tin chuyên nghiệp.',
  },
];

const STYLE_PRESETS = [
  {
    id: 'news',
    label: 'Bản tin thời sự',
    prompt: 'Giọng phát thanh viên tin tức chuyên nghiệp, rõ chữ, nhịp điệu dứt khoát, chuẩn mực',
  },
  {
    id: 'story',
    label: 'Kể chuyện đêm khuya',
    prompt: 'Giọng kể chuyện trầm ấm, sâu lắng, giàu cảm xúc, ngắt nghỉ chậm rãi truyền cảm',
  },
  {
    id: 'podcast',
    label: 'Podcast trò chuyện',
    prompt: 'Giọng trò chuyện gần gũi, tự nhiên, tươi vui và giàu năng lượng kết nối',
  },
  {
    id: 'promo',
    label: 'Quảng cáo thương mại',
    prompt: 'Giọng quảng cáo hào hứng, lôi cuốn, nhấn nhá từ khóa ấn tượng, tràn đầy sức sống',
  },
  {
    id: 'doc',
    label: 'Thuyết minh tài liệu',
    prompt: 'Giọng thuyết minh khám phá khoa học, trang trọng, cuốn hút và giàu chất điện ảnh',
  },
  {
    id: 'calm',
    label: 'Thiền & Thư giãn',
    prompt: 'Giọng đọc êm dịu, nhẹ nhàng, chậm rãi giúp thư giãn tâm trí và dễ đi vào giấc ngủ',
  },
];

const EXPRESSIVE_TAGS = [
  { tag: '<breath>', label: 'Lấy hơi (<breath>)', desc: 'Tạo nhịp hít thở tự nhiên giữa câu' },
  { tag: '<laugh>', label: 'Tiếng cười (<laugh>)', desc: 'Chèn tiếng cười tự nhiên' },
  { tag: '<gasp>', label: 'Ngạc nhiên (<gasp>)', desc: 'Thể hiện sự bất ngờ, hồi hộp' },
  { tag: '|mhm|', label: 'Đồng tình (|mhm|)', desc: 'Phản hồi gật gù trong hội thoại' },
  { tag: '|yeah|', label: 'Tương tác (|yeah|)', desc: 'Đệm lời tự nhiên kiểu podcast' },
];

export function VoiceToolWizard({ onClose }: { onClose: () => void }) {
  const { user, isDark, setIsAuthModalOpen, setActiveNav } = useTheme();
  const [activeTab, setActiveTab] = useState<'tts' | 'multi_tts' | 'transcribe'>('tts');
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [enhancing, setEnhancing] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Single-Speaker TTS State
  const [textToSpeech, setTextToSpeech] = useState<string>(
    'Chào mừng bạn đến với phòng thu giọng nói nhân tạo thế hệ mới! <breath> Tại đây, bạn có thể thiết kế ngữ điệu, chèn cảm xúc tự nhiên và tạo bản thu âm sắc nét chỉ trong vài giây.'
  );
  const [voicePerson, setVoicePerson] = useState<string>('Kore');
  const [stylePrompt, setStylePrompt] = useState<string>(
    'Giọng đọc truyền cảm, rõ ràng, phát âm tiếng Việt chuẩn và tự nhiên'
  );
  const [selectedPreset, setSelectedPreset] = useState<string>('story');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [useProModel, setUseProModel] = useState<boolean>(true);
  const [aiTopicPrompt, setAiTopicPrompt] = useState<string>('');

  // Multi-Speaker Dialogue State
  const [speakerA, setSpeakerA] = useState({
    speaker: 'Minh Anh',
    voiceName: 'Kore',
    style: 'Nữ host podcast thông minh, duyên dáng, nhiệt tình',
  });
  const [speakerB, setSpeakerB] = useState({
    speaker: 'Hoàng Nam',
    voiceName: 'Puck',
    style: 'Khách mời chuyên gia công nghệ, gần gũi, hóm hỉnh',
  });
  const [dialogueTurns, setDialogueTurns] = useState<DialogueTurn[]>([
    {
      id: 'turn_1',
      speaker: 'Minh Anh',
      text: 'Xin chào các bạn thính giả! <breath> Hôm nay chúng ta cùng khám phá công nghệ giọng nói AI đa nhân vật cực kỳ thú vị.',
      style: 'Hào hứng, tươi vui',
    },
    {
      id: 'turn_2',
      speaker: 'Hoàng Nam',
      text: 'Chào Minh Anh và mọi người! |yeah| Thật sự ấn tượng khi hai giọng đọc có thể tung hứng tự nhiên như đang ngồi chung phòng thu vậy.',
      style: 'Thân thiện, tự nhiên',
    },
  ]);

  // Transcribe & Live Recording State
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('audio/mp3');
  const [transcribeMode, setTranscribeMode] = useState<'verbatim' | 'summary' | 'translate'>('verbatim');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Playback & Output State
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [transcribeResult, setTranscribeResult] = useState<string | null>(null);
  const [sessionTakes, setSessionTakes] = useState<GeneratedAudioTake[]>([]);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioElemRef.current) {
        audioElemRef.current.pause();
      }
    };
  }, []);

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleInsertTag = (tag: string) => {
    setTextToSpeech((prev) => `${prev.trim()} ${tag} `);
  };

  const handleSelectPreset = (preset: typeof STYLE_PRESETS[0]) => {
    setSelectedPreset(preset.id);
    setStylePrompt(preset.prompt);
  };

  // AI Enhance / Script Generator
  const handleEnhanceWithAI = async () => {
    setEnhancing(true);
    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enhance_text',
          mode: activeTab === 'multi_tts' ? 'multi' : 'single',
          text: activeTab === 'multi_tts' ? dialogueTurns.map((t) => `${t.speaker}: ${t.text}`).join('\n') : textToSpeech,
          style: stylePrompt,
          speakers: [speakerA, speakerB],
          enhancePrompt: aiTopicPrompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (activeTab === 'multi_tts' && Array.isArray(data.turns) && data.turns.length > 0) {
        setDialogueTurns(
          data.turns.map((t: any, idx: number) => ({
            id: `turn_${Date.now()}_${idx}`,
            speaker: t.speaker || (idx % 2 === 0 ? speakerA.speaker : speakerB.speaker),
            text: t.text || '',
            style: t.style || 'Tự nhiên',
          }))
        );
      } else if (data.enhancedText) {
        setTextToSpeech(data.enhancedText);
        if (data.suggestedStyle) {
          setStylePrompt(data.suggestedStyle);
        }
      }
      setAiTopicPrompt('');
    } catch (err) {
      console.error('Lỗi tối ưu kịch bản bằng AI:', err);
    } finally {
      setEnhancing(false);
    }
  };

  // Live Microphone Recording for Transcription
  const startMicrophoneRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordingChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedAudio(reader.result as string);
          setUploadedMimeType('audio/webm');
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Không thể truy cập Micro:', err);
    }
  };

  const stopMicrophoneRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedMimeType(file.type || 'audio/mp3');
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedAudio(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Main Tool Action
  const handleRunTool = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tts') {
        const res = await fetch('/api/gemini/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'single',
            text: textToSpeech,
            voice: voicePerson,
            style: stylePrompt,
            useProExpressive: useProModel,
          }),
        });
        const data = await res.json();
        if (data.audioUrl) {
          setAudioUrl(data.audioUrl);
          const newTake: GeneratedAudioTake = {
            id: `take_${Date.now()}`,
            title: textToSpeech.slice(0, 42) + (textToSpeech.length > 42 ? '...' : ''),
            mode: 'single',
            voiceInfo: `${voicePerson} · ${useProModel ? 'Flash Pro TTS' : 'Flash Lite TTS'}`,
            audioUrl: data.audioUrl,
            scriptText: textToSpeech,
            createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          };
          setSessionTakes((prev) => [newTake, ...prev]);
          setStep(3);
        }
      } else if (activeTab === 'multi_tts') {
        const res = await fetch('/api/gemini/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'multi',
            speakers: [speakerA, speakerB],
            dialogueTurns,
            style: stylePrompt,
          }),
        });
        const data = await res.json();
        if (data.audioUrl) {
          setAudioUrl(data.audioUrl);
          const fullScript = dialogueTurns.map((t) => `${t.speaker}: ${t.text}`).join('\n');
          const newTake: GeneratedAudioTake = {
            id: `take_${Date.now()}`,
            title: `Hội thoại: ${speakerA.speaker} & ${speakerB.speaker}`,
            mode: 'multi',
            voiceInfo: `${speakerA.voiceName} + ${speakerB.voiceName} · Dual TTS`,
            audioUrl: data.audioUrl,
            scriptText: fullScript,
            createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          };
          setSessionTakes((prev) => [newTake, ...prev]);
          setStep(3);
        }
      } else if (activeTab === 'transcribe') {
        if (!uploadedAudio) {
          setLoading(false);
          return;
        }
        const promptByMode =
          transcribeMode === 'summary'
            ? 'Hãy chép lại toàn bộ lời nói trong đoạn âm thanh này, sau đó tóm tắt các ý chính rõ ràng bằng tiếng Việt.'
            : transcribeMode === 'translate'
            ? 'Hãy chép lời đoạn âm thanh này và dịch song ngữ sang tiếng Việt và tiếng Anh.'
            : 'Hãy chép lại chính xác từng câu chữ trong đoạn âm thanh này bằng tiếng Việt có dấu đầy đủ.';

        const res = await fetch('/api/gemini/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Audio: uploadedAudio,
            mimeType: uploadedMimeType,
            prompt: promptByMode,
          }),
        });
        const data = await res.json();
        if (data.result) {
          setTranscribeResult(data.result);
          setStep(3);
        }
      }
    } catch (err) {
      console.error('Lỗi xử lý âm thanh:', err);
    } finally {
      setLoading(false);
    }
  };

  // Studio Audio Player Controls
  const playAudioUrl = (urlToPlay: string) => {
    if (audioElemRef.current) {
      audioElemRef.current.pause();
    }
    const audio = new Audio(urlToPlay);
    audio.playbackRate = playbackSpeed;
    audioElemRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.play();
    setIsPlaying(true);
    setAudioUrl(urlToPlay);
  };

  const togglePlayAudio = () => {
    if (!audioUrl) return;
    if (isPlaying && audioElemRef.current) {
      audioElemRef.current.pause();
      setIsPlaying(false);
    } else if (audioElemRef.current && audioElemRef.current.src === audioUrl) {
      audioElemRef.current.playbackRate = playbackSpeed;
      audioElemRef.current.play();
      setIsPlaying(true);
    } else {
      playAudioUrl(audioUrl);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    if (audioElemRef.current) {
      audioElemRef.current.playbackRate = newSpeed;
    }
  };

  const handleAddDialogueTurn = () => {
    const nextSpeaker =
      dialogueTurns.length % 2 === 0 ? speakerA.speaker : speakerB.speaker;
    setDialogueTurns((prev) => [
      ...prev,
      {
        id: `turn_${Date.now()}`,
        speaker: nextSpeaker,
        text: '',
        style: 'Tự nhiên, truyền cảm',
      },
    ]);
  };

  const handleUpdateDialogueTurn = (id: string, field: keyof DialogueTurn, value: string) => {
    setDialogueTurns((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleRemoveDialogueTurn = (id: string) => {
    if (dialogueTurns.length <= 1) return;
    setDialogueTurns((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveToCloud = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const contentToSave = audioUrl || transcribeResult || '';
      const titleLabel =
        activeTab === 'tts'
          ? `Giọng đọc AI (${voicePerson}): ${textToSpeech.slice(0, 30)}...`
          : activeTab === 'multi_tts'
          ? `Hội thoại AI (${speakerA.speaker} & ${speakerB.speaker})`
          : `Chép lời âm thanh (${new Date().toLocaleDateString('vi-VN')})`;

      await saveCloudProject(user.uid, {
        title: titleLabel,
        toolCategory: 'speech',
        stepData: JSON.stringify({
          activeTab,
          voicePerson,
          stylePrompt,
          speakerA,
          speakerB,
        }),
        outputContent: contentToSave,
        tags: ['Giọng nói AI', activeTab === 'multi_tts' ? 'Đa nhân vật' : voicePerson],
      });

      await logToolHistory(
        user.uid,
        'voice_tool',
        'Phòng thu giọng nói AI',
        titleLabel,
        'Hoàn thành'
      );

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Lỗi lưu Cloud:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl w-full mx-auto max-h-[88vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10 gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <Mic size={20} />
          </div>
          <div className="min-w-0">
            <h3 className={`text-lg sm:text-xl font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Phòng thu chuyển văn bản thành giọng nói & âm thanh AI
            </h3>
            <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Thiết kế giọng đọc đơn, hội thoại 2 nhân vật, biểu cảm tự nhiên và giải mã âm thanh
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              onClose();
              setActiveNav(2);
            }}
            title="Mở Phòng sáng tạo câu chuyện đầy đủ (7 bước)"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              isDark
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25'
                : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <BookOpen size={14} />
            <span className="hidden sm:inline">Story Studio</span>
          </button>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-slate-800'
            }`}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Step Navigation Bar */}
      <div className="flex items-center justify-between mb-6 px-2 sm:px-4">
        {[
          { num: 1, label: 'Chọn chế độ phòng thu' },
          { num: 2, label: 'Thiết kế kịch bản & giọng đọc' },
          { num: 3, label: 'Nghe thử & Lưu trữ Cloud' },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => {
              if (s.num < step || (s.num === 2 && step >= 1)) setStep(s.num);
            }}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all tabular-nums ${
                step >= s.num
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : isDark
                  ? 'bg-white/10 text-slate-400'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {s.num}
            </div>
            <span
              className={`text-xs font-semibold ${
                step >= s.num
                  ? isDark
                    ? 'text-purple-300'
                    : 'text-purple-700'
                  : isDark
                  ? 'text-slate-500'
                  : 'text-slate-600'
              }`}
            >
              {s.label}
            </span>
            {s.num < 3 && <div className="w-8 sm:w-14 h-0.5 bg-white/10 mx-1 sm:mx-2 hidden md:block"></div>}
          </button>
        ))}
      </div>

      {/* STEP 1: Select Studio Mode */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <button
            onClick={() => {
              setActiveTab('tts');
              setStep(2);
            }}
            className={`p-5 rounded-3xl glass-card text-left transition-all cursor-pointer hover:border-purple-400 flex flex-col justify-between ${
              activeTab === 'tts' ? 'ring-2 ring-purple-500 bg-purple-500/10' : ''
            }`}
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <Volume2 className="w-6 h-6" />
              </div>
              <h4 className={`font-bold text-base mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Đọc đơn & Thiết kế giọng
              </h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Chuyển văn bản thành giọng nói đơn nhân vật với 6 bộ preset ngữ điệu, chèn tiếng cười, nhịp thở và đạo diễn cảm xúc.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-purple-400">
              <span>5 giọng AI · Biểu cảm Pro</span>
              <ArrowRight size={14} />
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('multi_tts');
              setStep(2);
            }}
            className={`p-5 rounded-3xl glass-card text-left transition-all cursor-pointer hover:border-indigo-400 flex flex-col justify-between ${
              activeTab === 'multi_tts' ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : ''
            }`}
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h4 className={`font-bold text-base mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Hội thoại 2 nhân vật (Podcast)
              </h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Phối hợp 2 nhân vật với giọng đọc và cá tính riêng trong cùng một bản thu âm hội thoại tự nhiên.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-indigo-400">
              <span>Dual-Speaker · Kịch bản AI</span>
              <ArrowRight size={14} />
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('transcribe');
              setStep(2);
            }}
            className={`p-5 rounded-3xl glass-card text-left transition-all cursor-pointer hover:border-pink-400 flex flex-col justify-between ${
              activeTab === 'transcribe' ? 'ring-2 ring-pink-500 bg-pink-500/10' : ''
            }`}
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-3">
                <FileAudio className="w-6 h-6" />
              </div>
              <h4 className={`font-bold text-base mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Thu âm & Chép lời văn bản
              </h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Ghi âm trực tiếp từ Micro hoặc tải file MP3/WAV để gỡ băng chính xác, tóm tắt ý chính hoặc dịch song ngữ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-pink-400">
              <span>Live Mic · Gỡ băng chuẩn</span>
              <ArrowRight size={14} />
            </div>
          </button>
        </div>
      )}

      {/* STEP 2: Configure Voice & Script */}
      {step === 2 && (
        <div className="glass-card p-5 rounded-3xl space-y-5 mb-4">
          {/* Quick Mode Switcher inside Step 2 */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/15">
              <button
                onClick={() => setActiveTab('tts')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'tts'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                Đọc đơn (Single TTS)
              </button>
              <button
                onClick={() => setActiveTab('multi_tts')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'multi_tts'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                Hội thoại 2 người (Podcast)
              </button>
              <button
                onClick={() => setActiveTab('transcribe')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'transcribe'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                Gỡ băng âm thanh
              </button>
            </div>

            {activeTab === 'tts' && (
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Động cơ âm thanh:</span>
                <button
                  onClick={() => setUseProModel(!useProModel)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    useProModel
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : isDark
                      ? 'bg-white/5 border-white/10 text-slate-400'
                      : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  {useProModel ? 'Gemini 3.8 Flash TTS (Biểu cảm cao)' : 'Gemini 3.8 Lite TTS (Tốc độ nhanh)'}
                </button>
              </div>
            )}
          </div>

          {/* MODE A: SINGLE-SPEAKER TTS */}
          {activeTab === 'tts' && (
            <div className="space-y-5">
              {/* 1. Voice Persona Selector */}
              <div>
                <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Chọn nhân vật giọng đọc (Voice Persona):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {VOICE_PERSONAS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVoicePerson(v.id)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                        voicePerson === v.id
                          ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                          : isDark
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                          : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{v.name}</span>
                        <span className="text-[10px] opacity-80">{v.gender}</span>
                      </div>
                      <div className="text-[11px] opacity-85 mt-1 line-clamp-2">{v.style}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Voice Style Presets & Custom Director Prompt */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Mẫu phong cách diễn cảm nhanh:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STYLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer truncate ${
                          selectedPreset === preset.id
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                            : isDark
                            ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Chỉ dẫn đạo diễn giọng đọc (Style Prompt):
                  </label>
                  <input
                    type="text"
                    value={stylePrompt}
                    onChange={(e) => setStylePrompt(e.target.value)}
                    placeholder="Nhập mô tả cảm xúc, nhịp độ, phong cách đọc..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-purple-500 ${
                      isDark
                        ? 'bg-black/30 border-white/10 text-white placeholder-slate-400'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              {/* 3. Expressive Vocal Bursts & AI Polisher Toolbar */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Nội dung văn bản cần chuyển thành giọng nói:
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {EXPRESSIVE_TAGS.map((item) => (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => handleInsertTag(item.tag)}
                        title={item.desc}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                          isDark
                            ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25'
                            : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                        }`}
                      >
                        + {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={textToSpeech}
                  onChange={(e) => setTextToSpeech(e.target.value)}
                  rows={5}
                  className={`w-full p-3.5 rounded-2xl border text-sm leading-relaxed focus:outline-none focus:border-purple-500 ${
                    isDark
                      ? 'bg-black/30 border-white/10 text-white placeholder-slate-400'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 shadow-sm'
                  }`}
                  placeholder="Nhập nội dung văn bản cần đọc..."
                />

                {/* AI Script Polisher Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={aiTopicPrompt}
                    onChange={(e) => setAiTopicPrompt(e.target.value)}
                    placeholder="Nhập ý tưởng để AI viết mới hoặc để trống để AI tự động trau chuốt văn bản trên..."
                    className={`flex-1 px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:border-purple-500 ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-slate-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleEnhanceWithAI}
                    disabled={enhancing}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {enhancing ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Đang biên tập AI...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={13} />
                        <span>Chuẩn hóa & Thêm cảm xúc bằng AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE B: MULTI-SPEAKER DUAL DIALOGUE */}
          {activeTab === 'multi_tts' && (
            <div className="space-y-5">
              {/* Two Speaker Config Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Speaker 1 */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400">Nhân vật 1 (Speaker A)</span>
                    <select
                      value={speakerA.voiceName}
                      onChange={(e) => setSpeakerA({ ...speakerA, voiceName: e.target.value })}
                      className={`px-2.5 py-1 rounded-lg text-xs border ${
                        isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {VOICE_PERSONAS.map((v) => (
                        <option key={v.id} value={v.id}>
                          Giọng {v.name} ({v.gender})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={speakerA.speaker}
                      onChange={(e) => setSpeakerA({ ...speakerA, speaker: e.target.value })}
                      placeholder="Tên nhân vật 1"
                      className={`px-3 py-1.5 rounded-xl border text-xs ${
                        isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <input
                      type="text"
                      value={speakerA.style}
                      onChange={(e) => setSpeakerA({ ...speakerA, style: e.target.value })}
                      placeholder="Phong cách giọng đọc..."
                      className={`px-3 py-1.5 rounded-xl border text-xs ${
                        isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Speaker 2 */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">Nhân vật 2 (Speaker B)</span>
                    <select
                      value={speakerB.voiceName}
                      onChange={(e) => setSpeakerB({ ...speakerB, voiceName: e.target.value })}
                      className={`px-2.5 py-1 rounded-lg text-xs border ${
                        isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {VOICE_PERSONAS.map((v) => (
                        <option key={v.id} value={v.id}>
                          Giọng {v.name} ({v.gender})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={speakerB.speaker}
                      onChange={(e) => setSpeakerB({ ...speakerB, speaker: e.target.value })}
                      placeholder="Tên nhân vật 2"
                      className={`px-3 py-1.5 rounded-xl border text-xs ${
                        isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <input
                      type="text"
                      value={speakerB.style}
                      onChange={(e) => setSpeakerB({ ...speakerB, style: e.target.value })}
                      placeholder="Phong cách giọng đọc..."
                      className={`px-3 py-1.5 rounded-xl border text-xs ${
                        isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* AI Multi-Speaker Dialogue Generator Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={aiTopicPrompt}
                  onChange={(e) => setAiTopicPrompt(e.target.value)}
                  placeholder="Nhập chủ đề hội thoại Podcast để AI tự động viết kịch bản 2 người..."
                  className={`flex-1 px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-500 ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder-slate-400'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleEnhanceWithAI}
                  disabled={enhancing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {enhancing ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Đang soạn hội thoại...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Tạo hội thoại AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dialogue Turns List */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {dialogueTurns.map((turn, idx) => (
                  <div
                    key={turn.id}
                    className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center gap-2.5 ${
                      isDark ? 'bg-black/25 border-white/10' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <select
                      value={turn.speaker}
                      onChange={(e) => handleUpdateDialogueTurn(turn.id, 'speaker', e.target.value)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border shrink-0 ${
                        turn.speaker === speakerA.speaker
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      }`}
                    >
                      <option value={speakerA.speaker}>{speakerA.speaker}</option>
                      <option value={speakerB.speaker}>{speakerB.speaker}</option>
                    </select>

                    <input
                      type="text"
                      value={turn.text}
                      onChange={(e) => handleUpdateDialogueTurn(turn.id, 'text', e.target.value)}
                      placeholder={`Lời thoại câu ${idx + 1} (có thể dùng <laugh>, <breath>, |yeah|)...`}
                      className={`flex-1 w-full px-3 py-1.5 rounded-xl border text-xs ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveDialogueTurn(turn.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer shrink-0"
                      title="Xóa lượt thoại"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddDialogueTurn}
                className={`w-full py-2 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isDark
                    ? 'border-white/20 text-slate-300 hover:border-indigo-400 hover:text-white'
                    : 'border-slate-300 text-slate-700 hover:border-indigo-500'
                }`}
              >
                <Plus size={14} /> Thêm lượt thoại tiếp theo
              </button>
            </div>
          )}

          {/* MODE C: TRANSCRIBE & LIVE RECORDING */}
          {activeTab === 'transcribe' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Nguồn âm thanh cần gỡ băng (Tải file hoặc Thu âm trực tiếp):
                </label>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'verbatim', label: 'Chép lời nguyên văn' },
                    { id: 'summary', label: 'Chép lời & Tóm tắt ý chính' },
                    { id: 'translate', label: 'Phiên dịch song ngữ Việt - Anh' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTranscribeMode(m.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        transcribeMode === m.id
                          ? 'bg-pink-600 text-white border-pink-500'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-slate-300'
                          : 'bg-slate-100 border-slate-300 text-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload File Box */}
                <div
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors flex flex-col items-center justify-center ${
                    isDark
                      ? 'border-white/20 bg-black/20 hover:border-pink-400'
                      : 'border-slate-300 bg-slate-50 hover:border-pink-500'
                  }`}
                >
                  <label className="cursor-pointer space-y-2 block w-full">
                    <FileAudio className="w-9 h-9 text-pink-500 mx-auto" />
                    <span className={`text-xs font-semibold block ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Tải tệp âm thanh (.MP3, .WAV, .WEBM)
                    </span>
                    <input type="file" accept="audio/*" onChange={handleAudioFileUpload} className="hidden" />
                  </label>
                </div>

                {/* Live Mic Recording Box */}
                <div
                  className={`border-2 rounded-2xl p-6 text-center transition-colors flex flex-col items-center justify-center space-y-2 ${
                    isRecording
                      ? 'border-rose-500 bg-rose-500/10'
                      : isDark
                      ? 'border-white/15 bg-black/20'
                      : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <div className="text-xs font-bold text-rose-400 tabular-nums">
                        Đang thu âm Micro: {formatTime(recordingSeconds)}
                      </div>
                      <button
                        type="button"
                        onClick={stopMicrophoneRecording}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Square size={13} /> Dừng thu âm
                      </button>
                    </>
                  ) : (
                    <>
                      <Mic className="w-9 h-9 text-purple-500 mx-auto" />
                      <button
                        type="button"
                        onClick={startMicrophoneRecording}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        Bắt đầu thu âm bằng Micro
                      </button>
                    </>
                  )}
                </div>
              </div>

              {uploadedAudio && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400">
                    ✓ Đã sẵn sàng dữ liệu âm thanh để giải mã
                  </span>
                  <button
                    type="button"
                    onClick={() => setUploadedAudio(null)}
                    className="text-xs text-rose-400 font-semibold hover:underline cursor-pointer"
                  >
                    Xóa âm thanh
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2 Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={() => setStep(1)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              Quay lại bước 1
            </button>

            <button
              onClick={handleRunTool}
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center space-x-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý âm thanh AI...</span>
                </>
              ) : (
                <>
                  <span>
                    {activeTab === 'transcribe' ? 'Giải mã giọng nói ngay' : 'Tổng hợp giọng nói AI'}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Studio Output & Playback */}
      {step === 3 && (
        <div className="glass-card p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-bold text-emerald-500 flex items-center space-x-1.5">
              <CheckCircle2 size={16} />
              <span>Đã hoàn tất xử lý tại phòng thu AI!</span>
            </span>
            <button
              onClick={() => setStep(2)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              <RefreshCw size={14} />
              <span>Chỉnh sửa & Tạo bản thu mới</span>
            </button>
          </div>

          {(activeTab === 'tts' || activeTab === 'multi_tts') && audioUrl && (
            <div className="space-y-5">
              <div
                className={`p-6 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-black/35 border-white/10' : 'bg-slate-100 border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlayAudio}
                      className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl hover:scale-105 transition-transform cursor-pointer shrink-0"
                    >
                      {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
                    </button>
                    <div>
                      <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {activeTab === 'multi_tts'
                          ? `Bản thu hội thoại: ${speakerA.speaker} & ${speakerB.speaker}`
                          : `Bản thu giọng đọc AI (${voicePerson})`}
                      </h4>
                      <p className={`text-xs mt-0.5 tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Thời lượng: {formatTime(currentTime)} / {formatTime(duration)} · Định dạng WAV 24kHz 16-bit
                      </p>
                    </div>
                  </div>

                  {/* Speed Controls */}
                  <div className="flex items-center gap-1">
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => handleSpeedChange(spd)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-mono tabular-nums cursor-pointer transition-colors ${
                          playbackSpeed === spd
                            ? 'bg-purple-600 text-white font-bold'
                            : isDark
                            ? 'bg-white/5 text-slate-400 hover:bg-white/10'
                            : 'bg-white text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-150"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={audioUrl}
                      download={`voice-studio-${activeTab}-${voicePerson}.wav`}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Tải file WAV (24kHz)</span>
                    </a>

                    <button
                      onClick={handleSaveToCloud}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
                    >
                      <CloudUpload size={14} />
                      <span>Lưu vào Cloud Firebase</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Session Takes History */}
              {sessionTakes.length > 1 && (
                <div className="space-y-2">
                  <h5 className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <History size={14} /> Lịch sử các bản thu trong phiên ({sessionTakes.length})
                  </h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {sessionTakes.map((take) => (
                      <div
                        key={take.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                          audioUrl === take.audioUrl
                            ? 'border-purple-500 bg-purple-500/10'
                            : isDark
                            ? 'border-white/10 bg-white/5'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {take.title}
                          </div>
                          <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {take.voiceInfo} · {take.createdAt}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => playAudioUrl(take.audioUrl)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer"
                          >
                            Phát bản này
                          </button>
                          <a
                            href={take.audioUrl}
                            download={`take-${take.id}.wav`}
                            className={`p-1.5 rounded-xl border ${
                              isDark ? 'border-white/10 text-slate-300' : 'border-slate-300 text-slate-700'
                            }`}
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transcribe' && transcribeResult && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border font-mono text-xs whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed ${
                  isDark
                    ? 'bg-black/40 border-white/10 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-emerald-400'
                }`}
              >
                {transcribeResult}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(transcribeResult);
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 2000);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer border ${
                    isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  {copiedText ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedText ? 'Đã sao chép' : 'Sao chép văn bản'}</span>
                </button>
                <button
                  onClick={handleSaveToCloud}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <CloudUpload size={14} />
                  <span>Lưu vào Cloud Firebase</span>
                </button>
              </div>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 font-bold text-xs text-center">
              ✓ Đã lưu dự án âm thanh thành công vào Cloud Firebase!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
