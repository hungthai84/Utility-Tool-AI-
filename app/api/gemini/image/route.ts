import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { action, prompt, base64Image, mimeType, aspectRatio } = await req.json();

    if (action === 'generate') {
      // Image Generation using gemini-3.1-flash-lite-image
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: prompt || 'Một bức ảnh phong cảnh hiện đại với ánh sáng glassmorphism quyến rũ',
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || '1:1',
          },
        },
      });

      let imageUrl = null;
      let textOutput = '';

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          } else if (part.text) {
            textOutput += part.text;
          }
        }
      }

      return NextResponse.json({ imageUrl, text: textOutput });
    } else if (action === 'analyze' || action === 'ocr') {
      // Vision Analysis / OCR using gemini-3.8-flash with multimodal image
      if (!base64Image) {
        return NextResponse.json({ error: 'Cần có hình ảnh để phân tích' }, { status: 400 });
      }

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: base64Image.replace(/^data:image\/\w+;base64,/, ''),
        },
      };

      const promptText = action === 'ocr'
        ? 'Hãy trích xuất chính xác 100% toàn bộ văn bản (chữ tiếng Việt/Anh) có trong hình ảnh này. Giữ nguyên định dạng và dòng.'
        : prompt || 'Phân tích hình ảnh này chi tiết: mô tả đối tượng, màu sắc chủ đạo, bố cục và đưa ra gợi ý tách nền/tối ưu hóa.';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: [imagePart, { text: promptText }] },
      });

      return NextResponse.json({ result: response.text });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Image API error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi xử lý hình ảnh' },
      { status: 500 }
    );
  }
}
