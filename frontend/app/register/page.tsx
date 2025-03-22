'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '../lib/api/auth';
import Button from '../ui/Button';
import Input from '../ui/Input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/Card';

type UserRole = 'mentor' | 'mentee';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
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

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요';
      isValid = false;
    }

    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호를 확인해주세요';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
      isValid = false;
    }

    if (!formData.role) {
      newErrors.role = '역할을 선택해주세요';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.expertise) {
      newErrors.expertise = '전문 분야를 입력해주세요';
      isValid = false;
    }

    if (!formData.profession) {
      newErrors.profession = '직업을 입력해주세요';
      isValid = false;
    }

    if (!formData.seniority_level) {
      newErrors.seniority_level = '경력 수준을 선택해주세요';
      isValid = false;
    }

    if (!formData.country) {
      newErrors.country = '국가를 입력해주세요';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (step === 1) {
      handleNextStep();
      return;
    }

    if (!validateStep2()) return;

    setIsSubmitting(true);

    try {
      await register(formData);
      router.push('/login?registered=true');
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError(
        error instanceof Error ? error.message : '회원가입에 실패했습니다.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            회원가입
          </CardTitle>
          <CardDescription className="text-center">
            계정을 생성하여 이벤트 참여 및 멘토링을 시작하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  label="이메일"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  disabled={isSubmitting}
                />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  label="이름"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  disabled={isSubmitting}
                />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="비밀번호"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  disabled={isSubmitting}
                />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="비밀번호 확인"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  disabled={isSubmitting}
                />

                <div className="space-y-1 w-full">
                  <label className="block text-sm font-medium text-gray-700">
                    주 역할
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
                      <span>멘티</span>
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
                      <span>멘토</span>
                    </label>
                  </div>
                  {errors.role && (
                    <p className="text-xs font-medium text-red-500">
                      {errors.role}
                    </p>
                  )}
                </div>

                {/* 보조 역할 선택 부분 추가 */}
                <div className="space-y-1 w-full">
                  <label className="block text-sm font-medium text-gray-700">
                    보조 역할 (선택 사항)
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
                      <span>없음</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="secondary_role"
                        value={formData.role === 'mentee' ? 'mentor' : 'mentee'}
                        checked={formData.secondary_role !== ''}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600"
                        disabled={!formData.role} // 주 역할 선택 전에는 비활성화
                      />
                      <span>
                        {formData.role === 'mentee' ? '멘토' : '멘티'}
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
                  label="전문 분야"
                  placeholder="프론트엔드 개발, 데이터 사이언스 등"
                  value={formData.expertise}
                  onChange={handleChange}
                  error={errors.expertise}
                  disabled={isSubmitting}
                />
                <Input
                  id="profession"
                  name="profession"
                  type="text"
                  label="직업"
                  placeholder="소프트웨어 엔지니어, UX 디자이너 등"
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
                    경력 수준
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
                    <option value="">선택해주세요</option>
                    <option value="Entry">신입 (0-2년)</option>
                    <option value="Mid-level">중급 (3-5년)</option>
                    <option value="Senior">시니어 (6년 이상)</option>
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
                  label="국가"
                  placeholder="대한민국"
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
                    소개 (선택사항)
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    placeholder="자신을 간단히 소개해주세요"
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
                  이전
                </Button>
              )}
              <Button
                type={step === 2 ? 'submit' : 'button'}
                onClick={step === 1 ? handleNextStep : undefined}
                isLoading={isSubmitting}
              >
                {step === 1 ? '다음' : '회원가입'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center text-gray-500 w-full">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              로그인
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
