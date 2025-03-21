'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  login as apiLogin,
  logout as apiLogout,
  getMe,
  getCurrentUser,
  isAuthenticated as checkAuth,
} from '../lib/api/auth';
import { User } from '../lib/api/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 초기 인증 상태 확인
  useEffect(() => {
    const checkAuthentication = async () => {
      setIsLoading(true);
      try {
        if (checkAuth()) {
          // 로컬 스토리지에서 사용자 정보 가져오기
          const storedUser = getCurrentUser();

          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
          } else {
            // 토큰은 있지만 사용자 정보가 없는 경우 API로 가져오기
            const userData = await getMe();
            setUser(userData);
            setIsAuthenticated(true);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('인증 확인 오류:', err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  // 로그인 함수
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiLogin({ email, password });
      setUser(response.user);
      setIsAuthenticated(true);
      router.push('/');
    } catch (err) {
      console.error('로그인 오류:', err);
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    setIsLoading(true);

    try {
      await apiLogout();
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
    } catch (err) {
      console.error('로그아웃 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    if (!isAuthenticated) return;

    try {
      const userData = await getMe();
      setUser(userData);
    } catch (err) {
      console.error('사용자 정보 새로고침 오류:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
