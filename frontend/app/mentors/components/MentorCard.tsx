'use client';

import { Mentor } from '@/types/matching';
import { requestMentorship } from '@/api/matching';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MentorCardProps {
  mentor: Mentor;
  menteeId: number;
}

export default function MentorCard({ mentor, menteeId }: MentorCardProps) {
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      await requestMentorship(menteeId, mentor.id);
      alert(`Mentorship requested with ${mentor.name}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm flex flex-col gap-2">
      <h3 className="font-bold">{mentor.name}</h3>
      <p className="text-sm text-gray-600">{mentor.job_title}</p>
      <p className="text-sm">{mentor.country}</p>
      <p className="text-sm">Tech Stack: {mentor.tech_stack.join(', ')}</p>
      <Button onClick={handleRequest} disabled={loading}>
        {loading ? 'Requesting...' : 'Request Mentorship'}
      </Button>
    </div>
  );
}
