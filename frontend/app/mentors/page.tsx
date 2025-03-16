'use client';

import {
  fetchMentors,
  fetchUserRequests,
  requestMentorship,
  cancelMentorshipRequest,
} from '@/api/matching';
import { useState, useEffect } from 'react';
import MentorFilters from './components/MentorFilters';
import { Mentor, MentorshipRequest } from '@/types/matching';

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [techStack, setTechStack] = useState<string>('all');

  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const userId = 1; // ✅ 실제 로그인된 유저 ID로 변경 필요

  useEffect(() => {
    async function loadMentors() {
      setLoading(true);
      try {
        const data = await fetchMentors();
        setMentors(data);
      } catch (error) {
        console.error('Failed to fetch mentors:', error);
      } finally {
        setLoading(false);
      }
    }

    async function loadRequests() {
      try {
        const data = await fetchUserRequests(userId);
        setRequests(data);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      }
    }

    loadMentors();
    loadRequests();
  }, []);

  const handleRequestMentorship = async (mentorId: number) => {
    try {
      await requestMentorship(userId, mentorId);
      setRequests([
        ...requests,
        { mentee_id: userId, mentor_id: mentorId, status: 'pending' },
      ]);
    } catch (error) {
      console.error('Failed to request mentorship:', error);
    }
  };

  const handleCancelRequest = async (mentorId: number) => {
    try {
      const requestToCancel = requests.find(
        (req) => req.mentor_id === mentorId
      );
      if (requestToCancel) {
        await cancelMentorshipRequest(requestToCancel.id);
        setRequests(requests.filter((req) => req.mentor_id !== mentorId));
      }
    } catch (error) {
      console.error('Failed to cancel mentorship request:', error);
    }
  };

  const filteredMentors = mentors.filter(
    (mentor) =>
      mentor.name.toLowerCase().includes(search.toLowerCase()) &&
      (techStack === 'all' || mentor.tech_stack.includes(techStack))
  );

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-bold">Find a Mentor</h1>

      <MentorFilters
        search={search}
        setSearch={setSearch}
        techStack={techStack}
        setTechStack={setTechStack}
      />

      {loading ? (
        <p>Loading mentors...</p>
      ) : filteredMentors.length > 0 ? (
        <ul>
          {filteredMentors.map((mentor) => (
            <li key={mentor.id} className="mt-4">
              <h2 className="font-bold">{mentor.name}</h2>
              <p>{mentor.job_title}</p>
              <p>{mentor.country}</p>

              {requests.some((req) => req.mentor_id === mentor.id) ? (
                <button
                  onClick={() => handleCancelRequest(mentor.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Cancel Request
                </button>
              ) : (
                <button
                  onClick={() => handleRequestMentorship(mentor.id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Request Mentorship
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No mentors found</p>
      )}
    </div>
  );
}
