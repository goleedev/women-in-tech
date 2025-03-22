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
  activeRole: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: string) => void;
  refreshUser: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<string>('');
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

            // 활성 역할 설정
            const savedRole =
              localStorage.getItem('activeRole') || storedUser.role;
            // 저장된 역할이 사용자의 주 역할이나 보조 역할인지 확인
            const validRole =
              savedRole === storedUser.role ||
              savedRole === storedUser.secondary_role;
            setActiveRole(validRole ? savedRole : storedUser.role);

            setIsAuthenticated(true);
          } else {
            // 토큰은 있지만 사용자 정보가 없는 경우 API로 가져오기
            const userData = await getMe();
            setUser(userData);

            // 활성 역할 설정
            const savedRole =
              localStorage.getItem('activeRole') || userData.role;
            const validRole =
              savedRole === userData.role ||
              savedRole === userData.secondary_role;
            setActiveRole(validRole ? savedRole : userData.role);

            setIsAuthenticated(true);
          }
        } else {
          setUser(null);
          setActiveRole('');
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('인증 확인 오류:', err);
        setUser(null);
        setActiveRole('');
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

      // 활성 역할 설정 (기본적으로 주 역할)
      setActiveRole(response.user.role);
      localStorage.setItem('activeRole', response.user.role);

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
      setActiveRole('');
      setIsAuthenticated(false);
      localStorage.removeItem('activeRole');
      router.push('/');
    } catch (err) {
      console.error('로그아웃 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 역할 전환 함수
  const switchRole = (role: string) => {
    if (!user) return;

    // 사용자가 해당 역할을 가지고 있는지 확인
    if (role === user.role || role === user.secondary_role) {
      setActiveRole(role);
      localStorage.setItem('activeRole', role);
    }
  };

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    if (!isAuthenticated) return;

    try {
      const userData = await getMe();
      setUser(userData);

      // 활성 역할이 여전히 유효한지 확인
      const currentRole = activeRole || userData.role;
      const validRole =
        currentRole === userData.role ||
        currentRole === userData.secondary_role;

      if (!validRole) {
        // 활성 역할이 더 이상 유효하지 않으면 기본 역할로 재설정
        setActiveRole(userData.role);
        localStorage.setItem('activeRole', userData.role);
      }
    } catch (err) {
      console.error('사용자 정보 새로고침 오류:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole,
        isAuthenticated,
        isLoading,
        login,
        logout,
        switchRole,
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
