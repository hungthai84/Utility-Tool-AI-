'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Volume2,
  Loader2,
  Sparkles,
  User,
  Users,
  Check,
  Play,
  Pause,
  Bot,
  Code2,
  Trash2,
  Edit3,
  Globe,
  Search,
  Wand2,
  Sun,
  Moon,
  Upload,
  Eye,
  Smile,
  Sliders,
  MapPin,
} from 'lucide-react';
import type {
  StoryCharacter,
  CharacterRole,
  CharacterGender,
  CharacterAgeGroup,
  BilingualLanguage,
  VietnameseRegionalDialect,
  VoicePersona,
  Avatar3DConfig,
} from '@/types/story';
import {
  ALL_AVATARS,
  ROBOT_AVATARS,
  HUMAN_AVATARS,
  PRESET_CHARACTER_PROMPTS,
  VN_REGIONAL_DIALECTS,
  VN_MACRO_REGIONS,
  REGIONAL_NUANCE_OPTIONS,
  type MacroRegionVN,
  getRegionalDialectMeta,
  getMacroRegionForDialect,
  getMacroRegionRecommendation,
  resolveRegionalDialectFromText,
  normalizeBilingualLang,
  normalizePitchMultiplier,
  parsePromptCodeToCharacter,
  synthesizeOrSpeakBilingual,
} from '@/lib/bilingualVoiceEngine';
import {
  DEFAULT_3D_PRESETS,
  SKIN_COLOR_PALETTE,
  HAIR_COLOR_PALETTE,
  EYE_COLOR_PALETTE,
  Interactive3DAvatar,
  build3DAvatarSvgDataUrl,
} from './Avatar3DStudio';
import { useTheme } from '@/components/ThemeContext';

export type CastModalTab = 'roster' | 'manual' | 'prompt_code';

interface CharacterStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (character: StoryCharacter) => void;
  initialCharacter?: StoryCharacter | null;
  characters?: StoryCharacter[];
  onDeleteCharacter?: (charId: string) => void;
  initialTab?: CastModalTab;
}

interface GenderVoiceOption {
  name: VoicePersona;
  label: string;
  desc: string;
  genderLabel: string;
  targetGender: CharacterGender;
  recommendedPitch?: number;
}

const GENDER_VOICE_OPTIONS: GenderVoiceOption[] = [
  // Giọng Nữ (female)
  {
    name: 'Kore',
    label: 'Kore (Nữ chuẩn)',
    desc: 'Giọng nữ ấm áp, truyền cảm, tự nhiên',
    genderLabel: 'Nữ',
    targetGender: 'female',
    recommendedPitch: 1.0,
  },
  {
    name: 'Zephyr',
    label: 'Zephyr (Nữ trong trẻo)',
    desc: 'Giọng nữ nhẹ nhàng, trong trẻo, thư thái',
    genderLabel: 'Nữ',
    targetGender: 'female',
    recommendedPitch: 1.08,
  },
  {
    name: 'Aoede',
    label: 'Aoede (Nữ dẫn chuyện)',
    desc: 'Giọng nữ thanh lịch, sắc sảo, giàu cảm xúc',
    genderLabel: 'Nữ',
    targetGender: 'female',
    recommendedPitch: 0.98,
  },
  {
    name: 'Leda',
    label: 'Leda (Nữ trẻ trung)',
    desc: 'Giọng nữ tươi sáng, năng động, hiện đại',
    genderLabel: 'Nữ',
    targetGender: 'female',
    recommendedPitch: 1.15,
  },

  // Giọng Nam (male)
  {
    name: 'Puck',
    label: 'Puck (Nam trẻ trung)',
    desc: 'Giọng nam trẻ trung, năng động, tươi sáng',
    genderLabel: 'Nam',
    targetGender: 'male',
    recommendedPitch: 1.0,
  },
  {
    name: 'Charon',
    label: 'Charon (Nam trầm sâu)',
    desc: 'Giọng nam sâu lắng, từng trải, cuốn hút',
    genderLabel: 'Nam',
    targetGender: 'male',
    recommendedPitch: 0.9,
  },
  {
    name: 'Fenrir',
    label: 'Fenrir (Nam uy quyền)',
    desc: 'Giọng nam trầm ấm, mạnh mẽ, quyết đoán',
    genderLabel: 'Nam',
    targetGender: 'male',
    recommendedPitch: 0.88,
  },
  {
    name: 'Orus',
    label: 'Orus (Nam thuyết minh)',
    desc: 'Giọng nam điềm đạm, chuẩn mực, rõ chữ',
    genderLabel: 'Nam',
    targetGender: 'male',
    recommendedPitch: 0.95,
  },

  // Giọng AI Robot (robot)
  {
    name: 'Fenrir',
    label: 'Fenrir-Bot (Robot Trầm)',
    desc: 'Giọng AI Robot cơ khí trầm, uy quyền, chuẩn xác',
    genderLabel: 'AI Robot',
    targetGender: 'robot',
    recommendedPitch: 0.85,
  },
  {
    name: 'Kore',
    label: 'Kore-AI (Trợ lý Nữ AI)',
    desc: 'Giọng AI Robot nữ thông minh, hệ điều hành tương lai',
    genderLabel: 'AI Robot',
    targetGender: 'robot',
    recommendedPitch: 1.05,
  },
  {
    name: 'Puck',
    label: 'Puck-Cyber (Robot Năng lượng)',
    desc: 'Giọng AI Robot nam tốc độ cao, sắc nét',
    genderLabel: 'AI Robot',
    targetGender: 'robot',
    recommendedPitch: 0.92,
  },
  {
    name: 'Zephyr',
    label: 'Zephyr-OS (AI Không gian)',
    desc: 'Giọng AI Robot thanh thoát, phát âm song ngữ chuẩn',
    genderLabel: 'AI Robot',
    targetGender: 'robot',
    recommendedPitch: 1.1,
  },
];

const ROLES: { value: CharacterRole; label: string }[] = [
  { value: 'main', label: 'Nhân vật chính' },
  { value: 'supporting', label: 'Nhân vật phụ' },
  { value: 'narrator', label: 'Người dẫn chuyện' },
  { value: 'ai_robot', label: 'AI Robot / Trợ lý máy' },
  { value: 'antagonist', label: 'Phản diện' },
  { value: 'host', label: 'Dẫn chương trình / Host' },
  { value: 'guest', label: 'Khách mời' },
  { value: 'custom', label: 'Tùy chỉnh khác' },
];

const GENDERS: { value: CharacterGender; label: string }[] = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'robot', label: 'AI Robot' },
];

const AGE_GROUPS: { value: CharacterAgeGroup; label: string }[] = [
  { value: 'tre_em', label: 'Trẻ em' },
  { value: 'thanh_thieu_nien', label: 'Thanh thiếu niên' },
  { value: 'truong_thanh', label: 'Trưởng thành' },
  { value: 'trung_nien', label: 'Trung niên' },
  { value: 'cao_tuoi', label: 'Cao tuổi' },
  { value: 'ai_robot', label: 'AI Robot' },
];

const CUSTOM_AVATARS_STORAGE_KEY = 'utility_hub_custom_uploaded_avatars_v1';

