import { prisma } from '@/lib/prisma';
import { VoucherStatus, Prisma } from '@/generated/prisma/client';
import { generateVoucherCode } from './voucher-code';
import { generateQrPayload, generateQrDataUrl } from './voucher-qr';
import { addDays, differenceInCalendarDays } from 'date-fns';
import { CANCELLATION_RULES, REFUND_RULES } from '@/lib/constants/business-rules';
import { SPLIT_USE_ALLOWED_CODES } from '@/lib/constants/products';

const VALID_TRANSITIONS: Record<VoucherStatus, VoucherStatus[]> = {
  ISSUED: ['ACTIVE', 'REFUNDED', 'EXPIRED'],
  ACTIVE: ['RESERVED', 'USED', 'EXPIRED', 'REFUNDED'],
  RESERVED: ['ACTIVE', 'CHECKED_IN', 'EXPIRED'],
  CHECKED_IN: ['ACTIVE', 'RESERVED', 'USED'],
  USED: [],
  EXPIRED: [],
  REFUNDED: [],
};

function canTransition(from: VoucherStatus, to: VoucherStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

async function recordStatusChange(
  tx: Prisma.TransactionClient,
  voucherId: string,
  fromStatus: VoucherStatus | null,
  toStatus: VoucherStatus,
  reason: string,
  actorType: string,
  actorId?: string
) {
  await tx.voucherStatusHistory.create({
    data: {
      voucherId,
      fromStatus,
      toStatus,
      reason,
      actorType,
      actorId,
    },
  });
}

export async function issueVoucher(params: {
  customerId: string;
  productId: string;
  productCode: string;
  totalNights: number;
  purchasePrice: number;
  validityDays: number;
  paymentId: string;
  channel?: 'DIRECT' | 'NAVER' | 'KAKAO' | 'WELFARE' | 'PHONE';
}) {
  const voucherCode = await generateVoucherCode(params.productCode);
  const expiresAt = addDays(new Date(), params.validityDays);

  const { payload, signature } = generateQrPayload(voucherCode, expiresAt);
  const qrCodeData = await generateQrDataUrl(payload);

  return prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.create({
      data: {
        voucherCode,
        customerId: params.customerId,
        productId: params.productId,
        paymentId: params.paymentId,
        channel: params.channel || 'DIRECT',
        status: 'ACTIVE',
        totalNights: params.totalNights,
        purchasePrice: params.purchasePrice,
        activatedAt: new Date(),
        expiresAt,
        qrCodeData,
        qrSignature: signature,
      },
    });

    await recordStatusChange(tx, voucher.id, null, 'ACTIVE', '결제 완료로 바우처 발행 및 활성화', 'SYSTEM');

    await tx.customer.update({
      where: { id: params.customerId },
      data: {
        totalPurchases: { increment: 1 },
        lifetimeValue: { increment: params.purchasePrice },
        firstPurchaseAt: { set: new Date() },
      },
    });

    return voucher;
  });
}

export async function reserveNights(voucherId: string, nightsCount: number, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.findUniqueOrThrow({
      where: { id: voucherId },
      include: { product: true },
    });

    if (voucher.status !== 'ACTIVE' && voucher.status !== 'RESERVED') {
      throw new Error(`예약할 수 없는 상태입니다: ${voucher.status}`);
    }

    if (new Date() > voucher.expiresAt) {
      throw new Error('유효기간이 만료된 바우처입니다');
    }

    const remaining = voucher.totalNights - voucher.usedNights - voucher.heldNights;
    if (nightsCount > remaining) {
      throw new Error(`잔여 박수가 부족합니다. 잔여: ${remaining}박, 요청: ${nightsCount}박`);
    }

    if (!SPLIT_USE_ALLOWED_CODES.includes(voucher.product.productCode as 'WW' | 'FL' | 'PA')) {
      if (nightsCount !== voucher.totalNights) {
        throw new Error('해당 상품은 분할 사용이 불가합니다');
      }
    }

    const updated = await tx.voucher.update({
      where: { id: voucherId },
      data: {
        heldNights: { increment: nightsCount },
        status: 'RESERVED',
      },
    });

    await recordStatusChange(
      tx, voucherId, voucher.status, 'RESERVED',
      `${nightsCount}박 예약 보류`, 'CUSTOMER', actorId
    );

    return updated;
  });
}

export async function cancelReservationNights(
  voucherId: string,
  nightsCount: number,
  checkInDate: Date,
  actorId?: string
) {
  return prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.findUniqueOrThrow({
      where: { id: voucherId },
    });

    const daysUntilCheckIn = differenceInCalendarDays(checkInDate, new Date());
    const isLateCancellation = daysUntilCheckIn < CANCELLATION_RULES.FREE_CANCEL_DAYS_BEFORE;
    const penalty = isLateCancellation ? CANCELLATION_RULES.LATE_CANCEL_PENALTY_NIGHTS : 0;

    const nightsToRestore = nightsCount - penalty;

    const updated = await tx.voucher.update({
      where: { id: voucherId },
      data: {
        heldNights: { decrement: nightsCount },
        usedNights: { increment: penalty },
      },
    });

    const newRemaining = updated.totalNights - updated.usedNights - updated.heldNights;
    const hasOtherReservations = updated.heldNights > 0;
    const newStatus = newRemaining === 0 ? 'USED' : (hasOtherReservations ? 'RESERVED' : 'ACTIVE');

    const finalVoucher = await tx.voucher.update({
      where: { id: voucherId },
      data: { status: newStatus },
    });

    const reason = isLateCancellation
      ? `취소 (D-${daysUntilCheckIn}): ${nightsCount}박 중 ${penalty}박 패널티 차감`
      : `무료 취소: ${nightsCount}박 전량 복원`;

    await recordStatusChange(tx, voucherId, voucher.status, newStatus, reason, 'CUSTOMER', actorId);

    return { voucher: finalVoucher, penalty, nightsRestored: nightsToRestore };
  });
}

