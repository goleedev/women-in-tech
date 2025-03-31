'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, MessageSquare } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/app/context/AuthContext';

import {
  getMyConnections,
  getConnectionRequests,
  updateConnectionStatus,
} from '@/app/lib/api/mentorship';
import { MentorshipConnection } from '@/app/lib/api/types';

import { formatDate } from '@/app/lib/utils';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';

export default function MentorshipConnectionsPage() {
  // Authentication context
  const { user } = useAuth();
  // State variables to manage mentorship connections and loading state
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const [connections, setConnections] = useState<MentorshipConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<
    MentorshipConnection[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Effect to fetch mentorship connections and requests
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get active connections
        const activeResponse = await getMyConnections();
        // Set active connections to state
        setConnections(activeResponse.connections);

        // Get pending requests if the user is a mentor
        if (user?.role === 'mentor') {
          const pendingResponse = await getConnectionRequests({
            status: 'pending',
          });
          setPendingRequests(pendingResponse.connections);
        }

        setError(null);
      } catch (err) {
        // Handle error
        console.error('⚠️ Error while getting mentorship connections:', err);
        setError('⚠️ Error while getting mentorship connections');
      } finally {
        setLoading(false);
      }
    };

    // Call the fetch function
    fetchData();
  }, [user]);

  // Function to handle accepting a connection request
  const handleAccept = async (connectionId: number) => {
    setActionInProgress(connectionId);
    try {
      // Update connection status to 'accepted'
      await updateConnectionStatus(connectionId, 'accepted');

      // Find the accepted request from pending requests
      const acceptedRequest = pendingRequests.find(
        (req) => req.id === connectionId
      );

      if (acceptedRequest) {
        // Remove from pending requests
        setPendingRequests((prev) =>
          prev.filter((req) => req.id !== connectionId)
        );

        // Add to active connections with updated status
        setConnections((prev) => [
          ...prev,
          {
            ...acceptedRequest,
            status: 'accepted',
          },
        ]);
      }

      // Set the active tab to 'active' to show the new connection
      setActiveTab('active');
    } catch (err) {
      console.error('⚠️ Error while accepting mentorship request:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Function to handle rejecting a connection request
  const handleReject = async (connectionId: number) => {
    setActionInProgress(connectionId);
    try {
      // Update connection status to 'rejected'
      await updateConnectionStatus(connectionId, 'rejected');

      // Remove the rejected request from pending requests
      setPendingRequests((prev) =>
        prev.filter((req) => req.id !== connectionId)
      );
    } catch (err) {
      // Handle error
      console.error('⚠️ Error while updating mentorship status:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/mentorship"
        className="flex items-center text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Mentorship
      </Link>

      <h1 className="text-3xl font-bold mb-6">My mentorship connections</h1>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            className={`py-2 px-1 -mb-px ${
              activeTab === 'active'
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('active')}
          >
            Active
          </button>
          {user?.role === 'mentor' && (
            <button
              className={`py-2 px-1 -mb-px ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending
              {pendingRequests.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 min-h-screen mx-auto my-auto">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          {error}
        </div>
      ) : activeTab === 'active' ? (
        connections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No active mentorship connections found.
            </p>
            <Link href="/mentorship">
              <Button>
                {user?.role === 'mentor' ? 'Find Mentee' : 'Find Mentor'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connections.map((connection) => {
              const isUserMentor = user?.id === connection.mentor.id;
              const otherPerson = isUserMentor
                ? connection.mentee
                : connection.mentor;

              return (
                <Card key={connection.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {isUserMentor ? 'Mentee' : 'Mentor'}: {otherPerson.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-500">Expertise:</span>{' '}
                        <span>{otherPerson.expertise}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Profession:</span>{' '}
                        <span>{otherPerson.profession}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Connection Date:</span>{' '}
                        <span>{formatDate(connection.created_at)}</span>
                      </div>

                      <div className="pt-4 flex justify-between">
                        <Link href={`/mentorship/users/${otherPerson.id}`}>
                          <Button variant="outline">View Profile</Button>
                        </Link>

                        {connection.chat_room_id && (
                          <Link href={`/chat/${connection.chat_room_id}`}>
                            <Button>
                              <MessageSquare size={16} className="mr-1" />
                              Chat
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : pendingRequests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No pending connections</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {request.mentee.name}
                    </h3>
                    <p className="text-gray-500">
                      {request.mentee.expertise} • {request.mentee.profession}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Request Date: {formatDate(request.created_at)}
                    </p>

                    {request.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">
                          {request.message}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start space-x-2">
                    <Button
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleAccept(request.id)}
                      disabled={actionInProgress === request.id}
                    >
                      <Check size={16} className="mr-1" />
                      Accept
                    </Button>

                    <Button
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleReject(request.id)}
                      disabled={actionInProgress === request.id}
                    >
                      <X size={16} className="mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
