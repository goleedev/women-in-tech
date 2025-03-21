'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { getMe } from '@/app/lib/api/auth';
import { updateUserProfile, updateUserTags } from '@/app/lib/api/user';
import { getAllTags } from '@/app/lib/api/tag';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/ui/Card';
import Button from '@/app/ui/Button';
import Input from '@/app/ui/Input';
import { Plus, X } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
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
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'tags'>('profile');

  // 사용자 정보 및 태그 목록 불러오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 사용자 정보 조회
        const userData = await getMe();
        setUser(userData);
        setFormData({
          name: userData.name || '',
          expertise: userData.expertise || '',
          profession: userData.profession || '',
          seniority_level: userData.seniority_level || '',
          country: userData.country || '',
          bio: userData.bio || '',
        });
        setTags(userData.tags || []);

        // 태그 목록 조회
        const tagsResponse = await getAllTags();
        const uniqueTags = Array.from(
          new Set(tagsResponse.tags.map((tag) => tag.name))
        );
        setAvailableTags(uniqueTags);
      } catch (error) {
        console.error('프로필 데이터 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요';
      isValid = false;
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (activeTab === 'profile' && !validateForm()) return;

    setIsSubmitting(true);

    try {
      if (activeTab === 'profile') {
        // 프로필 정보 업데이트
        await updateUserProfile(authUser?.id || '', formData);
      } else {
        // 태그 업데이트
        await updateUserTags(authUser?.id || '', tags);
      }

      // 사용자 정보 새로고침
      await refreshUser();

      // 성공 메시지 또는 리디렉션
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : '프로필 업데이트 중 오류가 발생했습니다.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">내 프로필</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>프로필 관리</CardTitle>
            </CardHeader>
            <CardContent>
              {submitError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
                  {submitError}
                </div>
              )}

              {/* 탭 */}
              <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-8">
                  <button
                    className={`py-2 px-1 -mb-px ${
                      activeTab === 'profile'
                        ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('profile')}
                  >
                    기본 정보
                  </button>
                  <button
                    className={`py-2 px-1 -mb-px ${
                      activeTab === 'tags'
                        ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('tags')}
                  >
                    태그
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {activeTab === 'profile' ? (
                  <div className="space-y-6">
                    <Input
                      id="name"
                      name="name"
                      label="이름"
                      placeholder="이름"
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                      disabled={isSubmitting}
                    />

                    <Input
                      id="expertise"
                      name="expertise"
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
                        소개
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        placeholder="자신을 간단히 소개해주세요"
                        className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                      ></textarea>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        태그
                      </label>
                      <p className="text-sm text-gray-500">
                        다른 사용자들이 당신을 찾을 때 사용될 키워드를
                        추가하세요.
                      </p>

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
                        {tags.length === 0 && (
                          <p className="text-sm text-gray-500">
                            추가된 태그가 없습니다.
                          </p>
                        )}
                      </div>

                      <div className="flex">
                        <input
                          type="text"
                          placeholder="태그 추가"
                          className="flex-grow rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === 'Enter' &&
                            (e.preventDefault(), handleAddTag())
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
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <Button type="submit" isLoading={isSubmitting}>
                    저장하기
                  </Button>
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
                  {user?.profile_image_url ? (
                    <Image
                      unoptimized
                      width={128}
                      height={128}
                      src={user.profile_image_url}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-blue-600">
                      {user?.name.charAt(0)}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-semibold">{user?.name}</h2>
                <p className="text-gray-600">
                  {user?.role === 'mentor' ? '멘토' : '멘티'}
                </p>

                <div className="w-full mt-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">이메일:</span>
                    <span>{user?.email}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">전문 분야:</span>
                    <span>{user?.expertise || '-'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">경력 수준:</span>
                    <span>{user?.seniority_level || '-'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">국가:</span>
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
