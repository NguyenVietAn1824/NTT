import { NextResponse, type NextRequest } from 'next/server';

const LANGS = ['vi', 'en', 'ja'];

// Chọn ngôn ngữ theo cookie đã lưu, rồi theo Accept-Language của trình duyệt
function preferredLang(req: NextRequest): string {
  const saved = req.cookies.get('lang')?.value;
  if (saved && LANGS.includes(saved)) return saved;
  const accept = req.headers.get('accept-language') || '';
  for (const part of accept.split(',')) {
    const code = part.split(';')[0].trim().slice(0, 2).toLowerCase();
    if (LANGS.includes(code)) return code;
  }
  return 'vi';
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Khu vực quản trị: chưa có cookie phiên → về trang đăng nhập (backend vẫn xác thực từng request)
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();
    if (!req.cookies.get('ntt_token')) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const first = pathname.split('/')[1];
  if (LANGS.includes(first)) {
    const res = NextResponse.next();
    if (req.cookies.get('lang')?.value !== first) res.cookies.set('lang', first, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
    return res;
  }

  // Đường dẫn không có tiền tố ngôn ngữ → thêm vào
  const url = req.nextUrl.clone();
  url.pathname = `/${preferredLang(req)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|media|_next|img|favicon.ico|robots.txt|sitemap.xml).*)'],
};
