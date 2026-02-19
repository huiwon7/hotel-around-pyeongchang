import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format } from 'date-fns';

export async function GET() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    totalActiveVouchers,
    monthlyVoucherSales,
    monthlyRevenue,
    todayCheckIns,
    todayReservations,
    vouchersByStatus,
    recentVouchers,
    salesByProduct,
  ] = await Promise.all([
    prisma.voucher.count({
      where: { status: { in: ['ACTIVE', 'RESERVED', 'CHECKED_IN'] } },
    }),
    prisma.voucher.count({
      where: { issuedAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.reservation.count({
      where: {
        checkInDate: { gte: todayStart, lte: todayEnd },
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      },
    }),
    prisma.reservation.findMany({
      where: {
        checkInDate: { gte: todayStart, lte: todayEnd },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        voucher: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.voucher.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.voucher.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, productCode: true } },
        customer: { select: { name: true, phone: true } },
      },
    }),
    prisma.voucher.groupBy({
      by: ['productId'],
      where: { issuedAt: { gte: monthStart, lte: monthEnd } },
      _count: { id: true },
      _sum: { purchasePrice: true },
    }),
  ]);

  return NextResponse.json({
    overview: {
      totalActiveVouchers,
      monthlyVoucherSales,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      todayCheckIns,
      currentMonth: format(now, 'yyyy년 M월'),
    },
    todayReservations,
    vouchersByStatus: Object.fromEntries(
      vouchersByStatus.map(v => [v.status, v._count.id])
    ),
    recentVouchers,
    salesByProduct,
  });
}
