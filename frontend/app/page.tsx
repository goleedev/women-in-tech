'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from './context/AuthContext';

import { Hero } from './components/main/Hero';
import { Features } from './components/main/Features';
import { LoadingSpinner } from '@/components/ui/loading';
import { Events } from './components/main/Events';

export default function RootPage() {
  // Get the router instance from Next.js
  const router = useRouter();
  // Get the authentication status and loading state from the AuthContext
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect authenticated users to the dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center mx-auto my-auto py-20 items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // If the user is authenticated, redirect to the dashboard
  if (isAuthenticated) return null;

  // Render page for unauthenticated users
  return (
    <div className="max-w-7xl mx-auto">
      <Hero />
      <Features />
      <Events />
    </div>
  );
}
