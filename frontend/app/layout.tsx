import Link from 'next/link';

export const metadata = {
  title: 'Women in Tech',
  description: 'Mentorship & Networking Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="p-4 bg-gray-100 shadow gap-3">
          <Link href="/dashboard" className="mr-4">
            Dashboard
          </Link>
          <Link href="/mentors">Find a Mentor</Link>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
