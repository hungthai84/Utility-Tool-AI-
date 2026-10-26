// Bộ phân tích và trích xuất CodePen an toàn (SSRF Protected, Sandbox Parser)
import { CodePenParsedSource, CodePenReadScope, CodePenExternalResource } from './types';

// Kiểm tra và chuẩn hóa URL CodePen
export function normalizeCodePenUrl(rawUrl: string): {
  isValid: boolean;
  normalizedUrl: string;
  author: string;
  penId: string;
  error?: string;
} {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, normalizedUrl: '', author: '', penId: '', error: 'Đường dẫn CodePen không được để trống.' };
  }

  const trimmed = rawUrl.trim();

  // Chặn giao thức nguy hiểm
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://') && !trimmed.includes('codepen.io')) {
    // Cho phép nhập trực tiếp dạng: codepen.io/username/pen/abc123 hoặc username/pen/abc123
    if (trimmed.includes('pen/')) {
      const parts = trimmed.split('pen/');
      const penId = parts[1]?.split(/[\/\?#]/)[0] || '';
      const author = parts[0]?.replace(/^https?:\/\//, '').replace(/codepen\.io\//, '').replace(/\/$/, '') || 'codepen-user';
      if (penId) {
        return {
          isValid: true,
          normalizedUrl: `https://codepen.io/${author}/pen/${penId}`,
          author,
          penId,
        };
      }
    }
    return {
      isValid: false,
      normalizedUrl: '',
      author: '',
      penId: '',
      error: 'Vui lòng nhập đường dẫn hợp lệ dạng: https://codepen.io/username/pen/penId',
    };
  }

  try {
    const urlObj = new URL(trimmed);

    // SSRF Check: Chỉ cho phép hostname codepen.io hoặc cdpn.io
    const host = urlObj.hostname.toLowerCase();
    if (host !== 'codepen.io' && host !== 'www.codepen.io' && host !== 'cdpn.io') {
      return {
        isValid: false,
        normalizedUrl: '',
        author: '',
        penId: '',
        error: 'Chỉ chấp nhận đường dẫn từ tên miền chính thức codepen.io',
      };
    }

    // Pattern: /:username/:view/:penId (ví dụ: /username/pen/abc, /username/full/abc, /username/embed/abc, /username/details/abc)
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    let author = 'unknown';
    let penId = '';

    if (pathParts.length >= 3 && ['pen', 'full', 'embed', 'details', 'editor'].includes(pathParts[1].toLowerCase())) {
      author = pathParts[0];
      penId = pathParts[2];
    } else if (pathParts.length >= 2 && pathParts[0].toLowerCase() === 'pen') {
      penId = pathParts[1];
    } else if (pathParts.length >= 2) {
      author = pathParts[0];
      penId = pathParts[1];
    }

    // Làm sạch penId (bỏ đuôi .html, .css nếu có)
    penId = penId.replace(/\.(html|css|js)$/i, '');

    if (!penId || penId.length < 2) {
      return {
        isValid: false,
        normalizedUrl: '',
        author,
        penId: '',
        error: 'Không thể xác định Pen ID từ đường dẫn đã cung cấp.',
      };
    }

    const cleanAuthor = author === 'unknown' ? 'codepen' : author;
    const normalizedUrl = `https://codepen.io/${cleanAuthor}/pen/${penId}`;

    return {
      isValid: true,
      normalizedUrl,
      author: cleanAuthor,
      penId,
    };
  } catch (err: any) {
    return {
      isValid: false,
      normalizedUrl: '',
      author: '',
      penId: '',
      error: `URL không hợp lệ: ${err?.message || 'Lỗi cú pháp'}`,
    };
  }
}

// Trích xuất mã nguồn thực tế từ CodePen qua các endpoints công khai và an toàn
export async function fetchCodePenPublicSource(rawUrl: string): Promise<CodePenParsedSource> {
  const norm = normalizeCodePenUrl(rawUrl);
  if (!norm.isValid) {
    throw new Error(norm.error || 'Đường dẫn CodePen không hợp lệ');
  }

  const { author, penId, normalizedUrl } = norm;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  let html = '';
  let css = '';
  let js = '';
  let title = `Pen #${penId}`;
  let description = `Mã nguồn CodePen của tác giả @${author}`;
  const externalCss: string[] = [];
  const externalJs: string[] = [];
  const dependencies: CodePenExternalResource[] = [];
  let isPublic = true;
  let readScope: CodePenReadScope = 'full_source';
  let errorReason: string | undefined;

  try {
    // 1. Lấy thông tin metadata qua oEmbed API chính thức của CodePen
    try {
      const oembedUrl = `https://codepen.io/api/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`;
      const oembedRes = await fetch(oembedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'UtilityHub-CodePen-Analyzer/2.0',
          Accept: 'application/json',
        },
      });

      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (oembedData.title) title = oembedData.title;
        if (oembedData.author_name) title = `${oembedData.title} by ${oembedData.author_name}`;
      }
    } catch {
      // Bỏ qua nếu oEmbed bị chặn hoặc không phản hồi
    }

    // 2. Tải song song 3 file raw công khai: .html, .css, .js
    const rawHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'text/html,text/css,text/javascript,application/javascript,*/*',
    };

    const [htmlRes, cssRes, jsRes] = await Promise.allSettled([
      fetch(`https://codepen.io/${author}/pen/${penId}.html`, {
        signal: controller.signal,
        headers: rawHeaders,
      }),
      fetch(`https://codepen.io/${author}/pen/${penId}.css`, {
        signal: controller.signal,
        headers: rawHeaders,
      }),
      fetch(`https://codepen.io/${author}/pen/${penId}.js`, {
        signal: controller.signal,
        headers: rawHeaders,
      }),
    ]);

    if (htmlRes.status === 'fulfilled' && htmlRes.value.ok) {
      html = await htmlRes.value.text();
    }
    if (cssRes.status === 'fulfilled' && cssRes.value.ok) {
      css = await cssRes.value.text();
    }
    if (jsRes.status === 'fulfilled' && jsRes.value.ok) {
      js = await jsRes.value.text();
    }

    // 3. Nếu các file raw không truy xuất được (hoặc trả về trang login 403/404), thử đọc trang view chính
    if (!html.trim() && !css.trim() && !js.trim()) {
      const pageRes = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: rawHeaders,
      });

      if (!pageRes.ok) {
        if (pageRes.status === 404) {
          readScope = 'fetch_error';
          errorReason = 'Pen không tồn tại hoặc đã bị xóa.';
        } else if (pageRes.status === 403 || pageRes.status === 401) {
          readScope = 'requires_auth';
          errorReason = 'Pen ở chế độ Riêng tư (Private) hoặc yêu cầu quyền đăng nhập CodePen.';
        } else {
          readScope = 'fetch_error';
          errorReason = `Máy chủ CodePen phản hồi mã trạng thái HTTP ${pageRes.status}`;
        }
      } else {
        const pageHtml = await pageRes.text();

        // Trích xuất thẻ title
        const titleMatch = pageHtml.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].replace(/ - CodePen$/i, '').trim();
        }

        // Kiểm tra xem có dữ liệu JSON trong thẻ data-pen hoặc init config không
        const dataMatch = pageHtml.match(/init_data\s*=\s*({[\s\S]+?});/) || pageHtml.match(/__DATA\s*=\s*({[\s\S]+?});/);
        if (dataMatch && dataMatch[1]) {
          try {
            const parsed = JSON.parse(dataMatch[1]);
            const penObj = parsed.pen || parsed.item || parsed;
            if (penObj.html) html = penObj.html;
            if (penObj.css) css = penObj.css;
            if (penObj.js) js = penObj.js;
            if (penObj.title) title = penObj.title;
            if (penObj.description) description = penObj.description;
          } catch {
            // Không parse được JSON init data
          }
        }

        if (!html.trim() && !css.trim() && !js.trim()) {
          readScope = 'preview_only';
          errorReason =
            'Mã nguồn được đóng gói hoặc yêu cầu tương tác trình duyệt. Hệ thống đã mở chế độ Preview và cho phép bạn Dán mã thủ công.';
        }
      }
    }

    // Phát hiện thư viện bên ngoài từ HTML và JS
    const scriptSrcMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi);
    for (const m of scriptSrcMatches) {
      if (m[1] && !externalJs.includes(m[1])) {
        externalJs.push(m[1]);
        dependencies.push(classifyResource(m[1], 'js'));
      }
    }

    const linkHrefMatches = html.matchAll(/<link[^>]+href=["']([^"']+)["']/gi);
    for (const m of linkHrefMatches) {
      if (m[1] && (m[0].includes('stylesheet') || m[1].endsWith('.css')) && !externalCss.includes(m[1])) {
        externalCss.push(m[1]);
        dependencies.push(classifyResource(m[1], 'css'));
      }
    }

    if (html.trim() && (css.trim() || js.trim())) {
      readScope = 'full_source';
    } else if (html.trim() || css.trim() || js.trim()) {
      readScope = 'partial_source';
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      readScope = 'fetch_error';
      errorReason = 'Quá thời gian kết nối tới máy chủ CodePen (Timeout 12s).';
    } else {
      readScope = 'fetch_error';
      errorReason = `Lỗi mạng khi tải CodePen: ${err?.message || 'Không thể kết nối'}`;
    }
  } finally {
    clearTimeout(timeoutId);
  }

  // Preview URL an toàn nhúng qua cdpn.io / codepen.io embed
  const previewUrl = `https://codepen.io/${author}/embed/${penId}?default-tab=result&theme-id=dark`;

  return {
    url: normalizedUrl,
    penId,
    author,
    title: title || `CodePen #${penId}`,
    description: description || `Mã nguồn CodePen của @${author}`,
    html: html || '',
    css: css || '',
    js: js || '',
    externalCss,
    externalJs,
    dependencies,
    readScope,
    isPublic,
    rawFetchedAt: new Date().toISOString(),
    previewUrl,
    errorReason,
  };
}

