'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Users,
  MessageSquare,
  Bell,
  Heart,
  ChevronRight,
} from 'lucide-react';

import { getEvents, getLikedEvents } from '@/app/lib/api/event';
import {
  getMyConnections,
  getRecommendedMentors,
} from '@/app/lib/api/mentorship';
import { getNotifications } from '@/app/lib/api/notification';
import { getChatRooms } from '@/app/lib/api/chat';

import { useAuth } from '@/app/context/AuthContext';

import { formatDate, truncate } from '@/app/lib/utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';

export default function DashboardPage() {
  // Context for authentication
  const { user } = useAuth();
  // State variables for dashboard data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [likedEvents, setLikedEvents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mentorshipConnections, setMentorshipConnections] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recommendedMentors, setRecommendedMentors] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get events limit by 3
        const eventsResponse = await getEvents({ limit: 3 });
        // Set upcoming events
        setUpcomingEvents(eventsResponse.events);

        // Get liked events limit by 3
        const likedEventsResponse = await getLikedEvents({ limit: 3 });
        // Set liked events
        setLikedEvents(likedEventsResponse.events);

        // Get mentorship connections limit by 3
        const connectionsResponse = await getMyConnections({ limit: 3 });
        // Set mentorship connections
        setMentorshipConnections(connectionsResponse.connections);

        // Get recommended mentors if user is a mentee
        if (user?.role === 'mentee') {
          try {
            // Fetch recommended mentors
            const mentorsResponse = await getRecommendedMentors();

            // Set recommended mentors limit by 3
            setRecommendedMentors(
              mentorsResponse.recommended_mentors.slice(0, 3)
            );
          } catch (error) {
            console.error(
              '⚠️ Error while fetching recommended mentors:',
              error
            );
          }
        }

        // Get unread messages count
        const chatRoomsResponse = await getChatRooms();

        // Calculate total unread messages
        const totalUnread = chatRoomsResponse.chat_rooms.reduce(
          (sum, room) => sum + room.unread_count,
          0
        );
        // Set unread messages count
        setUnreadMessages(totalUnread);

        // Get unread notifications count
        const notificationsResponse = await getNotifications();
        // Set unread notifications count
        setUnreadNotifications(notificationsResponse.unread_count);
      } catch (error) {
        console.error('⚠️ Error while fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch dashboard data when the component mounts
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto my-auto px-4 py-20 flex justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Hey, {user?.name}!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Calendar className="text-blue-300 mr-2" size={24} />
              <h3 className="text-lg font-medium">Event</h3>
            </div>
            <p className="text-3xl font-bold mb-2">{upcomingEvents.length}</p>
            <p className="text-gray-500 text-sm mb-4">Upcoming Event</p>
            <div className="mt-auto">
              <Link href="/events">
                <Button className="w-full">View Event</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Users className="text-blue-400 mr-2" size={24} />
              <h3 className="text-lg font-medium">Mentorship</h3>
            </div>
            <p className="text-3xl font-bold mb-2">
              {mentorshipConnections.length}
            </p>
            <p className="text-gray-500 text-sm mb-4">Active Connections</p>
            <div className="mt-auto">
              <Link href="/mentorship">
                <Button className="w-full">
                  {user?.role === 'mentor' ? 'Find Mentee' : 'Find Mentor'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <MessageSquare className="text-blue-500 mr-2" size={24} />
              <h3 className="text-lg font-medium">Messages</h3>
            </div>
            <p className="text-3xl font-bold mb-2">{unreadMessages}</p>
            <p className="text-gray-500 text-sm mb-4">Unread Messages</p>
            <div className="mt-auto">
              <Link href="/chat">
                <Button className="w-full">View Chat</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Bell className="text-blue-600 mr-2" size={24} />
              <h3 className="text-lg font-medium">Notification</h3>
            </div>
            <p className="text-3xl font-bold mb-2">{unreadNotifications}</p>
            <p className="text-gray-500 text-sm mb-4">Unread Notifications</p>
            <div className="mt-auto">
              <Link href="/notifications">
                <Button className="w-full">View Notification</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>Upcoming Events</span>
              <Link href="/events">
                <ChevronRight className="text-gray-500" size={20} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 py-2">No Upcoming Events</p>
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
                    <div className="mt-2 flex justify-end">
                      <Link href={`/events/${event.id}`} className="text-right">
                        <span className="text-blue-600 hover:underline  text-sm">
                          View Details
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>Liked Events</span>
              <Link href="/events/liked">
                <ChevronRight className="text-gray-500" size={20} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {likedEvents.length === 0 ? (
              <p className="text-gray-500 py-2">No Liked Events</p>
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
                    <div className="mt-2 flex justify-end">
                      <Link href={`/events/${event.id}`}>
                        <span className="text-blue-600 hover:underline text-sm">
                          View Details
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>Mentorship Connections</span>
              <Link href="/mentorship/connections">
                <ChevronRight className="text-gray-500" size={20} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mentorshipConnections.length === 0 ? (
              <p className="text-gray-500 py-2">No Mentorship Connections</p>
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
                            {isUserMentor ? 'Mentee' : 'Mentor'}:{' '}
                            {otherPerson.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {otherPerson.expertise}
                          </p>
                        </div>

                        {connection.chat_room_id && (
                          <Link href={`/chat/${connection.chat_room_id}`}>
                            <Button size="sm">
                              <MessageSquare size={14} className="mr-1" />
                              Chat
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

        {user?.role === 'mentee' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>Recommended Mentors</span>
                <Link href="/mentorship">
                  <ChevronRight className="text-gray-500" size={20} />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendedMentors.length === 0 ? (
                <p className="text-gray-500 py-2">No Recommended Mentors</p>
              ) : (
                <div className="divide-y">
                  {recommendedMentors.map((mentor) => (
                    <div key={mentor.id} className="py-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-medium">
                              {mentor.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium mb-1">{mentor.name}</p>
                            <p className="text-sm text-gray-500">
                              {mentor.expertise}
                            </p>
                          </div>
                        </div>

                        <Link href={`/mentorship/users/${mentor.id}`}>
                          <Button size="sm">View Profile</Button>
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
