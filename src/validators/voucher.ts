import { z } from 'zod';

export const voucherCodeSchema = z.string().regex(
  /^HAP-(HS|WW|FL|PA)-\d{4}-\d{6}-[0-9A-Z]{2}$/,
  '유효한 바우처 코드 형식이 아닙니다'
);

export const verifyVoucherSchema = z.object({
  voucherCode: voucherCodeSchema,
  signature: z.string().optional(),
});

export const refundRequestSchema = z.object({
  reason: z.string().min(1, '환불 사유를 입력해주세요').max(255),
});
