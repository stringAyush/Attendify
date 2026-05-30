import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours ?? '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h || 12;
  return `${displayHour}:${minutes} ${period}`;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function getAttendanceColor(percentage: number): string {
  if (percentage >= 85) return 'text-emerald-600';
  if (percentage >= 75) return 'text-amber-600';
  return 'text-red-600';
}

export function getAttendanceBg(percentage: number): string {
  if (percentage >= 85) return 'bg-emerald-100 text-emerald-700';
  if (percentage >= 75) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayOfWeek] ?? '';
}

export function getApiErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as {
      response?: { data?: { error?: string; message?: string } };
      message?: string;
    };
    return (
      axiosError.response?.data?.error ??
      axiosError.response?.data?.message ??
      axiosError.message ??
      'Something went wrong'
    );
  }
  return 'Something went wrong';
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getAcademicYears(): string[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => {
    const start = currentYear - i;
    return `${start}-${start + 1}`;
  });
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
