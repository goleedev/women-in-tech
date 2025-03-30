'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/app/context/AuthContext';

import { createEvent } from '@/app/lib/api/event';
import { getAllTags } from '@/app/lib/api/tag';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CreateEventPage() {
  // Authentication context
  const { isAuthenticated, user } = useAuth();
  // Get the router
  const router = useRouter();
  // State variables for form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    end_date: '',
    location: '',
    topic: '',
    max_attendees: 0,
    is_online: false,
    online_link: '',
  });
  // State variables for tags
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  // State variables for form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Effect to check authentication and fetch tags
  useEffect(() => {
    // Check if user is authenticated and has the correct role
    if (!isAuthenticated) {
      router.push('/login?redirect=/events/create');
      return;
    }

    if (user?.role !== 'mentor') {
      router.push('/events');
      return;
    }

    // Function to fetch available tags
    const fetchTags = async () => {
      try {
        // Get all tags from the API
        const response = await getAllTags();
        // Extract unique tag names
        const uniqueTags = Array.from(
          new Set(response.tags.map((tag) => tag.name))
        );

        setAvailableTags(uniqueTags);
      } catch (error) {
        // Handle error
        console.error('⚠️ Error while getting tags:', error);
      }
    };

    fetchTags();
  }, [isAuthenticated, user, router]);

  // Function to handle form input changes=
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    // Get the name, value, and type of the input
    const { name, value, type } = e.target;

    // Update the form data state
    if (type === 'checkbox') {
      // If the input is a checkbox, set the value to true or false
      const checked = (e.target as HTMLInputElement).checked;
      // Update the form data state with the checkbox value
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      // If the input is a text input, set the value directly
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Function to handle adding a new tag
  const handleAddTag = () => {
    // Check if the new tag is not empty and does not already exist in the tags array
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  // Function to handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    // Filter out the tag to remove from the tags array
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  // Function to validate the form data
  const validateForm = () => {
    // Initialize an empty errors object
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Check if title field is valid
    if (!formData.title) {
      newErrors.title = '⚠️ Title is required';

      isValid = false;
    }

    // Check if description field is valid
    if (!formData.description) {
      newErrors.description = '⚠️ Description is required';

      isValid = false;
    }

    // Check if date field is valid
    if (!formData.date) {
      newErrors.date = '⚠️ Date is required';

      isValid = false;
    }

    // Check if Location field is valid
    if (!formData.location) {
      newErrors.location = '⚠️ Location is required';

      isValid = false;
    }

    // Check if topic field is valid
    if (!formData.topic) {
      newErrors.topic = '⚠️ Topic is required';

      isValid = false;
    }

    // Check if URL field is valid
    if (formData.is_online && !formData.online_link) {
      newErrors.online_link = '⚠️ URL is required';

      isValid = false;
    }

    setErrors(newErrors);

    return isValid;
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form submission
    e.preventDefault();
    setSubmitError(null);

    // Validate the form data
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Create the event using the API
      const response = await createEvent({
        ...formData,
        tags,
      });

      // Redirect to the event details page
      router.push(`/events/${response.event?.id}`);
    } catch (error) {
      // Handle error
      console.error('⚠️ Error while creating an event:', error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : '⚠️ Error while creating an event'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/events"
        className="flex items-center text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Events
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Creaet a new event</CardTitle>
        </CardHeader>

        <CardContent>
          {submitError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="title"
                name="title"
                label="Title"
                placeholder="Title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                disabled={isSubmitting}
              />

              <Input
                id="topic"
                name="topic"
                label="Topic"
                placeholder="Topic"
                value={formData.topic}
                onChange={handleChange}
                error={errors.topic}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1 w-full">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="Description"
                className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                value={formData.description}
                onChange={handleChange}
                disabled={isSubmitting}
              ></textarea>
              {errors.description && (
                <p className="text-xs font-medium text-red-500">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="date"
                name="date"
                type="datetime-local"
                label="Start Date"
                value={formData.date}
                onChange={handleChange}
                error={errors.date}
                disabled={isSubmitting}
              />
              <Input
                id="end_date"
                name="end_date"
                type="datetime-local"
                label="End Date"
                value={formData.end_date}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="location"
                name="location"
                label="Location"
                placeholder="Seoul, South Korea"
                value={formData.location}
                onChange={handleChange}
                error={errors.location}
                disabled={isSubmitting}
              />

              <Input
                id="max_attendees"
                name="max_attendees"
                type="number"
                label="Max Attendees"
                placeholder="Max Attendees (0 for unlimited)"
                value={formData.max_attendees.toString()}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  id="is_online"
                  name="is_online"
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500"
                  checked={formData.is_online}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_online: e.target.checked,
                    }))
                  }
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="is_online"
                  className="text-sm font-medium text-gray-700"
                >
                  Virtual Event
                </label>
              </div>

              {formData.is_online && (
                <Input
                  id="online_link"
                  name="online_link"
                  label="URL"
                  placeholder="https://example.com"
                  value={formData.online_link}
                  onChange={handleChange}
                  error={errors.online_link}
                  disabled={isSubmitting}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>

              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                      disabled={isSubmitting}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex">
                <input
                  type="text"
                  placeholder="태그 추가"
                  className="flex-grow rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                  }
                  list="available-tags"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={isSubmitting}
                >
                  <Plus size={16} />
                </button>

                <datalist id="available-tags">
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Link href="/events">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
