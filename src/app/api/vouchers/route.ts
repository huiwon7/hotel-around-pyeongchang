import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');
  const status = searchParams.get('status');

  if (!phone) {
    return NextResponse.json({ error: '전화번호가 필요합니다' }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) {
    return NextResponse.json({ error: '고객을 찾을 수 없습니다' }, { status: 404 });
  }

  const where: Record<string, unknown> = { customerId: customer.id };
  if (status) {
    where.status = status;
  }

  const vouchers = await prisma.voucher.findMany({
    where,
    include: {
      product: true,
      reservations: {
        where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
        orderBy: { checkInDate: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = vouchers.map(v => ({
    ...v,
    remainingNights: v.totalNights - v.usedNights - v.heldNights,
  }));

  return NextResponse.json(result);
}
