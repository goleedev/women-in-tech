'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { getUserProfile } from '@/app/lib/api/user';
import { connectRequest } from '@/app/lib/api/mentorship';
import { Card, CardContent } from '@/app/ui/Card';
import Button from '@/app/ui/Button';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import Image from 'next/image';

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectInProgress, setConnectInProgress] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const userData = await getUserProfile(id as string);
        setUser(userData);
        setError(null);
      } catch (err) {
        console.error('사용자 프로필 조회 오류:', err);
        setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  const handleConnect = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/mentorship/users/${id}`);
      return;
    }

    setConnectMessage('');
    setShowConnectModal(true);
  };

  const handleSubmitConnect = async () => {
    setConnectInProgress(true);
    try {
      await connectRequest(id as string, connectMessage);
      setShowConnectModal(false);
      // 연결 상태 업데이트
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUser((prev: any) => ({
        ...prev,
        is_connected: true,
      }));
    } catch (err) {
      console.error('멘토십 연결 요청 오류:', err);
    } finally {
      setConnectInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          {error || '사용자를 찾을 수 없습니다.'}
        </div>
        <div className="text-center mt-4">
          <Link href="/mentorship">
            <Button variant="outline">멘토십 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 현재 사용자가 프로필 주인과 같은지 확인
  const isSelf = currentUser?.id === parseInt(id as string);
  // 현재 사용자와 프로필 사용자의 역할이 다른지 확인 (멘토-멘티 관계 가능)
  const canConnect =
    !isSelf && currentUser?.role !== user.role && !user.is_connected;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/mentorship"
        className="flex items-center text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft size={16} className="mr-1" />
        멘토십 목록으로 돌아가기
      </Link>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="h-48 bg-blue-600 relative"></div>

        <div className="relative px-6 sm:px-12 pb-12">
          <div className="flex flex-col sm:flex-row -mt-16 sm:-mt-24">
            <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-white p-1">
              <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {user.profile_image_url ? (
                  <Image
                    unoptimized
                    width={192}
                    height={192}
                    src={user.profile_image_url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-blue-600">
                    {user.name.charAt(0)}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 sm:mt-8 sm:ml-8 flex-grow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <p className="text-lg text-gray-600">
                    {user.role === 'mentor' ? '멘토' : '멘티'}
                  </p>
                </div>

                {canConnect && (
                  <div className="mt-4 sm:mt-0">
                    <Button onClick={handleConnect}>연결 요청</Button>
                  </div>
                )}

                {user.is_connected && user.chat_room_id && (
                  <div className="mt-4 sm:mt-0">
                    <Link href={`/chat/${user.chat_room_id}`}>
                      <Button>
                        <MessageSquare size={16} className="mr-1" />
                        채팅하기
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="md:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">소개</h2>
                  <div className="prose max-w-none">
                    {user.bio ? (
                      <p>{user.bio}</p>
                    ) : (
                      <p className="text-gray-500">소개 정보가 없습니다.</p>
                    )}
                  </div>

                  {user.tags && user.tags.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">태그</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">정보</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm text-gray-500">전문 분야</h3>
                      <p>{user.expertise || '-'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm text-gray-500">직업</h3>
                      <p>{user.profession || '-'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm text-gray-500">경력 수준</h3>
                      <p>{user.seniority_level || '-'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm text-gray-500">국가</h3>
                      <p>{user.country || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* 연결 요청 모달 */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">
              {user.name}님에게 멘토십 요청
            </h3>

            <div className="mb-4">
              <label
                htmlFor="connectMessage"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                요청 메시지
              </label>
              <textarea
                id="connectMessage"
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="멘토십 요청에 대한 간단한 메시지를 작성해주세요."
                value={connectMessage}
                onChange={(e) => setConnectMessage(e.target.value)}
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConnectModal(false)}
                disabled={connectInProgress}
              >
                취소
              </Button>
              <Button
                onClick={handleSubmitConnect}
                isLoading={connectInProgress}
              >
                요청 보내기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
