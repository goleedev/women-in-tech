'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import Button from './ui/Button';

export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // 리디렉션 중
  }

  // 비인증 사용자를 위한 인트로 섹션
  return (
    <div className="max-w-7xl mx-auto">
      {/* 히어로 섹션 */}
      <section className="py-16 md:py-24 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          여성 기술인을 위한 네트워킹 플랫폼
        </h1>
        <p className="text-xl mb-10 max-w-3xl mx-auto text-gray-600">
          다른 여성 기술인들과 연결하고, 멘토를 찾고, 경력 성장을 도울 수 있는
          이벤트에 참여하세요.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/register">
            <Button size="lg">시작하기</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              로그인
            </Button>
          </Link>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">주요 특징</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-white rounded-xl shadow-lg p-8 transform transition-transform hover:scale-105">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">이벤트</h3>
              <p className="text-gray-600 text-center">
                기술 분야의 여성들을 위한 다양한 네트워킹 이벤트를 찾고
                참여하세요.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 transform transition-transform hover:scale-105">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">멘토십</h3>
              <p className="text-gray-600 text-center">
                경력 성장을 도울 수 있는 멘토를 찾거나 멘토가 되어 경험을
                공유하세요.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 transform transition-transform hover:scale-105">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">채팅</h3>
              <p className="text-gray-600 text-center">
                이벤트 참가자들과 연결하고 멘토와 실시간으로 소통하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">11,000+</div>
              <div className="text-blue-100">활성 사용자</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">월별 이벤트</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2,500+</div>
              <div className="text-blue-100">멘토십 연결</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">15+</div>
              <div className="text-blue-100">기술 분야</div>
            </div>
          </div>
        </div>
      </section>

      {/* 커뮤니티 섹션 */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">함께 성장하는 커뮤니티</h2>
          <p className="text-xl max-w-3xl mx-auto text-gray-600 mb-10">
            네트워킹, 멘토십, 그리고 서로를 지원하는 커뮤니티를 통해 기술 분야의
            여성으로서 경력을 발전시켜 보세요.
          </p>
          <Link href="/register">
            <Button size="lg" className="px-8">
              지금 가입하기
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
