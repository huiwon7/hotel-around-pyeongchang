import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createReservationSchema } from '@/validators/reservation';
import { reserveNights } from '@/lib/voucher/voucher-engine';
import { checkAvailability, reserveQuota } from '@/lib/quota/quota-manager';
import { calculateNights } from '@/lib/utils/date';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');
  const voucherId = searchParams.get('voucherId');

  const where: Record<string, unknown> = {};

  if (phone) {
    const customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      return NextResponse.json({ error: '고객을 찾을 수 없습니다' }, { status: 404 });
    }
    where.customerId = customer.id;
  }

  if (voucherId) {
    where.voucherId = voucherId;
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      voucher: {
        include: { product: { select: { name: true, productCode: true } } },
      },
      customer: { select: { name: true, phone: true } },
    },
    orderBy: { checkInDate: 'desc' },
  });

  return NextResponse.json(reservations);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createReservationSchema.parse(body);

    const checkIn = new Date(validated.checkInDate);
    const checkOut = new Date(validated.checkOutDate);
    const nights = calculateNights(checkIn, checkOut);

    if (nights < 1) {
      return NextResponse.json({ error: '최소 1박 이상 예약해야 합니다' }, { status: 400 });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { id: validated.voucherId },
      include: { customer: true },
    });

    if (!voucher) {
      return NextResponse.json({ error: '바우처를 찾을 수 없습니다' }, { status: 404 });
    }

    const { available, totalSurcharge } = await checkAvailability(checkIn, checkOut);
    if (!available) {
      return NextResponse.json({ error: '선택한 날짜에 가용 객실이 없습니다' }, { status: 409 });
    }

    await reserveQuota(checkIn, checkOut);
    await reserveNights(voucher.id, nights, voucher.customerId);

    const reservation = await prisma.reservation.create({
      data: {
        voucherId: voucher.id,
        customerId: voucher.customerId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        nightsCount: nights,
        status: 'CONFIRMED',
        surchargeAmount: totalSurcharge,
      },
      include: {
        voucher: { include: { product: true } },
        customer: { select: { name: true, phone: true } },
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: '예약 생성 실패' }, { status: 500 });
  }
}
