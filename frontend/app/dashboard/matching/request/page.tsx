'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MatchingRequest } from '@/types/matching';

export default function RequestMentorPage() {
  const router = useRouter();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [techStack, setTechStack] = useState<string>('');
  const [experience, setExperience] = useState<number>(1);
  const [location, setLocation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/matching`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mentee_id: user.id,
            preferred_tech_stack: [techStack],
            preferred_experience: experience,
            preferred_location: location || null,
          }),
        }
      );

      if (!res.ok) throw new Error('Failed to send matching request.');

      const data: MatchingRequest = await res.json(); // ✅ Now we use it
      alert(
        `Matching request sent! Request ID: ${data.id}, Status: ${data.status}`
      );

      // ✅ Store the request in localStorage so the user can track it later
      localStorage.setItem('matchingRequest', JSON.stringify(data));

      router.push('/matching/status'); // Redirecting to status page
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Error submitting request.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold">Request a Mentor</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
        <Input
          type="text"
          placeholder="Preferred Tech Stack (e.g., React)"
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          required
        />
        <Input
          type="number"
          placeholder="Preferred Years of Experience"
          value={experience}
          onChange={(e) => setExperience(Number(e.target.value))}
          required
        />
        <Input
          type="text"
          placeholder="Preferred Location (Optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Request Mentor'}
        </Button>
      </form>
    </div>
  );
}
