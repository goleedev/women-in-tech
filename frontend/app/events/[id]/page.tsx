// src/app/events/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getEventById } from '@/app/lib/api/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface EventDetail {
  id: number;
  title: string;
  description: string;
  date: string;
  end_date: string;
  location: string;
  topic: string;
  organizer: {
    id: number;
    name: string;
    email: string;
  };
  max_attendees: number;
  current_attendees: number;
  is_online: boolean;
  online_link: string;
  tags: string[];
  attendees: { id: number; name: string }[];
}

export default function EventDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await getEventById(id);
        setEvent(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch event details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
  }, [id]);

  if (loading)
    return <div className="p-8 text-center">Loading event details...</div>;

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  if (!event) return <div className="p-8 text-center">Event not found</div>;

  return (
    <div className="container mx-auto p-4">
      <Link href="/events">
        <span className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Events
        </span>
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-2">{event.title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
              <p>{new Date(event.date).toLocaleString()}</p>
              {event.end_date && (
                <p>to {new Date(event.end_date).toLocaleString()}</p>
              )}
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500">Location</h3>
              <p>{event.location}</p>
              {event.is_online && event.online_link && (
                <p className="text-blue-600 hover:underline">
                  <a
                    href={event.online_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Online Link
                  </a>
                </p>
              )}
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500">Attendees</h3>
              <p>
                {event.current_attendees} / {event.max_attendees}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500">Organizer</h3>
              <p>{event.organizer.name}</p>
              <p className="text-gray-600">{event.organizer.email}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500">Topic</h3>
              <p>{event.topic}</p>
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">About this event</h3>
          <p className="whitespace-pre-line">{event.description}</p>
        </div>

        {event.attendees && event.attendees.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Attendees</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {event.attendees.map((attendee) => (
                <div key={attendee.id} className="bg-gray-50 p-2 rounded">
                  {attendee.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
