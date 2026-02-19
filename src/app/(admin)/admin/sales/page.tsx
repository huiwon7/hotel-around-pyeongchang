import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { formatKRW, formatNumber } from '@/lib/utils/currency';

export const dynamic = 'force-dynamic';

export const metadata = { title: '매출 리포트 | 호텔어라운드 평창' };

export default async function AdminSalesPage() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [monthlyPayments, productSales, totalStats] = await Promise.all([
    prisma.payment.findMany({
      where: { status: 'COMPLETED', paidAt: { gte: monthStart, lte: monthEnd } },
      orderBy: { paidAt: 'desc' },
    }),
    prisma.voucher.groupBy({
      by: ['productId'],
      where: { issuedAt: { gte: monthStart, lte: monthEnd } },
      _count: { id: true },
      _sum: { purchasePrice: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const products = await prisma.product.findMany();
  const productMap = new Map(products.map(p => [p.id, p]));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">매출 리포트 - {format(now, 'yyyy년 M월')}</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-border p-6">
          <p className="text-sm text-muted mb-1">월 매출</p>
          <p className="text-3xl font-bold text-primary">{formatKRW(totalStats._sum.amount || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-6">
          <p className="text-sm text-muted mb-1">결제 건수</p>
          <p className="text-3xl font-bold">{formatNumber(totalStats._count.id)}건</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-6">
          <p className="text-sm text-muted mb-1">건당 평균</p>
          <p className="text-3xl font-bold">
            {totalStats._count.id > 0
              ? formatKRW(Math.round((totalStats._sum.amount || 0) / totalStats._count.id))
              : '0원'}
          </p>
        </div>
      </div>

      {/* Product Breakdown */}
      <div className="bg-white rounded-xl border border-border mb-8">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-bold">상품별 판매</h2>
        </div>
        <div className="p-6">
          {productSales.length === 0 ? (
            <p className="text-center text-muted py-6">이번 달 판매 데이터가 없습니다</p>
          ) : (
            <div className="space-y-4">
              {productSales.map(ps => {
                const product = productMap.get(ps.productId);
                return (
                  <div key={ps.productId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{product?.name || '알 수 없음'}</span>
                      <span className="text-sm text-muted">{ps._count.id}건</span>
                    </div>
                    <span className="font-bold">{formatKRW(ps._sum.purchasePrice || 0)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-bold">최근 결제 내역</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">주문번호</th>
                <th className="px-4 py-3 text-left font-medium text-muted">고객</th>
                <th className="px-4 py-3 text-left font-medium text-muted">상품</th>
                <th className="px-4 py-3 text-left font-medium text-muted">금액</th>
                <th className="px-4 py-3 text-left font-medium text-muted">결제일</th>
              </tr>
            </thead>
            <tbody>
              {monthlyPayments.slice(0, 20).map(p => (
                <tr key={p.id} className="border-b border-border">
                  <td className="px-4 py-3 font-mono text-xs">{p.tossOrderId}</td>
                  <td className="px-4 py-3">{p.customerName}</td>
                  <td className="px-4 py-3">{p.productName}</td>
                  <td className="px-4 py-3 font-medium">{formatKRW(p.amount)}</td>
                  <td className="px-4 py-3 text-muted">
                    {p.paidAt ? new Date(p.paidAt).toLocaleString('ko-KR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
