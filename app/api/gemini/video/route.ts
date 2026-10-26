import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { concept, duration, resolution, style, fps, action } = await req.json();

    if (action === 'compress_plan') {
      const prompt = `Bạn là một Kỹ sư Tối ưu hóa Media & Video Codec. 
Hãy lập kế hoạch nén video 4K/HD sang định dạng Web (MP4/WebM/H.265/AV1) tối ưu nhất cho ý tưởng: "${concept || 'Video sản phẩm web'}".
Thông số hiện tại: Độ phân giải ${resolution || '1080p'}, Thời lượng ${duration || '30s'}, FPS ${fps || '60'}.
Đưa ra:
1. Thông số Bitrate đề xuất (Video & Audio)
2. Công thức lệnh FFmpeg chuẩn xác
3. Tỷ lệ giảm dung lượng dự kiến (%)
4. Lời khuyên tối ưu UX tải trang Web`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return NextResponse.json({ result: response.text });
    } else {
      // Prompt Generation for Omni / Veo / Runway / Sora Video Models
      const prompt = `Bạn là một Đạo diễn Kịch bản Video & Chuyên gia AI Video Generation (Veo/Omni Flash).
Hãy biến ý tưởng thô sau thành Prompt Video Tiếng Anh và Tiếng Việt siêu chi tiết, chuẩn điện ảnh:
Ý tưởng: "${concept}"
Phong cách: "${style || 'Cinematic, Hyper-realistic 8K, Photorealistic, Motion blur'}"
Thời lượng mong muốn: "${duration || '5s'}"

Hãy tạo ra:
1. **English Cinematic Prompt (Dùng cho AI Video Generator)**: Tả chi tiết góc máy (camera angle, movement), ánh sáng (lighting), màu sắc (color grading), hành động (action), chuyển động môi trường.
2. **Kịch bản phân cảnh (Storyboard 3-step)**: Từng giây cụ thể.
3. **Cấu hình tham số Omni Flash / Veo**: Aspect Ratio (16:9, 9:16, 1:1), Resolution, Frames Per Second.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return NextResponse.json({ result: response.text });
    }
  } catch (error: any) {
    console.error('Video API error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi xử lý video' },
      { status: 500 }
    );
  }
}
