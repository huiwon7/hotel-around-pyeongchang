import { z } from 'zod';

export const createReservationSchema = z.object({
  voucherId: z.string().uuid('유효한 바우처 ID가 아닙니다'),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
}).refine(
  (data) => new Date(data.checkOutDate) > new Date(data.checkInDate),
  { message: '체크아웃 날짜는 체크인 날짜 이후여야 합니다', path: ['checkOutDate'] }
);

export const cancelReservationSchema = z.object({
  reason: z.string().max(255).optional(),
});
