import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processNoShow } from '@/lib/voucher/voucher-engine';
import { releaseQuota } from '@/lib/quota/quota-manager';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function POST() {
  const yesterday = subDays(new Date(), 1);
  const dayStart = startOfDay(yesterday);
  const dayEnd = endOfDay(yesterday);

  const noShows = await prisma.reservation.findMany({
    where: {
      checkInDate: { gte: dayStart, lte: dayEnd },
      status: 'CONFIRMED',
    },
  });

  const results = [];
  for (const reservation of noShows) {
    try {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: 'NO_SHOW' },
      });

      await processNoShow(reservation.voucherId, reservation.nightsCount);
      await releaseQuota(reservation.checkInDate, reservation.checkOutDate);

      results.push({ reservationId: reservation.id, success: true });
    } catch (error) {
      results.push({
        reservationId: reservation.id,
        success: false,
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}
