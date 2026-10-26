import type {
  StoryCharacter,
  CharacterRole,
  CharacterGender,
  CharacterAgeGroup,
  BilingualLanguage,
  VietnameseRegionalDialect,
  VoicePersona,
  DialogueLine,
  StoryScene,
} from '@/types/story';

export const HUMAN_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&q=80',
];

export const ROBOT_AVATARS = [
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=150&q=80',
  'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=150&q=80',
  'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=150&q=80',
];

export const ALL_AVATARS = [...HUMAN_AVATARS, ...ROBOT_AVATARS];

export interface RegionalDialectOption {
  id: VietnameseRegionalDialect;
  regionGroup: 'Miền Bắc' | 'Miền Trung' | 'Tây Nguyên' | 'Miền Nam & Miền Tây' | 'Quốc Tế';
  label: string;
  shortBadge: string;
  accentTraits: string;
  typicalExpressions: string;
  recommendedPitch: number;
  recommendedRate: number;
  defaultNuance: string;
  ttsStylePrompt: string;
  sampleRegionalDialogue: string;
  colorAccent: 'emerald' | 'purple' | 'amber' | 'cyan' | 'rose' | 'indigo' | 'teal' | 'blue';
}

export const VN_REGIONAL_DIALECTS: RegionalDialectOption[] = [
  {
    id: 'bac_chuan',
    regionGroup: 'Miền Bắc',
    label: 'Miền Bắc — Chuẩn Hà Nội',
    shortBadge: 'Giọng Bắc • Hà Nội',
    accentTraits: 'Phát âm chuẩn 6 thanh điệu, tròn vành rõ chữ, âm sắc thanh lịch, nhả chữ đĩnh đạc.',
    typicalExpressions: 'nhé, ạ, thế nhỉ, cơ mà, đấy nhé',
    recommendedPitch: 1.0,
    recommendedRate: 1.0,
    defaultNuance: 'Tròn vành rõ chữ, thanh lịch chuẩn Hà Nội',
    ttsStylePrompt:
      'Giọng miền Bắc chuẩn Hà Nội, phát âm 6 thanh điệu rõ ràng, tròn vành rõ chữ, thanh lịch, truyền cảm',
    sampleRegionalDialogue:
      'Xin chào các bạn nhé, hôm nay tiết trời Hà Nội dịu mát quá, mời bạn cùng lắng nghe câu chuyện này ạ!',
    colorAccent: 'emerald',
  },
  {
    id: 'bac_dongbang',
    regionGroup: 'Miền Bắc',
    label: 'Đồng Bằng Bắc Bộ — Kinh Bắc',
    shortBadge: 'Giọng Bắc Bộ • Kinh Bắc',
    accentTraits: 'Âm sắc ấm áp, đằm thắm, ngân nhẹ ở cuối câu, giàu chất tự sự dân gian và truyền thống.',
    typicalExpressions: 'nhá, thế à, phải không nào, ừ nhỉ',
    recommendedPitch: 0.96,
    recommendedRate: 0.95,
    defaultNuance: 'Đằm thắm, ngân nhẹ truyền thống Bắc Bộ',
    ttsStylePrompt:
      'Giọng vùng Đồng bằng Bắc Bộ Kinh Bắc ấm áp, mộc mạc, nhịp đọc khoan thai, ngân nhẹ cuối câu đầy tình cảm',
    sampleRegionalDialogue:
      'Chiều buông trên bến sông quê yên ả quá, mời người ở lại nghe câu chuyện cổ tích năm xưa nhá.',
    colorAccent: 'teal',
  },
  {
    id: 'trung_bac',
    regionGroup: 'Miền Trung',
    label: 'Bắc Trung Bộ — Nghệ Tĩnh',
    shortBadge: 'Giọng Trung • Nghệ Tĩnh',
    accentTraits: 'Giọng trầm ấm, dày, có độ vang và nội lực mạnh mẽ, nhấn trọng âm sâu sắc, chân thành.',
    typicalExpressions: 'mô, tê, răng, rứa, nớ, cực kỳ chân chất',
    recommendedPitch: 0.9,
    recommendedRate: 0.96,
    defaultNuance: 'Trầm hùng, nội lực, nhấn âm sâu sắc',
    ttsStylePrompt:
      'Giọng Bắc Trung Bộ Nghệ Tĩnh trầm ấm, nội lực, âm vực dày, chân chất và sâu sắc',
    sampleRegionalDialogue:
      'Đi mô rồi cũng nhớ về quê hương mình cả, câu chuyện ni chứa đựng biết bao ân tình sâu nặng.',
    colorAccent: 'amber',
  },
  {
    id: 'trung_hue',
    regionGroup: 'Miền Trung',
    label: 'Trung Trung Bộ — Xứ Huế',
    shortBadge: 'Giọng Trung • Xứ Huế',
    accentTraits: 'Ngữ điệu nhẹ nhàng, trầm bổng uyển chuyển, giàu chất thơ, luyến láy mềm mại sâu lắng.',
    typicalExpressions: 'dạ thưa, rứa đó, răng chừ, dễ thương chi lạ',
    recommendedPitch: 1.04,
    recommendedRate: 0.92,
    defaultNuance: 'Mềm mại, trầm bổng chất thơ cố đô Huế',
    ttsStylePrompt:
      'Giọng miền Trung xứ Huế ngọt ngào, nhẹ nhàng, trầm bổng uyển chuyển, nhịp chậm rãi giàu chất thơ',
    sampleRegionalDialogue:
      'Dạ, chiều trên sông Hương tím biếc thương nhớ, mời quý vị cùng thưởng thức khúc tâm tình xứ Huế mình nghe.',
    colorAccent: 'purple',
  },
  {
    id: 'trung_nam',
    regionGroup: 'Miền Trung',
    label: 'Nam Trung Bộ — Đà Nẵng / Quảng Nam',
    shortBadge: 'Giọng Trung • Đà Nẵng',
    accentTraits: 'Nhịp điệu năng động, dứt khoát, âm sắc cởi mở, thân thiện và hiện đại.',
    typicalExpressions: 'nghen, hè, chi rứa, thiệt tình, quá chừng',
    recommendedPitch: 0.98,
    recommendedRate: 1.04,
    defaultNuance: 'Năng động, dứt khoát, thân thiện miền biển',
    ttsStylePrompt:
      'Giọng Nam Trung Bộ Đà Nẵng - Quảng Nam thân thiện, dứt khoát, cởi mở và tràn đầy năng lượng',
    sampleRegionalDialogue:
      'Chào mừng mọi người đến với thành phố biển năng động nghen, cùng khám phá hành trình thú vị này liền thôi!',
    colorAccent: 'cyan',
  },
  {
    id: 'tay_nguyen',
    regionGroup: 'Tây Nguyên',
    label: 'Tây Nguyên — Đại Ngàn',
    shortBadge: 'Giọng Tây Nguyên',
    accentTraits: 'Âm lượng khỏe khoắn, vang vọng, ngắt nhịp rõ ràng, mang âm hưởng sử thi đại ngàn.',
    typicalExpressions: 'ơi buôn làng, đại ngàn, hùng vĩ, vang xa',
    recommendedPitch: 0.88,
    recommendedRate: 0.95,
    defaultNuance: 'Khỏe khoắn, vang vọng hào sảng đại ngàn',
    ttsStylePrompt:
      'Giọng đọc mang âm hưởng Tây Nguyên đại ngàn khỏe khoắn, trầm vang, hào sảng và giàu sức sống',
    sampleRegionalDialogue:
      'Giữa đại ngàn gió lộng và tiếng cồng chiêng ngân vang, câu chuyện về lòng dũng cảm bắt đầu từ đây!',
    colorAccent: 'rose',
  },
  {
    id: 'nam_saigon',
    regionGroup: 'Miền Nam & Miền Tây',
    label: 'Miền Nam — Sài Gòn',
    shortBadge: 'Giọng Nam • Sài Gòn',
    accentTraits: 'Phóng khoáng, trẻ trung, tự nhiên, tiết tấu linh hoạt, ấm áp và gần gũi.',
    typicalExpressions: 'nè, nha, thiệt hả, dễ thương ghê, vậy đó',
    recommendedPitch: 1.05,
    recommendedRate: 1.05,
    defaultNuance: 'Phóng khoáng, hiện đại, trẻ trung Sài Gòn',
    ttsStylePrompt:
      'Giọng miền Nam chuẩn Sài Gòn phóng khoáng, trẻ trung, tự nhiên, thân thiện và giàu biểu cảm hiện đại',
    sampleRegionalDialogue:
      'Chào mọi người nha! Sài Gòn hôm nay nhộn nhịp lắm nè, mình cùng bắt đầu câu chuyện siêu hấp dẫn này hen!',
    colorAccent: 'indigo',
  },
  {
    id: 'nam_mientay',
    regionGroup: 'Miền Nam & Miền Tây',
    label: 'Miền Tây — Tây Nam Bộ',
    shortBadge: 'Giọng Miền Tây',
    accentTraits: 'Ngọt ngào, chân chất, hào sảng, ngân giọng truyền cảm và đượm tình quê sông nước.',
    typicalExpressions: 'nghen, đa, thiệt tình, thương quá chừng, bá cháy',
    recommendedPitch: 1.02,
    recommendedRate: 0.96,
    defaultNuance: 'Ngọt ngào, chân chất, hào sảng miền Tây',
    ttsStylePrompt:
      'Giọng miền Tây Nam Bộ ngọt ngào, chất phác, hào sảng, giàu tình cảm và ngân giọng tự nhiên',
    sampleRegionalDialogue:
      'Về miền Tây sông nước mênh mông, nghe câu hò ngọt lịm mà thương quê mình quá chừng luôn đó nghen!',
    colorAccent: 'rose',
  },
  {
    id: 'quoc_te_en',
    regionGroup: 'Quốc Tế',
    label: 'Quốc Tế — Chuẩn Song Ngữ (EN/VI)',
    shortBadge: 'Quốc Tế • EN/VI',
    accentTraits: 'Phát âm chuẩn quốc tế American English kết hợp ngữ điệu song ngữ hiện đại.',
    typicalExpressions: 'Hello, Awesome, Bilingual Studio, Let us begin',
    recommendedPitch: 1.0,
    recommendedRate: 1.02,
    defaultNuance: 'Phát âm chuẩn quốc tế, rõ nét từng âm tiết',
    ttsStylePrompt:
      'Standard international American English and clear bilingual pronunciation, articulate and expressive',
    sampleRegionalDialogue:
      'Welcome to the Bilingual Voice Studio! Let us bring your characters and stories to life.',
    colorAccent: 'blue',
  },
];

