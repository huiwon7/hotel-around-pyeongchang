import { prisma } from '@/lib/prisma';
import { eachDayOfInterval, addDays, format } from 'date-fns';
import type { QuotaInfo } from '@/types/quota';

export async function getQuotaRange(from: Date, to: Date): Promise<QuotaInfo[]> {
  const quotas = await prisma.dailyQuota.findMany({
    where: {
      quotaDate: { gte: from, lte: to },
    },
    orderBy: { quotaDate: 'asc' },
  });

  return quotas.map(q => ({
    date: format(q.quotaDate, 'yyyy-MM-dd'),
    maxVoucherRooms: q.maxVoucherRooms,
    reservedRooms: q.reservedRooms,
    availableRooms: q.maxVoucherRooms - q.reservedRooms,
    isBlackout: q.isBlackout,
    surchargePerNight: q.surchargePerNight,
    seasonType: q.seasonType,
  }));
}

export async function checkAvailability(checkIn: Date, checkOut: Date): Promise<{
  available: boolean;
  dates: QuotaInfo[];
  totalSurcharge: number;
}> {
  const stayDates = eachDayOfInterval({
    start: checkIn,
    end: addDays(checkOut, -1),
  });

  const quotas = await prisma.dailyQuota.findMany({
    where: {
      quotaDate: { in: stayDates },
    },
  });

  const quotaMap = new Map(quotas.map(q => [format(q.quotaDate, 'yyyy-MM-dd'), q]));
  const dates: QuotaInfo[] = [];
  let totalSurcharge = 0;
  let allAvailable = true;

  for (const date of stayDates) {
    const key = format(date, 'yyyy-MM-dd');
    const quota = quotaMap.get(key);

    if (!quota) {
      allAvailable = false;
      dates.push({
        date: key,
        maxVoucherRooms: 0,
        reservedRooms: 0,
        availableRooms: 0,
        isBlackout: false,
        surchargePerNight: 0,
        seasonType: 'NORMAL',
      });
      continue;
    }

    if (quota.isBlackout) {
      allAvailable = false;
    }

    const available = quota.maxVoucherRooms - quota.reservedRooms;
    if (available <= 0) {
      allAvailable = false;
    }

    totalSurcharge += quota.surchargePerNight;
    dates.push({
      date: key,
      maxVoucherRooms: quota.maxVoucherRooms,
      reservedRooms: quota.reservedRooms,
      availableRooms: available,
      isBlackout: quota.isBlackout,
      surchargePerNight: quota.surchargePerNight,
      seasonType: quota.seasonType,
    });
  }

  return { available: allAvailable, dates, totalSurcharge };
}

export async function reserveQuota(checkIn: Date, checkOut: Date): Promise<void> {
  const stayDates = eachDayOfInterval({
    start: checkIn,
    end: addDays(checkOut, -1),
  });

  await prisma.$transaction(async (tx) => {
    for (const date of stayDates) {
      const quota = await tx.$queryRaw<Array<{
        quota_date: Date;
        max_voucher_rooms: number;
        reserved_rooms: number;
        is_blackout: boolean;
      }>>`
        SELECT * FROM daily_quotas
        WHERE quota_date = ${date}::date
        FOR UPDATE
      `;

      if (!quota[0]) {
        throw new Error(`${format(date, 'yyyy-MM-dd')} 날짜의 쿼터 정보가 없습니다`);
      }

      if (quota[0].is_blackout) {
        throw new Error(`${format(date, 'yyyy-MM-dd')}은 블랙아웃 기간입니다`);
      }

      const available = quota[0].max_voucher_rooms - quota[0].reserved_rooms;
      if (available <= 0) {
        throw new Error(`${format(date, 'yyyy-MM-dd')} 날짜의 잔여 객실이 없습니다`);
      }

      await tx.dailyQuota.update({
        where: { quotaDate: date },
        data: { reservedRooms: { increment: 1 } },
      });
    }
  });
}

export async function releaseQuota(checkIn: Date, checkOut: Date): Promise<void> {
  const stayDates = eachDayOfInterval({
    start: checkIn,
    end: addDays(checkOut, -1),
  });

  await prisma.$transaction(async (tx) => {
    for (const date of stayDates) {
      await tx.dailyQuota.update({
        where: { quotaDate: date },
        data: {
          reservedRooms: { decrement: 1 },
        },
      });
    }
  });
}
