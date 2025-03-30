'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { formatDate, truncate } from '@/app/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';

import { getEvents } from '@/app/lib/api/event';
import { Event } from '@/app/lib/api';

export const Events = () => {
  // State variables to manage events data and loading state
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch events data
        const eventsResponse = await getEvents({ limit: 3 });

        // Set the events data to state
        setUpcomingEvents(eventsResponse.events);
      } catch (error) {
        console.error('⚠️ Error while fetching events:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <>
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Upcoming Events</h2>
            <Link href="/events">
              <span className="text-blue-600 hover:underline">
                View All Events
              </span>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No upcoming events available
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
                        <span className="font-medium">📍</span> {event.location}
                      </p>
                      <Link href={`/events/${event.id}`}>
                        <Button className="w-full">View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};
