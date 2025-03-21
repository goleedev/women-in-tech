'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLikedEvents } from '@/app/lib/api/event';
import { Event } from '@/app/lib/api/types';
import EventCard from '@/app/components/events/EventCard';
import Button from '@/app/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function LikedEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLikedEvents = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getLikedEvents({ page, limit: 12 });

      // 좋아요 페이지의 모든 이벤트에 is_liked: true 속성 추가
      const eventsWithLikedStatus = response.events.map((event) => ({
        ...event,
        is_liked: true, // 명시적으로 좋아요 상태를 true로 설정
      }));

      setEvents(eventsWithLikedStatus);
      setTotalPages(response.pagination.total_pages);
      setError(null);
    } catch (err) {
      console.error('좋아요한 이벤트 목록 조회 오류:', err);
      setError('이벤트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedEvents(page);
  }, [page]);

  const handleLikeToggle = (eventId: number, newStatus: boolean) => {
    if (!newStatus) {
      // 좋아요 취소 시 목록에서 제거
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/events"
        className="flex items-center text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft size={16} className="mr-1" />
        이벤트 목록으로 돌아가기
      </Link>

      <h1 className="text-3xl font-bold mb-6">좋아요한 이벤트</h1>

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
          <p className="text-gray-500 mb-4">좋아요한 이벤트가 없습니다.</p>
          <Link href="/events">
            <Button>이벤트 탐색하기</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onLikeToggle={handleLikeToggle}
            />
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
