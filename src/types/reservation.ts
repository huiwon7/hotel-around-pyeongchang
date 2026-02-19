import type { ReservationStatus } from '@/generated/prisma/client';

export interface ReservationWithRelations {
  id: string;
  voucherId: string;
  customerId: string;
  checkInDate: Date;
  checkOutDate: Date;
  nightsCount: number;
  roomType: string | null;
  status: ReservationStatus;
  surchargeAmount: number;
  surchargePaid: boolean;
  pmsReservationId: string | null;
  createdAt: Date;
  cancelledAt: Date | null;
  voucher: {
    voucherCode: string;
    product: {
      name: string;
      productCode: string;
    };
  };
  customer: {
    name: string;
    phone: string;
  };
}

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  CONFIRMED: '예약확정',
  CHECKED_IN: '체크인',
  COMPLETED: '투숙완료',
  CANCELLED: '취소됨',
  NO_SHOW: '노쇼',
};

export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-yellow-100 text-yellow-800',
};
