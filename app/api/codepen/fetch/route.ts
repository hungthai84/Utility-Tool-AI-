// Endpoint API: /api/codepen/fetch
// Nhận URL CodePen từ client, kiểm tra SSRF, trích xuất HTML/CSS/JS công khai
import { NextRequest, NextResponse } from 'next/server';
import { fetchCodePenPublicSource, normalizeCodePenUrl } from '@/lib/codepen/codepen-parser';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đường dẫn CodePen hợp lệ.' },
        { status: 400 }
      );
    }

    const norm = normalizeCodePenUrl(url);
    if (!norm.isValid) {
      return NextResponse.json({ error: norm.error }, { status: 400 });
    }

    const parsedSource = await fetchCodePenPublicSource(norm.normalizedUrl);
    return NextResponse.json(parsedSource);
  } catch (err: any) {
    console.error('[API /api/codepen/fetch error]:', err);
    return NextResponse.json(
      {
        error: `Không thể truy xuất CodePen: ${err?.message || 'Lỗi kết nối mạng máy chủ'}`,
      },
      { status: 500 }
    );
  }
}
