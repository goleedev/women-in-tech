'use client';

import { useState, useEffect } from 'react';

import { getMe } from '@/app/lib/api/auth';

import { updateUserProfile } from '@/app/lib/api/user';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useAuth } from '@/app/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading';

export default function ProfilePage() {
  // Context for authentication
  const { user: authUser, refreshUser } = useAuth();
  // State variables for form inputs and error messages
  const [loading, setLoading] = useState<boolean>(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    expertise: '',
    profession: '',
    seniority_level: '',
    country: '',
    bio: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Set user data
        const userData = await getMe();

        // Set user data to state
        setUser(userData);
        setFormData({
          name: userData.name || '',
          expertise: userData.expertise || '',
          profession: userData.profession || '',
          seniority_level: userData.seniority_level || '',
          country: userData.country || '',
          bio: userData.bio || '',
        });
      } catch (error) {
        // Handle error
        console.error('⚠️ Error while updating profile', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    // Get name and value from the event target
    const { name, value } = e.target;

    // Set form data to state
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Function to validate form inputs
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate name field
    if (!formData.name) {
      newErrors.name = '⚠️ Name is required';

      isValid = false;
    }

    // Validate expertise fields
    if (!formData.expertise) {
      newErrors.expertise = '⚠️ Expertise is required';

      isValid = false;
    }

    // Validate profession field
    if (!formData.profession) {
      newErrors.profession = '⚠️ Profession is required';

      isValid = false;
    }

    // Validate seniority level field
    if (!formData.seniority_level) {
      newErrors.seniority_level = '⚠️ Seniority level is required';

      isValid = false;
    }

    // Validate country field
    if (!formData.country) {
      newErrors.country = '⚠️ Country is required';

      isValid = false;
    }

    // Set error state
    setErrors(newErrors);

    return isValid;
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Check if form is valid
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Update user profile
      await updateUserProfile(authUser?.id || '', formData);

      // Refresh user data
      await refreshUser();
    } catch (error) {
      // Handle error
      console.error('⚠️ Error while updating the profile:', error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : '⚠️ Error while updating the profile'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 my-auto py-20 min-h-screen flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardContent>
              {submitError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <Input
                    id="name"
                    name="name"
                    label="Name"
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    disabled={isSubmitting}
                  />

                  <Input
                    id="expertise"
                    name="expertise"
                    label="Expertise"
                    placeholder="Frontend, Backend, etc."
                    value={formData.expertise}
                    onChange={handleChange}
                    error={errors.expertise}
                    disabled={isSubmitting}
                  />

                  <Input
                    id="profession"
                    name="profession"
                    label="Profession"
                    placeholder="Frontend Developer, Backend Developer, etc."
                    value={formData.profession}
                    onChange={handleChange}
                    error={errors.profession}
                    disabled={isSubmitting}
                  />

                  <div className="space-y-1 w-full">
                    <label
                      htmlFor="seniority_level"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Seniority Level
                    </label>
                    <select
                      id="seniority_level"
                      name="seniority_level"
                      value={formData.seniority_level}
                      onChange={handleChange}
                      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          ${
                            errors.seniority_level
                              ? 'border-red-500 focus:ring-red-500'
                              : ''
                          }`}
                      disabled={isSubmitting}
                    >
                      <option value="">Select</option>
                      <option value="Entry">Entry (0-2 years)</option>
                      <option value="Mid-level">Mid-level (3-5 years)</option>
                      <option value="Senior">Senior (6+ years)</option>
                    </select>
                    {errors.seniority_level && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.seniority_level}
                      </p>
                    )}
                  </div>

                  <Input
                    id="country"
                    name="country"
                    label="Country"
                    placeholder="South Korea"
                    value={formData.country}
                    onChange={handleChange}
                    error={errors.country}
                    disabled={isSubmitting}
                  />

                  <div className="space-y-1 w-full">
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Tell us about yourself"
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSubmitting}
                    ></textarea>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold text-blue-600">
                    {user?.name.charAt(0)}
                  </span>
                </div>

                <h2 className="text-xl font-semibold">{user?.name}</h2>
                <p className="text-gray-600">
                  {user?.role === 'mentor' ? 'Mentor' : 'Mentee'}
                </p>

                <div className="w-full mt-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span>{user?.email}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Expertise:</span>
                    <span>{user?.expertise || '-'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Seniority Level:</span>
                    <span>{user?.seniority_level || '-'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Country:</span>
                    <span>{user?.country || '-'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
