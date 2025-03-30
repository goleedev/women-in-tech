import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import Header from '@/app/components/layout/Header';
import Footer from '@/app/components/layout/Footer';

import { AuthProvider } from '@/app/context/AuthContext';

// Define the Inter font
const inter = Inter({ subsets: ['latin'] });

// Define the metadata for the page
export const metadata: Metadata = {
  title: 'Women in Tech Platform',
  description: 'It is a Women in Tech networking and event platform',
};

// Define the root layout for the application
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <link
        rel="icon"
        href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧑🏻‍💻</text></svg>"
      />
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto p-5 pt-16">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