function classifyResource(url: string, type: 'css' | 'js'): CodePenExternalResource {
  const u = url.toLowerCase();
  let name = url.split('/').pop()?.split('?')[0] || url;
  let version: string | undefined;

  const versionMatch = url.match(/@([0-9]+\.[0-9]+(\.[0-9]+)?)/);
  if (versionMatch) version = versionMatch[1];

  if (u.includes('tailwindcss')) name = 'Tailwind CSS (CDN)';
  else if (u.includes('font-awesome') || u.includes('fontawesome')) name = 'Font Awesome Icons';
  else if (u.includes('bootstrap')) name = 'Bootstrap Framework';
  else if (u.includes('animate.css')) name = 'Animate.css';
  else if (u.includes('three')) name = 'Three.js 3D Library';
  else if (u.includes('gsap')) name = 'GSAP Animation Library';
  else if (u.includes('jquery')) name = 'jQuery';
  else if (u.includes('react')) name = 'React Framework';
  else if (u.includes('vue')) name = 'Vue.js Framework';
  else if (u.includes('lucide')) name = 'Lucide Icons';

  return { type, url, name, version };
}

// Xây dựng trang Preview Sandbox an toàn (Isolated HTML)
export function createSandboxedPreviewHtml(params: {
  html: string;
  css: string;
  js: string;
  externalCss?: string[];
  externalJs?: string[];
}): string {
  const { html, css, js, externalCss = [], externalJs = [] } = params;

  const cssLinks = externalCss
    .map((href) => `<link rel="stylesheet" href="${escapeHtmlAttr(href)}">`)
    .join('\n');

  const jsScripts = externalJs
    .map((src) => `<script src="${escapeHtmlAttr(src)}"></script>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sandbox Preview</title>
  ${cssLinks}
  <style>
    /* Reset an toàn và cô lập lỗi trong iframe sandbox */
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background-color: transparent;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
  ${jsScripts}
  <script>
    // Bắt lỗi JS để không làm crash iframe
    window.onerror = function(msg, url, line) {
      console.warn('[Sandbox Preview Warning]:', msg, 'at line', line);
      return true;
    };
    try {
      ${js}
    } catch(err) {
      console.warn('[Sandbox Execution Error]:', err);
    }
  </script>
</body>
</html>`;
}

function escapeHtmlAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Tạo cấu trúc CodePenParsedSource thủ công khi người dùng dán code trực tiếp
export function createManualCodePenSource(params: {
  title?: string;
  author?: string;
  html?: string;
  css?: string;
  js?: string;
  url?: string;
  externalCss?: string[];
  externalJs?: string[];
}): CodePenParsedSource {
  const now = new Date().toISOString();
  const randId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    url: params.url || `https://codepen.io/manual/pen/${randId}`,
    penId: randId,
    author: params.author || 'User-Provided Code',
    title: params.title || 'Mã Nguồn Tùy Chỉnh (Manual Paste)',
    description: 'Mã nguồn được nhập trực tiếp qua tính năng Dán Mã Thủ Công.',
    html: params.html || '',
    css: params.css || '',
    js: params.js || '',
    externalCss: params.externalCss || [],
    externalJs: params.externalJs || [],
    dependencies: [],
    readScope: 'manual_paste',
    isPublic: true,
    rawFetchedAt: now,
  };
}
