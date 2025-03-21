'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import {
  getEventById,
  cancelEventAttendance,
  likeEvent,
  unlikeEvent,
} from '@/app/lib/api/event';
import { Event } from '@/app/lib/api/types';
import { Card, CardContent } from '@/app/ui/Card';
import Button from '@/app/ui/Button';
import { formatDate } from '@/app/lib/utils';
import { Calendar, MapPin, Users, Heart, Globe, ArrowLeft } from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendActionInProgress, setAttendActionInProgress] = useState(false);
  const [likeActionInProgress, setLikeActionInProgress] = useState(false);
  const [isAttending, setIsAttending] = useState(false);

  useEffect(() => {
    const fetchEventDetail = async () => {
      setLoading(true);
      try {
        const eventData = await getEventById(id as string);
        console.log('이벤트 상세 데이터:', eventData); // 디버깅용 로그 추가

        // is_liked가 undefined인 경우 false로 기본값 설정
        if (eventData.is_liked === undefined) {
          eventData.is_liked = false;
        }

        setEvent(eventData);

        // 현재 사용자가 참석자 목록에 있는지 확인
        if (isAuthenticated && user && eventData.attendees) {
          setIsAttending(
            eventData.attendees.some((attendee) => attendee.id === user.id)
          );
        }

        setError(null);
      } catch (err) {
        console.error('이벤트 상세 조회 오류:', err);
        setError('이벤트 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEventDetail();
    }
  }, [id, isAuthenticated, user]);

  // 이벤트 참가 신청/취소
  const handleAttendance = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }

    setAttendActionInProgress(true); // 참가 버튼만 로딩 상태로 변경
    try {
      if (isAttending) {
        await cancelEventAttendance(id as string);
        setIsAttending(false);
        // 참가자 수 업데이트
        if (event) {
          setEvent({
            ...event,
            current_attendees: event.current_attendees - 1,
            attendees:
              event.attendees?.filter((attendee) => attendee.id !== user?.id) ||
              [],
          });
        }
      } else {
        setIsAttending(true);
        // 참가자 수 업데이트
        if (event && user) {
          setEvent({
            ...event,
            current_attendees: event.current_attendees + 1,
            attendees: [
              ...(event.attendees || []),
              { id: user.id, name: user.name },
            ],
          });
        }
      }
    } catch (err) {
      console.error('이벤트 참가 처리 오류:', err);
    } finally {
      setAttendActionInProgress(false); // 참가 버튼 로딩 상태 해제
    }
  };

  // 좋아요 토글
  const handleLikeToggle = async () => {
    if (!isAuthenticated || !event) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }

    setLikeActionInProgress(true); // 좋아요 버튼만 로딩 상태로 변경
    try {
      if (event.is_liked) {
        await unlikeEvent(id as string);
      } else {
        await likeEvent(id as string);
      }
      // 좋아요 상태 업데이트
      setEvent({
        ...event,
        is_liked: !event.is_liked,
      });
    } catch (err) {
      console.error('좋아요 처리 오류:', err);
    } finally {
      setLikeActionInProgress(false); // 좋아요 버튼 로딩 상태 해제
    }
  };

  // 이벤트 시작 전인지 확인
  const isEventUpcoming = () => {
    if (!event) return false;
    const eventDate = new Date(event.date);
    return eventDate > new Date();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          {error || '이벤트를 찾을 수 없습니다.'}
        </div>
        <div className="text-center mt-4">
          <Link href="/events">
            <Button variant="outline">이벤트 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/events"
        className="flex items-center text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft size={16} className="mr-1" />
        이벤트 목록으로 돌아가기
      </Link>

      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {event.topic}
                </span>

                {event.is_online && (
                  <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    <Globe size={12} className="mr-1" />
                    온라인
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>

              <p className="text-gray-500 mb-1">
                {event.organizer && `주최자: ${event.organizer.name}`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {isEventUpcoming() && (
                <Button
                  onClick={handleAttendance}
                  disabled={
                    attendActionInProgress || // 참가 버튼 로딩 상태 확인
                    (event.max_attendees > 0 &&
                      event.current_attendees >= event.max_attendees &&
                      !isAttending)
                  }
                  isLoading={attendActionInProgress} // 참가 버튼 로딩 상태 연결
                >
                  {isAttending ? '참가 취소' : '참가하기'}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleLikeToggle}
                disabled={likeActionInProgress}
                isLoading={likeActionInProgress}
                className={
                  event.is_liked
                    ? 'border-red-500 text-red-500 hover:bg-red-50'
                    : ''
                }
              >
                {/* 하트 아이콘 색상과 채우기를 더 명확하게 설정 */}
                <Heart
                  size={16}
                  className={`mr-1 ${event.is_liked ? 'text-red-500' : ''}`}
                  fill={event.is_liked ? 'currentColor' : 'none'}
                  stroke={event.is_liked ? 'currentColor' : 'currentColor'}
                />
                {event.is_liked ? '좋아요 취소' : '좋아요'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="prose max-w-none">
                <h2 className="text-xl font-semibold mb-3">이벤트 상세 정보</h2>
                <div className="whitespace-pre-line">{event.description}</div>
              </div>

              {event.is_online && event.online_link && isAttending && (
                <div className="mt-6 p-4 bg-blue-50 rounded-md">
                  <h3 className="font-semibold mb-2">
                    온라인 이벤트 참가 링크
                  </h3>
                  <a
                    href={event.online_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {event.online_link}
                  </a>
                </div>
              )}
            </div>

            <div>
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h3 className="font-semibold mb-3">이벤트 정보</h3>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <Calendar size={18} className="mt-1 mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium">날짜 및 시간</p>
                      <p className="text-gray-600">{formatDate(event.date)}</p>
                      {event.end_date && (
                        <p className="text-gray-600">
                          종료: {formatDate(event.end_date)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin size={18} className="mt-1 mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium">위치</p>
                      <p className="text-gray-600">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Users size={18} className="mt-1 mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium">참가자</p>
                      <p className="text-gray-600">
                        {event.current_attendees} /{' '}
                        {event.max_attendees > 0
                          ? event.max_attendees
                          : '제한 없음'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {event.tags && event.tags.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-3">태그</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {event.attendees && event.attendees.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3">
                참가자 ({event.attendees.length}명)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {event.attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center p-2 bg-gray-50 rounded-md"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <span className="font-medium text-blue-600">
                        {attendee.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm truncate">{attendee.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
