import type { CustomerSegment } from '@/generated/prisma/client';

export interface CustomerWithStats {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  segment: CustomerSegment;
  totalPurchases: number;
  totalStays: number;
  lifetimeValue: number;
  firstPurchaseAt: Date | null;
  lastStayAt: Date | null;
  marketingConsent: boolean;
  createdAt: Date;
}

export const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  WORKATION: '워케이션',
  FAMILY: '가족',
  HEALING: '힐링/명상',
  SKI: '스키/액티비티',
  MICE: '기업(MICE)',
  GENERAL: '일반',
};
