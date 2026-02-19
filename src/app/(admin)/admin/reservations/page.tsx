import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = { title: '예약 관리 | 호텔어라운드 평창' };

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: '예약확정', CHECKED_IN: '체크인', COMPLETED: '투숙완료',
  CANCELLED: '취소', NO_SHOW: '노쇼',
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-blue-100 text-blue-800', CHECKED_IN: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800', CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-yellow-100 text-yellow-800',
};

export default async function AdminReservationsPage() {
  const reservations = await prisma.reservation.findMany({
    take: 50,
    orderBy: { checkInDate: 'desc' },
    include: {
      customer: { select: { name: true, phone: true } },
      voucher: { include: { product: { select: { name: true } } } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">예약 관리</h1>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">고객</th>
                <th className="px-4 py-3 text-left font-medium text-muted">상품</th>
                <th className="px-4 py-3 text-left font-medium text-muted">체크인</th>
                <th className="px-4 py-3 text-left font-medium text-muted">체크아웃</th>
                <th className="px-4 py-3 text-left font-medium text-muted">박수</th>
                <th className="px-4 py-3 text-left font-medium text-muted">상태</th>
                <th className="px-4 py-3 text-left font-medium text-muted">추가요금</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => (
                <tr key={r.id} className="border-b border-border hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>{r.customer.name}</div>
                    <div className="text-xs text-muted">{r.customer.phone}</div>
                  </td>
                  <td className="px-4 py-3">{r.voucher.product.name}</td>
                  <td className="px-4 py-3">{new Date(r.checkInDate).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-3">{new Date(r.checkOutDate).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-3">{r.nightsCount}박</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {r.surchargeAmount > 0 ? `${r.surchargeAmount.toLocaleString()}원` : '-'}
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
