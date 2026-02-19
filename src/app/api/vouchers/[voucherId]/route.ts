import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ voucherId: string }> }
) {
  const { voucherId } = await params;

  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
    include: {
      product: true,
      customer: { select: { name: true, phone: true, email: true } },
      payment: { select: { amount: true, method: true, paidAt: true, status: true } },
      reservations: { orderBy: { checkInDate: 'desc' } },
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!voucher) {
    return NextResponse.json({ error: '바우처를 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json({
    ...voucher,
    remainingNights: voucher.totalNights - voucher.usedNights - voucher.heldNights,
  });
}
