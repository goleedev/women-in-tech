// src/app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <div className="text-center max-w-3xl mx-auto py-16">
        <h1 className="text-4xl font-bold mb-6">
          Women in Tech Networking Platform
        </h1>
        <p className="text-xl mb-8">
          Connect with other women in tech, find mentors, and attend events
          designed to help you grow in your career.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Link href="/events">
            <div className="bg-blue-50 p-6 rounded-lg hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">Events</h2>
              <p>
                Discover networking events and opportunities to connect with
                others in tech.
              </p>
            </div>
          </Link>

          <Link href="/mentorship">
            <div className="bg-purple-50 p-6 rounded-lg hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">Mentorship</h2>
              <p>
                Find mentors who can guide you through your career journey in
                technology.
              </p>
            </div>
          </Link>

          <Link href="/chat">
            <div className="bg-green-50 p-6 rounded-lg hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">Chat</h2>
              <p>Connect and communicate with other attendees after events.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
