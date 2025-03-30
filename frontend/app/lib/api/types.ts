// Define the types for the mentorship connection data
export interface MentorshipConnection {
  id: number;
  mentor: {
    id: number;
    name: string;
    expertise: string;
    profession: string;
  };
  mentee: {
    id: number;
    name: string;
    expertise: string;
    profession: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  chat_room_id?: number;
}

// Define the types for the mentorship user data
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  secondary_role?: string;
  expertise?: string;
  profession?: string;
  seniority_level?: string;
  country?: string;
  bio?: string;
  profile_image_url?: string;
  is_verified?: boolean;
  tags?: string[];
}

// Define the types for the event
export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  end_date?: string;
  location: string;
  topic: string;
  organizer: {
    id: number;
    name: string;
    email?: string;
  };
  max_attendees: number;
  current_attendees: number;
  image_url?: string;
  is_online: boolean;
  online_link?: string;
  status: string;
  is_liked?: boolean;
  tags: string[];
  attendees?: Array<{ id: number; name: string }>;
}

// Define the types for the chat room
export interface ChatRoom {
  id: number;
  name: string;
  type: 'event' | 'mentorship';
  event_id?: number;
  mentorship_id?: number;
  last_message?: {
    content: string;
    sender_id: number;
    sender_name: string;
    created_at: string;
  };
  unread_count: number;
  created_at: string;
}

// Define the types for the chat message
export interface Message {
  id: number;
  chat_room_id: number;
  sender: {
    id: number;
    name: string;
    profile_image_url?: string;
  };
  content: string;
  is_read: boolean;
  created_at: string;
}

// Define the types for the mentorship connection data
export interface MentorshipConnection {
  id: number;
  mentor: {
    id: number;
    name: string;
    expertise: string;
    profession: string;
  };
  mentee: {
    id: number;
    name: string;
    expertise: string;
    profession: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  chat_room_id?: number;
}

// Define the types for the notification
export interface Notification {
  id: number;
  type: string;
  content: string;
  is_read: boolean;
  reference_id: number;
  reference_type: string;
  created_at: string;
}

// Define the types for the tag
export interface Tag {
  id: number;
  name: string;
  category: string;
}

// Define the types for pagination
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
