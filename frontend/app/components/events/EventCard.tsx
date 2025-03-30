'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, MapPin, Heart, Users } from 'lucide-react';

import { Event } from '@/app/lib/api/types';
import { likeEvent, unlikeEvent } from '@/app/lib/api/event';

import { formatDate, truncate } from '@/app/lib/utils';

// Define the EventCard interface
interface EventCardProps {
  event: Event;
  onLikeToggle?: (eventId: number, newStatus: boolean) => void;
}

export default function EventCard({ event, onLikeToggle }: EventCardProps) {
  // State variables to manage the like status and loading state
  const [isLiked, setIsLiked] = useState(event.is_liked || false);
  const [likeInProgress, setLikeInProgress] = useState(false);

  // Effect to set the initial like status based on the event prop
  useEffect(() => {
    setIsLiked(event.is_liked || false);
  }, [event.is_liked]);

  // Function to handle the like/unlike action
  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent multiple clicks during the like/unlike process
    if (likeInProgress) return;

    // Toggle the like status
    setLikeInProgress(true);
    try {
      if (isLiked) {
        await unlikeEvent(event.id);
      } else {
        await likeEvent(event.id);
      }

      const newStatus = !isLiked;
      setIsLiked(newStatus);

      if (onLikeToggle) {
        onLikeToggle(event.id, newStatus);
      }
    } catch (err) {
      console.error('⚠️ Error updating the event status:', err);
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
              aria-label={isLiked ? 'Unlike' : 'Like'}
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
              View Details
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
