'use client';
import { useState, useEffect } from 'react';
import { MatchingRequest } from '@/types/matching';

export default function MatchingStatusPage() {
  const [matchingRequest, setMatchingRequest] =
    useState<MatchingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRequest = localStorage.getItem('matchingRequest');
      if (storedRequest) {
        setMatchingRequest(JSON.parse(storedRequest));
        setLoading(false);
      } else {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/matching/latest`)
          .then((res) => {
            if (!res.ok) throw new Error('Failed to fetch latest request.');
            return res.json();
          })
          .then((data) => {
            setMatchingRequest(data);
            localStorage.setItem('matchingRequest', JSON.stringify(data));
          })
          .catch((err) => setError(err.message))
          .finally(() => setLoading(false));
      }
    }
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold">Matching Request Status</h1>
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
        <p>No matching request found.</p>
      )}
    </div>
  );
}
