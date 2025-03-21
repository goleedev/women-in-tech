'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import { getEvents } from './lib/api/event';
import { getRecommendedMentors } from './lib/api/mentorship';
import { Event, User } from './lib/api/types';
import { formatDate, truncate } from './lib/utils';
import Button from './ui/Button';
import { Card, CardContent } from './ui/Card';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recommendedMentors, setRecommendedMentors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 최신 이벤트 가져오기
        const eventsResponse = await getEvents({ limit: 3 });
        setUpcomingEvents(eventsResponse.events);

        // 인증된 경우 추천 멘토 가져오기
        if (isAuthenticated && user?.role === 'mentee') {
          try {
            const mentorsResponse = await getRecommendedMentors();
            setRecommendedMentors(mentorsResponse.recommended_mentors);
          } catch (error) {
            console.error('추천 멘토 가져오기 오류:', error);
          }
        }
      } catch (error) {
        console.error('데이터 가져오기 오류:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isAuthenticated, user]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* 히어로 섹션 */}
      <section className="py-12 md:py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          여성 기술인을 위한 네트워킹 플랫폼
        </h1>
        <p className="text-xl mb-8 max-w-3xl mx-auto text-gray-600">
          다른 여성 기술인들과 연결하고, 멘토를 찾고, 경력 성장을 도울 수 있는
          이벤트에 참여하세요.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/events">
            <Button size="lg">이벤트 탐색</Button>
          </Link>
          <Link href={isAuthenticated ? '/mentorship' : '/register'}>
            <Button variant="outline" size="lg">
              {isAuthenticated ? '멘토십 찾기' : '가입하기'}
            </Button>
          </Link>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">플랫폼 특징</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">이벤트</h3>
              <p className="text-gray-600">
                기술 분야의 여성들을 위한 다양한 네트워킹 이벤트를 찾고
                참여하세요.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">멘토십</h3>
              <p className="text-gray-600">
                경력 성장을 도울 수 있는 멘토를 찾거나 멘토가 되어 경험을
                공유하세요.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">채팅</h3>
              <p className="text-gray-600">
                이벤트 참가자들과 연결하고 멘토와 실시간으로 소통하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 최근 이벤트 섹션 */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">최근 이벤트</h2>
            <Link href="/events">
              <span className="text-blue-600 hover:underline">
                모든 이벤트 보기
              </span>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              예정된 이벤트가 없습니다.
            </p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="h-full flex flex-col">
                  <CardContent className="flex-grow">
                    <div className="mb-4">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {event.topic}
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        {formatDate(event.date)}
                      </p>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {truncate(event.description, 100)}
                    </p>
                    <div className="mt-auto">
                      <p className="text-sm text-gray-500 mb-2">
                        <span className="font-medium">장소:</span>{' '}
                        {event.location}
                      </p>
                      <Link href={`/events/${event.id}`}>
                        <Button variant="outline" fullWidth>
                          자세히 보기
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 추천 멘토 섹션 (인증된 멘티에게만 표시) */}
      {isAuthenticated && user?.role === 'mentee' && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">추천 멘토</h2>
              <Link href="/mentorship">
                <span className="text-blue-600 hover:underline">
                  모든 멘토 보기
                </span>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : recommendedMentors.length === 0 ? (
              <p className="text-center py-8 text-gray-500">
                추천 멘토가 없습니다.
              </p>
            ) : (
              <div className="grid md:grid-cols-4 gap-6">
                {recommendedMentors.map((mentor) => (
                  <Card key={mentor.id} className="h-full flex flex-col">
                    <CardContent>
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden mb-4">
                          {mentor.profile_image_url ? (
                            <img
                              src={mentor.profile_image_url}
                              alt={mentor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl font-bold text-blue-600">
                              {mentor.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold">{mentor.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {mentor.expertise}
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                          {mentor.seniority_level}
                        </p>
                        <Link href={`/mentorship/users/${mentor.id}`}>
                          <Button variant="outline" size="sm">
                            프로필 보기
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA 섹션 */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            함께 성장하는 커뮤니티에 참여하세요
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            네트워킹, 멘토십, 그리고 서로를 지원하는 커뮤니티를 통해 기술 분야의
            여성으로서 경력을 발전시켜 보세요.
          </p>
          <Link href={isAuthenticated ? '/events' : '/register'}>
            <Button
              className="bg-white text-blue-600 hover:bg-blue-50"
              size="lg"
            >
              {isAuthenticated ? '이벤트 참여하기' : '지금 가입하기'}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
