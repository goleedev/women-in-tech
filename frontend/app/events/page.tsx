'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { getEvents, likeEvent, unlikeEvent } from '@/app/lib/api/event';
import { Event } from '@/app/lib/api/types';
import { Card, CardContent } from '@/app/ui/Card';
import Button from '@/app/ui/Button';
import { formatDate, truncate } from '@/app/lib/utils';
import { Calendar, MapPin, Heart } from 'lucide-react';

export default function EventsPage() {
  const { isAuthenticated, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    location: '',
    topic: '',
    search: '',
  });
  const [likeInProgress, setLikeInProgress] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEvents = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getEvents({
        ...filters,
        page,
        limit: 9,
      });
      setEvents(response.events);
      setTotalPages(response.pagination.total_pages);
      setError(null);
    } catch (err) {
      console.error('이벤트 목록 조회 오류:', err);
      setError('이벤트를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(page);
  }, [page, filters]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // 검색 시 첫 페이지로 이동
    fetchEvents(1);
  };

  const handleLikeToggle = async (eventId: number, isLiked: boolean) => {
    if (!isAuthenticated) {
      // 로그인 페이지로 이동
      window.location.href = `/login?redirect=/events`;
      return;
    }

    setLikeInProgress(eventId);
    try {
      if (isLiked) {
        await unlikeEvent(eventId);
      } else {
        await likeEvent(eventId);
      }

      // 이벤트 목록에서 좋아요 상태 업데이트
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, is_liked: !isLiked } : event
        )
      );
    } catch (err) {
      console.error('좋아요 처리 오류:', err);
    } finally {
      setLikeInProgress(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">이벤트</h1>
        {isAuthenticated && user?.role === 'mentor' && (
          <Link href="/events/create">
            <Button>이벤트 생성</Button>
          </Link>
        )}
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
              placeholder="이벤트 검색..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              위치
            </label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="위치"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.location}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              주제
            </label>
            <input
              id="topic"
              name="topic"
              type="text"
              placeholder="주제"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.topic}
              onChange={handleFilterChange}
            />
          </div>

          <div className="flex items-end">
            <Button type="submit" fullWidth>
              검색
            </Button>
          </div>
        </form>
      </div>

      {/* 이벤트 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">조건에 맞는 이벤트가 없습니다.</p>
          <Button
            onClick={() => setFilters({ location: '', topic: '', search: '' })}
          >
            모든 이벤트 보기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="h-full flex flex-col overflow-hidden"
            >
              <CardContent className="p-0 flex-grow flex flex-col">
                <div className="p-4 flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {event.topic}
                    </span>
                    <button
                      onClick={() =>
                        handleLikeToggle(event.id, event.is_liked || false)
                      }
                      disabled={likeInProgress === event.id}
                      className="text-gray-400 hover:text-red-500 focus:outline-none disabled:opacity-50"
                      aria-label={event.is_liked ? '좋아요 취소' : '좋아요'}
                    >
                      <Heart
                        size={20}
                        fill={event.is_liked ? 'currentColor' : 'none'}
                        className={event.is_liked ? 'text-red-500' : ''}
                      />
                    </button>
                  </div>

                  <h3 className="text-xl font-semibold mb-2">{event.title}</h3>

                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar size={16} className="mr-1" />
                    <span>{formatDate(event.date)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <MapPin size={16} className="mr-1" />
                    <span>{event.location}</span>
                  </div>

                  <p className="text-gray-600 mb-4">
                    {truncate(event.description, 100)}
                  </p>

                  <div className="mt-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        참가자: {event.current_attendees}/{event.max_attendees}
                      </span>

                      <Link href={`/events/${event.id}`}>
                        <span className="text-blue-600 hover:underline text-sm">
                          자세히 보기
                        </span>
                      </Link>
                    </div>
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
    </div>
  );
}
