'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

import { useAuth } from '@/app/context/AuthContext';

import { getUsers, connectRequest } from '@/app/lib/api/mentorship';
import { User } from '@/app/lib/api/types';

import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import RoleSwitcher from '../components/mentorship/RuleSwitcher';

// Define MentorshipUser interface
interface MentorshipUser extends User {
  tags: string[];
  similarity_score?: number;
  match_level?: 'High' | 'Medium' | 'Low';
  is_connected?: boolean;
  connection_status?: 'pending' | 'accepted' | 'rejected' | null;
}

export default function MentorshipPage() {
  // Authentication context
  const { user, isAuthenticated, activeRole } = useAuth();

  // State variables for user data and loading state
  const [users, setUsers] = useState<MentorshipUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Determine the target role based on the active role
  const targetRole = activeRole === 'mentor' ? 'mentee' : 'mentor';

  // State variables for filters and pagination
  const [filters, setFilters] = useState<{
    role: 'mentor' | 'mentee';
    expertise: string;
    seniority_level: string;
    country: string;
    search: string;
  }>({
    role: targetRole,
    expertise: '',
    seniority_level: '',
    country: '',
    search: '',
  });

  // State variables for connection request
  const [connectInProgress, setConnectInProgress] = useState<number | null>(
    null
  );
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [connectMessage, setConnectMessage] = useState<string>('');
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<MentorshipUser | null>(null);

  const getMatchBadgeColor = (level: 'High' | 'Medium' | 'Low') => {
    switch (level) {
      case 'High':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-blue-100 text-blue-800';
      case 'Low':
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to render match badge
  const renderMatchBadge = (userItem: MentorshipUser) => {
    if (!user) return null;

    return (
      <span
        className={`inline-block text-xs px-2 py-1 rounded-full ${getMatchBadgeColor(
          userItem.match_level || 'Low'
        )}`}
      >
        {userItem.match_level || 'Low'} Match
      </span>
    );
  };

  // Effect to handle role switching
  useEffect(() => {
    // Set the new target role based on the active role
    const newTargetRole = activeRole === 'mentor' ? 'mentee' : 'mentor';

    // Update filters with the new target role
    setFilters((prev) => ({
      ...prev,
      role: newTargetRole,
    }));

    // Reset pagination to the first page
    setPage(1);
  }, [activeRole]);

  // Function to calculate similarity score between current user and other users
  const calculateSimilarityScore = useCallback(
    (otherUser: User): number => {
      if (!user) return 0;

      let score = 0;

      // Check expertise match (weight: 3)
      if (
        user.expertise &&
        otherUser.expertise &&
        user.expertise.toLowerCase() === otherUser.expertise.toLowerCase()
      ) {
        score += 3;
      }

      // Check profession match (weight: 2)
      if (
        user.profession &&
        otherUser.profession &&
        user.profession.toLowerCase() === otherUser.profession.toLowerCase()
      ) {
        score += 2;
      }

      // Check country match (weight: 2)
      if (
        user.country &&
        otherUser.country &&
        user.country.toLowerCase() === otherUser.country.toLowerCase()
      ) {
        score += 2;
      }

      // Check seniority level for mentor-mentee relationship (weight: 1.5 for Senior, 1 for Mid-level)
      if (activeRole === 'mentee' && otherUser.seniority_level) {
        if (otherUser.seniority_level === 'Senior') {
          score += 1.5;
        } else if (otherUser.seniority_level === 'Mid-level') {
          score += 1;
        }
      }

      return score;
    },
    [user, activeRole]
  );

  // Function to determine match level based on similarity score
  const getMatchLevel = (score: number): 'High' | 'Medium' | 'Low' => {
    if (score >= 5) return 'High';
    if (score >= 3) return 'Medium';
    return 'Low';
  };

  // Function to fetch users based on filters and pagination
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Get users from the API
      const response = await getUsers({
        ...filters,
        page,
        limit: 9,
        mode: activeRole,
      });

      // Filter out the current user from the list
      const filteredUsers = response.users.filter((u) => u.id !== user?.id);

      // Calculate similarity scores and match levels and ensure connection fields are properly set
      const usersWithScores = filteredUsers.map((u) => {
        // Only calculate similarity score if the current user exists
        const similarityScore = user ? calculateSimilarityScore(u) : 0;

        // Create a properly typed user object with default values for missing fields
        const enhancedUser: MentorshipUser = {
          ...u,
          tags: u.tags || [],
          similarity_score: similarityScore,
          match_level: getMatchLevel(similarityScore),
          is_connected: Boolean(u.is_connected), // Convert to boolean to ensure it's defined
          connection_status: u.connection_status || null, // Ensure it's either a valid status or null
        };

        return enhancedUser;
      });

      // Sort users by similarity score in descending order
      usersWithScores.sort(
        (a, b) => (b.similarity_score || 0) - (a.similarity_score || 0)
      );

      // Set the users and pagination data
      setUsers(usersWithScores);
      setTotalPages(response.pagination.total_pages);
      setError(null);
    } catch (err) {
      // Handle error
      console.error('⚠️ Error while getting users list:', err);
      setError('⚠️ Error while getting users list.');
    } finally {
      setLoading(false);
    }
  }, [filters, page, activeRole, user, calculateSimilarityScore]);

  // Effect to fetch users when the component mounts or when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Function to handle filter changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    // Get the name and value of the changed input
    const { name, value } = e.target;
    // Update the filters state
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Function to handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset pagination to the first page
    setPage(1);
    // Fetch users with the updated filters
    fetchUsers();
  };

  // Function to handle connection request
  const handleConnect = (userItem: MentorshipUser) => {
    // Check if the user is authenticated
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      window.location.href = `/login?redirect=/mentorship`;
      return;
    }

    // Set the selected user for connection
    setSelectedUser(userItem);
    setConnectMessage('');
    setShowConnectModal(true);
  };

  // Function to handle connection request submission
  const handleSubmitConnect = async () => {
    // Check if the selected user is available
    if (!selectedUser) return;

    setConnectInProgress(selectedUser.id);
    try {
      const response = await connectRequest(selectedUser.id, connectMessage);
      console.log('Connection request response:', response);

      // Update the users state with the new connection status
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                is_connected: false,
                connection_status: 'pending',
              }
            : u
        )
      );

      setShowConnectModal(false);
    } catch (err) {
      console.error('⚠️ Error while sending connection request:', err);
    } finally {
      setConnectInProgress(null);
    }
  };

  // Function to render connection status
  const renderConnectionStatus = (userItem: MentorshipUser) => {
    // Check if connected
    if (userItem.is_connected)
      return <span className="text-green-600 text-sm">Connected</span>;

    // Check the connection status
    switch (userItem.connection_status) {
      case 'pending':
        return <span className="text-yellow-600 text-sm">Pending</span>;
      case 'accepted':
        // If accepted but is_connected is false, update it
        return <span className="text-green-600 text-sm">Connected</span>;
      case 'rejected':
        return <span className="text-red-600 text-sm">Rejected</span>;
      default:
        return (
          <Button
            variant="outline"
            onClick={() => handleConnect(userItem)}
            disabled={connectInProgress === userItem.id}
          >
            Request
          </Button>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <h1 className="text-3xl font-bold">
            {activeRole === 'mentor' ? 'Find Mentee' : 'Find Mentor'}
          </h1>

          {user && (user.secondary_role || user.role !== activeRole) && (
            <RoleSwitcher />
          )}
        </div>

        <Link href="/mentorship/connections">
          <Button variant="outline">My Mentorship Connections</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name Search
            </label>
            <input
              id="search"
              name="search"
              type="text"
              placeholder="Search by name"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location
            </label>
            <input
              id="country"
              name="country"
              type="text"
              placeholder="Country or location"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.country}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <label
              htmlFor="expertise"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Expertise
            </label>
            <input
              id="expertise"
              name="expertise"
              type="text"
              placeholder="Expertise"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.expertise}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <label
              htmlFor="seniority_level"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Seniority Level
            </label>
            <select
              id="seniority_level"
              name="seniority_level"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.seniority_level}
              onChange={handleFilterChange}
            >
              <option value="">All Levels</option>
              <option value="Entry">Entry (0-2 years)</option>
              <option value="Mid-level">Mid Level (3-5 years)</option>
              <option value="Senior">Senior (6+ years)</option>
            </select>
          </div>

          <div className="md:col-span-4 flex justify-end">
            <Button type="submit">Search</Button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 min-h-screen mx-auto my-auto">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No Results</p>
          <Button
            onClick={() =>
              setFilters({
                role: activeRole === 'mentor' ? 'mentee' : 'mentor',
                expertise: '',
                seniority_level: '',
                country: '',
                search: '',
              })
            }
          >
            View all users
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((userItem) => (
            <Card key={userItem.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="h-10"></div>
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-white p-1 absolute -bottom-10">
                      <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                        <span className="text-xl font-bold text-blue-600">
                          {userItem.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-12 p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold">{userItem.name}</h3>
                    {renderMatchBadge(userItem)}
                  </div>

                  <p className="text-gray-600 mb-4">{userItem.expertise}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    {userItem.role === 'mentor' ? 'Mentor' : 'Mentee'}
                    {userItem.secondary_role &&
                      ` / ${
                        userItem.secondary_role === 'mentor'
                          ? 'Mentor'
                          : 'Mentee'
                      }`}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start">
                      <span className="text-gray-500 w-24 text-sm">
                        Profession:
                      </span>
                      <span>{userItem.profession || '-'}</span>
                    </div>

                    <div className="flex items-start">
                      <span className="text-gray-500 w-24 text-sm">
                        Seniority:
                      </span>
                      <span>{userItem.seniority_level || '-'}</span>
                    </div>

                    <div className="flex items-start">
                      <span className="text-gray-500 w-24 text-sm">
                        Location:
                      </span>
                      <span>{userItem.country || '-'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Link href={`/mentorship/users/${userItem.id}`}>
                      <span className="text-blue-600 hover:underline text-sm">
                        View Profile
                      </span>
                    </Link>

                    {isAuthenticated && renderConnectionStatus(userItem)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              Prev
            </Button>

            <div className="text-sm text-gray-500">
              {page} / {totalPages}
            </div>

            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {showConnectModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">
              Send your connection request to {selectedUser.name}
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
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConnectModal(false)}
                disabled={connectInProgress === selectedUser.id}
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
