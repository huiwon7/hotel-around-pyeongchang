import { prisma } from '@/lib/prisma';
import { formatKRW } from '@/lib/utils/currency';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = { title: '바우처 관리 | 호텔어라운드 평창' };

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '활성', RESERVED: '예약됨', CHECKED_IN: '투숙중',
  USED: '사용완료', EXPIRED: '만료', REFUNDED: '환불됨', ISSUED: '발행됨',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800', RESERVED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-purple-100 text-purple-800', USED: 'bg-gray-200 text-gray-600',
  EXPIRED: 'bg-red-100 text-red-800', REFUNDED: 'bg-yellow-100 text-yellow-800',
  ISSUED: 'bg-gray-100 text-gray-800',
};

export default async function AdminVouchersPage() {
  const vouchers = await prisma.voucher.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { name: true, productCode: true } },
      customer: { select: { name: true, phone: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">바우처 관리</h1>
        <span className="text-sm text-muted">총 {vouchers.length}건</span>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">바우처 코드</th>
                <th className="px-4 py-3 text-left font-medium text-muted">고객</th>
                <th className="px-4 py-3 text-left font-medium text-muted">상품</th>
                <th className="px-4 py-3 text-left font-medium text-muted">상태</th>
                <th className="px-4 py-3 text-left font-medium text-muted">박수</th>
                <th className="px-4 py-3 text-left font-medium text-muted">금액</th>
                <th className="px-4 py-3 text-left font-medium text-muted">만료일</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map(v => (
                <tr key={v.id} className="border-b border-border hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <Link href={`/admin/vouchers/${v.id}`} className="font-mono text-primary hover:underline">
                      {v.voucherCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{v.customer.name}</div>
                    <div className="text-xs text-muted">{v.customer.phone}</div>
                  </td>
                  <td className="px-4 py-3">{v.product.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[v.status]}`}>
                      {STATUS_LABELS[v.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted">{v.usedNights}</span>
                    <span className="text-muted">/</span>
                    <span>{v.totalNights}</span>
                  </td>
                  <td className="px-4 py-3">{formatKRW(v.purchasePrice)}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(v.expiresAt).toLocaleDateString('ko-KR')}
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
