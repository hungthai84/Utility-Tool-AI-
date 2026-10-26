export type ContentType =
  | 'truyen_ngan'
  | 'truyen_dai'
  | 'truyen_thieu_nhi'
  | 'truyen_co_tich'
  | 'truyen_truyen_cam'
  | 'truyen_hoi_thoai'
  | 'podcast'
  | 'sach_noi'
  | 'kich_ban_video'
  | 'dao_tao'
  | 'thuyet_minh'
  | 'doc_tu_dong'
  | 'tuy_chinh';

export type CharacterRole =
  | 'main'
  | 'supporting'
  | 'narrator'
  | 'antagonist'
  | 'host'
  | 'guest'
  | 'ai_robot'
  | 'custom';

export type CharacterGender = 'male' | 'female' | 'robot';

export type CharacterAgeGroup =
  | 'tre_em'
  | 'thanh_thieu_nien'
  | 'truong_thanh'
  | 'trung_nien'
  | 'cao_tuoi'
  | 'ai_robot';

export type BilingualLanguage = 'vi-VN' | 'en-US';

export type VietnameseRegionalDialect =
  | 'bac_chuan'
  | 'bac_dongbang'
  | 'trung_bac'
  | 'trung_hue'
  | 'trung_nam'
  | 'tay_nguyen'
  | 'nam_saigon'
  | 'nam_mientay'
  | 'quoc_te_en';

export type VoicePersona =
  | 'Kore'
  | 'Puck'
  | 'Zephyr'
  | 'Fenrir'
  | 'Charon'
  | 'Aoede'
  | 'Leda'
  | 'Orus';

export interface Avatar3DConfig {
  enabled: boolean;
  presetId:
    | 'female_3d'
    | 'male_3d'
    | 'child_3d'
    | 'elder_3d'
    | 'robot_3d'
    | 'custom_logo_rig';
  skinColor: string;
  hairColor: string;
  eyeColor: string;
  eyeStyle: 'natural' | 'anime' | 'cyber_glow' | 'cute';
  mouthStyle: 'natural_lips' | 'smile_3d' | 'cyber_wave';
  accessory: 'none' | 'glasses' | 'headset' | 'crown' | 'halo';
  eyeTrackingMode: 'auto_blink_gaze' | 'follow_cursor' | 'lively';
  lipSyncSensitivity: number;
  customLogoUrl?: string;
  eyeOffsetY?: number;
  mouthOffsetY?: number;
}

export interface VoiceProfile {
  voiceName: VoicePersona;
  language: string; // 'vi-VN' | 'en-US'
  speed: number; // 0.5 to 2.0 (Rate)
  pitch: number; // -10 to +10 or normalized 0.5 to 1.5
  pitchMultiplier?: number; // 0.5 to 1.5 for direct TTS pitch control
  style: string; // e.g. 'Truyền cảm, Tự nhiên'
  pauseDurationMs: number;
  vnDialect?: VietnameseRegionalDialect; // Giọng đọc theo vùng miền Việt Nam
  regionalNuance?: string; // Tính chất khẩu âm / cách nhả chữ vùng miền
  intonationLevel?: number; // Độ nhấn nhá ngữ điệu vùng miền (0.5 - 1.5)
}

export interface StoryCharacter {
  id: string;
  name: string;
  avatarUrl: string;
  avatar3DConfig?: Avatar3DConfig;
  role: CharacterRole;
  gender?: CharacterGender;
  ageGroup?: CharacterAgeGroup;
  description: string;
  personality: string;
  voiceProfile: VoiceProfile;
  sampleDialogue: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DialogueLine {
  id: string;
  characterId: string; // character ID or 'narrator'
  characterName: string;
  text: string;
  emotionStyle?: string;
  overrideSpeed?: number;
  pauseAfterMs?: number;
  audioUrl?: string; // base64 / WAV URL or 'browser_tts_ready'
  status: 'unprocessed' | 'processing' | 'completed' | 'failed';
}

export interface StoryScene {
  id: string;
  sceneNumber: number;
  title: string;
  description: string;
  setting: string;
  lines: DialogueLine[];
  audioUrl?: string; // Scene combined audio
  status: 'unprocessed' | 'processing' | 'completed' | 'failed';
}

export interface StoryChapter {
  id: string;
  chapterNumber: number;
  title: string;
  scenes: StoryScene[];
}

export interface VoiceStoryProject {
  id: string;
  userId: string;
  title: string;
  contentType: ContentType;
  description: string;
  language: string; // 'vi-VN' | 'en-US'
  targetAudience: string;
  author: string;
  characters: StoryCharacter[];
  storyText: string;
  chapters: StoryChapter[];
  currentStep: number; // 1 to 7
  status: 'draft' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}
