'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Bell, Menu, X } from 'lucide-react';

import { useAuth } from '@/app/context/AuthContext';

import RoleSwitcher from '../mentorship/RuleSwitcher';

export default function Header() {
  // Define state variables for mobile menu and unread notifications
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Get user authentication status and logout function from AuthContext
  const { user, isAuthenticated, logout } = useAuth();

  // Effect to fetch unread notifications count when user is authenticated
  useEffect(() => {
    if (isAuthenticated) setUnreadCount(0);
  }, [isAuthenticated]);

  return (
    <header className="bg-black text-white fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="font-bold text-xl">
            💻 Women in Tech
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/events" className="hover:text-blue-200">
              Events
            </Link>
            <Link href="/mentorship" className="hover:text-blue-200">
              Mentorship
            </Link>

            {/* Show Chat Menu when user is authenticated */}
            {isAuthenticated && (
              <>
                <Link href="/chat" className="hover:text-blue-200">
                  Chat
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

                {/* Show Role Switcher */}
                {user && (user.secondary_role || user.role) && <RoleSwitcher />}
              </>
            )}
          </nav>

          {/* Desktop Profile and Logout */}
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
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="hover:text-blue-200">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-700 rounded"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <button
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 h-[100vh]">
            <Link
              href="/events"
              className="block py-2 hover:text-blue-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/mentorship"
              className="block py-2 hover:text-blue-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Mentorship
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/chat"
                  className="block py-2 hover:text-blue-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Chat
                </Link>
                <Link
                  href="/notifications"
                  className="block py-2 hover:text-blue-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Notification {unreadCount > 0 && `(${unreadCount})`}
                </Link>

                <Link
                  href="/profile"
                  className="block py-2 hover:text-blue-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>

                {user && (user.secondary_role || user.role) && <RoleSwitcher />}

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 hover:text-blue-200"
                >
                  Logout
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
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block py-2 hover:text-blue-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
