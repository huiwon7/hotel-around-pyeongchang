import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkIn } from '@/lib/voucher/voucher-engine';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const { reservationId } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 });
    }

    if (reservation.status !== 'CONFIRMED') {
      return NextResponse.json({ error: '체크인할 수 없는 예약 상태입니다' }, { status: 400 });
    }

    await checkIn(reservation.voucherId, reservation.nightsCount);

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CHECKED_IN' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: '체크인 처리 실패' }, { status: 500 });
  }
}
