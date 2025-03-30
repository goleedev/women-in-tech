'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Heart } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/app/context/AuthContext';

import { getEvents, likeEvent, unlikeEvent } from '@/app/lib/api/event';
import { Event } from '@/app/lib/api/types';

import { formatDate, truncate } from '@/app/lib/utils';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';

export default function EventsPage() {
  // Authentication context
  const { isAuthenticated, user } = useAuth();

  // State variables for events
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    location: '',
    topic: '',
    search: '',
  });
  const [likeInProgress, setLikeInProgress] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Function to fetch events based on filters and pagination
  const fetchEvents = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getEvents({
        ...filters,
        page,
        limit: 9,
      });
      setEvents(response.events);
      setTotalPages(response.pagination.total_pages);
      setError(null);
    } catch (err) {
      console.error('⚠️ Error while getting events:', err);
      setError('⚠️ Error while getting events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(page);
  }, [page, filters]);

  // Function to handle filter changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    // Get the name and value of the input
    const { name, value } = e.target;
    // Update the filters state
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Reset the page to 1 when filters change
    setPage(1);
  };

  // Function to handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    // Prevent default form submission
    e.preventDefault();
    // Reset the page to 1 when searching
    setPage(1);
    // Fetch events with the current filters
    fetchEvents(1);
  };

  // Function to handle like/unlike event
  const handleLikeToggle = async (eventId: number, isLiked: boolean) => {
    // Prevent multiple clicks during the like/unlike process
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/events`;
      return;
    }

    setLikeInProgress(eventId);
    try {
      // Toggle the like status
      if (isLiked) {
        await unlikeEvent(eventId);
      } else {
        await likeEvent(eventId);
      }

      // Update the event list with the new like status
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, is_liked: !isLiked } : event
        )
      );
    } catch (err) {
      console.error('⚠️ Error while updating like status:', err);
    } finally {
      setLikeInProgress(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Events</h1>
        {isAuthenticated && user?.role === 'mentor' && (
          <Link href="/events/create">
            <Button>Create an event</Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              id="search"
              name="search"
              type="text"
              placeholder="Searching..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="Location"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.location}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Topic
            </label>
            <input
              id="topic"
              name="topic"
              type="text"
              placeholder="Topic"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.topic}
              onChange={handleFilterChange}
            />
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Search
            </Button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 min-h-screen mx-auto my-auto">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No results</p>
          <Button
            onClick={() => setFilters({ location: '', topic: '', search: '' })}
          >
            View all events
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="h-full flex flex-col overflow-hidden"
            >
              <CardContent className="p-0 flex-grow flex flex-col">
                <div className="p-4 flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {event.topic}
                    </span>
                    <button
                      onClick={() =>
                        handleLikeToggle(event.id, event.is_liked || false)
                      }
                      disabled={likeInProgress === event.id}
                      className="text-gray-400 hover:text-red-500 focus:outline-none disabled:opacity-50"
                      aria-label={event.is_liked ? 'Unlike' : 'Like'}
                    >
                      <Heart
                        size={20}
                        fill={event.is_liked ? 'currentColor' : 'none'}
                        className={event.is_liked ? 'text-red-500' : ''}
                      />
                    </button>
                  </div>

                  <h3 className="text-xl font-semibold mb-2">{event.title}</h3>

                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar size={16} className="mr-1" />
                    <span>{formatDate(event.date)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <MapPin size={16} className="mr-1" />
                    <span>{event.location}</span>
                  </div>

                  <p className="text-gray-600 mb-4">
                    {truncate(event.description, 100)}
                  </p>

                  <div className="mt-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Attendees: {event.current_attendees}/
                        {event.max_attendees}
                      </span>

                      <Link href={`/events/${event.id}`}>
                        <span className="text-blue-600 hover:underline text-sm">
                          View Details
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
