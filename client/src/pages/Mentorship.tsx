import React, { useEffect, useState } from 'react';

interface Mentor {
  id: number;
  name: string;
  expertise: string;
  seniority: string;
}

const Mentorship = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/mentors')
      .then((response) => response.json())
      .then((data) => setMentors(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Mentorship Matching</h1>
      <ul>
        {mentors.map((mentor) => (
          <li key={mentor.id}>
            <h2>{mentor.name}</h2>
            <p>Expertise: {mentor.expertise}</p>
            <p>Seniority: {mentor.seniority}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Mentorship;
