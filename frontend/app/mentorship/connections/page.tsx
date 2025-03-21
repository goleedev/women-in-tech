'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import {
  getMyConnections,
  getConnectionRequests,
  updateConnectionStatus,
} from '@/app/lib/api/mentorship';
import { MentorshipConnection } from '@/app/lib/api/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/ui/Card';
import Button from '@/app/ui/Button';
import { formatDate } from '@/app/lib/utils';
import { ArrowLeft, Check, X, MessageSquare } from 'lucide-react';

export default function MentorshipConnectionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const [connections, setConnections] = useState<MentorshipConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<
    MentorshipConnection[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 활성화된 연결 가져오기
        const activeResponse = await getMyConnections();
        setConnections(activeResponse.connections);

        // 멘토인 경우에만 대기 중인 요청 가져오기
        if (user?.role === 'mentor') {
          const pendingResponse = await getConnectionRequests({
            status: 'pending',
          });
          setPendingRequests(pendingResponse.connections);
        }

        setError(null);
      } catch (err) {
        console.error('멘토십 연결 목록 조회 오류:', err);
        setError('멘토십 연결 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleAccept = async (connectionId: number) => {
    setActionInProgress(connectionId);
    try {
      await updateConnectionStatus(connectionId, 'accepted');

      // 현재 요청에서 제거하고 활성 연결에 추가
      const acceptedRequest = pendingRequests.find(
        (req) => req.id === connectionId
      );
      if (acceptedRequest) {
        setPendingRequests((prev) =>
          prev.filter((req) => req.id !== connectionId)
        );
        setConnections((prev) => [
          ...prev,
          { ...acceptedRequest, status: 'accepted' },
        ]);
      }

      // 활성 탭으로 전환
      setActiveTab('active');
    } catch (err) {
      console.error('멘토십 요청 수락 오류:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (connectionId: number) => {
    setActionInProgress(connectionId);
    try {
      await updateConnectionStatus(connectionId, 'rejected');

      // 현재 요청에서 제거
      setPendingRequests((prev) =>
        prev.filter((req) => req.id !== connectionId)
      );
    } catch (err) {
      console.error('멘토십 요청 거절 오류:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/mentorship"
        className="flex items-center text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft size={16} className="mr-1" />
        멘토십 목록으로 돌아가기
      </Link>

      <h1 className="text-3xl font-bold mb-6">내 멘토십 연결</h1>

      {/* 탭 */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            className={`py-2 px-1 -mb-px ${
              activeTab === 'active'
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('active')}
          >
            활성 연결
          </button>
          {user?.role === 'mentor' && (
            <button
              className={`py-2 px-1 -mb-px ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              대기 중인 요청
              {pendingRequests.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          {error}
        </div>
      ) : activeTab === 'active' ? (
        connections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              활성화된 멘토십 연결이 없습니다.
            </p>
            <Link href="/mentorship">
              <Button>
                {user?.role === 'mentor' ? '멘티 찾기' : '멘토 찾기'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connections.map((connection) => {
              const isUserMentor = user?.id === connection.mentor.id;
              const otherPerson = isUserMentor
                ? connection.mentee
                : connection.mentor;

              return (
                <Card key={connection.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {isUserMentor ? '멘티' : '멘토'}: {otherPerson.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-500">전문 분야:</span>{' '}
                        <span>{otherPerson.expertise}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">직업:</span>{' '}
                        <span>{otherPerson.profession}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">연결 날짜:</span>{' '}
                        <span>{formatDate(connection.created_at)}</span>
                      </div>

                      <div className="pt-4 flex justify-between">
                        <Link href={`/mentorship/users/${otherPerson.id}`}>
                          <Button variant="outline">프로필 보기</Button>
                        </Link>

                        {connection.chat_room_id && (
                          <Link href={`/chat/${connection.chat_room_id}`}>
                            <Button>
                              <MessageSquare size={16} className="mr-1" />
                              채팅하기
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : // 대기 중인 요청 탭
      pendingRequests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">대기 중인 멘토십 요청이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {request.mentee.name}
                    </h3>
                    <p className="text-gray-500">
                      {request.mentee.expertise} • {request.mentee.profession}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      요청일: {formatDate(request.created_at)}
                    </p>

                    {request.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">
                          {request.message}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start space-x-2">
                    <Button
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleAccept(request.id)}
                      disabled={actionInProgress === request.id}
                      isLoading={actionInProgress === request.id}
                    >
                      <Check size={16} className="mr-1" />
                      수락
                    </Button>

                    <Button
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleReject(request.id)}
                      disabled={actionInProgress === request.id}
                    >
                      <X size={16} className="mr-1" />
                      거절
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
