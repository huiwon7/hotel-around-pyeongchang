import { format, differenceInCalendarDays, eachDayOfInterval, addDays, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDateKo(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy년 M월 d일', { locale: ko });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'M/d(EEE)', { locale: ko });
}

export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatYearMonth(date: Date): string {
  return format(date, 'yyMM');
}

export function getDaysUntil(targetDate: Date): number {
  return differenceInCalendarDays(targetDate, new Date());
}

export function getStayDates(checkIn: Date, checkOut: Date): Date[] {
  return eachDayOfInterval({
    start: checkIn,
    end: addDays(checkOut, -1),
  });
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  return differenceInCalendarDays(checkOut, checkIn);
}

export function isExpired(expiresAt: Date): boolean {
  const now = new Date();
  return now > expiresAt;
}
