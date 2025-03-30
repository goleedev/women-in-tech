'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { getLikedEvents } from '@/app/lib/api/event';
import { Event } from '@/app/lib/api/types';

import EventCard from '@/app/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';

export default function LikedEventsPage() {
  // State variables to manage liked events data and loading state
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Function to fetch liked events based on pagination
  const fetchLikedEvents = async (page = 1) => {
    setLoading(true);
    try {
      // Get liked events from the API
      const response = await getLikedEvents({ page, limit: 12 });

      // Map through the events to set the liked status
      const eventsWithLikedStatus = response.events.map((event) => ({
        ...event,
        is_liked: true,
      }));

      // Set the events data to state
      setEvents(eventsWithLikedStatus);
      setTotalPages(response.pagination.total_pages);
      setError(null);
    } catch (err) {
      // Handle error
      console.error('⚠️ Error while getting events:', err);
      setError('⚠️ Error while getting events');
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch liked events when the component mounts or when the page changes
  useEffect(() => {
    fetchLikedEvents(page);
  }, [page]);

  // Function to handle the like toggle action
  const handleLikeToggle = (eventId: number, newStatus: boolean) => {
    if (!newStatus)
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/events"
        className="flex items-center text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Events
      </Link>

      <h1 className="text-3xl font-bold mb-6">Liked Events</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No events</p>
          <Link href="/events">
            <Button>Search Events</Button>
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

      {!loading && totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              Prev
            </Button>

            <div className="text-sm text-gray-500">
              {page} / {totalPages}
            </div>

            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
