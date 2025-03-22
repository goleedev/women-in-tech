'use client';

import { useAuth } from '@/app/context/AuthContext';
import Button from '@/app/ui/Button';
import { RefreshCw } from 'lucide-react';

export default function RoleSwitcher() {
  const { user, activeRole, switchRole } = useAuth();

  // 역할 전환 함수
  const handleSwitchRole = () => {
    if (!user) return;

    // 현재 활성 역할이 주 역할이면 보조 역할로, 아니면 주 역할로 전환
    const newRole = activeRole === user.role ? user.secondary_role : user.role;

    if (newRole) {
      switchRole(newRole);
      console.log('역할 전환:', newRole); // 디버깅용 로그
    }
  };

  // 보조 역할이 없고, 활성 역할이 주 역할인 경우 전환 버튼 표시하지 않음
  if (!user?.secondary_role && activeRole === user?.role) {
    console.log('역할 전환 버튼 숨김: 보조 역할 없음');
    return null;
  }

  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSwitchRole}
        className="flex items-center bg-blue-50 border-blue-200"
      >
        <span className="mr-1">
          {activeRole === 'mentor' ? '멘토' : '멘티'} 모드
        </span>
        <RefreshCw size={14} />
      </Button>
    </div>
  );
}
