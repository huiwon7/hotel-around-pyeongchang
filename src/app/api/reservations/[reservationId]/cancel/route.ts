import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cancelReservationNights } from '@/lib/voucher/voucher-engine';
import { releaseQuota } from '@/lib/quota/quota-manager';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const { reservationId } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { voucher: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 });
    }

    if (reservation.status !== 'CONFIRMED') {
      return NextResponse.json({ error: '취소할 수 없는 예약 상태입니다' }, { status: 400 });
    }

    await releaseQuota(reservation.checkInDate, reservation.checkOutDate);

    const result = await cancelReservationNights(
      reservation.voucherId,
      reservation.nightsCount,
      reservation.checkInDate
    );

    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      penalty: result.penalty,
      nightsRestored: result.nightsRestored,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: '예약 취소 실패' }, { status: 500 });
  }
}
