'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type User = {
  id: number;
  name: string;
  email: string;
  country: string;
  job_title: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User>();

  useEffect(() => {
    // ✅ localStorage에서 유저 정보 불러오기
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login'); // 로그인 안 한 경우 로그인 페이지로 이동
    }
  }, [router]);

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {user ? (
        <div className="mt-4">
          <p>
            <strong>Name:</strong> <span>{user.name}</span>
          </p>
          <p>
            <strong>Email:</strong> <span>{user.email}</span>
          </p>
          <p>
            <strong>Country:</strong> <span>{user.country}</span>
          </p>
          <p>
            <strong>Job Title:</strong> <span>{user.job_title}</span>
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
      ) : (
        <p>Loading user data...</p>
      )}
    </div>
  );
}
