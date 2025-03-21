'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { getUsers, connectRequest } from '@/app/lib/api/mentorship';
import { User } from '@/app/lib/api/types';
import { Card, CardContent } from '@/app/ui/Card';
import Button from '@/app/ui/Button';
import Image from 'next/image';

interface MentorshipUser extends User {
  tags: string[];
  similarity_score?: number;
  is_connected?: boolean;
}

export default function MentorshipPage() {
  const { isAuthenticated, user } = useAuth();
  const [users, setUsers] = useState<MentorshipUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    role: '',
    expertise: '',
    seniority_level: '',
    country: '',
    search: '',
  });
  const [connectInProgress, setConnectInProgress] = useState<number | null>(
    null
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [connectMessage, setConnectMessage] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MentorshipUser | null>(null);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      // 현재 사용자가 멘토면 멘티만, 멘티면 멘토만 보여주기
      const defaultRole = user?.role === 'mentor' ? 'mentee' : 'mentor';

      const response = await getUsers({
        ...filters,
        role: (filters.role as 'mentee' | 'mentor') || defaultRole,
        page,
        limit: 9,
      });

      setUsers(response.users);
      setTotalPages(response.pagination.total_pages);
      setError(null);
    } catch (err) {
      console.error('멘토/멘티 목록 조회 오류:', err);
      setError('사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page, user?.role]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1);
  };

  const handleConnect = (selectedUser: MentorshipUser) => {
    setSelectedUser(selectedUser);
    setConnectMessage('');
    setShowConnectModal(true);
  };

  const handleSubmitConnect = async () => {
    if (!selectedUser) return;

    setConnectInProgress(selectedUser.id);
    try {
      await connectRequest(selectedUser.id, connectMessage);

      // 연결 상태 업데이트
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, is_connected: true } : u
        )
      );

      setShowConnectModal(false);
    } catch (err) {
      console.error('멘토십 연결 요청 오류:', err);
    } finally {
      setConnectInProgress(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">
          {user?.role === 'mentor' ? '멘티 찾기' : '멘토 찾기'}
        </h1>

        <Link href="/mentorship/connections">
          <Button variant="outline">내 멘토십 연결</Button>
        </Link>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              검색
            </label>
            <input
              id="search"
              name="search"
              type="text"
              placeholder="이름, 전문 분야 등 검색..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <label
              htmlFor="expertise"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              전문 분야
            </label>
            <input
              id="expertise"
              name="expertise"
              type="text"
              placeholder="전문 분야"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.expertise}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <label
              htmlFor="seniority_level"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              경력 수준
            </label>
            <select
              id="seniority_level"
              name="seniority_level"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.seniority_level}
              onChange={handleFilterChange}
            >
              <option value="">모든 경력 수준</option>
              <option value="Entry">신입 (0-2년)</option>
              <option value="Mid-level">중급 (3-5년)</option>
              <option value="Senior">시니어 (6년 이상)</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button type="submit" fullWidth>
              검색
            </Button>
          </div>
        </form>
      </div>

      {/* 사용자 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">조건에 맞는 사용자가 없습니다.</p>
          <Button
            onClick={() =>
              setFilters({
                role: '',
                expertise: '',
                seniority_level: '',
                country: '',
                search: '',
              })
            }
          >
            모든 사용자 보기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="h-20 bg-blue-600"></div>
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-white p-1 absolute -bottom-10">
                      <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                        {user.profile_image_url ? (
                          <Image
                            src={user.profile_image_url}
                            alt={user.name}
                            unoptimized
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-blue-600">
                            {user.name.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-12 p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    {user.similarity_score !== undefined &&
                      user.similarity_score > 0 && (
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {user.similarity_score >= 5
                            ? '높은 일치도'
                            : '일치도 있음'}
                        </span>
                      )}
                  </div>

                  <p className="text-gray-600 mb-4">{user.expertise}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start">
                      <span className="text-gray-500 w-24 text-sm">직업:</span>
                      <span>{user.profession || '-'}</span>
                    </div>

                    <div className="flex items-start">
                      <span className="text-gray-500 w-24 text-sm">
                        경력 수준:
                      </span>
                      <span>{user.seniority_level || '-'}</span>
                    </div>

                    <div className="flex items-start">
                      <span className="text-gray-500 w-24 text-sm">국가:</span>
                      <span>{user.country || '-'}</span>
                    </div>
                  </div>

                  {user.tags && user.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {user.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <Link href={`/mentorship/users/${user.id}`}>
                      <span className="text-blue-600 hover:underline text-sm">
                        프로필 보기
                      </span>
                    </Link>

                    {isAuthenticated && !user.is_connected && (
                      <Button
                        variant="outline"
                        onClick={() => handleConnect(user)}
                        disabled={connectInProgress === user.id}
                        isLoading={connectInProgress === user.id}
                      >
                        연결 요청
                      </Button>
                    )}

                    {user.is_connected && (
                      <span className="text-green-600 text-sm">연결됨</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              이전
            </Button>

            <div className="text-sm text-gray-500">
              {page} / {totalPages}
            </div>

            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* 연결 요청 모달 */}
      {showConnectModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">
              {selectedUser.name}님에게 멘토십 요청
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
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConnectModal(false)}
                disabled={connectInProgress === selectedUser.id}
              >
                취소
              </Button>
              <Button
                onClick={handleSubmitConnect}
                isLoading={connectInProgress === selectedUser.id}
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
