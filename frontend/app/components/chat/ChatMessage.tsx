import { User } from '@/app/lib/api/types';
import { formatDate } from '@/app/lib/utils';

// ChatMessage Interface
interface ChatMessageProps {
  id: number;
  content: string;
  sender: {
    id: number;
    name: string;
    profile_image_url?: string;
  };
  created_at: string;
  currentUser: User | null;
}

export default function ChatMessage({
  content,
  sender,
  created_at,
  currentUser,
}: ChatMessageProps) {
  // Check if the message is sent by the current user
  const isMyMessage = sender.id === currentUser?.id;

  return (
    <div
      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      {!isMyMessage && (
        <div className="flex-shrink-0 mr-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="font-medium text-blue-600">
              {sender.name.charAt(0)}
            </span>
          </div>
        </div>
      )}

      <div
        className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl ${
          isMyMessage
            ? 'bg-blue-600 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg'
            : 'bg-white border border-gray-200 rounded-tl-lg rounded-tr-lg rounded-br-lg'
        } p-3 shadow-sm`}
      >
        {!isMyMessage && (
          <div className="font-medium text-sm mb-1">{sender.name}</div>
        )}
        <div className="mb-1">{content}</div>
        <div
          className={`text-xs ${
            isMyMessage ? 'text-blue-100' : 'text-gray-500'
          } text-right`}
        >
          {formatDate(created_at)}
        </div>
      </div>
    </div>
  );
}
