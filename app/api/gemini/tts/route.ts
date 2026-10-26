import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

export interface DialogueTurnInput {
  speaker: string;
  text: string;
  style?: string;
}

export interface SpeakerConfigInput {
  speaker: string;
  voiceName: string;
  style?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      mode = 'single', // 'single' | 'multi'
      text,
      voice,
      style,
      language = 'vi-VN',
      useProExpressive = false,
      speakers = [],
      dialogueTurns = [],
      enhancePrompt,
    } = body;

    // 1. AI Script Enhancer / Generator for TTS
    if (action === 'enhance_text') {
      if (!text && !enhancePrompt) {
        return NextResponse.json(
          { error: 'Vui lòng nhập văn bản hoặc chủ đề cần tối ưu' },
          { status: 400 }
        );
      }

      const systemPrompt =
        mode === 'multi'
          ? `Bạn là đạo diễn âm thanh và biên kịch Podcast AI chuyên nghiệp.
Nhiệm vụ của bạn là viết hoặc chuyển đổi nội dung đầu vào thành kịch bản hội thoại tự nhiên giữa 2 người (${speakers[0]?.speaker || 'Host'} và ${speakers[1]?.speaker || 'Khách mời'}).
Hỗ trợ chèn các thẻ biểu cảm giọng nói tự nhiên của Gemini 3.8 TTS khi phù hợp: <breath>, <laugh>, <gasp>, |mhm|, |yeah|.
Trả về đúng định dạng JSON:
{
  "enhancedText": "Toàn bộ kịch bản dạng Tên: Lời thoại",
  "turns": [
    { "speaker": "${speakers[0]?.speaker || 'Host'}", "text": "Lời thoại...", "style": "Phong cách đọc" },
    { "speaker": "${speakers[1]?.speaker || 'Khách mời'}", "text": "Lời thoại...", "style": "Phong cách đọc" }
  ]
}`
          : `Bạn là chuyên gia biên tập văn bản đọc lồng tiếng (Voiceover & TTS Script Polisher).
Nhiệm vụ của bạn:
1. Chuẩn hóa câu chữ để khi đọc lên nghe tự nhiên, truyền cảm, ngắt nghỉ hợp lý.
2. Nếu được yêu cầu thêm biểu cảm, hãy chèn khéo léo các thẻ âm thanh tự nhiên như <breath> (lấy hơi), <laugh> (cười nhẹ), <gasp> (ngạc nhiên) vào vị trí hợp lý.
3. Phong cách mục tiêu: ${style || 'Truyền cảm, rõ ràng, tự nhiên'}. Ngôn ngữ: ${language}.
Trả về đúng định dạng JSON:
{
  "enhancedText": "Văn bản đã chuẩn hóa để đọc...",
  "suggestedStyle": "Hướng dẫn phong cách diễn cảm ngắn gọn"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: enhancePrompt
          ? `Yêu cầu: ${enhancePrompt}\nNội dung gốc (nếu có): ${text || ''}`
          : `Hãy chuẩn hóa và tối ưu đoạn văn bản sau cho đọc giọng nói AI:\n${text}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return NextResponse.json(parsed);
    }

    // 2. Multi-Speaker Dual Dialogue Mode (gemini-3.8-flash-tts)
    if (mode === 'multi') {
      const validSpeakers: SpeakerConfigInput[] =
        Array.isArray(speakers) && speakers.length === 2
          ? speakers
          : [
              { speaker: 'Alex', voiceName: 'Puck', style: 'Hào hứng, tự nhiên' },
              { speaker: 'Sam', voiceName: 'Kore', style: 'Truyền cảm, sâu sắc' },
            ];

      let parts: { text: string; speechMetadata?: { speaker: string; style?: string } }[] = [];

      if (Array.isArray(dialogueTurns) && dialogueTurns.length > 0) {
        parts = dialogueTurns
          .filter((t: DialogueTurnInput) => t.text && t.text.trim() !== '')
          .map((t: DialogueTurnInput) => {
            const matchedSpeaker =
              validSpeakers.find(
                (s) => s.speaker.toLowerCase() === (t.speaker || '').toLowerCase()
              ) || validSpeakers[0];
            return {
              text: `${matchedSpeaker.speaker}: ${t.text.trim()}`,
              speechMetadata: {
                speaker: matchedSpeaker.speaker,
                style: t.style || matchedSpeaker.style || style || 'Tự nhiên, truyền cảm',
              },
            };
          });
      } else if (text && text.trim() !== '') {
        // Parse lines formatted like "Speaker: text"
        const lines = text
          .split('\n')
          .map((l: string) => l.trim())
          .filter(Boolean);
        parts = lines.map((line: string, idx: number) => {
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0) {
            const spkName = line.slice(0, colonIdx).trim();
            const content = line.slice(colonIdx + 1).trim();
            const matched =
              validSpeakers.find((s) => s.speaker.toLowerCase() === spkName.toLowerCase()) ||
              validSpeakers[idx % 2];
            return {
              text: `${matched.speaker}: ${content}`,
              speechMetadata: {
                speaker: matched.speaker,
                style: matched.style || style || 'Tự nhiên, truyền cảm',
              },
            };
          }
          const fallbackSpeaker = validSpeakers[idx % 2];
          return {
            text: `${fallbackSpeaker.speaker}: ${line}`,
            speechMetadata: {
              speaker: fallbackSpeaker.speaker,
              style: fallbackSpeaker.style || style || 'Tự nhiên, truyền cảm',
            },
          };
        });
      }

      if (parts.length === 0) {
        return NextResponse.json(
          { error: 'Vui lòng nhập ít nhất một câu hội thoại để tổng hợp giọng nói' },
          { status: 400 }
        );
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: validSpeakers.map((s) => ({
                speaker: s.speaker,
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: s.voiceName || 'Kore' },
                },
              })),
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return NextResponse.json(
          { error: 'Không thể tạo âm thanh hội thoại đa giọng đọc' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        audioUrl: `data:audio/wav;base64,${base64Audio}`,
        mode: 'multi',
        modelUsed: 'gemini-3.8-flash-tts',
      });
    }

    // 3. Single-Speaker TTS Mode
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Nội dung văn bản không được để trống' }, { status: 400 });
    }

    const selectedVoice = voice || 'Kore';
    const voiceStyle = style || 'Giọng đọc truyền cảm, rõ ràng, phát âm tiếng Việt chuẩn';
    const hasExpressiveTags = /<(laugh|gasp|breath)>|\|(mhm|yeah)\|/i.test(text);
    const modelName =
      useProExpressive || hasExpressiveTags ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: voiceStyle,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return NextResponse.json({ error: 'Không thể tạo âm thanh giọng nói' }, { status: 500 });
    }

    const audioUrl = `data:audio/wav;base64,${base64Audio}`;

    return NextResponse.json({
      audioUrl,
      voice: selectedVoice,
      modelUsed: modelName,
    });
  } catch (error: any) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi chuyển văn bản thành giọng nói' },
      { status: 500 }
    );
  }
}
