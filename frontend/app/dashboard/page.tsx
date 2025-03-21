'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { getEvents, getLikedEvents } from '@/app/lib/api/event';
import {
  getMyConnections,
  getRecommendedMentors,
} from '@/app/lib/api/mentorship';
import { getNotifications } from '@/app/lib/api/notification';
import { getChatRooms } from '@/app/lib/api/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/ui/Card';
import Button from '@/app/ui/Button';
import { formatDate, truncate } from '@/app/lib/utils';
import {
  Calendar,
  Users,
  MessageSquare,
  Bell,
  Heart,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [likedEvents, setLikedEvents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mentorshipConnections, setMentorshipConnections] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recommendedMentors, setRecommendedMentors] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 이벤트 데이터 가져오기
        const eventsResponse = await getEvents({ limit: 3 });
        setUpcomingEvents(eventsResponse.events);

        // 좋아요한 이벤트 가져오기
        const likedEventsResponse = await getLikedEvents({ limit: 3 });
        setLikedEvents(likedEventsResponse.events);

        // 멘토십 연결 가져오기
        const connectionsResponse = await getMyConnections({ limit: 3 });
        setMentorshipConnections(connectionsResponse.connections);

        // 멘티인 경우 추천 멘토 가져오기
        if (user?.role === 'mentee') {
          try {
            const mentorsResponse = await getRecommendedMentors();
            setRecommendedMentors(
              mentorsResponse.recommended_mentors.slice(0, 3)
            );
          } catch (error) {
            console.error('추천 멘토 가져오기 오류:', error);
          }
        }

        // 읽지 않은 메시지 수 가져오기
        const chatRoomsResponse = await getChatRooms();
        const totalUnread = chatRoomsResponse.chat_rooms.reduce(
          (sum, room) => sum + room.unread_count,
          0
        );
        setUnreadMessages(totalUnread);

        // 읽지 않은 알림 수 가져오기
        const notificationsResponse = await getNotifications();
        setUnreadNotifications(notificationsResponse.unread_count);
      } catch (error) {
        console.error('대시보드 데이터 가져오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">대시보드</h1>
      <p className="text-gray-500 mb-8">안녕하세요, {user?.name}님!</p>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Calendar className="text-blue-600 mr-2" size={24} />
              <h3 className="text-lg font-medium">이벤트</h3>
            </div>
            <p className="text-3xl font-bold mb-2">{upcomingEvents.length}</p>
            <p className="text-gray-500 text-sm mb-4">다가오는 이벤트</p>
            <div className="mt-auto">
              <Link href="/events">
                <Button variant="outline" fullWidth>
                  이벤트 보기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Users className="text-green-600 mr-2" size={24} />
              <h3 className="text-lg font-medium">멘토십</h3>
            </div>
            <p className="text-3xl font-bold mb-2">
              {mentorshipConnections.length}
            </p>
            <p className="text-gray-500 text-sm mb-4">활성 연결</p>
            <div className="mt-auto">
              <Link href="/mentorship">
                <Button variant="outline" fullWidth>
                  {user?.role === 'mentor' ? '멘티 찾기' : '멘토 찾기'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <MessageSquare className="text-purple-600 mr-2" size={24} />
              <h3 className="text-lg font-medium">메시지</h3>
            </div>
            <p className="text-3xl font-bold mb-2">{unreadMessages}</p>
            <p className="text-gray-500 text-sm mb-4">읽지 않은 메시지</p>
            <div className="mt-auto">
              <Link href="/chat">
                <Button variant="outline" fullWidth>
                  채팅 보기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Bell className="text-orange-600 mr-2" size={24} />
              <h3 className="text-lg font-medium">알림</h3>
            </div>
            <p className="text-3xl font-bold mb-2">{unreadNotifications}</p>
            <p className="text-gray-500 text-sm mb-4">읽지 않은 알림</p>
            <div className="mt-auto">
              <Link href="/notifications">
                <Button variant="outline" fullWidth>
                  알림 보기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 다가오는 이벤트 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>다가오는 이벤트</span>
              <Link href="/events">
                <ChevronRight className="text-gray-500" size={20} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 py-2">다가오는 이벤트가 없습니다.</p>
            ) : (
              <div className="divide-y">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="py-3">
                    <p className="font-medium mb-1">{event.title}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Calendar size={14} className="mr-1" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {truncate(event.description, 100)}
                    </p>
                    <div className="mt-2">
                      <Link href={`/events/${event.id}`}>
                        <span className="text-blue-600 hover:underline text-sm">
                          자세히 보기
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 좋아요한 이벤트 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>좋아요한 이벤트</span>
              <Link href="/events/liked">
                <ChevronRight className="text-gray-500" size={20} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {likedEvents.length === 0 ? (
              <p className="text-gray-500 py-2">좋아요한 이벤트가 없습니다.</p>
            ) : (
              <div className="divide-y">
                {likedEvents.map((event) => (
                  <div key={event.id} className="py-3">
                    <div className="flex items-start">
                      <Heart
                        className="flex-shrink-0 text-red-500 mt-1 mr-2"
                        size={16}
                        fill="currentColor"
                      />
                      <div>
                        <p className="font-medium mb-1">{event.title}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={14} className="mr-1" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Link href={`/events/${event.id}`}>
                        <span className="text-blue-600 hover:underline text-sm">
                          자세히 보기
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 멘토십 연결 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>멘토십 연결</span>
              <Link href="/mentorship/connections">
                <ChevronRight className="text-gray-500" size={20} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mentorshipConnections.length === 0 ? (
              <p className="text-gray-500 py-2">
                활성화된 멘토십 연결이 없습니다.
              </p>
            ) : (
              <div className="divide-y">
                {mentorshipConnections.map((connection) => {
                  const isUserMentor = user?.id === connection.mentor.id;
                  const otherPerson = isUserMentor
                    ? connection.mentee
                    : connection.mentor;

                  return (
                    <div key={connection.id} className="py-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium mb-1">
                            {isUserMentor ? '멘티' : '멘토'}: {otherPerson.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {otherPerson.expertise}
                          </p>
                        </div>

                        {connection.chat_room_id && (
                          <Link href={`/chat/${connection.chat_room_id}`}>
                            <Button variant="outline" size="sm">
                              <MessageSquare size={14} className="mr-1" />
                              채팅
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 추천 멘토 (멘티인 경우만) */}
        {user?.role === 'mentee' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>추천 멘토</span>
                <Link href="/mentorship">
                  <ChevronRight className="text-gray-500" size={20} />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendedMentors.length === 0 ? (
                <p className="text-gray-500 py-2">추천 멘토가 없습니다.</p>
              ) : (
                <div className="divide-y">
                  {recommendedMentors.map((mentor) => (
                    <div key={mentor.id} className="py-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mr-3">
                            {mentor.profile_image_url ? (
                              <Image
                                unoptimized
                                width={40}
                                height={40}
                                src={mentor.profile_image_url}
                                alt={mentor.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-blue-600 font-medium">
                                {mentor.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium mb-1">{mentor.name}</p>
                            <p className="text-sm text-gray-500">
                              {mentor.expertise}
                            </p>
                          </div>
                        </div>

                        <Link href={`/mentorship/users/${mentor.id}`}>
                          <Button variant="outline" size="sm">
                            프로필
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
