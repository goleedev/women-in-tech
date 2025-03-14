'use client';

import { useEffect, useState } from 'react';
import {
  requestMentorship,
  getMatchingStatus,
  cancelMentorshipRequest,
} from '@/api/matching';

interface Mentor {
  id: number;
  name: string;
  job_title: string;
  country: string;
  tech_stack: string[];
}

export default function MentorPage({
  mentors,
  menteeId,
}: {
  mentors: Mentor[];
  menteeId: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<number | null>(null);

  // ✅ Check if mentee already has a pending request
  useEffect(() => {
    async function fetchStatus() {
      try {
        const status = await getMatchingStatus(menteeId);
        if (status.status === 'pending') {
          setPendingRequestId(status.id); // ✅ Store request ID
        }
      } catch (err) {
        console.error(err);
        setPendingRequestId(null);
      }
    }
    fetchStatus();
  }, [menteeId]);

  // ✅ Handle requesting mentorship
  const handleRequest = async (mentorId: number) => {
    try {
      setLoading(true);
      const response = await requestMentorship(menteeId, mentorId);
      setPendingRequestId(response.id); // ✅ Save request ID after success
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to request mentorship'
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle canceling request
  const handleCancel = async () => {
    if (!pendingRequestId) return;
    try {
      setLoading(true);
      await cancelMentorshipRequest(pendingRequestId);
      setPendingRequestId(null); // ✅ Reset request ID
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold">Find a Mentor</h2>
      {error && <p className="text-red-500">{error}</p>}
      <ul>
        {mentors?.map((mentor) => (
          <li key={mentor.id} className="p-4 border mb-2">
            <strong>{mentor.name}</strong> <br />
            {mentor.job_title} <br />
            {mentor.country} <br />
            {pendingRequestId ? (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="bg-red-500 text-white p-2 rounded mt-2"
              >
                {loading ? 'Canceling...' : 'Cancel Request'}
              </button>
            ) : (
              <button
                onClick={() => handleRequest(mentor.id)}
                disabled={loading}
                className="bg-blue-500 text-white p-2 rounded mt-2"
              >
                {loading ? 'Requesting...' : 'Request Mentorship'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
