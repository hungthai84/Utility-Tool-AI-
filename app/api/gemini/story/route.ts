import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { action, title, contentType, topic, targetAudience, characters, storyText } = await req.json();

    if (action === 'generate_outline') {
      if (!topic || topic.trim() === '') {
        return NextResponse.json({ error: 'Vui lòng nhập chủ đề hoặc ý tưởng chính' }, { status: 400 });
      }

      const characterNames = (characters || []).map((c: any) => `${c.name} (${c.role}): ${c.description}`).join('; ');

      const prompt = `Bạn là một tác giả kịch bản và nhà biên tập nội dung âm thanh chuyên nghiệp.
Hãy viết kịch bản/cốt truyện đầy đủ cho một tác phẩm thuộc thể loại "${contentType || 'truyen_ngan'}" với các thông tin sau:
- Tiêu đề: ${title || 'Chưa đặt tên'}
- Ý tưởng/Chủ đề: ${topic}
- Đối tượng khán giả: ${targetAudience || 'Mọi lứa tuổi'}
- Danh sách nhân vật chính: ${characterNames || 'Tự động sáng tạo nhân vật phù hợp'}

Yêu cầu kịch bản:
1. Viết hấp dẫn, sinh động, chuẩn ngôn ngữ tiếng Việt tự nhiên.
2. Sử dụng định dạng rõ ràng bao gồm lời dẫn chuyện và lời thoại nhân vật theo cấu trúc:
Người dẫn chuyện: [Nội dung lời dẫn]
Tên Nhân Vật: [Nội dung lời thoại]
3. Ngắt thành 2-4 phân cảnh rõ ràng để người đọc dễ theo dõi.

Trả về phản hồi dạng JSON hợp lệ duy nhất có cấu trúc:
{
  "generatedStoryText": "Nội dung đầy đủ kịch bản...",
  "suggestedTitle": "Tiêu đề đề xuất hay hơn"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text;
      if (!responseText) {
        return NextResponse.json({ error: 'Không thể tạo kịch bản từ AI' }, { status: 500 });
      }

      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    }

    if (action === 'parse_scenes') {
      if (!storyText || storyText.trim() === '') {
        return NextResponse.json({ error: 'Nội dung kịch bản không được để trống' }, { status: 400 });
      }

      const knownChars = (characters || []).map((c: any) => c.name);

      const prompt = `Bạn là một hệ thống phân tích kịch bản âm thanh (Voice & Audio Script Parser).
Nhiệm vụ của bạn là phân tích đoạn văn bản kịch bản dưới đây thành các Cảnh (Scenes) và các Câu Thoại (Dialogue Lines) chi tiết.

Danh sách nhân vật đã khai báo: ${JSON.stringify(knownChars)}
(Nếu thấy lời thoại của ai không có trong danh sách, hãy ghi nhận đúng tên nhân vật đó, hoặc dùng "Người dẫn chuyện" cho phần dẫn cảnh).

Văn bản kịch bản:
"""
${storyText}
"""

Hãy phân tích và trả về đúng 1 đối tượng JSON có cấu trúc:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Tên cảnh ngắn gọn",
      "setting": "Bối cảnh thời gian/không gian",
      "description": "Mô tả vắn tắt diễn biến",
      "lines": [
        {
          "characterName": "Tên nhân vật hoặc Người dẫn chuyện",
          "text": "Nội dung lời thoại chính xác",
          "emotionStyle": "Phong cách cảm xúc phù hợp (e.g. Hào hứng, Trầm ấm, Hồi hộp, Vui vẻ)",
          "pauseAfterMs": 400
        }
      ]
    }
  ]
}

Chú ý:
- Tên nhân vật phải khớp với danh sách khai báo nếu trùng.
- Không để sót câu thoại nào trong văn bản gốc.
- Đảm bảo JSON hợp lệ không có ký tự dư thừa.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text;
      if (!responseText) {
        return NextResponse.json({ error: 'Không thể phân tích kịch bản thành phân cảnh' }, { status: 500 });
      }

      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Story API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi xử lý AI Story Studio' },
      { status: 500 }
    );
  }
}
