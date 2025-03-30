import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Create a utility function to merge class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Create a utility function to format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US').format(date);
}

// Create a utility function to truncate strings
export function truncate(str: string, length: number): string {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
