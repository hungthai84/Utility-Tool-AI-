import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { base64Audio, mimeType, prompt } = await req.json();

    if (!base64Audio) {
      return NextResponse.json({ error: 'Cần có tệp âm thanh để giải mã' }, { status: 400 });
    }

    const cleanBase64 = base64Audio.replace(/^data:audio\/\w+;base64,/, '');

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/mp3',
        data: cleanBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          { text: prompt || 'Hãy chép lại toàn bộ lời nói trong đoạn âm thanh này bằng tiếng Việt chuẩn xác.' },
        ],
      },
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error('Audio Transcribe API error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi trích xuất giọng nói' },
      { status: 500 }
    );
  }
}
