import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { sourceCode, fromLang, toLang, action, customPrompt } = await req.json();

    let systemInstruction = `Bạn là một Chuyên gia Lập trình Web Cao cấp (Senior Software Engineer & Code Architect). 
Nhiệm vụ của bạn là chuyển đổi, refactor hoặc tạo mã nguồn theo yêu cầu người dùng một cách chính xác 100%, tối ưu hiệu suất, sạch sẽ và sẵn sàng sử dụng.
Đặc biệt tuân thủ:
1. Đảm bảo dữ liệu và logic không bị thay đổi trừ khi được yêu cầu.
2. Dùng TypeScript, React 19, Tailwind CSS v4, Next.js App Router nếu liên quan đến Web.
3. Cung cấp mã nguồn sạch, có chú thích giải thích trong khối markdown code block.`;

    let prompt = `Chuyển đổi/Xử lý mã nguồn từ [${fromLang || 'Tự động'}] sang [${toLang || 'React TypeScript + Tailwind'}]`.trim();

    if (action === 'convert') {
      prompt += `\n\nCode nguồn:\n\`\`\`\n${sourceCode}\n\`\`\`\n\nHãy chuyển đổi mã nguồn trên thành ${toLang}. Giữ nguyên 100% dữ liệu, hình ảnh, văn bản và tên biến quan trọng.`;
    } else if (action === 'refactor') {
      prompt += `\n\nTối ưu hóa (Refactor) và nâng cấp hiệu năng cho mã nguồn sau:\n\`\`\`\n${sourceCode}\n\`\`\`\n\nThêm xử lý chống tràn (anti-overflow), tối ưu CSS Tailwind, tách component nếu cần.`;
    } else if (action === 'explain') {
      prompt += `\n\nGiải thích chi tiết từng phần của đoạn mã sau:\n\`\`\`\n${sourceCode}\n\`\`\``;
    } else if (customPrompt) {
      prompt = `${customPrompt}\n\nCode đính kèm (nếu có):\n\`\`\`\n${sourceCode || 'Không có'}\n\`\`\``;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error('Code conversion API error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi xử lý mã nguồn' },
      { status: 500 }
    );
  }
}
