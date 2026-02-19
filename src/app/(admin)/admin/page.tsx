import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format } from 'date-fns';
import { formatKRW, formatNumber } from '@/lib/utils/currency';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = { title: '관리자 대시보드 | 호텔어라운드 평창' };

export default async function AdminDashboardPage() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    activeVouchers,
    monthlySales,
    monthlyRevenue,
    todayCheckIns,
    totalCustomers,
    recentVouchers,
    todayReservations,
  ] = await Promise.all([
    prisma.voucher.count({ where: { status: { in: ['ACTIVE', 'RESERVED', 'CHECKED_IN'] } } }),
    prisma.voucher.count({ where: { issuedAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.reservation.count({
      where: { checkInDate: { gte: todayStart, lte: todayEnd }, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
    }),
    prisma.customer.count(),
    prisma.voucher.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true } }, customer: { select: { name: true, phone: true } } },
    }),
    prisma.reservation.findMany({
      where: { checkInDate: { gte: todayStart, lte: todayEnd } },
      include: {
        customer: { select: { name: true, phone: true } },
        voucher: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const kpis = [
    { label: '활성 바우처', value: formatNumber(activeVouchers), color: 'text-green-600' },
    { label: `${format(now, 'M')}월 판매`, value: `${monthlySales}건`, color: 'text-blue-600' },
    { label: `${format(now, 'M')}월 매출`, value: formatKRW(monthlyRevenue._sum.amount || 0), color: 'text-primary' },
    { label: '오늘 체크인', value: `${todayCheckIns}건`, color: 'text-purple-600' },
    { label: '전체 고객', value: formatNumber(totalCustomers), color: 'text-muted' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Reservations */}
        <div className="bg-white rounded-xl border border-border">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center">
            <h2 className="font-bold">오늘 체크인 ({todayCheckIns}건)</h2>
            <Link href="/admin/reservations" className="text-sm text-primary hover:underline">전체 보기</Link>
          </div>
          <div className="p-4">
            {todayReservations.length === 0 ? (
              <p className="text-center text-muted py-6">오늘 체크인 예정이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {todayReservations.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{r.customer.name}</p>
                      <p className="text-xs text-muted">{r.voucher.product.name} / {r.nightsCount}박</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      r.status === 'CHECKED_IN' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {r.status === 'CHECKED_IN' ? '체크인 완료' : '대기'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Vouchers */}
        <div className="bg-white rounded-xl border border-border">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center">
            <h2 className="font-bold">최근 발행 바우처</h2>
            <Link href="/admin/vouchers" className="text-sm text-primary hover:underline">전체 보기</Link>
          </div>
          <div className="p-4">
            {recentVouchers.length === 0 ? (
              <p className="text-center text-muted py-6">발행된 바우처가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {recentVouchers.map(v => (
                  <div key={v.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm font-mono">{v.voucherCode}</p>
                      <p className="text-xs text-muted">{v.customer.name} / {v.product.name}</p>
                    </div>
                    <span className="text-sm font-medium">{formatKRW(v.purchasePrice)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
