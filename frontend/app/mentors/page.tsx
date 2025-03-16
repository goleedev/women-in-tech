'use client';

import { useState, useEffect } from 'react';
import {
  fetchMentors,
  requestMentorship,
  fetchUserRequests,
} from '@/api/matching';
import MentorFilters from './components/MentorFilters';
import { Mentor, MentorshipRequest } from '@/types/matching';

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [techStack, setTechStack] = useState<string>('all');
  const userId = 1; // ✅ 실제 로그인된 유저 ID로 변경 필요

  useEffect(() => {
    async function loadMentorsAndRequests() {
      setLoading(true);
      try {
        const [mentorsData, requestsData] = await Promise.all([
          fetchMentors(),
          fetchUserRequests(userId),
        ]);
        setMentors(mentorsData);
        setRequests(requestsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMentorsAndRequests();
  }, []);

  const handleRequestMentorship = async (mentorId: number) => {
    try {
      const newRequest = await requestMentorship(userId, mentorId);

      // ✅ 요청이 성공하면 `requests` 상태 업데이트
      setRequests((prev) => [...prev, newRequest]);
    } catch (error) {
      console.error('Failed to request mentorship:', error);
    }
  };

  const isRequestSent = (mentorId: number) =>
    requests.some((req) => req.mentor_id === mentorId);

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
              <button
                className={`border px-4 py-2 mt-2 ${
                  isRequestSent(mentor.id)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                onClick={() => handleRequestMentorship(mentor.id)}
                disabled={isRequestSent(mentor.id)}
              >
                {isRequestSent(mentor.id)
                  ? 'Request Sent'
                  : 'Request Mentorship'}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No mentors found</p>
      )}
    </div>
  );
}
