import Link from 'next/link';

export const Features = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">주요 특징</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <Link href="/events">
            <div className="bg-white rounded-xl shadow-lg p-8 transform transition-transform hover:scale-105">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">이벤트</h3>
              <p className="text-gray-600 text-center">
                기술 분야의 여성들을 위한 다양한 네트워킹 이벤트를 찾고
                참여하세요.
              </p>
            </div>
          </Link>
          <Link href="/mentorship">
            <div className="bg-white rounded-xl shadow-lg p-8 transform transition-transform hover:scale-105">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">멘토십</h3>
              <p className="text-gray-600 text-center">
                경력 성장을 도울 수 있는 멘토를 찾거나 멘토가 되어 경험을
                공유하세요.
              </p>
            </div>
          </Link>
          <Link href="/chat">
            <div className="bg-white rounded-xl shadow-lg p-8 transform transition-transform hover:scale-105">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">채팅</h3>
              <p className="text-gray-600 text-center">
                이벤트 참가자들과 연결하고 멘토와 실시간으로 소통하세요.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};
