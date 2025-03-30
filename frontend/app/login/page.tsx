'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  // State variables for form inputs and error messages
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Context for authentication
  const { login } = useAuth();

  // Router for navigation
  const router = useRouter();

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);

    // Redirect to home if authentication is already expired
    if (params.get('expired') === 'true') {
      setLoginError('⚠️ Authentication expired. Please log in again.');
    }
  }, []);

  // Function to validate form inputs
  const validateForm = () => {
    // Set initial error state
    const newErrors: { email?: string; password?: string } = {};

    let isValid = true;

    // Validate email input
    if (!email) {
      newErrors.email = '⚠️ Email is required';

      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '⚠️ Invalid email address';

      isValid = false;
    }

    // Validate password input
    if (!password) {
      newErrors.password = '⚠️ Password is required';

      isValid = false;
    }

    // Set error state
    setErrors(newErrors);

    return isValid;
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // Check if form is valid
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Call the login function from the context
      await login(email, password);

      router.push('/');
    } catch (error) {
      // Handle login error
      setLoginError(
        error instanceof Error
          ? error.message
          : '⚠️ Failed to login. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] m-auto flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-center">
          Log in to your account
        </h2>
        <div>
          {loginError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="이메일"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={isSubmitting}
            />
            <Input
              id="password"
              type="password"
              label="비밀번호"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={isSubmitting}
            />
            <Button type="submit" className="w-full">
              Log In
            </Button>
          </form>
        </div>
        <div className="text-sm text-center text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
