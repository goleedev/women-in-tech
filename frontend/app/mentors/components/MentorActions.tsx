'use client';

import { useState } from 'react';
import { requestMentorship, cancelMentorshipRequest } from '@/api/matching';

export default function MentorActions({ mentorId }: { mentorId: number }) {
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    try {
      setLoading(true);
      await requestMentorship(1, mentorId); // ✅ Hardcoded mentee ID (replace with actual user)
      setRequested(true);
    } catch (err) {
      alert('Failed to request mentorship' + err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      await cancelMentorshipRequest(mentorId);
      setRequested(false);
    } catch (err) {
      alert('Failed to cancel request' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      {requested ? (
        <button
          onClick={handleCancel}
          disabled={loading}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          {loading ? 'Canceling...' : 'Cancel Request'}
        </button>
      ) : (
        <button
          onClick={handleRequest}
          disabled={loading}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          {loading ? 'Requesting...' : 'Request Mentorship'}
        </button>
      )}
    </div>
  );
}
