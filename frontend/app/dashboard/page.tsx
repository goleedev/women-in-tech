'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export type User = {
  id: number;
  name: string;
  email: string;
  country: string;
  city: string;
  job_title: string;
  tech_stack: string[];
  years_of_experience: number;
  mentoring_topics: string[];
  available_times: string[];
  calcom_link?: string;
  created_at: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  console.log('🔍 User:', user); // ✅ Debug user data

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');

      if (storedUser) {
        setUser(JSON.parse(storedUser)); // ✅ Correctly parsing the stored JSON
      } else {
        console.warn('No user data found. Redirecting...');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, []);

  if (!user) return <p>Loading...</p>; // ✅ Prevents rendering before data is loaded

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-4">
        <p>
          <strong>Name:</strong> {user.name || 'N/A'}
        </p>
        <p>
          <strong>Email:</strong> {user.email || 'N/A'}
        </p>
        <p>
          <strong>Country:</strong> {user.country || 'N/A'}
        </p>
        <p>
          <strong>Job Title:</strong> {user.job_title || 'N/A'}
        </p>

        <Button
          className="mt-4"
          onClick={() => {
            localStorage.removeItem('user');
            router.push('/login');
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