export const REGIONAL_NUANCE_OPTIONS: string[] = [
  'Tròn vành rõ chữ, chuẩn phát thanh viên',
  'Đời thường tự nhiên, gần gũi thân mật',
  'Ngân giọng sâu lắng, kể chuyện đêm khuya',
  'Hào sảng, nhiệt huyết, giàu năng lượng',
  'Mềm mại, luyến láy giàu chất thơ',
  'Trầm mặc, điềm đạm, từng trải',
  'Trong trẻo, hồn nhiên, hoạt ngôn',
  'Cơ khí chuẩn xác kết hợp ngữ điệu vùng miền',
];

export function getRegionalDialectMeta(dialect?: VietnameseRegionalDialect): RegionalDialectOption {
  if (!dialect) return VN_REGIONAL_DIALECTS[0];
  return VN_REGIONAL_DIALECTS.find((d) => d.id === dialect) || VN_REGIONAL_DIALECTS[0];
}

export function resolveRegionalDialectFromText(
  rawText?: string,
  lang?: string
): VietnameseRegionalDialect {
  if (lang && normalizeBilingualLang(lang) === 'en-US' && (!rawText || !rawText.trim())) {
    return 'quoc_te_en';
  }
  const t = (rawText || '').toLowerCase();
  if (t.includes('miền tây') || t.includes('nam bộ') || t.includes('cần thơ') || t.includes('sông nước') || t.includes('nam_mientay')) {
    return 'nam_mientay';
  }
  if (t.includes('sài gòn') || t.includes('miền nam') || t.includes('tp.hcm') || t.includes('nam_saigon')) {
    return 'nam_saigon';
  }
  if (t.includes('huế') || t.includes('cố đô') || t.includes('trung_hue')) {
    return 'trung_hue';
  }
  if (t.includes('nghệ') || t.includes('hà tĩnh') || t.includes('bắc trung bộ') || t.includes('trung_bac')) {
    return 'trung_bac';
  }
  if (t.includes('đà nẵng') || t.includes('quảng nam') || t.includes('nam trung bộ') || t.includes('trung_nam')) {
    return 'trung_nam';
  }
  if (t.includes('tây nguyên') || t.includes('đại ngàn') || t.includes('buôn') || t.includes('tay_nguyen')) {
    return 'tay_nguyen';
  }
  if (t.includes('kinh bắc') || t.includes('bắc bộ') || t.includes('đồng bằng') || t.includes('bac_dongbang')) {
    return 'bac_dongbang';
  }
  if (t.includes('quốc tế') || t.includes('english') || t.includes('quoc_te_en')) {
    return 'quoc_te_en';
  }
  return 'bac_chuan';
}

export interface PresetPromptItem {
  id: string;
  label: string;
  badge: string;
  promptCode: string;
  avatarUrl: string;
}

