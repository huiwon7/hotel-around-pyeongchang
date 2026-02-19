import { z } from 'zod';

export const paymentInitSchema = z.object({
  productCode: z.enum(['HS', 'WW', 'FL', 'PA'], { message: '유효한 상품 코드가 아닙니다' }),
  customerName: z.string().min(2, '이름은 2자 이상이어야 합니다').max(50),
  customerPhone: z.string().regex(/^01[016789]\d{7,8}$/, '유효한 휴대전화 번호가 아닙니다'),
  customerEmail: z.string().email('유효한 이메일 주소가 아닙니다').optional(),
  marketingConsent: z.boolean(),
});

export const paymentConfirmSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().positive(),
});
