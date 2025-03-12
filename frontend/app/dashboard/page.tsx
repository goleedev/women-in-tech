'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User } from '@/types/user';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem('user');

      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);

        if (parsedData.user) {
          setUser(parsedData.user);
        } else {
          console.warn('User object not found in localStorage.');
          router.push('/login');
        }
      } else {
        console.warn('No user data found. Redirecting...');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [router]);

  if (!user) return <p>Loading...</p>; // ✅ Prevents undefined access

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-4">
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Country:</strong> {user.country}
        </p>
        <p>
          <strong>Job Title:</strong> {user.job_title}
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
