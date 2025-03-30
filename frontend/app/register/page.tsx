'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { register } from '../lib/api/auth';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

type UserRole = 'mentor' | 'mentee';

interface RegisterFormData {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  secondary_role: UserRole | '';
  expertise: string;
  profession: string;
  seniority_level: string;
  country: string;
  bio: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole,
    secondary_role: '' as UserRole | '',
    expertise: '',
    profession: '',
    seniority_level: '',
    country: '',
    bio: '',
  });

  // Set step state to 1 for the first step
  const [step, setStep] = useState<number>(1);
  // Initialize errors state to an empty object
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Initialize submitting state to false
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // Initialize register error state to null
  const [registerError, setRegisterError] = useState<string | null>(null);
  // Initialize router for navigation
  const router = useRouter();

  // Handle input changes and update form data
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    // Destructure name and value from the event target
    const { name, value } = e.target;

    // Update form data state with the new value
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validate the first step of the form
  const validateStep1 = () => {
    // Initialize an empty object to store errors
    const newErrors: Record<string, string> = {};
    // Initialize a variable to track if the form is valid
    let isValid = true;

    // Check if the email is valid
    if (!formData.email) {
      newErrors.email = '⚠️ Email is required';

      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '⚠️ Invalid email address';

      isValid = false;
    }

    // Check if the name is valid
    if (!formData.name) {
      newErrors.name = '⚠️ Name is required';

      isValid = false;
    }

    // Check if the password is valid
    if (!formData.password) {
      newErrors.password = '⚠️ Password is required';

      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = '⚠️ Password must be at least 8 characters long';

      isValid = false;
    }

    // Check if the confirm password matches
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '⚠️ Confirm password';

      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '⚠️ Passwords do not match';

      isValid = false;
    }

    // Check if the role is selected
    if (!formData.role) {
      newErrors.role = '⚠️ Role is required';

      isValid = false;
    }

    // Set the errors state with the new errors
    setErrors(newErrors);

    return isValid;
  };

  // Validate the second step of the form
  const validateStep2 = () => {
    // Initialize an empty object to store errors
    const newErrors: Record<string, string> = {};
    // Initialize a variable to track if the form is valid
    let isValid = true;

    // Check if the expertise is valid
    if (!formData.expertise) {
      newErrors.expertise = '⚠️ Expertise is required';

      isValid = false;
    }

    // Check if the profession is valid
    if (!formData.profession) {
      newErrors.profession = '⚠️ Profession is required';

      isValid = false;
    }

    // Check if the seniority level is selected
    if (!formData.seniority_level) {
      newErrors.seniority_level = '⚠️ Seniority level is required';

      isValid = false;
    }

    // Check if the country is valid
    if (!formData.country) {
      newErrors.country = '⚠️ Country is required';

      isValid = false;
    }

    // Set the errors state with the new errors
    setErrors(newErrors);

    return isValid;
  };

  // Handle the next step of the form
  const handleNextStep = () => {
    if (validateStep1()) setStep(2);
  };

  // Handle the previous step of the form
  const handlePrevStep = () => setStep(1);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    // First step validation
    if (step === 1) {
      handleNextStep();
      return;
    }

    // Second step validation
    if (!validateStep2()) return;

    setIsSubmitting(true);

    // Prepare the data for registration
    try {
      // Create a new FormData object
      await register(formData);

      router.push('/login?registered=true');
    } catch (error) {
      // Handle registration error
      console.error('⚠️ Error registering user:', error);

      setRegisterError(
        error instanceof Error ? error.message : '⚠️ Failed to register'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center pb-6 pt-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>
        <div>
          {registerError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {registerError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="test@test.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  disabled={isSubmitting}
                />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  label="Name"
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  disabled={isSubmitting}
                />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="********"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  disabled={isSubmitting}
                />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  placeholder="********"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  disabled={isSubmitting}
                />

                <div className="space-y-1 w-full">
                  <label className="block text-sm font-medium text-gray-700">
                    Primary Role
                  </label>
                  <div className="flex space-x-4 mt-1">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="role"
                        value="mentee"
                        checked={formData.role === 'mentee'}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>Mentee</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="role"
                        value="mentor"
                        checked={formData.role === 'mentor'}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>Mentor</span>
                    </label>
                  </div>
                  {errors.role && (
                    <p className="text-xs font-medium text-red-500">
                      {errors.role}
                    </p>
                  )}
                </div>

                {/* Secondary role selection based on primary role */}
                <div className="space-y-1 w-full">
                  <label className="block text-sm font-medium text-gray-700">
                    Secondary Role (Optional)
                  </label>
                  <div className="flex space-x-4 mt-1">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="secondary_role"
                        value=""
                        checked={formData.secondary_role === ''}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>None</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="secondary_role"
                        value={formData.role === 'mentee' ? 'mentor' : 'mentee'}
                        checked={formData.secondary_role !== ''}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600"
                        disabled={!formData.role}
                      />
                      <span>
                        {formData.role === 'mentee' ? 'Mentor' : 'Mentee'}
                      </span>
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Input
                  id="expertise"
                  name="expertise"
                  type="text"
                  label="Expertise"
                  placeholder="Frontend, Backend, Design, etc."
                  value={formData.expertise}
                  onChange={handleChange}
                  error={errors.expertise}
                  disabled={isSubmitting}
                />
                <Input
                  id="profession"
                  name="profession"
                  type="text"
                  label="Profession"
                  placeholder="Software Engineer, Designer, etc."
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
                  type="text"
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
                    Bio (Optional)
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tell us about yourself"
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  ></textarea>
                </div>
              </>
            )}

            <div
              className={
                step === 1 ? 'flex justify-end' : 'flex justify-between'
              }
            >
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              )}
              <Button
                type={step === 2 ? 'submit' : 'button'}
                onClick={step === 1 ? handleNextStep : undefined}
              >
                {step === 1 ? 'Next' : 'Sign Up'}
              </Button>
            </div>
          </form>
        </div>
        <div>
          <div className="text-sm text-center text-gray-500 w-full">
            Do you have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
