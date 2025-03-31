import { Calendar, Group, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export const Features = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">Features</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <Link href="/events">
            <div className="bg-white rounded-xl shadow-lg p-8 transform transition-transform hover:scale-105">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Calendar size={40} className="text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">Events</h3>
              <p className="text-gray-600 text-center">
                Find and join events that match your interests and career goals.
              </p>
            </div>
          </Link>
          <Link href="/mentorship">
            <div className="bg-white rounded-xl shadow-lg p-8 transform transition-transform hover:scale-105">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Group size={40} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">
                Mentorship
              </h3>
              <p className="text-gray-600 text-center">
                Connect with mentors who can guide you in your career journey.
              </p>
            </div>
          </Link>
          <Link href="/chat">
            <div className="bg-white rounded-xl shadow-lg p-8 transform transition-transform hover:scale-105">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <MessageSquare size={40} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">Chat</h3>
              <p className="text-gray-600 text-center">
                Engage in discussions and share insights with fellow members.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};
