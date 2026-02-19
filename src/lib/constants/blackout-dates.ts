import type { SeasonType } from '@/generated/prisma/client';

export interface SeasonPeriod {
  name: string;
  fromMonth: number;
  fromDay: number;
  toMonth: number;
  toDay: number;
  seasonType: SeasonType;
  surchargePerNight: number;
  maxRooms: number;
  crossYear?: boolean;
}

export const SEASON_PERIODS: SeasonPeriod[] = [
  {
    name: '연말연시',
    fromMonth: 12,
    fromDay: 22,
    toMonth: 1,
    toDay: 3,
    seasonType: 'PEAK',
    surchargePerNight: 30000,
    maxRooms: 15,
    crossYear: true,
  },
  {
    name: '여름성수기',
    fromMonth: 7,
    fromDay: 20,
    toMonth: 8,
    toDay: 15,
    seasonType: 'PEAK',
    surchargePerNight: 30000,
    maxRooms: 20,
  },
];

export const LUNAR_HOLIDAYS_2026 = {
  seollal: { from: '2026-02-16', to: '2026-02-18' },
  chuseok: { from: '2026-10-04', to: '2026-10-06' },
};

export const LUNAR_HOLIDAYS_2027 = {
  seollal: { from: '2027-02-05', to: '2027-02-07' },
  chuseok: { from: '2027-09-23', to: '2027-09-25' },
};
