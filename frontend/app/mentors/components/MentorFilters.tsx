'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select';

// ✅ 유저 타입 명확하게 정의
interface User {
  id: number;
  name: string;
  job_title: string;
  tech_stack: string[]; // 🚨 tech_stack은 항상 `string[]`이어야 함
}

interface MentorFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  techStack: string;
  setTechStack: (value: string) => void;
}

export default function MentorFilters({
  search,
  setSearch,
  techStack,
  setTechStack,
}: MentorFiltersProps) {
  const [techStacks, setTechStacks] = useState<string[]>([]);

  // 🚀 서버에서 모든 유저의 tech_stack을 가져오는 함수
  useEffect(() => {
    async function fetchTechStacks() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
        const users: User[] = await res.json(); // ✅ API 응답을 `User[]`로 처리

        // ✅ 모든 유저에서 고유한 tech_stack만 추출
        const uniqueTechStacks = Array.from(
          new Set(users.flatMap((user) => user.tech_stack))
        );

        setTechStacks(uniqueTechStacks);
      } catch (error) {
        console.error('Failed to fetch tech stacks:', error);
      }
    }

    fetchTechStacks();
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* 🔹 검색 필드 */}
      <Input
        type="text"
        placeholder="Search by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 🔹 기술 스택 필터 */}
      <Select value={techStack} onValueChange={setTechStack}>
        <SelectTrigger>
          {techStack === 'all' ? 'Filter by Tech Stack' : techStack}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>

          {/* 동적으로 가져온 tech_stack 옵션 */}
          {techStacks.length > 0 ? (
            techStacks.map((tech) => (
              <SelectItem key={tech} value={tech}>
                {tech}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>
              No tech stack available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
