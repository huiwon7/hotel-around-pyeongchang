import type { SeasonType } from '@/generated/prisma/client';

export interface QuotaInfo {
  date: string;
  maxVoucherRooms: number;
  reservedRooms: number;
  availableRooms: number;
  isBlackout: boolean;
  surchargePerNight: number;
  seasonType: SeasonType;
}

export const SEASON_LABELS: Record<SeasonType, string> = {
  PEAK: '최성수기',
  HIGH: '성수기',
  NORMAL: '일반',
  LOW: '비수기',
};

export const SEASON_COLORS: Record<SeasonType, string> = {
  PEAK: 'bg-red-500 text-white',
  HIGH: 'bg-orange-400 text-white',
  NORMAL: 'bg-green-500 text-white',
  LOW: 'bg-blue-400 text-white',
};
