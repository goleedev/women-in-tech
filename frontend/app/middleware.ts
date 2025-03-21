// app/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증이 필요한
const protectedRoutes = ['/chat', '/profile', '/notifications'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 인증이 필요한 경로 체크
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // 멘토십 페이지에서 신규 연결 요청 등
  const isMentorshipAction = pathname.includes('/mentorship/connect');

  // 이벤트 참가, 좋아요 등 액션
  const isEventAction =
    pathname.includes('/events') &&
    (pathname.includes('/attend') || pathname.includes('/like'));

  // 인증이 필요한지 확인
  const needsAuth = isProtectedRoute || isMentorshipAction || isEventAction;

  if (!needsAuth) {
    return NextResponse.next();
  }

  // 쿠키에서 토큰 확인 (클라이언트 쿠키는 localStorage에서 읽을 수 없음)
  const authToken = request.cookies.get('token')?.value;

  if (!authToken) {
    // 로그인 페이지로 리디렉션, 로그인 후 원래 페이지로 돌아올 수 있도록 redirect 파라미터 추가
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 인증이 필요한 페이지
    '/chat/:path*',
    '/profile/:path*',
    '/notifications/:path*',
    // 특정 액션에 대한 API 경로
    '/mentorship/connect/:path*',
    '/events/:id/attend',
    '/events/:id/like',
  ],
};
