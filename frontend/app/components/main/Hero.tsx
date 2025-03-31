'use client';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const Hero = () => {
  return (
    <section className="py-16 md:py-24 text-center px-4">
      <h1 className="text-4xl md:text-6xl py-10 text-blue-500 font-bold mb-6">
        Network & Event Platform <br />
        for Women in Tech
      </h1>
      <p className="text-xl mb-10 max-w-3xl mx-auto text-gray-600">
        Connect with fellow Women in Tech, find mentors, and participate in
        events that help you grow your career.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link href="/register">
          <Button size="lg">Sign Up</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" size="lg">
            Login
          </Button>
        </Link>
      </div>
    </section>
  );
};
