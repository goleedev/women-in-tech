// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Women in Tech Networking Platform',
  description: 'A platform for women in tech to network and find events',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <nav className="bg-blue-600 text-white">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/">
              <span className="font-bold text-xl">WiT Network</span>
            </Link>
            <div className="space-x-6">
              <Link href="/events">
                <span className="hover:underline">Events</span>
              </Link>
              <Link href="/mentorship">
                <span className="hover:underline">Mentorship</span>
              </Link>
              <Link href="/chat">
                <span className="hover:underline">Chat</span>
              </Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