export const PRESET_CHARACTER_PROMPTS: PresetPromptItem[] = [
  {
    id: 'cyberbot_x9',
    label: 'CyberBot-X9',
    badge: 'AI Robot • vi-VN',
    promptCode:
      'Name: CyberBot-X9 | Gender: Robot | Age: AI Robot | Role: AI Robot | Lang: vi-VN | Region: Hà Nội | Pitch: 0.82 | Rate: 1.12 | Voice: Fenrir | Desc: Robot quản gia thông minh thế hệ X9, giọng cơ khí chuẩn xác, trung thành và hài hước ngầm.',
    avatarUrl: ROBOT_AVATARS[0],
  },
  {
    id: 'bac_ba_nam_bo',
    label: 'Bác Ba Nam Bộ',
    badge: 'Cao tuổi • Miền Tây',
    promptCode:
      'Name: Bác Ba Nam Bộ | Gender: Nam | Age: Cao tuổi | Role: Nhân vật phụ | Lang: vi-VN | Region: Miền Tây | Pitch: 0.88 | Rate: 0.92 | Voice: Charon | Desc: Lão nông miền Tây hào sảng, giọng trầm ấm, chất phác, giàu kinh nghiệm sống.',
    avatarUrl: HUMAN_AVATARS[3],
  },
  {
    id: 'be_su',
    label: 'Bé Su',
    badge: 'Trẻ em • Sài Gòn',
    promptCode:
      'Name: Bé Su | Gender: Nữ | Age: Trẻ em | Role: Nhân vật chính | Lang: vi-VN | Region: Sài Gòn | Pitch: 1.32 | Rate: 1.15 | Voice: Zephyr | Desc: Cô bé 8 tuổi lém lỉnh, tò mò, giọng trong trẻo, hồn nhiên và tràn đầy năng lượng.',
    avatarUrl: HUMAN_AVATARS[2],
  },
  {
    id: 'tham_tu_dem',
    label: 'Thám Tử Đêm',
    badge: 'Trưởng thành • Hà Nội',
    promptCode:
      'Name: Thám Tử Đêm | Gender: Nam | Age: Trưởng thành | Role: Nhân vật chính | Lang: vi-VN | Region: Hà Nội | Pitch: 0.90 | Rate: 0.98 | Voice: Fenrir | Desc: Thám tử tư sắc sảo, điềm tĩnh, giọng trầm lạnh lùng đầy suy tư.',
    avatarUrl: HUMAN_AVATARS[1],
  },
  {
    id: 'nang_tho_xu_hue',
    label: 'Nàng Thơ Xứ Huế',
    badge: 'Trưởng thành • Xứ Huế',
    promptCode:
      'Name: Nàng Thơ Xứ Huế | Gender: Nữ | Age: Trưởng thành | Role: Người dẫn chuyện | Lang: vi-VN | Region: Xứ Huế | Pitch: 1.04 | Rate: 0.92 | Voice: Aoede | Desc: Người kể chuyện xứ Huế dịu dàng, giọng trầm bổng giàu chất thơ, sâu lắng và truyền cảm.',
    avatarUrl: HUMAN_AVATARS[0],
  },
  {
    id: 'nova_ai_en',
    label: 'A.I. Nova (EN)',
    badge: 'AI Robot • en-US',
    promptCode:
      'Name: A.I. Nova | Gender: Robot | Age: AI Robot | Role: AI Robot | Lang: en-US | Region: Quốc Tế | Pitch: 1.08 | Rate: 1.05 | Voice: Kore | Desc: Futuristic bilingual tactical AI assistant from Neo-Saigon, calm and analytical.',
    avatarUrl: ROBOT_AVATARS[1],
  },
  {
    id: 'dr_evelyn_en',
    label: 'Dr. Evelyn (EN)',
    badge: 'Trung niên • en-US',
    promptCode:
      'Name: Dr. Evelyn | Gender: Nữ | Age: Trung niên | Role: Khách mời | Lang: en-US | Region: Quốc Tế | Pitch: 1.0 | Rate: 1.0 | Voice: Kore | Desc: Chief Robotics Scientist, articulate English speaker, inspiring and warm.',
    avatarUrl: HUMAN_AVATARS[4],
  },
];

/**
 * Chuẩn hóa mã ngôn ngữ nghiêm ngặt về 2 chuẩn: 'vi-VN' hoặc 'en-US'
 */
export function normalizeBilingualLang(rawLang?: string): BilingualLanguage {
  if (!rawLang) return 'vi-VN';
  const cleaned = rawLang.trim().toLowerCase();
  if (cleaned.startsWith('en') || cleaned.includes('english') || cleaned.includes('anh')) {
    return 'en-US';
  }
  return 'vi-VN';
}

/**
 * Chuyển đổi giá trị Pitch giữa thang đo (-10..+10) và hệ số nhân (0.5..1.5)
 */
export function normalizePitchMultiplier(pitchValue?: number, pitchMultiplier?: number): number {
  if (typeof pitchMultiplier === 'number' && pitchMultiplier >= 0.5 && pitchMultiplier <= 2.0) {
    return Number(pitchMultiplier.toFixed(2));
  }
  if (typeof pitchValue === 'number') {
    if (pitchValue >= 0.5 && pitchValue <= 2.0 && pitchValue !== 1 && pitchValue !== 0) {
      return Number(pitchValue.toFixed(2));
    }
    // Map -10..+10 to 0.6..1.4
    const mapped = 1.0 + (pitchValue / 10) * 0.4;
    return Number(Math.max(0.5, Math.min(1.5, mapped)).toFixed(2));
  }
  return 1.0;
}

/**
 * Phân tích Prompt Code hoặc mô tả tự nhiên thành hồ sơ nhân vật StoryCharacter
 */
export function parsePromptCodeToCharacter(
  promptCode: string,
  presetAvatar?: string
): Omit<StoryCharacter, 'id' | 'createdAt' | 'updatedAt'> {
  const raw = promptCode.trim();
  const segments = raw.split('|').map((s) => s.trim());

  const kv: Record<string, string> = {};
  segments.forEach((seg) => {
    const colonIdx = seg.indexOf(':');
    if (colonIdx > 0) {
      const k = seg.slice(0, colonIdx).trim().toLowerCase();
      const v = seg.slice(colonIdx + 1).trim();
      kv[k] = v;
    }
  });

  const name =
    kv['name'] ||
    kv['tên'] ||
    kv['ten'] ||
    (raw.length > 0 ? raw.split(/[|,-]/)[0].trim().slice(0, 32) : 'Nhân vật AI mới');

  const rawRole = (kv['role'] || kv['vai trò'] || kv['vai'] || '').toLowerCase();
  const rawGender = (kv['gender'] || kv['giới tính'] || kv['gioi tinh'] || '').toLowerCase();
  const rawAge = (kv['age'] || kv['độ tuổi'] || kv['tuổi'] || '').toLowerCase();
  const rawLang = kv['lang'] || kv['language'] || kv['ngôn ngữ'] || 'vi-VN';
  const rawRegion =
    kv['region'] ||
    kv['dialect'] ||
    kv['vùng miền'] ||
    kv['vung mien'] ||
    kv['giọng vùng'] ||
    '';
  const desc =
    kv['desc'] ||
    kv['description'] ||
    kv['mô tả'] ||
    (Object.keys(kv).length === 0 ? raw : 'Nhân vật được khởi tạo từ AI Prompt Code.');

  const isRobot =
    rawRole.includes('robot') ||
    rawGender.includes('robot') ||
    rawAge.includes('robot') ||
    name.toLowerCase().includes('bot') ||
    raw.toLowerCase().includes('robot');

  let gender: CharacterGender = 'female';
  if (isRobot) {
    gender = 'robot';
  } else if (
    rawGender.includes('nam') ||
    rawGender.includes('male') ||
    name.toLowerCase().includes('bác ba') ||
    name.toLowerCase().includes('thám tử')
  ) {
    gender = 'male';
  }

  let ageGroup: CharacterAgeGroup = 'truong_thanh';
  if (isRobot) {
    ageGroup = 'ai_robot';
  } else if (rawAge.includes('trẻ em') || rawAge.includes('child') || rawAge.includes('bé')) {
    ageGroup = 'tre_em';
  } else if (rawAge.includes('thiếu niên') || rawAge.includes('teen')) {
    ageGroup = 'thanh_thieu_nien';
  } else if (rawAge.includes('trung niên') || rawAge.includes('middle')) {
    ageGroup = 'trung_nien';
  } else if (rawAge.includes('cao tuổi') || rawAge.includes('elder') || rawAge.includes('già')) {
    ageGroup = 'cao_tuoi';
  }

  let role: CharacterRole = 'main';
  if (isRobot) {
    role = 'ai_robot';
  } else if (rawRole.includes('phụ') || rawRole.includes('support')) {
    role = 'supporting';
  } else if (rawRole.includes('dẫn') || rawRole.includes('narrator')) {
    role = 'narrator';
  } else if (rawRole.includes('phản diện') || rawRole.includes('antagonist')) {
    role = 'antagonist';
  } else if (rawRole.includes('host')) {
    role = 'host';
  } else if (rawRole.includes('khách') || rawRole.includes('guest')) {
    role = 'guest';
  }

  const language = normalizeBilingualLang(rawLang);
  const vnDialect = resolveRegionalDialectFromText(`${rawRegion} ${name} ${desc}`, language);
  const dialectMeta = getRegionalDialectMeta(vnDialect);

  const parsedPitch = parseFloat(
    kv['pitch'] ||
      (isRobot
        ? '0.85'
        : String(dialectMeta.recommendedPitch || (gender === 'male' ? 0.92 : 1.05)))
  );
  const pitchMultiplier = isNaN(parsedPitch) ? 1.0 : Math.max(0.5, Math.min(1.5, parsedPitch));
  const pitchSteps = Math.round((pitchMultiplier - 1.0) * 15);

  const parsedRate = parseFloat(
    kv['rate'] || kv['speed'] || String(dialectMeta.recommendedRate || 1.0)
  );
  const speed = isNaN(parsedRate) ? 1.0 : Math.max(0.5, Math.min(2.0, parsedRate));

  let voiceName: VoicePersona = 'Kore';
  const requestedVoice = (kv['voice'] || '').toLowerCase();
  if (requestedVoice.includes('fenrir')) voiceName = 'Fenrir';
  else if (requestedVoice.includes('puck')) voiceName = 'Puck';
  else if (requestedVoice.includes('zephyr')) voiceName = 'Zephyr';
  else if (requestedVoice.includes('charon')) voiceName = 'Charon';
  else if (requestedVoice.includes('aoede')) voiceName = 'Aoede';
  else if (requestedVoice.includes('leda')) voiceName = 'Leda';
  else if (requestedVoice.includes('orus')) voiceName = 'Orus';
  else if (requestedVoice.includes('kore')) voiceName = 'Kore';
  else if (isRobot) voiceName = 'Fenrir';
  else if (gender === 'male' && ageGroup === 'cao_tuoi') voiceName = 'Charon';
  else if (gender === 'male') voiceName = 'Puck';
  else if (ageGroup === 'tre_em') voiceName = 'Zephyr';

  const avatarUrl =
    presetAvatar ||
    (isRobot
      ? ROBOT_AVATARS[0]
      : gender === 'male'
      ? HUMAN_AVATARS[1]
      : HUMAN_AVATARS[0]);

  const sampleDialogue =
    language === 'en-US'
      ? isRobot
        ? `System online. Greetings, I am ${name}. All bilingual voice modules are calibrated.`
        : `Hello everyone! I am ${name}, ready to bring this story to life.`
      : isRobot
      ? `Hệ thống khởi động hoàn tất. Xin chào, tôi là ${name}, trợ lý AI song ngữ (${dialectMeta.shortBadge}).`
      : dialectMeta.sampleRegionalDialogue ||
        `Xin chào! Tôi là ${name}, rất vui được góp giọng trong câu chuyện hôm nay!`;

  return {
    name,
    role,
    gender,
    ageGroup,
    avatarUrl,
    description: desc,
    personality: isRobot
      ? 'Chính xác, thông minh, âm sắc cơ khí hiện đại'
      : desc,
    voiceProfile: {
      voiceName,
      language,
      speed,
      pitch: pitchSteps,
      pitchMultiplier,
      style: isRobot
        ? `Giọng AI Robot điện tử, ${dialectMeta.ttsStylePrompt}`
        : dialectMeta.ttsStylePrompt,
      pauseDurationMs: 300,
      vnDialect,
      regionalNuance: dialectMeta.defaultNuance,
      intonationLevel: 1.0,
    },
    sampleDialogue,
  };
}

