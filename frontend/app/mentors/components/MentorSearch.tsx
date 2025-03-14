'use client';

import { useState } from 'react';

export default function MentorSearch() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  return (
    <div className="mb-4 flex gap-2">
      <input
        type="text"
        placeholder="Search by name or skill..."
        className="border p-2 rounded w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        className="border p-2 rounded"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        <option value="">All</option>
        <option value="frontend">Frontend</option>
        <option value="backend">Backend</option>
      </select>
    </div>
  );
}
