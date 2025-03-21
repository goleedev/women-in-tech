'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Event } from '@/app/lib/api/types';
import { likeEvent, unlikeEvent } from '@/app/lib/api/event';
import { Calendar, MapPin, Heart, Users } from 'lucide-react';
import { formatDate, truncate } from '@/app/lib/utils';

interface EventCardProps {
  event: Event;
  onLikeToggle?: (eventId: number, newStatus: boolean) => void;
}

export default function EventCard({ event, onLikeToggle }: EventCardProps) {
  // 초기 상태를 event.is_liked로 설정하여 이미 좋아요한 이벤트의 경우 하트가 채워지도록 함
  const [isLiked, setIsLiked] = useState(event.is_liked || false);
  const [likeInProgress, setLikeInProgress] = useState(false);

  // 추가: 이벤트 props가 변경될 때 isLiked 상태 업데이트
  useEffect(() => {
    setIsLiked(event.is_liked || false);
  }, [event.is_liked]);

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (likeInProgress) return;

    setLikeInProgress(true);
    try {
      if (isLiked) {
        await unlikeEvent(event.id);
      } else {
        await likeEvent(event.id);
      }

      const newStatus = !isLiked;
      setIsLiked(newStatus);

      // 부모 컴포넌트에 변경 알림
      if (onLikeToggle) {
        onLikeToggle(event.id, newStatus);
      }
    } catch (err) {
      console.error('좋아요 처리 오류:', err);
    } finally {
      setLikeInProgress(false);
    }
  };

  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">
              {event.topic}
            </span>
            <button
              onClick={handleLikeToggle}
              disabled={likeInProgress}
              className={`text-gray-400 hover:text-red-500 focus:outline-none transition-colors duration-200 ${
                isLiked ? 'text-red-500' : ''
              }`}
              aria-label={isLiked ? '좋아요 취소' : '좋아요'}
            >
              <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
          </div>

          <h3 className="text-lg font-semibold mb-2">{event.title}</h3>

          <div className="space-y-2 text-sm text-gray-500 mb-3">
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              <span>{formatDate(event.date)}</span>
            </div>

            <div className="flex items-center">
              <MapPin size={16} className="mr-2" />
              <span>{event.location}</span>
            </div>

            <div className="flex items-center">
              <Users size={16} className="mr-2" />
              <span>
                {event.current_attendees}/{event.max_attendees || '∞'}
              </span>
            </div>
          </div>

          <p className="text-gray-600 mb-4 flex-grow">
            {truncate(event.description, 120)}
          </p>

          <div className="mt-auto flex justify-end">
            <span className="text-blue-600 inline-flex items-center text-sm">
              자세히 보기
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
