import { z } from 'zod';

export const phoneVerifySchema = z.object({
  phone: z.string().regex(/^01[016789]\d{7,8}$/, '유효한 휴대전화 번호가 아닙니다'),
});

export const otpVerifySchema = z.object({
  phone: z.string().regex(/^01[016789]\d{7,8}$/, '유효한 휴대전화 번호가 아닙니다'),
  otp: z.string().length(6, 'OTP는 6자리입니다'),
});

export const customerUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  marketingConsent: z.boolean().optional(),
});
