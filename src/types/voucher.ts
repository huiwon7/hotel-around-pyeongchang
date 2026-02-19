import type { VoucherStatus, SalesChannel } from '@/generated/prisma/client';

export interface VoucherWithRelations {
  id: string;
  voucherCode: string;
  customerId: string;
  productId: string;
  channel: SalesChannel;
  status: VoucherStatus;
  totalNights: number;
  usedNights: number;
  heldNights: number;
  remainingNights: number;
  purchasePrice: number;
  issuedAt: Date;
  activatedAt: Date | null;
  expiresAt: Date;
  qrCodeData: string | null;
  giftFlag: boolean;
  product: {
    productCode: string;
    name: string;
    totalNights: number;
    benefits: unknown;
  };
  customer: {
    name: string;
    phone: string;
  };
  reservations: {
    id: string;
    checkInDate: Date;
    checkOutDate: Date;
    nightsCount: number;
    status: string;
  }[];
}

export function getRemainingNights(voucher: { totalNights: number; usedNights: number; heldNights: number }) {
  return voucher.totalNights - voucher.usedNights - voucher.heldNights;
}

export const VOUCHER_STATUS_LABELS: Record<VoucherStatus, string> = {
  ISSUED: '발행됨',
  ACTIVE: '활성',
  RESERVED: '예약됨',
  CHECKED_IN: '투숙중',
  USED: '사용완료',
  EXPIRED: '만료',
  REFUNDED: '환불됨',
};

export const VOUCHER_STATUS_COLORS: Record<VoucherStatus, string> = {
  ISSUED: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  RESERVED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-purple-100 text-purple-800',
  USED: 'bg-gray-300 text-gray-600',
  EXPIRED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-yellow-100 text-yellow-800',
};
