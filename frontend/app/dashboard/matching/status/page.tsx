'use client';
import { useEffect, useState } from 'react';
import { MatchingRequest } from '@/types/matching';

export default function MatchingStatusPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [matchingRequest, setMatchingRequest] =
    useState<MatchingRequest | null>(
      JSON.parse(localStorage.getItem('matchingRequest') || 'null')
    );
  const [loading, setLoading] = useState(!matchingRequest);

  useEffect(() => {
    if (!matchingRequest) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/matching/${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setMatchingRequest(data);
          localStorage.setItem('matchingRequest', JSON.stringify(data)); // Store latest request
        })
        .catch((error) => console.error('❌ Error fetching request:', error))
        .finally(() => setLoading(false));
    }
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold">Mentorship Request Status</h1>
      {matchingRequest ? (
        <div className="p-4 border rounded mt-4">
          <p>
            <strong>Tech Stack:</strong>{' '}
            {matchingRequest.preferred_tech_stack.join(', ')}
          </p>
          <p>
            <strong>Experience Required:</strong>{' '}
            {matchingRequest.preferred_experience} years
          </p>
          <p>
            <strong>Preferred Location:</strong>{' '}
            {matchingRequest.preferred_location || 'Any'}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            {matchingRequest.status === 'pending'
              ? '⏳ Pending'
              : matchingRequest.status === 'matched'
              ? '✅ Matched'
              : '❌ Rejected'}
          </p>
        </div>
      ) : (
        <p>No mentorship request found.</p>
      )}
    </div>
  );
}
