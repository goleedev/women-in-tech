'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Bell, Menu, X } from 'lucide-react';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 알림 수 가져오기
  useEffect(() => {
    if (isAuthenticated) {
      // API를 통해 읽지 않은 알림 수 가져오기 (나중에 구현)
      // 지금은 임시로 0으로 설정
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  return (
    <header className="bg-blue-600 text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="font-bold text-xl">
            WiT Network
          </Link>

          {/* 데스크톱 메뉴 */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/events" className="hover:text-blue-200">
              이벤트
            </Link>
            <Link href="/mentorship" className="hover:text-blue-200">
              멘토십
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/chat" className="hover:text-blue-200">
                  채팅
                </Link>
                <Link
                  href="/notifications"
                  className="hover:text-blue-200 relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </nav>

          {/* 사용자 메뉴 */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="hover:text-blue-200">
                  {user?.name || '프로필'}
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="hover:text-blue-200">
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3">
            <Link
              href="/events"
              className="block py-2 hover:text-blue-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              이벤트
            </Link>
            <Link
              href="/mentorship"
              className="block py-2 hover:text-blue-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              멘토십
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/chat"
                  className="block py-2 hover:text-blue-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  채팅
                </Link>
                <Link
                  href="/notifications"
                  className="block py-2 hover:text-blue-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  알림 {unreadCount > 0 && `(${unreadCount})`}
                </Link>
                <Link
                  href="/profile"
                  className="block py-2 hover:text-blue-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  프로필
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 hover:text-blue-200"
                >
                  로그아웃
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link
                  href="/login"
                  className="block py-2 hover:text-blue-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="block py-2 hover:text-blue-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
