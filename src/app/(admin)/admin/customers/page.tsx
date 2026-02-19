import { prisma } from '@/lib/prisma';
import { formatKRW } from '@/lib/utils/currency';

export const dynamic = 'force-dynamic';

export const metadata = { title: '고객 관리 | 호텔어라운드 평창' };

const SEGMENT_LABELS: Record<string, string> = {
  WORKATION: '워케이션', FAMILY: '가족', HEALING: '힐링',
  SKI: '스키', MICE: '기업', GENERAL: '일반',
};

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    take: 50,
    orderBy: { lifetimeValue: 'desc' },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">고객 관리</h1>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">이름</th>
                <th className="px-4 py-3 text-left font-medium text-muted">전화번호</th>
                <th className="px-4 py-3 text-left font-medium text-muted">세그먼트</th>
                <th className="px-4 py-3 text-left font-medium text-muted">구매</th>
                <th className="px-4 py-3 text-left font-medium text-muted">투숙</th>
                <th className="px-4 py-3 text-left font-medium text-muted">누적 금액</th>
                <th className="px-4 py-3 text-left font-medium text-muted">가입일</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-b border-border hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100">
                      {SEGMENT_LABELS[c.segment] || c.segment}
                    </span>
                  </td>
                  <td className="px-4 py-3">{c.totalPurchases}건</td>
                  <td className="px-4 py-3">{c.totalStays}회</td>
                  <td className="px-4 py-3">{formatKRW(c.lifetimeValue)}</td>
                  <td className="px-4 py-3 text-muted">{new Date(c.createdAt).toLocaleDateString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