/**
 * Phát giọng nói trực tiếp bằng Web Speech API bản địa (Fallback an toàn cho vi-VN & en-US)
 */
export function speakWithBrowserFallback(options: {
  text: string;
  language?: string;
  pitchMultiplier?: number;
  rate?: number;
  isRobot?: boolean;
  vnDialect?: VietnameseRegionalDialect;
  intonationLevel?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onError?.('Trình duyệt không hỗ trợ Web Speech API');
    options.onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(options.text);
    const normalizedLang = normalizeBilingualLang(options.language);
    utterance.lang = normalizedLang;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice =
      voices.find((v) => v.lang.toLowerCase() === normalizedLang.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(normalizedLang.slice(0, 2).toLowerCase()));

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    const basePitch = options.pitchMultiplier ?? (options.isRobot ? 0.8 : 1.0);
    utterance.pitch = Math.max(0.5, Math.min(2.0, basePitch));
    utterance.rate = Math.max(0.5, Math.min(2.0, options.rate ?? 1.0));

    utterance.onstart = () => options.onStart?.();
    utterance.onend = () => options.onEnd?.();
    utterance.onerror = () => {
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err: any) {
    options.onError?.(err?.message || 'Lỗi trình đọc bản địa');
    options.onEnd?.();
  }
}

/**
 * Hệ thống Bilingual Voice Engine (Kết hợp Gemini Cloud TTS + Native Browser Fallback)
 */
export async function synthesizeOrSpeakBilingual(params: {
  text: string;
  character?: StoryCharacter;
  emotionStyle?: string;
  preferBrowserImmediate?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}): Promise<{ audioUrl?: string; usedFallback: boolean; language: BilingualLanguage }> {
  const char = params.character;
  const language = normalizeBilingualLang(char?.voiceProfile?.language);
  const isRobot = char?.gender === 'robot' || char?.ageGroup === 'ai_robot' || char?.role === 'ai_robot';
  const speed = char?.voiceProfile?.speed ?? 1.0;
  const pitchMultiplier = normalizePitchMultiplier(
    char?.voiceProfile?.pitch,
    char?.voiceProfile?.pitchMultiplier
  );
  const vnDialect =
    char?.voiceProfile?.vnDialect ||
    resolveRegionalDialectFromText(char?.voiceProfile?.style || char?.description, language);
  const dialectMeta = getRegionalDialectMeta(vnDialect);
  const regionalNuance = char?.voiceProfile?.regionalNuance || dialectMeta.defaultNuance;
  const intonationLevel = char?.voiceProfile?.intonationLevel ?? 1.0;

  if (params.preferBrowserImmediate) {
    speakWithBrowserFallback({
      text: params.text,
      language,
      pitchMultiplier,
      rate: speed,
      isRobot,
      vnDialect,
      intonationLevel,
      onStart: params.onStart,
      onEnd: params.onEnd,
    });
    return { usedFallback: true, language };
  }

  try {
    const regionalDirective =
      language === 'vi-VN'
        ? `Vùng miền: ${dialectMeta.label} (${dialectMeta.ttsStylePrompt}). Khẩu âm & nhả chữ: ${regionalNuance}. Độ nhấn ngữ điệu vùng miền: ${intonationLevel}x.`
        : `International accent (${dialectMeta.ttsStylePrompt}). Nuance: ${regionalNuance}.`;

    const res = await fetch('/api/gemini/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: params.text,
        voice: char?.voiceProfile?.voiceName || 'Kore',
        language,
        style: `${params.emotionStyle ? params.emotionStyle + '. ' : ''}${regionalDirective} Phong cách nhân vật: ${char?.voiceProfile?.style || 'Truyền cảm'}. Ngôn ngữ: ${language}. Tốc độ: ${speed}x. Cao độ: ${pitchMultiplier}`,
      }),
    });

    if (!res.ok) {
      throw new Error(`Cloud TTS HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.audioUrl) {
      return { audioUrl: data.audioUrl, usedFallback: false, language };
    }
    throw new Error('Empty audioUrl from Cloud TTS');
  } catch (err) {
    console.warn('Gemini Cloud TTS chuyển sang chế độ Browser Fallback an toàn:', err);
    speakWithBrowserFallback({
      text: params.text,
      language,
      pitchMultiplier,
      rate: speed,
      isRobot,
      vnDialect,
      intonationLevel,
      onStart: params.onStart,
      onEnd: params.onEnd,
    });
    return { usedFallback: true, language };
  }
}

/**
 * Tạo nội dung phụ đề chuẩn SRT từ danh sách lời thoại
 */
export function generateSRTSubtitles(lines: DialogueLine[]): string {
  const formatSRTTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    const ms = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
    const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const pad3 = (n: number) => (n < 10 ? `00${n}` : n < 100 ? `0${n}` : `${n}`);
    return `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)},${pad3(ms)}`;
  };

  let currentSec = 0;
  return lines
    .map((line, idx) => {
      const wordCount = Math.max(1, line.text.trim().split(/\s+/).length);
      const estimatedDuration = Math.max(2.2, Number((wordCount / 2.8).toFixed(2)));
      const startStr = formatSRTTime(currentSec);
      const endSec = currentSec + estimatedDuration;
      const endStr = formatSRTTime(endSec);
      currentSec = endSec + (line.pauseAfterMs ? line.pauseAfterMs / 1000 : 0.35);

      return `${idx + 1}\n${startStr} --> ${endStr}\n[${line.characterName}] ${line.text}\n`;
    })
    .join('\n');
}

/**
 * Kịch bản mẫu 1-chạm (Demo Script Loader) có đầy đủ Nhân vật Con người + AI Robot + Song ngữ VI/EN
 */
export function createDemoStoryPackage() {
  const now = new Date().toISOString();
  const characters: StoryCharacter[] = [
    {
      id: 'narrator_default',
      name: 'Người dẫn chuyện',
      role: 'narrator',
      gender: 'female',
      ageGroup: 'truong_thanh',
      avatarUrl: HUMAN_AVATARS[0],
      description: 'Giọng dẫn chuyện truyền cảm, kết nối mạch cảm xúc toàn cảnh',
      personality: 'Điềm tĩnh, ấm áp, giàu chất điện ảnh',
      voiceProfile: {
        voiceName: 'Kore',
        language: 'vi-VN',
        speed: 1.0,
        pitch: 0,
        pitchMultiplier: 1.0,
        style: 'Truyền cảm, rõ ràng, sâu lắng',
        pauseDurationMs: 350,
      },
      sampleDialogue: 'Đêm mưa tại trạm nghiên cứu Neo-Sài Gòn, ánh đèn neon phản chiếu trên mặt kính...',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'char_cyberbot_x9',
      name: 'CyberBot-X9',
      role: 'ai_robot',
      gender: 'robot',
      ageGroup: 'ai_robot',
      avatarUrl: ROBOT_AVATARS[0],
      description: 'Robot quản gia kiêm trợ lý phân tích dữ liệu lượng tử thế hệ X9',
      personality: 'Logic, trung thành, giọng cơ khí thông minh',
      voiceProfile: {
        voiceName: 'Fenrir',
        language: 'vi-VN',
        speed: 1.1,
        pitch: -3,
        pitchMultiplier: 0.85,
        style: 'Giọng AI Robot điện tử, dứt khoát, hiện đại',
        pauseDurationMs: 250,
      },
      sampleDialogue: 'Cảnh báo: Phát hiện tín hiệu sóng âm lạ từ tầng hầm số 4. Đang kích hoạt lá chắn.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'char_tham_tu_dem',
      name: 'Thám Tử Đêm',
      role: 'main',
      gender: 'male',
      ageGroup: 'truong_thanh',
      avatarUrl: HUMAN_AVATARS[1],
      description: 'Thám tử điều tra công nghệ cao chuyên giải mã các vụ án AI',
      personality: 'Bản lĩnh, sắc bén, trầm tĩnh',
      voiceProfile: {
        voiceName: 'Charon',
        language: 'vi-VN',
        speed: 0.98,
        pitch: -2,
        pitchMultiplier: 0.9,
        style: 'Trầm ấm, cuốn hút, điềm tĩnh',
        pauseDurationMs: 300,
      },
      sampleDialogue: 'CyberBot, giữ nguyên tần số quét. Chúng ta không đơn độc trong căn phòng này.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'char_be_su',
      name: 'Bé Su',
      role: 'supporting',
      gender: 'female',
      ageGroup: 'tre_em',
      avatarUrl: HUMAN_AVATARS[2],
      description: 'Thần đồng lập trình nhí 9 tuổi, người vô tình giải mã được hộp đen',
      personality: 'Hồn nhiên, thông minh, lém lỉnh',
      voiceProfile: {
        voiceName: 'Zephyr',
        language: 'vi-VN',
        speed: 1.12,
        pitch: 4,
        pitchMultiplier: 1.28,
        style: 'Trong trẻo, tươi sáng, hào hứng',
        pauseDurationMs: 300,
      },
      sampleDialogue: 'Chú Thám Tử ơi! Cháu vừa mở được mật mã âm thanh của chiếc hộp phát sáng rồi!',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'char_nova_en',
      name: 'A.I. Nova',
      role: 'ai_robot',
      gender: 'robot',
      ageGroup: 'ai_robot',
      avatarUrl: ROBOT_AVATARS[1],
      description: 'Hệ thống AI trung tâm điều hành bằng tiếng Anh (Bilingual Core)',
      personality: 'Chuẩn xác, hiện đại, phát âm chuẩn en-US',
      voiceProfile: {
        voiceName: 'Puck',
        language: 'en-US',
        speed: 1.05,
        pitch: 1,
        pitchMultiplier: 1.06,
        style: 'Futuristic English AI voice, crisp and clear',
        pauseDurationMs: 300,
      },
      sampleDialogue: 'Security protocol unlocked. Welcome to the Bilingual Voice & Story Studio.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const scenes: StoryScene[] = [
    {
      id: 'scene_demo_1',
      sceneNumber: 1,
      title: 'Tín hiệu bí ẩn lúc nửa đêm',
      description: 'Cuộc hội ngộ tại phòng thí nghiệm âm thanh Cyberpunk',
      setting: 'Phòng thu Cyberpunk Neo-Sài Gòn • 23:45',
      status: 'unprocessed',
      lines: [
        {
          id: 'line_demo_1',
          characterId: 'narrator_default',
          characterName: 'Người dẫn chuyện',
          text: 'Nửa đêm tại trung tâm công nghệ Neo-Sài Gòn, những tia sáng hologram lấp lánh quanh bàn điều khiển âm thanh.',
          emotionStyle: 'Huyền bí, điện ảnh',
          pauseAfterMs: 400,
          status: 'unprocessed',
        },
        {
          id: 'line_demo_2',
          characterId: 'char_cyberbot_x9',
          characterName: 'CyberBot-X9',
          text: 'Báo cáo Thám Tử: Hệ thống vừa thu được một bản ghi âm cổ xưa phát ra từ lõi trung tâm.',
          emotionStyle: 'Cơ khí, khẩn trương',
          pauseAfterMs: 300,
          status: 'unprocessed',
        },
        {
          id: 'line_demo_3',
          characterId: 'char_tham_tu_dem',
          characterName: 'Thám Tử Đêm',
          text: 'Khử nhiễu ngay lập tức cho tôi, CyberBot. Đó có thể là chìa khóa mà chúng ta tìm kiếm suốt ba năm qua.',
          emotionStyle: 'Trầm tĩnh, quyết đoán',
          pauseAfterMs: 350,
          status: 'unprocessed',
        },
        {
          id: 'line_demo_4',
          characterId: 'char_be_su',
          characterName: 'Bé Su',
          text: 'Oa! Chú nhìn kìa, sóng âm đang tự động xếp thành một bản nhạc đa sắc màu trên màn hình!',
          emotionStyle: 'Hào hứng, ngạc nhiên',
          pauseAfterMs: 350,
          status: 'unprocessed',
        },
        {
          id: 'line_demo_5',
          characterId: 'char_nova_en',
          characterName: 'A.I. Nova',
          text: 'Voice synchronization complete. All bilingual channels in Vietnamese and English are now active.',
          emotionStyle: 'Futuristic, clear English',
          pauseAfterMs: 400,
          status: 'unprocessed',
        },
      ],
    },
  ];

  const storyText = scenes[0].lines.map((l) => `${l.characterName}: ${l.text}`).join('\n\n');

  return {
    title: 'Bí Mật Tần Số Thứ 9 (Kịch Bản Mẫu Đa Nhân Vật)',
    characters,
    scenes,
    storyText,
  };
}

/**
 * ---------------------------------------------------------------------------
 * 1. BỘ CHỌN NHANH 3 VÙNG MIỀN (BẮC • TRUNG • NAM) CHO NHÂN VẬT TIẾNG VIỆT
 * ---------------------------------------------------------------------------
 */
export type MacroRegionVN = 'bac' | 'trung' | 'nam';

export interface MacroRegionMeta {
  id: MacroRegionVN;
  label: string;
  shortLabel: string;
  defaultDialect: VietnameseRegionalDialect;
  dialects: VietnameseRegionalDialect[];
  recommendedPitchMale: number;
  recommendedPitchFemale: number;
  recommendedRate: number;
  summaryTraits: string;
  accentSummary: string;
}

export const VN_MACRO_REGIONS: MacroRegionMeta[] = [
  {
    id: 'bac',
    label: 'Miền Bắc (Hà Nội • Kinh Bắc)',
    shortLabel: 'Bắc',
    defaultDialect: 'bac_chuan',
    dialects: ['bac_chuan', 'bac_dongbang'],
    recommendedPitchMale: 0.94,
    recommendedPitchFemale: 1.0,
    recommendedRate: 1.0,
    summaryTraits: 'Tròn vành rõ chữ, chuẩn 6 thanh điệu, âm sắc thanh lịch đĩnh đạc',
    accentSummary: 'Tròn vành rõ chữ, chuẩn 6 thanh điệu, âm sắc thanh lịch đĩnh đạc',
  },
  {
    id: 'trung',
    label: 'Miền Trung (Xứ Huế • Nghệ Tĩnh • Đà Nẵng)',
    shortLabel: 'Trung',
    defaultDialect: 'trung_hue',
    dialects: ['trung_hue', 'trung_bac', 'trung_nam', 'tay_nguyen'],
    recommendedPitchMale: 0.9,
    recommendedPitchFemale: 1.04,
    recommendedRate: 0.94,
    summaryTraits: 'Trầm bổng giàu chất thơ xứ Huế hoặc trầm ấm nội lực miền Trung',
    accentSummary: 'Trầm bổng giàu chất thơ xứ Huế hoặc trầm ấm nội lực miền Trung',
  },
  {
    id: 'nam',
    label: 'Miền Nam (Sài Gòn • Miền Tây Nam Bộ)',
    shortLabel: 'Nam',
    defaultDialect: 'nam_saigon',
    dialects: ['nam_saigon', 'nam_mientay'],
    recommendedPitchMale: 0.96,
    recommendedPitchFemale: 1.06,
    recommendedRate: 1.04,
    summaryTraits: 'Phóng khoáng, trẻ trung Sài Gòn hoặc ngọt ngào hào sảng miền Tây',
    accentSummary: 'Phóng khoáng, trẻ trung Sài Gòn hoặc ngọt ngào hào sảng miền Tây',
  },
];

export function getMacroRegionForDialect(dialect?: VietnameseRegionalDialect): MacroRegionVN {
  if (!dialect) return 'bac';
  if (dialect === 'nam_saigon' || dialect === 'nam_mientay') return 'nam';
  if (
    dialect === 'trung_hue' ||
    dialect === 'trung_bac' ||
    dialect === 'trung_nam' ||
    dialect === 'tay_nguyen'
  ) {
    return 'trung';
  }
  return 'bac';
}

export function getMacroRegionRecommendation(
  macro: MacroRegionVN,
  gender: CharacterGender = 'female'
): {
  dialect: VietnameseRegionalDialect;
  defaultDialect: VietnameseRegionalDialect;
  pitchMultiplier: number;
  recommendedPitch: number;
  rate: number;
  recommendedRate: number;
  nuance: string;
  stylePrompt: string;
} {
  const found = VN_MACRO_REGIONS.find((m) => m.id === macro) || VN_MACRO_REGIONS[0];
  const dialectMeta = getRegionalDialectMeta(found.defaultDialect);
  const pitchMultiplier =
    gender === 'robot'
      ? 0.85
      : gender === 'male'
      ? found.recommendedPitchMale
      : found.recommendedPitchFemale;

  return {
    dialect: found.defaultDialect,
    defaultDialect: found.defaultDialect,
    pitchMultiplier,
    recommendedPitch: pitchMultiplier,
    rate: found.recommendedRate,
    recommendedRate: found.recommendedRate,
    nuance: dialectMeta.defaultNuance,
    stylePrompt: dialectMeta.ttsStylePrompt,
  };
}

/**
 * ---------------------------------------------------------------------------
 * 2. TỰ ĐỘNG ĐỐI THOẠI ĐA VÙNG MIỀN THEO BỐI CẢNH KỊCH BẢN (MULTI-REGION AUTO CAST)
 * ---------------------------------------------------------------------------
 */
export interface AutoCastAssignmentReport {
  characterId: string;
  characterName: string;
  assignedDialect: VietnameseRegionalDialect;
  dialectLabel: string;
  pitchMultiplier: number;
  speed: number;
  reason: string;
}

export function autoCastCharactersByScriptContext(
  paramsOrCharacters:
    | {
        storyText: string;
        scenes: StoryScene[];
        characters: StoryCharacter[];
      }
    | StoryCharacter[],
  storyTextArg?: string,
  linesOrScenesArg?: (DialogueLine | StoryScene)[]
): {
  updatedCharacters: StoryCharacter[];
  report: AutoCastAssignmentReport[];
  reports: AutoCastAssignmentReport[];
} {
  const isArrayCall = Array.isArray(paramsOrCharacters);
  const characters = isArrayCall ? paramsOrCharacters : paramsOrCharacters.characters;
  const storyText = isArrayCall ? storyTextArg || '' : paramsOrCharacters.storyText;
  const scenes: StoryScene[] = isArrayCall
    ? (linesOrScenesArg || []).filter((item): item is StoryScene => 'lines' in item)
    : paramsOrCharacters.scenes;
  const directLines: DialogueLine[] = isArrayCall
    ? (linesOrScenesArg || []).filter((item): item is DialogueLine => 'text' in item && !('lines' in item))
    : [];
  const allLines = [...scenes.flatMap((s) => s.lines), ...directLines];
  const fullContextLower = (
    storyText +
    ' ' +
    scenes.map((s) => `${s.title} ${s.setting} ${s.description}`).join(' ')
  ).toLowerCase();

  // Cycle of diverse regional dialects when characters have no explicit regional cue
  const fallbackRegionalCycle: VietnameseRegionalDialect[] = [
    'bac_chuan',
    'nam_saigon',
    'trung_hue',
    'nam_mientay',
    'trung_nam',
    'bac_dongbang',
    'trung_bac',
    'tay_nguyen',
  ];

  const report: AutoCastAssignmentReport[] = [];

  const updatedCharacters = characters.map((char, idx) => {
    const lang = normalizeBilingualLang(char.voiceProfile?.language);
    if (lang === 'en-US') {
      const meta = getRegionalDialectMeta('quoc_te_en');
      report.push({
        characterId: char.id,
        characterName: char.name,
        assignedDialect: 'quoc_te_en',
        dialectLabel: meta.shortBadge,
        pitchMultiplier: char.voiceProfile?.pitchMultiplier ?? 1.02,
        speed: char.voiceProfile?.speed ?? 1.02,
        reason: 'Nhân vật sử dụng ngôn ngữ Quốc Tế (en-US)',
      });
      return char;
    }

    // Gather all dialogue spoken by this character
    const charLinesText = allLines
      .filter(
        (l) =>
          l.characterId === char.id ||
          l.characterName.trim().toLowerCase() === char.name.trim().toLowerCase()
      )
      .map((l) => l.text)
      .join(' ');

    const combinedSignal = `${char.name} ${char.description} ${char.personality} ${charLinesText}`.toLowerCase();

    let detectedDialect: VietnameseRegionalDialect | null = null;
    let reason = '';

    if (
      combinedSignal.includes('huế') ||
      combinedSignal.includes('sông hương') ||
      combinedSignal.includes('cố đô') ||
      combinedSignal.includes('dạ thưa') ||
      combinedSignal.includes('răng chừ') ||
      combinedSignal.includes('chi lạ') ||
      combinedSignal.includes('o ') ||
      combinedSignal.includes('mệ ')
    ) {
      detectedDialect = 'trung_hue';
      reason = 'Phát hiện bối cảnh/phương ngữ Xứ Huế trong lời thoại & hồ sơ';
    } else if (
      combinedSignal.includes('miền tây') ||
      combinedSignal.includes('nam bộ') ||
      combinedSignal.includes('cần thơ') ||
      combinedSignal.includes('sông nước') ||
      combinedSignal.includes('bác ba') ||
      combinedSignal.includes('chú sáu') ||
      combinedSignal.includes('út ') ||
      combinedSignal.includes('quá chừng') ||
      combinedSignal.includes('nghen')
    ) {
      detectedDialect = 'nam_mientay';
      reason = 'Phát hiện bối cảnh/phương ngữ Miền Tây Nam Bộ';
    } else if (
      combinedSignal.includes('sài gòn') ||
      combinedSignal.includes('tp.hcm') ||
      combinedSignal.includes('quận ') ||
      combinedSignal.includes('bé su') ||
      combinedSignal.includes('vậy đó') ||
      combinedSignal.includes('thiệt hả') ||
      combinedSignal.includes('dễ thương ghê')
    ) {
      detectedDialect = 'nam_saigon';
      reason = 'Phát hiện bối cảnh/khẩu ngữ Sài Gòn năng động';
    } else if (
      combinedSignal.includes('nghệ an') ||
      combinedSignal.includes('hà tĩnh') ||
      combinedSignal.includes('nghệ tĩnh') ||
      combinedSignal.includes('mô ') ||
      combinedSignal.includes('răng ') ||
      combinedSignal.includes('rứa')
    ) {
      detectedDialect = 'trung_bac';
      reason = 'Phát hiện bối cảnh/phương ngữ Bắc Trung Bộ (Nghệ Tĩnh)';
    } else if (
      combinedSignal.includes('đà nẵng') ||
      combinedSignal.includes('quảng nam') ||
      combinedSignal.includes('hội an') ||
      combinedSignal.includes('sông hàn')
    ) {
      detectedDialect = 'trung_nam';
      reason = 'Phát hiện bối cảnh Đà Nẵng / Quảng Nam';
    } else if (
      combinedSignal.includes('tây nguyên') ||
      combinedSignal.includes('đại ngàn') ||
      combinedSignal.includes('buôn làng') ||
      combinedSignal.includes('cồng chiêng')
    ) {
      detectedDialect = 'tay_nguyen';
      reason = 'Phát hiện bối cảnh Đại Ngàn Tây Nguyên';
    } else if (
      combinedSignal.includes('kinh bắc') ||
      combinedSignal.includes('bắc ninh') ||
      combinedSignal.includes('làng quê bắc') ||
      combinedSignal.includes('cổ tích')
    ) {
      detectedDialect = 'bac_dongbang';
      reason = 'Phát hiện âm hưởng Đồng Bằng Bắc Bộ / Kinh Bắc';
    } else if (
      combinedSignal.includes('hà nội') ||
      combinedSignal.includes('hồ gươm') ||
      combinedSignal.includes('phố cổ') ||
      combinedSignal.includes('thám tử')
    ) {
      detectedDialect = 'bac_chuan';
      reason = 'Phát hiện bối cảnh Chuẩn Hà Nội / Miền Bắc';
    } else if (fullContextLower.includes('huế') && idx % 3 === 1) {
      detectedDialect = 'trung_hue';
      reason = 'Phân bổ theo bối cảnh chung kịch bản tại Huế';
    } else if (fullContextLower.includes('miền tây') && idx % 2 === 1) {
      detectedDialect = 'nam_mientay';
      reason = 'Phân bổ theo bối cảnh chung kịch bản Miền Tây';
    } else {
      // Assign distinct regional voices across cast for rich multi-region dialogue
      detectedDialect =
        char.role === 'narrator'
          ? 'bac_chuan'
          : fallbackRegionalCycle[idx % fallbackRegionalCycle.length];
      reason =
        char.role === 'narrator'
          ? 'Người dẫn chuyện giữ giọng chuẩn kết nối mạch truyện'
          : 'Tự động phối hợp đa vùng miền để phân tách màu giọng nhân vật';
    }

    const meta = getRegionalDialectMeta(detectedDialect);
    const isRobot =
      char.gender === 'robot' || char.ageGroup === 'ai_robot' || char.role === 'ai_robot';
    const genderOffset =
      isRobot ? -0.12 : char.gender === 'male' ? -0.05 : char.ageGroup === 'tre_em' ? 0.18 : 0;

    const newPitch = Number(
      Math.max(0.65, Math.min(1.4, meta.recommendedPitch + genderOffset)).toFixed(2)
    );
    const newSpeed = Number(
      Math.max(0.75, Math.min(1.35, meta.recommendedRate)).toFixed(2)
    );

    report.push({
      characterId: char.id,
      characterName: char.name,
      assignedDialect: detectedDialect,
      dialectLabel: meta.shortBadge,
      pitchMultiplier: newPitch,
      speed: newSpeed,
      reason,
    });

    return {
      ...char,
      updatedAt: new Date().toISOString(),
      voiceProfile: {
        ...char.voiceProfile,
        vnDialect: detectedDialect,
        pitchMultiplier: newPitch,
        pitch: Math.round((newPitch - 1.0) * 15),
        speed: newSpeed,
        regionalNuance: meta.defaultNuance,
        style: isRobot ? `Giọng AI Robot, ${meta.ttsStylePrompt}` : meta.ttsStylePrompt,
      },
    };
  });

  return { updatedCharacters, report, reports: report };
}

/**
 * ---------------------------------------------------------------------------
 * 3. HIỆU ỨNG ÂM THANH BỐI CẢNH TỰ ĐỘNG THEO VÙNG MIỀN (REGIONAL AMBIENT SOUNDSCAPE)
 * Sử dụng Web Audio API tổng hợp âm thanh thời gian thực (không cần file MP3 ngoài)
 * ---------------------------------------------------------------------------
 */
export type RegionalSoundscapeId =
  | 'bac_danbau'
  | 'hue_mua'
  | 'mientay_songnuoc'
  | 'taynguyen_congchieng'
  | 'saigon_lofi';

export interface RegionalSoundscapePreset {
  id: RegionalSoundscapeId;
  label: string;
  regionBadge: string;
  description: string;
  matchedDialects: VietnameseRegionalDialect[];
}

export const REGIONAL_SOUNDSCAPE_PRESETS: RegionalSoundscapePreset[] = [
  {
    id: 'bac_danbau',
    label: 'Đàn Bầu & Gió Thu Bắc Bộ',
    regionBadge: 'Miền Bắc • Kinh Bắc',
    description: 'Tiếng ngân đàn bầu ngũ cung thanh tao hòa cùng tiếng gió nhẹ',
    matchedDialects: ['bac_chuan', 'bac_dongbang'],
  },
  {
    id: 'hue_mua',
    label: 'Mưa Xứ Huế & Chuông Chùa Thiên Mụ',
    regionBadge: 'Miền Trung • Xứ Huế',
    description: 'Tiếng mưa rơi êm dịu trên sông Hương điểm tiếng chuông chùa trầm mặc',
    matchedDialects: ['trung_hue', 'trung_bac', 'trung_nam'],
  },
  {
    id: 'mientay_songnuoc',
    label: 'Sóng Nước Miền Tây & Đàn Kìm Nam Bộ',
    regionBadge: 'Miền Tây • Nam Bộ',
    description: 'Tiếng sóng nước vỗ mạn thuyền êm ả kết hợp âm hưởng đàn kìm tài tử',
    matchedDialects: ['nam_mientay'],
  },
  {
    id: 'taynguyen_congchieng',
    label: 'Cồng Chiêng & Gió Đại Ngàn Tây Nguyên',
    regionBadge: 'Tây Nguyên • Đại Ngàn',
    description: 'Âm vang cồng chiêng trầm hùng hòa quyện tiếng gió rừng đại ngàn',
    matchedDialects: ['tay_nguyen'],
  },
  {
    id: 'saigon_lofi',
    label: 'Đêm Đô Thị Sài Gòn (Ambient Pad)',
    regionBadge: 'Sài Gòn • Quốc Tế',
    description: 'Hợp âm Ambient Lofi ấm áp hiện đại cho Podcast & Kịch bản trẻ trung',
    matchedDialects: ['nam_saigon', 'quoc_te_en'],
  },
];

export function resolveSoundscapeForDialect(
  dialectOrScenes?: VietnameseRegionalDialect | StoryScene[] | string,
  storyText?: string,
  characters?: StoryCharacter[]
): RegionalSoundscapeId {
  if (typeof dialectOrScenes === 'string') {
    const found = REGIONAL_SOUNDSCAPE_PRESETS.find((p) =>
      p.matchedDialects.includes(dialectOrScenes as VietnameseRegionalDialect)
    );
    if (found) return found.id;
  }
  const combinedText = `${storyText || ''} ${
    Array.isArray(dialectOrScenes)
      ? dialectOrScenes.map((s) => `${s.title} ${s.setting} ${s.description}`).join(' ')
      : ''
  }`.toLowerCase();

  if (combinedText.includes('huế') || combinedText.includes('sông hương')) return 'hue_mua';
  if (combinedText.includes('miền tây') || combinedText.includes('nam bộ') || combinedText.includes('sông nước'))
    return 'mientay_songnuoc';
  if (combinedText.includes('tây nguyên') || combinedText.includes('đại ngàn') || combinedText.includes('cồng chiêng'))
    return 'taynguyen_congchieng';
  if (combinedText.includes('sài gòn') || combinedText.includes('tp.hcm')) return 'saigon_lofi';

  const firstCharDialect = characters?.find((c) => c.voiceProfile?.vnDialect)?.voiceProfile?.vnDialect;
  if (firstCharDialect) {
    const found = REGIONAL_SOUNDSCAPE_PRESETS.find((p) => p.matchedDialects.includes(firstCharDialect));
    if (found) return found.id;
  }
  return 'bac_danbau';
}

class RegionalAmbientSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private activeNodes: AudioNode[] = [];
  private isPlaying = false;
  private currentPreset: RegionalSoundscapeId = 'bac_danbau';
  private volume = 0.25;

  public start(preset: RegionalSoundscapeId, volume = 0.25) {
    if (typeof window === 'undefined') return;
    this.stop();

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.currentPreset = preset;
    this.volume = Math.max(0.02, Math.min(1, volume));
    this.isPlaying = true;

    const master = this.ctx.createGain();
    master.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
    master.connect(this.ctx.destination);
    this.masterGain = master;

    // 1. Tạo lớp nền khí quyển (Pink/Brown Noise cho Mưa Huế, Sóng Nước hoặc Gió Đại Ngàn)
    this.createAtmosphereLayer(preset);

    // 2. Tạo chu kỳ gảy nhạc cụ dân tộc theo vùng miền
    this.triggerMelodicNote(preset);
    this.timerId = setInterval(() => {
      if (this.isPlaying) {
        this.triggerMelodicNote(this.currentPreset);
      }
    }, preset === 'taynguyen_congchieng' ? 3200 : preset === 'hue_mua' ? 3600 : 2400);
  }

  private createAtmosphereLayer(preset: RegionalSoundscapeId) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 0.25;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = preset === 'hue_mua' ? 'bandpass' : 'lowpass';
    filter.frequency.value =
      preset === 'hue_mua'
        ? 950
        : preset === 'mientay_songnuoc'
        ? 380
        : preset === 'taynguyen_congchieng'
        ? 280
        : 220;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value =
      preset === 'hue_mua'
        ? 0.45
        : preset === 'mientay_songnuoc'
        ? 0.38
        : preset === 'taynguyen_congchieng'
        ? 0.3
        : 0.14;

    // Nếu là Sóng nước miền Tây, thêm LFO điều chế nhịp sóng vỗ
    if (preset === 'mientay_songnuoc') {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.28; // Nhịp sóng 3.5 giây
      lfoGain.gain.value = 160;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.activeNodes.push(lfo, lfoGain);
    }

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter, noiseGain);
  }

  private triggerMelodicNote(preset: RegionalSoundscapeId) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Thang âm ngũ cung Việt Nam (Hò - Xự - Xang - Xê - Cống)
    const pentatonicNotes = [220, 247.5, 293.66, 330, 392, 440, 495];
    const baseFreq = pentatonicNotes[Math.floor(Math.random() * pentatonicNotes.length)];

    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    if (preset === 'bac_danbau') {
      // Đàn bầu: Sine/Triangle với hiệu ứng rung cần (pitch bend mềm mại)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.12, now + 0.65);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 1.4);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.22, now + 0.15);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 2.1);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 2.15);
    } else if (preset === 'hue_mua') {
      // Chuông chùa Thiên Mụ & Tơ đồng trầm lắng
      osc.type = 'sine';
      const bellFreq = [261.63, 329.63, 392.0, 523.25][Math.floor(Math.random() * 4)];
      osc.frequency.setValueAtTime(bellFreq, now);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0008, now + 3.0);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 3.05);
    } else if (preset === 'mientay_songnuoc') {
      // Đàn kìm Nam Bộ gảy ngọt ngào
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * 0.75, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.78, now + 0.35);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.65);
    } else if (preset === 'taynguyen_congchieng') {
      // Cồng chiêng Tây Nguyên trầm hùng (2 tần số cộng hưởng)
      const gongFreq = [110, 130.81, 146.83, 164.81][Math.floor(Math.random() * 4)];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(gongFreq, now);

      const overtone = this.ctx.createOscillator();
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(gongFreq * 1.52, now);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.28, now + 0.06);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      osc.connect(noteGain);
      overtone.connect(noteGain);
      noteGain.connect(this.masterGain);
      osc.start(now);
      overtone.start(now);
      osc.stop(now + 2.85);
      overtone.stop(now + 2.85);
    } else {
      // Sài Gòn Lofi / Ambient Pad
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * 0.5, now);
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.16, now + 0.4);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 2.25);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0.02, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.35, this.ctx.currentTime, 0.1);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // ignore already stopped nodes
      }
    });
    this.activeNodes = [];
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.masterGain = null;
  }
}

export const regionalAmbientController = new RegionalAmbientSynthesizer();

