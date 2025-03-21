// src/app/events/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { eventAPI } from '@/app/lib/api/api';
import Link from 'next/link';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  topic: string;
  organizer: {
    id: number;
    name: string;
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getEvents = async () => {
      try {
        setLoading(true);
        console.log(
          'Fetching events from:',
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'
        );
        const data = await eventAPI.getEvents();
        console.log('Received events data:', data);
        setEvents(data.events || []);
        setError(null);
      } catch (err) {
        console.error('Error details:', err);
        setError('Failed to fetch events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getEvents();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading events...</div>;

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Upcoming Events</h1>

      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="border rounded-lg overflow-hidden shadow-sm"
            >
              <div className="p-4">
                <h2 className="text-xl font-semibold">{event.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(event.date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 mt-2">{event.location}</p>
                <div className="mt-3 line-clamp-3 text-sm">
                  {event.description}
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {event.topic}
                  </span>
                  <Link href={`/events/${event.id}`}>
                    <span className="text-blue-600 hover:underline text-sm">
                      View Details
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
