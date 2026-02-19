import { differenceInCalendarDays } from 'date-fns';
import { REFUND_RULES } from '@/lib/constants/business-rules';

export interface RefundResult {
  eligible: boolean;
  type: 'FULL' | 'PARTIAL' | 'NONE';
  refundAmount: number;
  reason: string;
}

export function calculateRefund(voucher: {
  purchasePrice: number;
  totalNights: number;
  usedNights: number;
  heldNights: number;
  issuedAt: Date;
}): RefundResult {
  const daysSincePurchase = differenceInCalendarDays(new Date(), voucher.issuedAt);

  if (voucher.heldNights > 0) {
    return {
      eligible: false,
      type: 'NONE',
      refundAmount: 0,
      reason: '진행 중인 예약이 있습니다. 예약을 먼저 취소해주세요.',
    };
  }

  if (daysSincePurchase <= REFUND_RULES.FULL_REFUND_DAYS && voucher.usedNights === 0) {
    return {
      eligible: true,
      type: 'FULL',
      refundAmount: voucher.purchasePrice,
      reason: `구매 후 ${daysSincePurchase}일 이내, 미사용 - 전액 환불`,
    };
  }

  if (voucher.usedNights > 0 && voucher.usedNights < voucher.totalNights) {
    const perNightPrice = Math.ceil(voucher.purchasePrice / voucher.totalNights);
    const usedValue = voucher.usedNights * perNightPrice;
    const refundAmount = Math.max(0, voucher.purchasePrice - usedValue);

    return {
      eligible: true,
      type: 'PARTIAL',
      refundAmount,
      reason: `${voucher.usedNights}/${voucher.totalNights}박 사용 - 부분 환불 ${refundAmount}원`,
    };
  }

  if (voucher.usedNights === 0) {
    return {
      eligible: true,
      type: 'FULL',
      refundAmount: voucher.purchasePrice,
      reason: '미사용 - 전액 환불',
    };
  }

  return {
    eligible: false,
    type: 'NONE',
    refundAmount: 0,
    reason: '전체 박수가 사용되어 환불이 불가합니다.',
  };
}
