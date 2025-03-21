export default function Footer() {
  return (
    <footer className="bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-semibold">Women in Tech Network</h3>
            <p className="text-gray-600 text-sm mt-1">
              여성 기술인을 위한 네트워킹 플랫폼
            </p>
          </div>

          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
            <div>
              <h4 className="font-medium mb-2">플랫폼</h4>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>
                  <a href="/events" className="hover:text-blue-600">
                    이벤트
                  </a>
                </li>
                <li>
                  <a href="/mentorship" className="hover:text-blue-600">
                    멘토십
                  </a>
                </li>
                <li>
                  <a href="/chat" className="hover:text-blue-600">
                    채팅
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">소개</h4>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>
                  <a href="/about" className="hover:text-blue-600">
                    소개
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-blue-600">
                    이용약관
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-blue-600">
                    개인정보처리방침
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Women in Tech Network. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
