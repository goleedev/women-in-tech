'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select';

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
        <SelectTrigger>{techStack || 'Filter by Tech Stack'}</SelectTrigger>
        <SelectContent>
          <SelectItem value="">All</SelectItem>
          <SelectItem value="React">React</SelectItem>
          <SelectItem value="Node.js">Node.js</SelectItem>
          <SelectItem value="Python">Python</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
