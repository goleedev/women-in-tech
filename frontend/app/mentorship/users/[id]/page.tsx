'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/app/context/AuthContext';

import { getUserProfile } from '@/app/lib/api/user';
import { connectRequest } from '@/app/lib/api/mentorship';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';

export default function UserProfilePage() {
  // Get the user ID from the URL parameters
  const { id } = useParams();
  // Get the router
  const router = useRouter();
  // Get the authentication context
  const { user: currentUser, isAuthenticated } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectInProgress, setConnectInProgress] = useState<boolean>(false);
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [connectMessage, setConnectMessage] = useState<string>('');

  // Effect to fetch user profile data when the component mounts or when the ID changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Check if the ID is valid
      if (!id) return;

      setLoading(true);
      try {
        // Get the user profile data from the API
        const userData = await getUserProfile(id as string);

        // Set the user data to state
        setUser(userData);
        setError(null);
      } catch (err) {
        // Handle error
        console.error('⚠️ Error while getting profile data:', err);
        setError('⚠️ Error while getting profile data');
      } finally {
        setLoading(false);
      }
    };

    // Call the fetch function
    fetchUserProfile();
  }, [id]);

  // Function to handle the connect request
  const handleConnect = () => {
    // Check if the user is authenticated
    if (!isAuthenticated) {
      router.push(`/login?redirect=/mentorship/users/${id}`);
      return;
    }

    // Show the connect modal
    setConnectMessage('');
    setShowConnectModal(true);
  };

  // Function to handle the connect request submission
  const handleSubmitConnect = async () => {
    setConnectInProgress(true);
    try {
      // Send the connect request to the API
      await connectRequest(id as string, connectMessage);

      setShowConnectModal(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUser((prev: any) => ({
        ...prev,
        is_connected: true,
      }));
    } catch (err) {
      console.error('⚠️ Error while connecting request:', err);
    } finally {
      setConnectInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Check if there is an error or if the user is not found
  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          {error || '⚠️ User not found'}
        </div>
        <div className="text-center mt-4">
          <Link href="/mentorship">
            <Button variant="outline">Back to mentorship</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if the current user is the same as the profile user
  const isSelf = currentUser?.id === parseInt(id as string);
  // Check if can connect
  const canConnect =
    !isSelf && currentUser?.role !== user.role && !user.is_connected;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/mentorship"
        className="flex items-center text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to mentorship
      </Link>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="h-48 bg-black relative"></div>

        <div className="relative px-6 sm:px-12 pb-12">
          <div className="flex flex-col sm:flex-row -mt-16 sm:-mt-24">
            <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-white p-1">
              <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                <span className="text-4xl font-bold text-blue-600">
                  {user.name.charAt(0)}
                </span>
              </div>
            </div>

            <div className="mt-4 sm:mt-8 sm:ml-8 flex-grow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <p className="text-lg text-gray-600">
                    {user.role === 'mentor' ? 'Mentor' : 'Mentee'}
                  </p>
                </div>

                {canConnect && (
                  <div className="mt-4 sm:mt-0">
                    <Button onClick={handleConnect}>Request</Button>
                  </div>
                )}

                {user.is_connected && user.chat_room_id && (
                  <div className="mt-4 sm:mt-0">
                    <Link href={`/chat/${user.chat_room_id}`}>
                      <Button>
                        <MessageSquare size={16} className="mr-1" />
                        Chat
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="md:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Bio</h2>
                  <div className="prose max-w-none">
                    {user.bio ? (
                      <p>{user.bio}</p>
                    ) : (
                      <p className="text-gray-500">No Bio</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Info</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm text-gray-500">Expertise</h3>
                      <p>{user.expertise || '-'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm text-gray-500">Profession</h3>
                      <p>{user.profession || '-'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm text-gray-500">Seniority Level</h3>
                      <p>{user.seniority_level || '-'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm text-gray-500">Country</h3>
                      <p>{user.country || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">
              Sent a request to {user.name}
            </h3>

            <div className="mb-4">
              <label
                htmlFor="connectMessage"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Message
              </label>
              <textarea
                id="connectMessage"
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Type your message here..."
                value={connectMessage}
                onChange={(e) => setConnectMessage(e.target.value)}
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConnectModal(false)}
                disabled={connectInProgress}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitConnect}>Send</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
