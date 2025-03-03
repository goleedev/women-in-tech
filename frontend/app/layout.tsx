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
        <nav className="p-4 bg-gray-100 shadow">
          <Link href="/" className="mr-4">
            Home
          </Link>
          <a href="/users">Users</a>
          <a href="/add-user">Add User</a>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
