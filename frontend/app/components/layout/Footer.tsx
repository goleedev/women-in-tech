import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-gray-600 text-sm text-left">
              <p>
                <b>Women in Tech.</b>
              </p>
              <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <Link href="/privacy" className="text-gray-600 hover:text-blue-500">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-600 hover:text-blue-500">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
