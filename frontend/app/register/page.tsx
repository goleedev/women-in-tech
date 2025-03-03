'use client';
import { useState } from 'react';
import { registerUser } from '@/api/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    country: '',
    city: '',
    job_title: '',
    tech_stack: '',
    years_of_experience: '',
    mentoring_topics: '',
    available_times: '',
    calcom_link: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser({
        ...form,
        years_of_experience: Number(form.years_of_experience) || 0,
        tech_stack: form.tech_stack.split(',').map((s) => s.trim()),
        mentoring_topics: form.mentoring_topics.split(',').map((s) => s.trim()),
        available_times: form.available_times.split(',').map((s) => s.trim()),
      });
      alert('Registration successful! Please log in.');
      router.push('/login');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold">Register</h1>
      <form onSubmit={handleRegister} className="flex flex-col gap-4 mt-4">
        <Input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <Input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <Input
          type="text"
          name="country"
          placeholder="Country"
          value={form.country}
          onChange={handleChange}
          required
        />
        <Input
          type="text"
          name="city"
          placeholder="City"
          value={form.city}
          onChange={handleChange}
          required
        />
        <Input
          type="text"
          name="job_title"
          placeholder="Job Title"
          value={form.job_title}
          onChange={handleChange}
          required
        />

        <Input
          type="text"
          name="tech_stack"
          placeholder="Tech Stack (comma separated)"
          value={form.tech_stack}
          onChange={handleChange}
        />
        <Input
          type="number"
          name="years_of_experience"
          placeholder="Years of Experience"
          value={form.years_of_experience}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="mentoring_topics"
          placeholder="Mentoring Topics (comma separated)"
          value={form.mentoring_topics}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="available_times"
          placeholder="Available Times (comma separated)"
          value={form.available_times}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="calcom_link"
          placeholder="Cal.com link (optional)"
          value={form.calcom_link}
          onChange={handleChange}
        />

        <Button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </form>
    </div>
  );
}
