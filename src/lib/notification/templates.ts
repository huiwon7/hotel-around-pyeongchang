import { sendAlimtalk } from './kakao-client';
import { formatKRW } from '@/lib/utils/currency';

export async function sendPurchaseConfirmation(params: {
  phone: string;
  customerName: string;
  productName: string;
  totalNights: number;
  amount: number;
  voucherCode: string;
  expiresAt: Date;
}) {
  return sendAlimtalk({
    type: 'PURCHASE_CONFIRM',
    templateCode: 'HAP_PURCHASE_CONFIRM',
    recipientPhone: params.phone,
    recipientName: params.customerName,
    variables: {
      customerName: params.customerName,
      productName: params.productName,
      totalNights: String(params.totalNights),
      amount: formatKRW(params.amount),
      voucherCode: params.voucherCode,
      expiresAt: params.expiresAt.toLocaleDateString('ko-KR'),
    },
  });
}

export async function sendReservationConfirmation(params: {
  phone: string;
  customerName: string;
  productName: string;
  checkInDate: string;
  checkOutDate: string;
  nightsCount: number;
  surcharge: number;
}) {
  return sendAlimtalk({
    type: 'RESERVATION_CONFIRM',
    templateCode: 'HAP_RESERVATION_CONFIRM',
    recipientPhone: params.phone,
    recipientName: params.customerName,
    variables: {
      customerName: params.customerName,
      productName: params.productName,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      nightsCount: String(params.nightsCount),
      surcharge: params.surcharge > 0 ? formatKRW(params.surcharge) : '없음',
    },
  });
}

export async function sendCancellationNotice(params: {
  phone: string;
  customerName: string;
  checkInDate: string;
  nightsPenalty: number;
}) {
  return sendAlimtalk({
    type: 'RESERVATION_CANCEL',
    templateCode: 'HAP_CANCEL_NOTICE',
    recipientPhone: params.phone,
    recipientName: params.customerName,
    variables: {
      customerName: params.customerName,
      checkInDate: params.checkInDate,
      nightsPenalty: params.nightsPenalty > 0 ? `${params.nightsPenalty}박 차감` : '패널티 없음',
    },
  });
}

export async function sendCheckInReminder(params: {
  phone: string;
  customerName: string;
  checkInDate: string;
  productName: string;
}) {
  return sendAlimtalk({
    type: 'CHECK_IN_REMINDER',
    templateCode: 'HAP_CHECKIN_REMINDER',
    recipientPhone: params.phone,
    recipientName: params.customerName,
    variables: {
      customerName: params.customerName,
      checkInDate: params.checkInDate,
      productName: params.productName,
    },
  });
}

export async function sendRefundNotice(params: {
  phone: string;
  customerName: string;
  voucherCode: string;
  refundAmount: number;
}) {
  return sendAlimtalk({
    type: 'PURCHASE_CONFIRM',
    templateCode: 'HAP_REFUND_NOTICE',
    recipientPhone: params.phone,
    recipientName: params.customerName,
    variables: {
      customerName: params.customerName,
      voucherCode: params.voucherCode,
      refundAmount: formatKRW(params.refundAmount),
    },
  });
}