export const CharacterStudioModal: React.FC<CharacterStudioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCharacter,
  characters = [],
  onDeleteCharacter,
  initialTab = 'manual',
}) => {
  const { isDark, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<CastModalTab>(initialTab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Uploaded Logos / Avatars from User Computer
  const [customUploadedAvatars, setCustomUploadedAvatars] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const animId = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(CUSTOM_AVATARS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCustomUploadedAvatars(parsed);
          }
        }
      } catch (e) {
        console.warn('Không thể tải danh sách logo từ máy:', e);
      }
    });
    return () => cancelAnimationFrame(animId);
  }, []);

  const saveCustomAvatarsToStorage = (list: string[]) => {
    setCustomUploadedAvatars(list);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CUSTOM_AVATARS_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('Không thể lưu logo vào bộ nhớ trình duyệt:', e);
      }
    }
  };

  // Roster Filter State (Tab 1)
  const [rosterSearch, setRosterSearch] = useState('');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterAge, setFilterAge] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [previewingCharId, setPreviewingCharId] = useState<string | null>(null);

  // Manual Form State (Tab 2)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<CharacterRole>('main');
  const [gender, setGender] = useState<CharacterGender>('female');
  const [ageGroup, setAgeGroup] = useState<CharacterAgeGroup>('truong_thanh');
  const [language, setLanguage] = useState<BilingualLanguage>('vi-VN');
  const [avatarUrl, setAvatarUrl] = useState(HUMAN_AVATARS[0]);
  const [avatar3DConfig, setAvatar3DConfig] = useState<Avatar3DConfig>({
    ...DEFAULT_3D_PRESETS[0].config,
    enabled: false,
  });
  const [isSimulating3DLipSync, setIsSimulating3DLipSync] = useState(false);

  const [description, setDescription] = useState('');
  const [personality, setPersonality] = useState('');
  const [voiceName, setVoiceName] = useState<VoicePersona>('Kore');
  const [speed, setSpeed] = useState(1.0);
  const [pitchMultiplier, setPitchMultiplier] = useState(1.0);
  const [style, setStyle] = useState('Truyền cảm, phát âm rõ ràng');
  const [vnDialect, setVnDialect] = useState<VietnameseRegionalDialect>('bac_chuan');
  const [regionalNuance, setRegionalNuance] = useState<string>(
    VN_REGIONAL_DIALECTS[0].defaultNuance
  );
  const [intonationLevel, setIntonationLevel] = useState<number>(1.0);
  const [regionGroupFilter, setRegionGroupFilter] = useState<string>('all');
  const [sampleDialogue, setSampleDialogue] = useState(
    'Xin chào, tôi rất vui được đồng hành cùng bạn trong câu chuyện truyền cảm hứng này!'
  );

  // Voice Test State
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);
  const [voiceEngineStatus, setVoiceEngineStatus] = useState<string>('');

  // Prompt Code State (Tab 3)
  const [promptCodeInput, setPromptCodeInput] = useState(
    PRESET_CHARACTER_PROMPTS[0].promptCode
  );
  const [selectedPresetAvatar, setSelectedPresetAvatar] = useState<string>(
    PRESET_CHARACTER_PROMPTS[0].avatarUrl
  );

  // Filter voices strictly by selected gender
  const availableVoicesForGender = useMemo(() => {
    return GENDER_VOICE_OPTIONS.filter((v) => v.targetGender === gender);
  }, [gender]);

  // Filter regional dialects by region group tab
  const filteredRegionalDialects = useMemo(() => {
    if (regionGroupFilter === 'all') return VN_REGIONAL_DIALECTS;
    return VN_REGIONAL_DIALECTS.filter((d) => d.regionGroup === regionGroupFilter);
  }, [regionGroupFilter]);

  const activeDialectMeta = useMemo(() => getRegionalDialectMeta(vnDialect), [vnDialect]);

  // Sync state when modal opens or props change
  const [prevSyncKey, setPrevSyncKey] = useState<string>('');
  const currentSyncKey = `${isOpen}-${initialCharacter?.id || 'new'}-${initialTab}`;

  if (currentSyncKey !== prevSyncKey) {
    setPrevSyncKey(currentSyncKey);
    setActiveTab(initialCharacter ? 'manual' : initialTab);
    if (initialCharacter) {
      const charGender: CharacterGender =
        initialCharacter.gender ||
        (initialCharacter.role === 'ai_robot' ? 'robot' : 'female');
      const resolvedLang = normalizeBilingualLang(initialCharacter.voiceProfile?.language);
      const resolvedDialect =
        initialCharacter.voiceProfile?.vnDialect ||
        resolveRegionalDialectFromText(
          `${initialCharacter.voiceProfile?.style || ''} ${initialCharacter.description || ''} ${initialCharacter.name || ''}`,
          resolvedLang
        );
      const dialectMeta = getRegionalDialectMeta(resolvedDialect);

      setEditingId(initialCharacter.id);
      setName(initialCharacter.name);
      setRole(initialCharacter.role);
      setGender(charGender);
      setAgeGroup(
        initialCharacter.ageGroup ||
          (initialCharacter.role === 'ai_robot' ? 'ai_robot' : 'truong_thanh')
      );
      setLanguage(resolvedLang);
      setAvatarUrl(initialCharacter.avatarUrl || HUMAN_AVATARS[0]);
      setAvatar3DConfig(
        initialCharacter.avatar3DConfig || {
          ...(charGender === 'robot'
            ? DEFAULT_3D_PRESETS[4].config
            : charGender === 'male'
            ? DEFAULT_3D_PRESETS[1].config
            : DEFAULT_3D_PRESETS[0].config),
          enabled: false,
        }
      );
      setDescription(initialCharacter.description || '');
      setPersonality(initialCharacter.personality || '');
      setVnDialect(resolvedDialect);
      setRegionalNuance(
        initialCharacter.voiceProfile?.regionalNuance || dialectMeta.defaultNuance
      );
      setIntonationLevel(initialCharacter.voiceProfile?.intonationLevel ?? 1.0);
      if (initialCharacter.voiceProfile) {
        const matchingGenderVoices = GENDER_VOICE_OPTIONS.filter(
          (v) => v.targetGender === charGender
        );
        const isCurrentVoiceValidForGender = matchingGenderVoices.some(
          (v) => v.name === initialCharacter.voiceProfile.voiceName
        );
        setVoiceName(
          isCurrentVoiceValidForGender
            ? initialCharacter.voiceProfile.voiceName
            : matchingGenderVoices[0]?.name || 'Kore'
        );
        setSpeed(initialCharacter.voiceProfile.speed ?? 1.0);
        setPitchMultiplier(
          normalizePitchMultiplier(
            initialCharacter.voiceProfile.pitch,
            initialCharacter.voiceProfile.pitchMultiplier
          )
        );
        setStyle(initialCharacter.voiceProfile.style || dialectMeta.ttsStylePrompt);
      }
      setSampleDialogue(
        initialCharacter.sampleDialogue ||
          dialectMeta.sampleRegionalDialogue ||
          'Xin chào, tôi rất vui được đồng hành cùng bạn trong câu chuyện truyền cảm hứng này!'
      );
    } else {
      setEditingId(null);
      setName('');
      setRole('main');
      setGender('female');
      setAgeGroup('truong_thanh');
      setLanguage('vi-VN');
      setAvatarUrl(HUMAN_AVATARS[0]);
      setAvatar3DConfig({
        ...DEFAULT_3D_PRESETS[0].config,
        enabled: false,
      });
      setDescription('');
      setPersonality('');
      setVoiceName('Kore');
      setSpeed(1.0);
      setPitchMultiplier(1.0);
      setVnDialect('bac_chuan');
      setRegionalNuance(VN_REGIONAL_DIALECTS[0].defaultNuance);
      setIntonationLevel(1.0);
      setStyle(VN_REGIONAL_DIALECTS[0].ttsStylePrompt);
      setSampleDialogue(
        'Xin chào, tôi rất vui được đồng hành cùng bạn trong câu chuyện truyền cảm hứng này!'
      );
    }
    setTestAudioUrl(null);
    setIsPlayingTest(false);
    setIsSimulating3DLipSync(false);
    setVoiceEngineStatus('');
  }

  // Live parsed character from Prompt Code in Tab 3
  const parsedPromptCharacter = useMemo(() => {
    return parsePromptCodeToCharacter(promptCodeInput, selectedPresetAvatar);
  }, [promptCodeInput, selectedPresetAvatar]);

  // Filtered characters for Tab 1 (Cast Roster)
  const filteredRoster = useMemo(() => {
    return characters.filter((c) => {
      const cGender = c.gender || (c.role === 'ai_robot' ? 'robot' : 'female');
      const cAge = c.ageGroup || (c.role === 'ai_robot' ? 'ai_robot' : 'truong_thanh');
      const cLang = normalizeBilingualLang(c.voiceProfile?.language);
      const cDialect =
        c.voiceProfile?.vnDialect ||
        resolveRegionalDialectFromText(
          `${c.voiceProfile?.style || ''} ${c.description || ''} ${c.name || ''}`,
          cLang
        );
      const matchGender = filterGender === 'all' || cGender === filterGender;
      const matchAge = filterAge === 'all' || cAge === filterAge;
      const matchRegion = filterRegion === 'all' || cDialect === filterRegion;
      const q = rosterSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.personality.toLowerCase().includes(q);
      return matchGender && matchAge && matchRegion && matchSearch;
    });
  }, [characters, filterGender, filterAge, filterRegion, rosterSearch]);

  if (!isOpen) return null;

  // Handle uploading logo/image from user's local machine
  const handleUploadLocalLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      if (!resultStr) return;

      // Resize image on canvas to max 256x256 to keep storage fast and lightweight
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h >= w && h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const optimizedDataUrl = canvas.toDataURL('image/png', 0.9);
          const updatedList = [
            optimizedDataUrl,
            ...customUploadedAvatars.filter((u) => u !== optimizedDataUrl),
          ].slice(0, 12);
          saveCustomAvatarsToStorage(updatedList);
          setAvatarUrl(optimizedDataUrl);
          if (avatar3DConfig.enabled && avatar3DConfig.presetId === 'custom_logo_rig') {
            setAvatar3DConfig({
              ...avatar3DConfig,
              customLogoUrl: optimizedDataUrl,
            });
          }
        } else {
          setAvatarUrl(resultStr);
        }
      };
      img.onerror = () => {
        setAvatarUrl(resultStr);
      };
      img.src = resultStr;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGenderChange = (newGender: CharacterGender) => {
    setGender(newGender);

    // Filter voices for the newly selected gender and auto-select matching voice
    const genderVoices = GENDER_VOICE_OPTIONS.filter((v) => v.targetGender === newGender);
    const currentStillMatches = genderVoices.some((v) => v.name === voiceName);
    const chosenVoice = currentStillMatches ? voiceName : genderVoices[0]?.name || 'Kore';
    setVoiceName(chosenVoice);

    const matchedVoiceMeta =
      genderVoices.find((v) => v.name === chosenVoice) || genderVoices[0];

    if (newGender === 'robot') {
      setAgeGroup('ai_robot');
      setRole('ai_robot');
      if (!customUploadedAvatars.includes(avatarUrl)) {
        setAvatarUrl(ROBOT_AVATARS[0]);
      }
      setPitchMultiplier(matchedVoiceMeta?.recommendedPitch ?? 0.85);
      if (avatar3DConfig.enabled && avatar3DConfig.presetId !== 'custom_logo_rig') {
        setAvatar3DConfig({
          ...DEFAULT_3D_PRESETS[4].config,
          enabled: true,
        });
      }
    } else if (newGender === 'male') {
      if (ageGroup === 'ai_robot') setAgeGroup('truong_thanh');
      if (role === 'ai_robot') setRole('main');
      if (ROBOT_AVATARS.includes(avatarUrl)) {
        setAvatarUrl(HUMAN_AVATARS[1]);
      }
      setPitchMultiplier(matchedVoiceMeta?.recommendedPitch ?? 0.95);
      if (avatar3DConfig.enabled && avatar3DConfig.presetId !== 'custom_logo_rig') {
        setAvatar3DConfig({
          ...DEFAULT_3D_PRESETS[1].config,
          enabled: true,
        });
      }
    } else {
      if (ageGroup === 'ai_robot') setAgeGroup('truong_thanh');
      if (role === 'ai_robot') setRole('main');
      if (ROBOT_AVATARS.includes(avatarUrl)) {
        setAvatarUrl(HUMAN_AVATARS[0]);
      }
      setPitchMultiplier(matchedVoiceMeta?.recommendedPitch ?? 1.0);
      if (avatar3DConfig.enabled && avatar3DConfig.presetId !== 'custom_logo_rig') {
        setAvatar3DConfig({
          ...DEFAULT_3D_PRESETS[0].config,
          enabled: true,
        });
      }
    }
  };

  const loadCharacterIntoManualTab = (char: StoryCharacter) => {
    const charGender: CharacterGender =
      char.gender || (char.role === 'ai_robot' ? 'robot' : 'female');
    const resolvedLang = normalizeBilingualLang(char.voiceProfile?.language);
    const resolvedDialect =
      char.voiceProfile?.vnDialect ||
      resolveRegionalDialectFromText(
        `${char.voiceProfile?.style || ''} ${char.description || ''} ${char.name || ''}`,
        resolvedLang
      );
    const dialectMeta = getRegionalDialectMeta(resolvedDialect);

    setEditingId(char.id);
    setName(char.name);
    setRole(char.role);
    setGender(charGender);
    setAgeGroup(char.ageGroup || (char.role === 'ai_robot' ? 'ai_robot' : 'truong_thanh'));
    setLanguage(resolvedLang);
    setAvatarUrl(char.avatarUrl || HUMAN_AVATARS[0]);
    setAvatar3DConfig(
      char.avatar3DConfig || {
        ...(charGender === 'robot'
          ? DEFAULT_3D_PRESETS[4].config
          : charGender === 'male'
          ? DEFAULT_3D_PRESETS[1].config
          : DEFAULT_3D_PRESETS[0].config),
        enabled: false,
      }
    );
    setDescription(char.description || '');
    setPersonality(char.personality || '');
    setVnDialect(resolvedDialect);
    setRegionalNuance(char.voiceProfile?.regionalNuance || dialectMeta.defaultNuance);
    setIntonationLevel(char.voiceProfile?.intonationLevel ?? 1.0);

    const matchingGenderVoices = GENDER_VOICE_OPTIONS.filter(
      (v) => v.targetGender === charGender
    );
    const hasValidVoice = matchingGenderVoices.some(
      (v) => v.name === char.voiceProfile?.voiceName
    );
    setVoiceName(
      hasValidVoice
        ? char.voiceProfile.voiceName
        : matchingGenderVoices[0]?.name || 'Kore'
    );
    setSpeed(char.voiceProfile?.speed ?? 1.0);
    setPitchMultiplier(
      normalizePitchMultiplier(
        char.voiceProfile?.pitch,
        char.voiceProfile?.pitchMultiplier
      )
    );
    setStyle(char.voiceProfile?.style || dialectMeta.ttsStylePrompt);
    setSampleDialogue(
      char.sampleDialogue ||
        dialectMeta.sampleRegionalDialogue ||
        'Xin chào, tôi rất vui được đồng hành cùng bạn trong câu chuyện truyền cảm hứng này!'
    );
    setActiveTab('manual');
  };

  const handleSelectRegionalDialect = (
    dialectId: VietnameseRegionalDialect,
    applyRecommendedProsody = true
  ) => {
    const meta = getRegionalDialectMeta(dialectId);
    setVnDialect(dialectId);
    setRegionalNuance(meta.defaultNuance);
    setStyle(meta.ttsStylePrompt);
    if (dialectId === 'quoc_te_en') {
      setLanguage('en-US');
    } else if (language === 'en-US') {
      setLanguage('vi-VN');
    }
    if (applyRecommendedProsody) {
      setPitchMultiplier(meta.recommendedPitch);
      setSpeed(meta.recommendedRate);
    }
  };

  // Chọn nhanh Vùng miền (Bắc • Trung • Nam) cho nhân vật Tiếng Việt và gợi ý Pitch/Rate chuẩn vùng
  const handleSelectMacroRegion = (macro: MacroRegionVN) => {
    const rec = getMacroRegionRecommendation(macro, gender);
    setLanguage('vi-VN');
    setVnDialect(rec.dialect);
    setPitchMultiplier(rec.pitchMultiplier);
    setSpeed(rec.rate);
    setRegionalNuance(rec.nuance);
    setStyle(rec.stylePrompt);
    const meta = getRegionalDialectMeta(rec.dialect);
    if (meta.sampleRegionalDialogue) {
      setSampleDialogue(meta.sampleRegionalDialogue);
    }
    if (macro === 'bac') setRegionGroupFilter('Miền Bắc');
    else if (macro === 'trung') setRegionGroupFilter('Miền Trung');
    else if (macro === 'nam') setRegionGroupFilter('Miền Nam & Miền Tây');
  };

  const handlePreviewRosterCharacter = async (char: StoryCharacter) => {
    setPreviewingCharId(char.id);
    const sampleText =
      char.sampleDialogue ||
      (normalizeBilingualLang(char.voiceProfile?.language) === 'en-US'
        ? `Hello, my name is ${char.name}.`
        : `Xin chào, tôi là ${char.name}.`);

    const result = await synthesizeOrSpeakBilingual({
      text: sampleText,
      character: char,
      onEnd: () => setPreviewingCharId(null),
    });

    if (result.audioUrl) {
      const audio = new Audio(result.audioUrl);
      audio.playbackRate = char.voiceProfile?.speed ?? 1.0;
      audio.onended = () => setPreviewingCharId(null);
      audio.onerror = () => setPreviewingCharId(null);
      audio.play().catch(() => setPreviewingCharId(null));
    }
  };

  const handleTestVoiceManual = async () => {
    if (!sampleDialogue.trim()) return;
    setIsTestingVoice(true);
    setIsSimulating3DLipSync(true);
    setVoiceEngineStatus('Đang kết nối Bilingual Voice Engine & Vùng miền...');

    const tempChar: StoryCharacter = {
      id: 'temp_preview',
      name: name || 'Nhân vật thử giọng',
      role,
      gender,
      ageGroup,
      avatarUrl,
      avatar3DConfig,
      description,
      personality,
      voiceProfile: {
        voiceName,
        language,
        speed,
        pitch: Math.round((pitchMultiplier - 1.0) * 15),
        pitchMultiplier,
        style,
        pauseDurationMs: 300,
        vnDialect,
        regionalNuance,
        intonationLevel,
      },
      sampleDialogue,
      createdAt: '',
      updatedAt: '',
    };

    try {
      const result = await synthesizeOrSpeakBilingual({
        text: sampleDialogue,
        character: tempChar,
        onStart: () => {
          setIsPlayingTest(true);
          setIsSimulating3DLipSync(true);
        },
        onEnd: () => {
          setIsPlayingTest(false);
          setIsSimulating3DLipSync(false);
        },
      });

      if (result.audioUrl) {
        setTestAudioUrl(result.audioUrl);
        const newAudio = new Audio(result.audioUrl);
        newAudio.playbackRate = speed;
        newAudio.onended = () => {
          setIsPlayingTest(false);
          setIsSimulating3DLipSync(false);
        };
        setAudioObj(newAudio);
        newAudio.play();
        setIsPlayingTest(true);
        setIsSimulating3DLipSync(true);
        setVoiceEngineStatus(
          `Gemini Cloud TTS (${result.language}) • ${activeDialectMeta.shortBadge} • Giọng ${voiceName} • Pitch ${pitchMultiplier}x • Rate ${speed}x`
        );
      } else {
        setVoiceEngineStatus(
          `Native Browser Voice (${result.language}) • ${activeDialectMeta.shortBadge} • Giọng ${voiceName} • Pitch ${pitchMultiplier}x • Rate ${speed}x`
        );
      }
    } catch (err) {
      console.error('Lỗi khi nghe thử giọng:', err);
      setVoiceEngineStatus('Đã chuyển sang chế độ đọc dự phòng an toàn.');
      setIsSimulating3DLipSync(false);
    } finally {
      setIsTestingVoice(false);
    }
  };

  const togglePlayTest = () => {
    if (!audioObj) return;
    if (isPlayingTest) {
      audioObj.pause();
      setIsPlayingTest(false);
      setIsSimulating3DLipSync(false);
    } else {
      audioObj.play();
      setIsPlayingTest(true);
      setIsSimulating3DLipSync(true);
    }
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const pitchSteps = Math.round((pitchMultiplier - 1.0) * 15);
    const resolvedAvatarUrl = avatar3DConfig.enabled
      ? build3DAvatarSvgDataUrl(avatar3DConfig)
      : avatarUrl;

    const charObj: StoryCharacter = {
      id: editingId || initialCharacter?.id || 'char_' + Date.now(),
      name: name.trim(),
      role: gender === 'robot' ? 'ai_robot' : role,
      gender,
      ageGroup: gender === 'robot' ? 'ai_robot' : ageGroup,
      avatarUrl: resolvedAvatarUrl,
      avatar3DConfig: avatar3DConfig.enabled ? avatar3DConfig : undefined,
      description,
      personality,
      voiceProfile: {
        voiceName,
        language: normalizeBilingualLang(language),
        speed,
        pitch: pitchSteps,
        pitchMultiplier,
        style,
        pauseDurationMs: 300,
        vnDialect,
        regionalNuance,
        intonationLevel,
      },
      sampleDialogue,
      createdAt: initialCharacter?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(charObj);
    if (characters.length > 0) {
      setActiveTab('roster');
    } else {
      onClose();
    }
  };

  const handleCreateFromPromptCode = () => {
    const now = new Date().toISOString();
    const newChar: StoryCharacter = {
      ...parsedPromptCharacter,
      id: 'char_prompt_' + Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    onSave(newChar);
    setActiveTab('roster');
  };

  const inputClass = isDark
    ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-purple-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-purple-600 shadow-sm';

  const selectClass = isDark
    ? 'bg-gray-800 border-white/10 text-white focus:border-purple-500'
    : 'bg-white border-slate-300 text-slate-900 focus:border-purple-600 shadow-sm';

  const activeGenderLabel =
    gender === 'female' ? 'Nữ' : gender === 'male' ? 'Nam' : 'AI Robot';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div
        className={`relative w-full max-w-4xl border rounded-[14px] shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col transition-colors ${
          isDark
            ? 'bg-gray-900 border-white/20 text-white'
            : 'bg-[#F8FAFC] border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b transition-colors ${
            isDark
              ? 'border-white/10 bg-gradient-to-r from-purple-950/60 via-indigo-950/50 to-gray-900'
              : 'border-slate-200 bg-gradient-to-r from-purple-50 via-indigo-50/70 to-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-[14px] border ${
                isDark
                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                  : 'bg-purple-100 border-purple-200 text-purple-700'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3
                className={`text-lg font-bold flex flex-wrap items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <span>Quản Lý Dàn Nhân Vật & AI Prompt Studio</span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${
                    isDark
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  }`}
                >
                  Song Ngữ VI / EN • Avatar 3D Live
                </span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Bảng phân vai (Con người & AI Robot), lọc giọng theo giới tính, tải Logo máy & Tạo hình Avatar 3D chuyển động mắt, nhép miệng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`px-3 py-1.5 rounded-[14px] border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/10 hover:bg-white/15 border-white/15 text-amber-300'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-indigo-700 shadow-sm'
              }`}
              title="Chuyển đổi Giao diện Sáng / Tối"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDark ? 'Sáng' : 'Tối'}</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-[14px] transition-colors cursor-pointer ${
                isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3-Tab Navigation Bar */}
        <div
          className={`grid grid-cols-3 gap-2 px-6 py-3 border-b transition-colors ${
            isDark
              ? 'bg-black/40 border-white/10'
              : 'bg-slate-100/90 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`py-2.5 px-3 rounded-[14px] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : isDark
                ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                : 'bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-700 border border-slate-200/80'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">1. Bảng Nhân Vật ({characters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setActiveTab('manual');
            }}
            className={`py-2.5 px-3 rounded-[14px] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : isDark
                ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                : 'bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-700 border border-slate-200/80'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="truncate">{editingId ? '2. Đang Sửa Nhân Vật' : '2. Thêm Thủ Công'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prompt_code')}
            className={`py-2.5 px-3 rounded-[14px] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'prompt_code'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                : isDark
                ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/80'
            }`}
          >
            <Code2 className="w-4 h-4 shrink-0" />
            <span className="truncate">3. Thêm Bằng Prompt Code</span>
          </button>
        </div>

        {/* TAB 1: CAST ROSTER (BẢNG NHÂN VẬT) */}
        {activeTab === 'roster' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Filter Controls */}
            <div
              className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-[14px] border ${
                isDark
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="relative flex-1">
                <Search
                  className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-gray-400' : 'text-slate-400'
                  }`}
                />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Tìm kiếm theo tên, vai trò, tính cách..."
                  className={`w-full pl-9 pr-3 py-2 border rounded-[14px] text-xs focus:outline-none ${inputClass}`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className={`px-3 py-2 border rounded-[14px] text-xs focus:outline-none ${selectClass}`}
                >
                  <option value="all">Tất cả giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="robot">AI Robot</option>
                </select>

                <select
                  value={filterAge}
                  onChange={(e) => setFilterAge(e.target.value)}
                  className={`px-3 py-2 border rounded-[14px] text-xs focus:outline-none ${selectClass}`}
                >
                  <option value="all">Tất cả độ tuổi</option>
                  {AGE_GROUPS.map((ag) => (
                    <option key={ag.value} value={ag.value}>
                      {ag.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className={`px-3 py-2 border rounded-[14px] text-xs focus:outline-none ${selectClass}`}
                >
                  <option value="all">Tất cả vùng miền giọng đọc</option>
                  {VN_REGIONAL_DIALECTS.map((rg) => (
                    <option key={rg.id} value={rg.id}>
                      {rg.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Roster Grid */}
            {filteredRoster.length === 0 ? (
              <div
                className={`p-10 text-center rounded-[14px] border space-y-3 ${
                  isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <Users
                  className={`w-10 h-10 mx-auto ${
                    isDark ? 'text-gray-500' : 'text-slate-400'
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-slate-700'
                  }`}
                >
                  Không tìm thấy nhân vật nào khớp bộ lọc.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className="px-4 py-2 rounded-[14px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium cursor-pointer"
                  >
                    + Thêm Thủ Công
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('prompt_code')}
                    className="px-4 py-2 rounded-[14px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                  >
                    + Tạo Bằng Prompt Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRoster.map((char) => {
                  const isRobot =
                    char.gender === 'robot' ||
                    char.ageGroup === 'ai_robot' ||
                    char.role === 'ai_robot';
                  const charLang = normalizeBilingualLang(char.voiceProfile?.language);
                  const charPitch = normalizePitchMultiplier(
                    char.voiceProfile?.pitch,
                    char.voiceProfile?.pitchMultiplier
                  );
                  const ageLabel =
                    AGE_GROUPS.find((a) => a.value === char.ageGroup)?.label ||
                    (isRobot ? 'AI Robot' : 'Trưởng thành');
                  const charDialect =
                    char.voiceProfile?.vnDialect ||
                    resolveRegionalDialectFromText(
                      `${char.voiceProfile?.style || ''} ${char.description || ''} ${char.name || ''}`,
                      charLang
                    );
                  const charDialectMeta = getRegionalDialectMeta(charDialect);
                  const isPreviewingThis = previewingCharId === char.id;

                  return (
                    <div
                      key={char.id}
                      className={`p-4 rounded-[14px] border transition-all space-y-3 flex flex-col justify-between ${
                        isRobot
                          ? isDark
                            ? 'bg-gradient-to-br from-cyan-950/40 via-gray-900 to-indigo-950/40 border-cyan-500/30 hover:border-cyan-400/60'
                            : 'bg-gradient-to-br from-cyan-50/90 via-white to-indigo-50/70 border-cyan-300 hover:border-cyan-500 shadow-sm'
                          : isDark
                          ? 'bg-white/5 border-white/10 hover:border-purple-500/50'
                          : 'bg-white border-slate-200 hover:border-purple-400 shadow-sm'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <Interactive3DAvatar
                                avatarUrl={char.avatarUrl || HUMAN_AVATARS[0]}
                                avatar3DConfig={char.avatar3DConfig}
                                name={char.name}
                                isSpeaking={isPreviewingThis}
                                isRobot={isRobot}
                                size="md"
                                className={`rounded-[14px] border-2 ${
                                  isRobot ? 'border-cyan-400' : 'border-purple-500/40'
                                }`}
                              />
                              {isRobot && (
                                <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-cyan-500 text-black shadow z-10">
                                  <Bot className="w-3 h-3" />
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <h4
                                className={`text-sm font-bold truncate flex items-center gap-1.5 ${
                                  isDark ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {char.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                                    isRobot
                                      ? isDark
                                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                        : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                                      : isDark
                                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                      : 'bg-purple-100 text-purple-800 border-purple-200'
                                  }`}
                                >
                                  {isRobot
                                    ? 'AI Robot'
                                    : char.gender === 'male'
                                    ? 'Nam'
                                    : 'Nữ'}{' '}
                                  • {ageLabel}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold inline-flex items-center gap-1 ${
                                    isDark
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                      : 'bg-amber-100 text-amber-900 border-amber-300'
                                  }`}
                                >
                                  <MapPin className="w-2.5 h-2.5" />
                                  {charDialectMeta.shortBadge}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                                    isDark
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  }`}
                                >
                                  {charLang}
                                </span>
                                {char.avatar3DConfig?.enabled && (
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                                      isDark
                                        ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30'
                                        : 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300'
                                    }`}
                                  >
                                    3D Rig
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div
                            className={`text-right text-[10px] font-mono shrink-0 ${
                              isDark ? 'text-gray-400' : 'text-slate-500'
                            }`}
                          >
                            <div>Giọng: {char.voiceProfile?.voiceName || 'Kore'}</div>
                            <div>Pitch: {charPitch}x</div>
                            <div>Rate: {char.voiceProfile?.speed ?? 1.0}x</div>
                          </div>
                        </div>

                        <p
                          className={`text-xs line-clamp-2 break-words ${
                            isDark ? 'text-gray-300' : 'text-slate-600'
                          }`}
                        >
                          {char.description || char.personality || 'Chưa có mô tả chi tiết.'}
                        </p>
                      </div>

                      <div
                        className={`flex items-center justify-between gap-2 pt-3 border-t ${
                          isDark ? 'border-white/10' : 'border-slate-200/80'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handlePreviewRosterCharacter(char)}
                          disabled={isPreviewingThis}
                          className={`px-3 py-1.5 rounded-[14px] text-xs font-medium transition-colors flex items-center gap-1.5 border cursor-pointer ${
                            isDark
                              ? 'bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border-purple-500/30'
                              : 'bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border-purple-200'
                          }`}
                        >
                          {isPreviewingThis ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang phát & nhép miệng...
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" /> Nghe thử giọng
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => loadCharacterIntoManualTab(char)}
                            className={`p-2 rounded-[14px] text-xs transition-colors cursor-pointer ${
                              isDark
                                ? 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                            title="Chỉnh sửa nhân vật"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {char.role !== 'narrator' && onDeleteCharacter && (
                            <button
                              type="button"
                              onClick={() => onDeleteCharacter(char.id)}
                              className={`p-2 rounded-[14px] text-xs transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                  : 'bg-red-50 hover:bg-red-100 text-red-600'
                              }`}
                              title="Xóa nhân vật"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: THÊM THỦ CÔNG (MANUAL ADD / EDIT) */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSubmitManual} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              <h4
                className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                  isDark ? 'text-purple-400' : 'text-purple-700'
                }`}
              >
                <User className="w-4 h-4" /> Hồ sơ Nhân vật & Phân loại Độ tuổi / Giới tính
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Tên nhân vật *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: CyberBot-X9, Bác Ba, Bé Su..."
                    className={`w-full px-3 py-2 border rounded-[14px] text-sm focus:outline-none ${inputClass}`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Giới tính / Loại
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => handleGenderChange(e.target.value as CharacterGender)}
                    className={`w-full px-3 py-2 border rounded-[14px] text-sm focus:outline-none ${selectClass}`}
                  >
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Độ tuổi
                  </label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value as CharacterAgeGroup)}
                    className={`w-full px-3 py-2 border rounded-[14px] text-sm focus:outline-none ${selectClass}`}
                  >
                    {AGE_GROUPS.map((ag) => (
                      <option key={ag.value} value={ag.value}>
                        {ag.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Vai trò trong kịch bản
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as CharacterRole)}
                    className={`w-full px-3 py-2 border rounded-[14px] text-sm focus:outline-none ${selectClass}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-xs font-medium mb-1 flex items-center gap-1.5 ${
                      isDark ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-500" /> Ngôn ngữ chuẩn (Bilingual Engine)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage('vi-VN')}
                      className={`py-2 px-3 rounded-[14px] border text-xs font-semibold transition-all cursor-pointer ${
                        language === 'vi-VN'
                          ? isDark
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                          : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🇻🇳 Tiếng Việt (vi-VN)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('en-US')}
                      className={`py-2 px-3 rounded-[14px] border text-xs font-semibold transition-all cursor-pointer ${
                        language === 'en-US'
                          ? isDark
                            ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                            : 'bg-blue-50 border-blue-500 text-blue-800'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                          : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🇺🇸 English (en-US)
                    </button>
                  </div>
                </div>

                {/* Trường chọn Vùng miền (Bắc • Trung • Nam) cho nhân vật Tiếng Việt */}
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 flex items-center justify-between gap-1 ${
                      isDark ? 'text-amber-300' : 'text-amber-800'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" /> Vùng miền (Bắc • Trung • Nam)
                    </span>
                    <span className="text-[10px] font-mono opacity-80">
                      Gợi ý Pitch/Rate tự động
                    </span>
                  </label>
                  {language === 'vi-VN' ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      {VN_MACRO_REGIONS.map((mr) => {
                        const currentMacro = getMacroRegionForDialect(vnDialect);
                        const isSelectedMacro = currentMacro === mr.id;
                        return (
                          <button
                            key={mr.id}
                            type="button"
                            onClick={() => handleSelectMacroRegion(mr.id)}
                            className={`py-2 px-2 rounded-[14px] border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isSelectedMacro
                                ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                                : isDark
                                ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-amber-50'
                            }`}
                            title={mr.summaryTraits}
                          >
                            <span>Miền {mr.shortLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className={`py-2 px-3 rounded-[14px] border text-xs text-center ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-gray-400'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}
                    >
                      Chuyển sang Tiếng Việt (vi-VN) để chọn Bắc/Trung/Nam
                    </div>
                  )}
                </div>
              </div>

              {/* Avatar Selection (Human + AI Robot + Upload Local Logo + 3D Avatar Creator) */}
              <div
                className={`p-4 rounded-[14px] border space-y-4 ${
                  isDark
                    ? 'bg-white/[0.03] border-white/10'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    className={`block text-xs font-semibold ${
                      isDark ? 'text-gray-200' : 'text-slate-800'
                    }`}
                  >
                    Chọn Avatar Nhân vật (Con người & AI Robot)
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Hidden File Input for Local Logo Upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLocalLogo}
                      className="hidden"
                    />

                    {/* Button 1: Upload Logo from Computer */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`px-3 py-1.5 rounded-[14px] border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-300'
                          : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-800 shadow-sm'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Thêm logo từ hình máy</span>
                    </button>

                    {/* Button 2: Toggle 3D Animated Avatar Builder */}
                    <button
                      type="button"
                      onClick={() =>
                        setAvatar3DConfig((prev) => ({
                          ...prev,
                          enabled: !prev.enabled,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-[14px] border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        avatar3DConfig.enabled
                          ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-purple-500 shadow-md shadow-purple-500/25'
                          : isDark
                          ? 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/40 text-purple-300'
                          : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-800 shadow-sm'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {avatar3DConfig.enabled
                          ? 'Đang bật Avatar 3D (Mắt & Nhép miệng)'
                          : 'Tạo hình Avatar 3D (Chuyển động mắt & Nhép miệng)'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Avatar Gallery Strip (Custom Uploaded Logos + Default Human & Robot Avatars) */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {/* Quick Upload Slot */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-12 h-12 rounded-[14px] border-2 border-dashed flex flex-col items-center justify-center gap-0.5 shrink-0 transition-all cursor-pointer ${
                      isDark
                        ? 'border-cyan-500/50 hover:border-cyan-400 bg-cyan-500/10 text-cyan-300'
                        : 'border-cyan-400 hover:border-cyan-600 bg-cyan-50/70 text-cyan-700'
                    }`}
                    title="Tải ảnh hoặc logo từ máy tính"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[8px] font-bold">TẢI ẢNH</span>
                  </button>

                  {/* Custom Uploaded Avatars from Machine */}
                  {customUploadedAvatars.map((customUrl, cIdx) => {
                    const isSelected =
                      !avatar3DConfig.enabled && avatarUrl === customUrl;
                    return (
                      <div key={`custom_${cIdx}`} className="relative shrink-0 group">
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarUrl(customUrl);
                            if (
                              avatar3DConfig.enabled &&
                              avatar3DConfig.presetId === 'custom_logo_rig'
                            ) {
                              setAvatar3DConfig({
                                ...avatar3DConfig,
                                customLogoUrl: customUrl,
                              });
                            }
                          }}
                          className={`relative w-12 h-12 rounded-[14px] overflow-hidden border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-cyan-400 scale-105 shadow-lg shadow-cyan-500/30'
                              : 'border-cyan-500/30 opacity-85 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={customUrl}
                            alt={`Logo máy ${cIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 bg-amber-500 text-black text-[7px] font-bold px-1 rounded-tl">
                            LOGO
                          </span>
                          {isSelected && (
                            <div className="absolute inset-0 bg-cyan-500/25 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {/* Built-in Human & AI Robot Avatars */}
                  {ALL_AVATARS.map((url, idx) => {
                    const isRobotAvatar = idx >= HUMAN_AVATARS.length;
                    const isSelected = !avatar3DConfig.enabled && avatarUrl === url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(url);
                          setAvatar3DConfig((prev) => ({ ...prev, enabled: false }));
                        }}
                        className={`relative w-12 h-12 rounded-[14px] overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'border-purple-500 scale-105 shadow-lg shadow-purple-500/30'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Avatar ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {isRobotAvatar && (
                          <span className="absolute bottom-0 right-0 bg-cyan-500 text-black text-[8px] font-bold px-1 rounded-tl">
                            BOT
                          </span>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 3D INTERACTIVE AVATAR BUILDER (CHUYỂN ĐỘNG MẮT & NHÉP MIỆNG) */}
                {avatar3DConfig.enabled && (
                  <div
                    className={`p-4 rounded-[14px] border space-y-4 transition-all ${
                      isDark
                        ? 'bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 border-purple-500/40'
                        : 'bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/80 border-purple-300 shadow-inner'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-purple-500/20">
                      <div className="flex items-center gap-2">
                        <Sparkles
                          className={`w-4 h-4 ${
                            isDark ? 'text-purple-300' : 'text-purple-700'
                          }`}
                        />
                        <h5
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          Xưởng Tạo Hình Avatar 3D (Chuyển Động Mắt & Nhép Miệng Thời Gian Thực)
                        </h5>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsSimulating3DLipSync((prev) => !prev)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isSimulating3DLipSync
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md animate-pulse'
                            : isDark
                            ? 'bg-white/10 hover:bg-white/20 text-purple-200 border-white/15'
                            : 'bg-white hover:bg-purple-100 text-purple-700 border-purple-300 shadow-sm'
                        }`}
                      >
                        <Smile className="w-3.5 h-3.5" />
                        <span>
                          {isSimulating3DLipSync
                            ? 'Đang thử nhép miệng & đảo mắt (Nhấn để dừng)'
                            : 'Thử chuyển động mắt & nhép miệng 3D'}
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      {/* Left: Interactive 3D Avatar Preview Stage */}
                      <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-[14px] border border-purple-500/30 bg-black/25 space-y-2.5">
                        <Interactive3DAvatar
                          avatarUrl={avatarUrl}
                          avatar3DConfig={avatar3DConfig}
                          name={name || '3D Preview'}
                          isSpeaking={isSimulating3DLipSync || isPlayingTest}
                          isRobot={gender === 'robot'}
                          size="stage"
                          className="rounded-[14px] border-2 border-purple-400 shadow-2xl"
                        />
                        <div className="text-center space-y-0.5">
                          <div className="text-[11px] font-bold text-purple-300 flex items-center justify-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Di chuột lên mặt để mắt nhìn theo</span>
                          </div>
                          <p className="text-[10px] text-gray-400">
                            Tự động chớp mắt tự nhiên & nhép môi đa khẩu hình khi phát thoại
                          </p>
                        </div>
                      </div>

                      {/* Right: 3D Preset & Rig Controls */}
                      <div className="lg:col-span-8 space-y-3">
                        {/* 1. 3D Model Presets */}
                        <div>
                          <label
                            className={`block text-[11px] font-semibold mb-1.5 ${
                              isDark ? 'text-gray-300' : 'text-slate-700'
                            }`}
                          >
                            1. Chọn Mẫu Khuôn Mặt 3D hoặc Gắn Mắt/Miệng 3D Lên Logo Máy
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {DEFAULT_3D_PRESETS.map((preset) => {
                              const isCurrentPreset =
                                avatar3DConfig.presetId === preset.id;
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => {
                                    const nextCustomUrl =
                                      preset.id === 'custom_logo_rig'
                                        ? customUploadedAvatars[0] || avatarUrl
                                        : undefined;
                                    setAvatar3DConfig({
                                      ...preset.config,
                                      enabled: true,
                                      customLogoUrl: nextCustomUrl,
                                    });
                                  }}
                                  className={`p-2 rounded-[12px] border text-left transition-all cursor-pointer ${
                                    isCurrentPreset
                                      ? isDark
                                        ? 'bg-purple-600/35 border-purple-400 text-white shadow'
                                        : 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                      : isDark
                                      ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-purple-50'
                                  }`}
                                >
                                  <div className="text-xs font-bold truncate">
                                    {preset.label}
                                  </div>
                                  <div
                                    className={`text-[10px] truncate ${
                                      isCurrentPreset
                                        ? 'text-purple-100'
                                        : isDark
                                        ? 'text-gray-400'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {preset.badge}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Eye Style, Mouth Style, Accessory & Eye Tracking */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label
                              className={`block text-[11px] font-medium mb-1 ${
                                isDark ? 'text-gray-300' : 'text-slate-700'
                              }`}
                            >
                              Kiểu Mắt 3D & Đảo mắt
                            </label>
                            <select
                              value={avatar3DConfig.eyeStyle}
                              onChange={(e) =>
                                setAvatar3DConfig({
                                  ...avatar3DConfig,
                                  eyeStyle: e.target.value as Avatar3DConfig['eyeStyle'],
                                })
                              }
                              className={`w-full px-2.5 py-1.5 border rounded-[10px] text-xs focus:outline-none ${selectClass}`}
                            >
                              <option value="natural">Mắt 3D Tự nhiên</option>
                              <option value="anime">Mắt Anime Long lanh</option>
                              <option value="cute">Mắt To Tròn Đáng yêu</option>
                              <option value="cyber_glow">Mắt LED Cyber Robot</option>
                            </select>
                          </div>

                          <div>
                            <label
                              className={`block text-[11px] font-medium mb-1 ${
                                isDark ? 'text-gray-300' : 'text-slate-700'
                              }`}
                            >
                              Kiểu Nhép Miệng 3D
                            </label>
                            <select
                              value={avatar3DConfig.mouthStyle}
                              onChange={(e) =>
                                setAvatar3DConfig({
                                  ...avatar3DConfig,
                                  mouthStyle: e.target.value as Avatar3DConfig['mouthStyle'],
                                })
                              }
                              className={`w-full px-2.5 py-1.5 border rounded-[10px] text-xs focus:outline-none ${selectClass}`}
                            >
                              <option value="natural_lips">Môi 3D Tự nhiên (Răng & Lưỡi)</option>
                              <option value="smile_3d">Miệng Cười Tươi 3D</option>
                              <option value="cyber_wave">Miệng Sóng Âm LED Robot</option>
                            </select>
                          </div>

                          <div>
                            <label
                              className={`block text-[11px] font-medium mb-1 ${
                                isDark ? 'text-gray-300' : 'text-slate-700'
                              }`}
                            >
                              Phụ Kiện 3D
                            </label>
                            <select
                              value={avatar3DConfig.accessory}
                              onChange={(e) =>
                                setAvatar3DConfig({
                                  ...avatar3DConfig,
                                  accessory: e.target.value as Avatar3DConfig['accessory'],
                                })
                              }
                              className={`w-full px-2.5 py-1.5 border rounded-[10px] text-xs focus:outline-none ${selectClass}`}
                            >
                              <option value="none">Không phụ kiện</option>
                              <option value="headset">Tai nghe Phòng thu</option>
                              <option value="glasses">Kính Thông minh 3D</option>
                              <option value="crown">Vương miện Vàng</option>
                              <option value="halo">Vòng Hào quang Cyber</option>
                            </select>
                          </div>
                        </div>

                        {/* 3. Color Swatches (Skin, Hair, Eye Color) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                          <div>
                            <span
                              className={`block text-[10px] font-semibold mb-1 ${
                                isDark ? 'text-gray-400' : 'text-slate-600'
                              }`}
                            >
                              Màu Da / Vỏ 3D
                            </span>
                            <div className="flex items-center gap-1.5">
                              {SKIN_COLOR_PALETTE.map((c) => (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() =>
                                    setAvatar3DConfig({
                                      ...avatar3DConfig,
                                      skinColor: c.value,
                                    })
                                  }
                                  className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                                    avatar3DConfig.skinColor === c.value
                                      ? 'scale-125 border-purple-500 ring-2 ring-purple-400/50'
                                      : 'border-white/30'
                                  }`}
                                  style={{ backgroundColor: c.value }}
                                  title={c.label}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <span
                              className={`block text-[10px] font-semibold mb-1 ${
                                isDark ? 'text-gray-400' : 'text-slate-600'
                              }`}
                            >
                              Màu Tóc / Khung Đầu
                            </span>
                            <div className="flex items-center gap-1.5">
                              {HAIR_COLOR_PALETTE.map((c) => (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() =>
                                    setAvatar3DConfig({
                                      ...avatar3DConfig,
                                      hairColor: c.value,
                                    })
                                  }
                                  className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                                    avatar3DConfig.hairColor === c.value
                                      ? 'scale-125 border-purple-500 ring-2 ring-purple-400/50'
                                      : 'border-white/30'
                                  }`}
                                  style={{ backgroundColor: c.value }}
                                  title={c.label}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <span
                              className={`block text-[10px] font-semibold mb-1 ${
                                isDark ? 'text-gray-400' : 'text-slate-600'
                              }`}
                            >
                              Màu Con Ngươi Mắt 3D
                            </span>
                            <div className="flex items-center gap-1.5">
                              {EYE_COLOR_PALETTE.map((c) => (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() =>
                                    setAvatar3DConfig({
                                      ...avatar3DConfig,
                                      eyeColor: c.value,
                                    })
                                  }
                                  className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                                    avatar3DConfig.eyeColor === c.value
                                      ? 'scale-125 border-purple-500 ring-2 ring-purple-400/50'
                                      : 'border-white/30'
                                  }`}
                                  style={{ backgroundColor: c.value }}
                                  title={c.label}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 4. If Custom Logo Rig is selected, allow adjusting Eye & Mouth Y position */}
                        {avatar3DConfig.presetId === 'custom_logo_rig' && (
                          <div
                            className={`p-3 rounded-[12px] border grid grid-cols-1 sm:grid-cols-2 gap-3 ${
                              isDark
                                ? 'bg-black/30 border-cyan-500/30'
                                : 'bg-cyan-50/60 border-cyan-200'
                            }`}
                          >
                            <div>
                              <div className="flex justify-between text-[10px] font-semibold mb-1">
                                <span className="flex items-center gap-1">
                                  <Sliders className="w-3 h-3 text-cyan-400" /> Vị trí Mắt 3D trên Logo
                                </span>
                                <span>{avatar3DConfig.eyeOffsetY ?? 42}%</span>
                              </div>
                              <input
                                type="range"
                                min={22}
                                max={58}
                                value={avatar3DConfig.eyeOffsetY ?? 42}
                                onChange={(e) =>
                                  setAvatar3DConfig({
                                    ...avatar3DConfig,
                                    eyeOffsetY: Number(e.target.value),
                                  })
                                }
                                className="w-full accent-cyan-500"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] font-semibold mb-1">
                                <span className="flex items-center gap-1">
                                  <Sliders className="w-3 h-3 text-rose-400" /> Vị trí Miệng Nhép trên Logo
                                </span>
                                <span>{avatar3DConfig.mouthOffsetY ?? 70}%</span>
                              </div>
                              <input
                                type="range"
                                min={58}
                                max={88}
                                value={avatar3DConfig.mouthOffsetY ?? 70}
                                onChange={(e) =>
                                  setAvatar3DConfig({
                                    ...avatar3DConfig,
                                    mouthOffsetY: Number(e.target.value),
                                  })
                                }
                                className="w-full accent-rose-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Mô tả ngoại hình & bối cảnh
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Nghề nghiệp, xuất thân, đặc điểm nhận dạng..."
                    className={`w-full px-3 py-2 border rounded-[14px] text-sm focus:outline-none ${inputClass}`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Tính cách & Sắc thái cảm xúc
                  </label>
                  <textarea
                    rows={2}
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    placeholder="Điềm tĩnh, hài hước, giọng máy chuẩn xác..."
                    className={`w-full px-3 py-2 border rounded-[14px] text-sm focus:outline-none ${inputClass}`}
                  />
                </div>
              </div>
            </div>

            {/* Voice Engine Config (Filtered by Selected Gender) */}
            <div
              className={`space-y-4 pt-4 border-t ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                    isDark ? 'text-purple-400' : 'text-purple-700'
                  }`}
                >
                  <Volume2 className="w-4 h-4" /> Thông số Giọng nói Song ngữ (Pitch & Rate)
                </h4>

                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${
                    gender === 'robot'
                      ? isDark
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : 'bg-cyan-50 text-cyan-800 border-cyan-300'
                      : gender === 'male'
                      ? isDark
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-blue-50 text-blue-800 border-blue-300'
                      : isDark
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                      : 'bg-pink-50 text-pink-800 border-pink-300'
                  }`}
                >
                  Hiển thị theo giới tính: {activeGenderLabel} ({availableVoicesForGender.length} giọng)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableVoicesForGender.map((vp) => (
                  <button
                    key={`${vp.targetGender}_${vp.name}`}
                    type="button"
                    onClick={() => {
                      setVoiceName(vp.name);
                      if (vp.recommendedPitch) {
                        setPitchMultiplier(vp.recommendedPitch);
                      }
                    }}
                    className={`p-3 rounded-[14px] border text-left transition-all flex items-start justify-between cursor-pointer ${
                      voiceName === vp.name
                        ? isDark
                          ? 'bg-purple-500/20 border-purple-500 text-white shadow-lg'
                          : 'bg-purple-50 border-purple-500 text-slate-900 shadow-sm'
                        : isDark
                        ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-xs">
                        <span>{vp.label}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            isDark
                              ? 'bg-white/10 text-gray-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {vp.genderLabel}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] mt-1 ${
                          isDark ? 'text-gray-400' : 'text-slate-500'
                        }`}
                      >
                        {vp.desc}
                      </p>
                    </div>
                    {voiceName === vp.name && (
                      <Check
                        className={`w-4 h-4 shrink-0 ${
                          isDark ? 'text-purple-400' : 'text-purple-600'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={`p-3.5 rounded-[14px] border ${
                    isDark
                      ? 'bg-white/5 border-white/10'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div
                    className={`flex justify-between items-center text-xs font-medium mb-1.5 ${
                      isDark ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    <span>Cao độ (Pitch Multiplier)</span>
                    <span
                      className={`font-mono ${
                        isDark ? 'text-purple-400' : 'text-purple-700 font-bold'
                      }`}
                    >
                      {pitchMultiplier.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    value={pitchMultiplier}
                    onChange={(e) => setPitchMultiplier(parseFloat(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <div
                    className={`flex justify-between text-[10px] mt-1 ${
                      isDark ? 'text-gray-500' : 'text-slate-500'
                    }`}
                  >
                    <span>0.5x (Trầm / Máy)</span>
                    <span>1.0x (Chuẩn)</span>
                    <span>1.5x (Cao / Trẻ em)</span>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-[14px] border ${
                    isDark
                      ? 'bg-white/5 border-white/10'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div
                    className={`flex justify-between items-center text-xs font-medium mb-1.5 ${
                      isDark ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    <span>Tốc độ đọc (Rate)</span>
                    <span
                      className={`font-mono ${
                        isDark ? 'text-purple-400' : 'text-purple-700 font-bold'
                      }`}
                    >
                      {speed.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.05}
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <div
                    className={`flex justify-between text-[10px] mt-1 ${
                      isDark ? 'text-gray-500' : 'text-slate-500'
                    }`}
                  >
                    <span>0.5x (Chậm)</span>
                    <span>1.0x (Tự nhiên)</span>
                    <span>2.0x (Nhanh)</span>
                  </div>
                </div>
              </div>

              {/* TÍNH CHẤT GIỌNG ĐỌC TIẾNG VIỆT THEO VÙNG MIỀN (VIETNAMESE REGIONAL VOICE STUDIO) */}
              <div
                className={`p-4 rounded-[14px] border space-y-4 transition-all ${
                  isDark
                    ? 'bg-gradient-to-br from-amber-950/30 via-gray-900/90 to-purple-950/30 border-amber-500/30'
                    : 'bg-gradient-to-br from-amber-50/80 via-white to-purple-50/60 border-amber-300 shadow-sm'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <MapPin
                      className={`w-4 h-4 ${
                        isDark ? 'text-amber-400' : 'text-amber-600'
                      }`}
                    />
                    <div>
                      <h5
                        className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        <span>Tính Chất Giọng Đọc Tiếng Việt Theo Vùng Miền</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                            isDark
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          Đang chọn: {activeDialectMeta.shortBadge}
                        </span>
                      </h5>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          isDark ? 'text-gray-400' : 'text-slate-600'
                        }`}
                      >
                        Tùy chỉnh âm sắc vùng miền (Bắc • Trung • Tây Nguyên • Nam • Miền Tây), khẩu âm nhả chữ và độ ngân ngữ điệu
                      </p>
                    </div>
                  </div>

                  {/* Region Group Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1">
                    {['all', 'Miền Bắc', 'Miền Trung', 'Tây Nguyên', 'Miền Nam & Miền Tây', 'Quốc Tế'].map(
                      (grp) => (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => setRegionGroupFilter(grp)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                            regionGroupFilter === grp
                              ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                              : isDark
                              ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50'
                          }`}
                        >
                          {grp === 'all' ? 'Tất cả vùng' : grp}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Regional Dialect Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filteredRegionalDialects.map((dialect) => {
                    const isSelected = vnDialect === dialect.id;
                    return (
                      <div
                        key={dialect.id}
                        onClick={() => handleSelectRegionalDialect(dialect.id, true)}
                        className={`p-3 rounded-[14px] border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? isDark
                              ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                              : 'bg-amber-50 border-amber-500 text-slate-900 shadow-md'
                            : isDark
                            ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50/40'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-xs font-bold truncate">
                              {dialect.label}
                            </span>
                            {isSelected && (
                              <Check
                                className={`w-4 h-4 shrink-0 ${
                                  isDark ? 'text-amber-400' : 'text-amber-600'
                                }`}
                              />
                            )}
                          </div>
                          <p
                            className={`text-[10px] leading-relaxed line-clamp-2 ${
                              isDark ? 'text-gray-300' : 'text-slate-600'
                            }`}
                          >
                            {dialect.accentTraits}
                          </p>
                        </div>

                        <div className="space-y-1.5 pt-1.5 border-t border-white/10">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
                            <span
                              className={
                                isDark ? 'text-amber-300' : 'text-amber-800 font-semibold'
                              }
                            >
                              Pitch {dialect.recommendedPitch}x • Rate {dialect.recommendedRate}x
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectRegionalDialect(dialect.id, true);
                                setSampleDialogue(dialect.sampleRegionalDialogue);
                              }}
                              className={`px-2 py-0.5 rounded text-[9px] font-sans font-semibold border cursor-pointer ${
                                isDark
                                  ? 'bg-white/10 hover:bg-white/20 border-white/15 text-cyan-300'
                                  : 'bg-white hover:bg-amber-100 border-amber-300 text-amber-900'
                              }`}
                            >
                              + Nạp câu mẫu vùng
                            </button>
                          </div>
                          <div
                            className={`text-[9px] italic truncate ${
                              isDark ? 'text-gray-400' : 'text-slate-500'
                            }`}
                          >
                            Từ đặc trưng: {dialect.typicalExpressions}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Regional Nuance & Intonation Fine-Tuning */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-amber-500/20">
                  <div className="md:col-span-7 space-y-1.5">
                    <label
                      className={`block text-[11px] font-semibold ${
                        isDark ? 'text-gray-200' : 'text-slate-800'
                      }`}
                    >
                      Tính chất Khẩu âm & Phong cách nhả chữ vùng miền
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={
                          REGIONAL_NUANCE_OPTIONS.includes(regionalNuance)
                            ? regionalNuance
                            : 'custom'
                        }
                        onChange={(e) => {
                          if (e.target.value !== 'custom') {
                            setRegionalNuance(e.target.value);
                          }
                        }}
                        className={`sm:w-1/2 px-3 py-1.5 border rounded-[12px] text-xs focus:outline-none ${selectClass}`}
                      >
                        <option value={activeDialectMeta.defaultNuance}>
                          Mặc định vùng ({activeDialectMeta.defaultNuance})
                        </option>
                        {REGIONAL_NUANCE_OPTIONS.map((nuance) => (
                          <option key={nuance} value={nuance}>
                            {nuance}
                          </option>
                        ))}
                        <option value="custom">Tự nhập sắc thái riêng...</option>
                      </select>
                      <input
                        type="text"
                        value={regionalNuance}
                        onChange={(e) => setRegionalNuance(e.target.value)}
                        placeholder="Nhập khẩu âm, cách nhấn nhá vùng miền..."
                        className={`sm:w-1/2 px-3 py-1.5 border rounded-[12px] text-xs focus:outline-none ${inputClass}`}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-5 space-y-1.5">
                    <div
                      className={`flex items-center justify-between text-[11px] font-semibold ${
                        isDark ? 'text-gray-200' : 'text-slate-800'
                      }`}
                    >
                      <span>Độ đậm ngữ điệu vùng miền</span>
                      <span
                        className={`font-mono ${
                          isDark ? 'text-amber-400' : 'text-amber-700 font-bold'
                        }`}
                      >
                        {intonationLevel.toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={1.5}
                      step={0.05}
                      value={intonationLevel}
                      onChange={(e) => setIntonationLevel(parseFloat(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <div
                      className={`flex justify-between text-[9px] ${
                        isDark ? 'text-gray-400' : 'text-slate-500'
                      }`}
                    >
                      <span>0.5x (Thoảng nhẹ)</span>
                      <span>1.0x (Tự nhiên)</span>
                      <span>1.5x (Đậm chất địa phương)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Voice Preview Box */}
              <div
                className={`p-4 rounded-[14px] border space-y-3 ${
                  isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label
                    className={`text-xs font-medium ${
                      isDark ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Câu thoại nghe thử ({language} • Giọng {voiceName})
                  </label>
                  {voiceEngineStatus && (
                    <span
                      className={`text-[11px] font-mono ${
                        isDark ? 'text-emerald-400' : 'text-emerald-700'
                      }`}
                    >
                      {voiceEngineStatus}
                    </span>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={sampleDialogue}
                  onChange={(e) => setSampleDialogue(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-[14px] text-sm focus:outline-none ${inputClass}`}
                />
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleTestVoiceManual}
                    disabled={isTestingVoice || !sampleDialogue.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-[14px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isTestingVoice ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang tổng hợp...
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" /> Nghe thử giọng & Nhép miệng ({language})
                      </>
                    )}
                  </button>

                  {testAudioUrl && (
                    <button
                      type="button"
                      onClick={togglePlayTest}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-[14px] text-xs font-medium transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-white/10 hover:bg-white/20 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {isPlayingTest ? (
                        <>
                          <Pause className="w-4 h-4 text-purple-500" /> Tạm dừng
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 text-emerald-500" /> Phát lại
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`flex items-center justify-end gap-3 pt-4 border-t ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-[14px] text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-[14px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
              >
                {editingId ? 'Cập nhật nhân vật' : 'Lưu vào Bảng Nhân Vật'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: THÊM BẰNG PROMPT CODE (AI CHARACTER PROMPT CREATOR) */}
        {activeTab === 'prompt_code' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div
              className={`p-4 rounded-[14px] border space-y-3 ${
                isDark
                  ? 'bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-indigo-500/30'
                  : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-white border-indigo-200 shadow-sm'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4
                  className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                    isDark ? 'text-indigo-300' : 'text-indigo-700'
                  }`}
                >
                  <Wand2 className="w-4 h-4" /> Preset Prompt 1-Chạm (Khởi tạo tức thì)
                </h4>
                <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Nhấn vào bất kỳ mẫu nào để nạp cấu hình tự động
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_CHARACTER_PROMPTS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setPromptCodeInput(preset.promptCode);
                      setSelectedPresetAvatar(preset.avatarUrl);
                    }}
                    className={`p-3 rounded-[14px] border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      promptCodeInput === preset.promptCode
                        ? isDark
                          ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg'
                          : 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : isDark
                        ? 'bg-black/30 border-white/10 text-gray-300 hover:bg-white/10'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-indigo-50/70'
                    }`}
                  >
                    <img
                      src={preset.avatarUrl}
                      alt={preset.label}
                      className="w-9 h-9 rounded-[14px] object-cover border border-indigo-400/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{preset.label}</div>
                      <div
                        className={`text-[10px] truncate ${
                          promptCodeInput === preset.promptCode
                            ? 'text-indigo-100'
                            : isDark
                            ? 'text-indigo-300'
                            : 'text-indigo-600'
                        }`}
                      >
                        {preset.badge}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Code Editor */}
            <div className="space-y-2">
              <label
                className={`block text-xs font-semibold ${
                  isDark ? 'text-gray-200' : 'text-slate-800'
                }`}
              >
                Nhập Cú Pháp Prompt Code Hoặc Mô Tả Tự Nhiên
              </label>
              <textarea
                rows={4}
                value={promptCodeInput}
                onChange={(e) => setPromptCodeInput(e.target.value)}
                placeholder="VD: Name: CyberBot | Role: AI Robot | Lang: vi-VN | Pitch: 0.85 | Rate: 1.1 | Desc: Robot quản gia thông minh"
                className={`w-full p-4 border rounded-[14px] text-xs font-mono focus:outline-none leading-relaxed ${
                  isDark
                    ? 'bg-black/50 border-indigo-500/40 text-emerald-300 placeholder-gray-500 focus:border-indigo-400'
                    : 'bg-slate-900 border-indigo-300 text-emerald-300 placeholder-slate-400 focus:border-indigo-600 shadow-inner'
                }`}
              />
              <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Cú pháp hỗ trợ:{' '}
                <code className={isDark ? 'text-indigo-300' : 'text-indigo-700 font-semibold'}>
                  Name: ... | Gender: Nam/Nữ/Robot | Age: ... | Lang: vi-VN/en-US | Region: Hà Nội/Xứ Huế/Nghệ Tĩnh/Đà Nẵng/Sài Gòn/Miền Tây | Pitch: 0.95 | Rate: 1.0 | Desc: ...
                </code>
              </p>
            </div>

            {/* Live Parsed Character Preview */}
            <div
              className={`p-5 rounded-[14px] border space-y-4 ${
                isDark
                  ? 'bg-white/5 border-white/15'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div
                className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <span
                  className={`text-xs font-semibold flex items-center gap-2 ${
                    isDark ? 'text-purple-300' : 'text-purple-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> Bản Xem Trước Nhân Vật Tự Động Sinh Ra
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                      isDark
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    {getRegionalDialectMeta(parsedPromptCharacter.voiceProfile.vnDialect).shortBadge}
                  </span>
                  <span
                    className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                      isDark
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {parsedPromptCharacter.voiceProfile.language} • Giọng{' '}
                    {parsedPromptCharacter.voiceProfile.voiceName} • Pitch{' '}
                    {parsedPromptCharacter.voiceProfile.pitchMultiplier}x • Rate{' '}
                    {parsedPromptCharacter.voiceProfile.speed}x
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={parsedPromptCharacter.avatarUrl}
                    alt={parsedPromptCharacter.name}
                    className="w-16 h-16 rounded-[14px] object-cover border-2 border-indigo-400 shadow-lg"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-base font-bold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {parsedPromptCharacter.name}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          isDark
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {parsedPromptCharacter.gender === 'robot'
                          ? 'AI Robot'
                          : parsedPromptCharacter.gender === 'male'
                          ? 'Nam'
                          : 'Nữ'}
                      </span>
                    </div>
                    <p
                      className={`text-xs break-words ${
                        isDark ? 'text-gray-300' : 'text-slate-600'
                      }`}
                    >
                      {parsedPromptCharacter.description}
                    </p>
                    <p
                      className={`text-[11px] italic break-words ${
                        isDark ? 'text-gray-400' : 'text-slate-500'
                      }`}
                    >
                      &ldquo;{parsedPromptCharacter.sampleDialogue}&rdquo;
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handlePreviewRosterCharacter({
                      ...parsedPromptCharacter,
                      id: 'preview_prompt',
                      createdAt: '',
                      updatedAt: '',
                    })
                  }
                  className={`px-3.5 py-2 rounded-[14px] text-xs font-medium flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-purple-500" /> Nghe thử giọng
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2.5 rounded-[14px] text-xs font-medium cursor-pointer ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleCreateFromPromptCode}
                className="px-6 py-2.5 rounded-[14px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Khởi Tạo & Thêm Vào Kịch Bản
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
