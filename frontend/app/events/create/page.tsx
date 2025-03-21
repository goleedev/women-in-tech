'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { createEvent } from '@/app/lib/api/event';
import { getAllTags } from '@/app/lib/api/tag';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/ui/Card';
import Button from '@/app/ui/Button';
import Input from '@/app/ui/Input';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useEffect } from 'react';

export default function CreateEventPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
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
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 인증 및 권한 체크
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/events/create');
      return;
    }

    if (user?.role !== 'mentor') {
      router.push('/events');
      return;
    }

    // 태그 목록 가져오기
    const fetchTags = async () => {
      try {
        const response = await getAllTags();
        const uniqueTags = Array.from(
          new Set(response.tags.map((tag) => tag.name))
        );
        setAvailableTags(uniqueTags);
      } catch (error) {
        console.error('태그 가져오기 오류:', error);
      }
    };

    fetchTags();
  }, [isAuthenticated, user, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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

    if (!formData.title) {
      newErrors.title = '제목을 입력해주세요';
      isValid = false;
    }

    if (!formData.description) {
      newErrors.description = '설명을 입력해주세요';
      isValid = false;
    }

    if (!formData.date) {
      newErrors.date = '날짜를 입력해주세요';
      isValid = false;
    }

    if (!formData.location) {
      newErrors.location = '위치를 입력해주세요';
      isValid = false;
    }

    if (!formData.topic) {
      newErrors.topic = '주제를 입력해주세요';
      isValid = false;
    }

    if (formData.is_online && !formData.online_link) {
      newErrors.online_link = '온라인 링크를 입력해주세요';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await createEvent({
        ...formData,
        tags,
      });

      router.push(`/events/${response.event?.id}`);
    } catch (error) {
      console.error('이벤트 생성 오류:', error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : '이벤트 생성 중 오류가 발생했습니다.'
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
        이벤트 목록으로 돌아가기
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">새 이벤트 생성</CardTitle>
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
                label="제목"
                placeholder="이벤트 제목"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                disabled={isSubmitting}
              />

              <Input
                id="topic"
                name="topic"
                label="주제"
                placeholder="이벤트 주제 (예: 웹 개발, 데이터 사이언스)"
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
                설명
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="이벤트에 대한 설명을 입력해주세요"
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
                label="시작 날짜 및 시간"
                value={formData.date}
                onChange={handleChange}
                error={errors.date}
                disabled={isSubmitting}
              />
              <Input
                id="end_date"
                name="end_date"
                type="datetime-local"
                label="종료 날짜 및 시간 (선택사항)"
                value={formData.end_date}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="location"
                name="location"
                label="위치"
                placeholder="이벤트 장소"
                value={formData.location}
                onChange={handleChange}
                error={errors.location}
                disabled={isSubmitting}
              />

              <Input
                id="max_attendees"
                name="max_attendees"
                type="number"
                label="최대 참가자 수 (0은 제한 없음)"
                placeholder="최대 참가자 수"
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
                  온라인 이벤트
                </label>
              </div>

              {formData.is_online && (
                <Input
                  id="online_link"
                  name="online_link"
                  label="온라인 링크"
                  placeholder="이벤트 참가 링크 (Zoom, Google Meet 등)"
                  value={formData.online_link}
                  onChange={handleChange}
                  error={errors.online_link}
                  disabled={isSubmitting}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                태그
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
                  취소
                </Button>
              </Link>
              <Button type="submit" isLoading={isSubmitting}>
                이벤트 생성
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
