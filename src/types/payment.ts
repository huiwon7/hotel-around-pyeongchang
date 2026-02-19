import type { PaymentStatus, PaymentMethod } from '@/generated/prisma/client';

export interface PaymentInitRequest {
  productCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  marketingConsent: boolean;
}

export interface PaymentInitResponse {
  orderId: string;
  amount: number;
  productName: string;
  customerName: string;
}

export interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface PaymentConfirmResponse {
  success: boolean;
  voucherCode?: string;
  error?: string;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: '대기중',
  COMPLETED: '완료',
  FAILED: '실패',
  CANCELLED: '취소',
  REFUNDED: '환불',
  PARTIAL_REFUNDED: '부분환불',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: '카드',
  EASY_PAY: '간편결제',
  VIRTUAL_ACCOUNT: '가상계좌',
  TRANSFER: '계좌이체',
};