export async function checkIn(voucherId: string, nightsCount: number) {
  return prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.findUniqueOrThrow({
      where: { id: voucherId },
    });

    if (voucher.status !== 'RESERVED') {
      throw new Error(`체크인할 수 없는 상태입니다: ${voucher.status}`);
    }

    const updated = await tx.voucher.update({
      where: { id: voucherId },
      data: {
        heldNights: { decrement: nightsCount },
        usedNights: { increment: nightsCount },
        status: 'CHECKED_IN',
      },
    });

    await recordStatusChange(
      tx, voucherId, voucher.status, 'CHECKED_IN',
      `체크인: ${nightsCount}박 사용 확정`, 'SYSTEM'
    );

    return updated;
  });
}

export async function checkOut(voucherId: string) {
  return prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.findUniqueOrThrow({
      where: { id: voucherId },
    });

    if (voucher.status !== 'CHECKED_IN') {
      throw new Error(`체크아웃할 수 없는 상태입니다: ${voucher.status}`);
    }

    const remaining = voucher.totalNights - voucher.usedNights - voucher.heldNights;
    const newStatus = remaining === 0 ? 'USED' : (voucher.heldNights > 0 ? 'RESERVED' : 'ACTIVE');

    const updated = await tx.voucher.update({
      where: { id: voucherId },
      data: { status: newStatus },
    });

    await recordStatusChange(
      tx, voucherId, voucher.status, newStatus,
      `체크아웃. 잔여: ${remaining}박`, 'SYSTEM'
    );

    await tx.customer.update({
      where: { id: voucher.customerId },
      data: {
        totalStays: { increment: 1 },
        lastStayAt: new Date(),
      },
    });

    return updated;
  });
}

export async function processNoShow(voucherId: string, nightsCount: number) {
  return prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.findUniqueOrThrow({
      where: { id: voucherId },
    });

    const penalty = CANCELLATION_RULES.NO_SHOW_PENALTY_NIGHTS;
    const nightsToRestore = nightsCount - penalty;

    const updated = await tx.voucher.update({
      where: { id: voucherId },
      data: {
        heldNights: { decrement: nightsCount },
        usedNights: { increment: penalty },
      },
    });

    const remaining = updated.totalNights - updated.usedNights - updated.heldNights;
    const newStatus = remaining === 0 ? 'USED' : (updated.heldNights > 0 ? 'RESERVED' : 'ACTIVE');

    const finalVoucher = await tx.voucher.update({
      where: { id: voucherId },
      data: { status: newStatus },
    });

    await recordStatusChange(
      tx, voucherId, voucher.status, newStatus,
      `노쇼: ${penalty}박 패널티 차감, ${nightsToRestore}박 복원`, 'SYSTEM'
    );

    return finalVoucher;
  });
}

export async function expireVoucher(voucherId: string) {
  return prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.findUniqueOrThrow({
      where: { id: voucherId },
    });

    if (['USED', 'EXPIRED', 'REFUNDED'].includes(voucher.status)) {
      return voucher;
    }

    const updated = await tx.voucher.update({
      where: { id: voucherId },
      data: {
        status: 'EXPIRED',
        heldNights: 0,
      },
    });

    const remaining = voucher.totalNights - voucher.usedNights;
    await recordStatusChange(
      tx, voucherId, voucher.status, 'EXPIRED',
      `유효기간 만료. 미사용 ${remaining}박 소멸`, 'SYSTEM'
    );

    return updated;
  });
}

export async function refundVoucher(voucherId: string, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.findUniqueOrThrow({
      where: { id: voucherId },
      include: { payment: true },
    });

    if (!canTransition(voucher.status, 'REFUNDED')) {
      throw new Error(`환불할 수 없는 상태입니다: ${voucher.status}`);
    }

    if (voucher.heldNights > 0) {
      throw new Error('진행 중인 예약이 있습니다. 예약을 먼저 취소해주세요.');
    }

    const daysSincePurchase = differenceInCalendarDays(new Date(), voucher.issuedAt);
    const isFullRefundEligible = daysSincePurchase <= REFUND_RULES.FULL_REFUND_DAYS && voucher.usedNights === 0;

    let refundAmount: number;
    let reason: string;

    if (isFullRefundEligible) {
      refundAmount = voucher.purchasePrice;
      reason = `전액 환불 (구매 후 ${daysSincePurchase}일, 미사용)`;
    } else if (voucher.usedNights > 0) {
      const usedValue = voucher.usedNights * Math.ceil(voucher.purchasePrice / voucher.totalNights);
      refundAmount = Math.max(0, voucher.purchasePrice - usedValue);
      reason = `부분 환불: ${voucher.usedNights}/${voucher.totalNights}박 사용, 환불액 ${refundAmount}원`;
    } else {
      refundAmount = voucher.purchasePrice;
      reason = `전액 환불 요청`;
    }

    const updated = await tx.voucher.update({
      where: { id: voucherId },
      data: { status: 'REFUNDED' },
    });

    if (voucher.payment) {
      await tx.payment.update({
        where: { id: voucher.payment.id },
        data: {
          status: refundAmount === voucher.purchasePrice ? 'REFUNDED' : 'PARTIAL_REFUNDED',
          refundAmount,
          refundedAt: new Date(),
        },
      });
    }

    await recordStatusChange(tx, voucherId, voucher.status, 'REFUNDED', reason, 'CUSTOMER', actorId);

    return { voucher: updated, refundAmount, reason };
  });
}
