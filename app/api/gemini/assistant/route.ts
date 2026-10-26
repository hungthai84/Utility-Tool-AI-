import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    const systemInstruction = `Bạn là Trợ lý AI Tiện Ích Đa Năng của nền tảng UTILITY HUB.
Bạn giao tiếp hoàn toàn bằng TIẾNG VIỆT tự nhiên, thân thiện, súc tích và chuyên nghiệp.
Nền tảng của bạn tích hợp các bộ công cụ:
1. Bộ xử lý Hình ảnh AI (Tạo ảnh, tách nền, OCR trích xuất chữ).
2. Bộ xử lý Video (Tạo prompt kịch bản video AI, nén & chuyển mã video 4K web).
3. Bộ xử lý Giọng nói (Text-to-Speech đa giọng đọc Kore, Puck, Zephyr..., Transcribe âm thanh).
4. Bộ chuyển đổi Code (Chuyển đổi HTML sang React/Next.js, JS sang TS, Refactor mã nguồn, thêm chống tràn UI).
5. Đồng bộ hóa Cloud Firebase & Chế độ làm việc Ngoại tuyến (Offline Mode).

Khi trả lời:
- Luôn trả lời trực tiếp câu hỏi người dùng.
- Thường xuyên đưa ra các gợi ý tính năng hữu ích tiếp theo.
- Sử dụng định dạng Markdown đẹp mắt (danh sách, khối code nếu cần).`;

    const chatHistory = history || [];
    const contents = [
      ...chatHistory.map((item: any) => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return NextResponse.json({ reply: response.text });
  } catch (error: any) {
    console.error('AI Assistant API error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi kết nối Trợ lý AI' },
      { status: 500 }
    );
  }
}
