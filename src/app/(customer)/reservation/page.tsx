'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatKRW } from '@/lib/utils/currency';

interface Reservation {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  nightsCount: number;
  status: string;
  surchargeAmount: number;
  voucher: { voucherCode: string; product: { name: string } };
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: '예약확정', CHECKED_IN: '체크인', COMPLETED: '투숙완료',
  CANCELLED: '취소', NO_SHOW: '노쇼',
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-blue-100 text-blue-800', CHECKED_IN: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800', CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-yellow-100 text-yellow-800',
};

export default function ReservationListPage() {
  const [phone, setPhone] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const cleaned = phone.replace(/\D/g, '');
    try {
      const res = await fetch(`/api/reservations?phone=${cleaned}`);
      if (res.ok) {
        setReservations(await res.json());
      } else {
        setReservations([]);
      }
    } catch {
      setReservations([]);
    }
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">예약 확인</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="구매 시 입력한 전화번호"
          className="flex-1 px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? '조회 중...' : '조회'}
        </button>
      </form>

      {searched && reservations.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p className="mb-4">예약 내역이 없습니다.</p>
          <Link href="/voucher" className="text-primary font-medium hover:underline">
            내 바우처에서 예약하기
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {reservations.map(r => (
          <Link key={r.id} href={`/reservation/${r.id}`}>
            <div className="bg-white border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold">{r.voucher.product.name}</p>
                  <p className="text-sm text-muted font-mono">{r.voucher.voucherCode}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-gray-100'}`}>
                  {STATUS_LABELS[r.status] || r.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span>
                  {new Date(r.checkInDate).toLocaleDateString('ko-KR')} ~ {new Date(r.checkOutDate).toLocaleDateString('ko-KR')}
                </span>
                <span className="text-muted">{r.nightsCount}박</span>
                {r.surchargeAmount > 0 && (
                  <span className="text-accent">추가요금 {formatKRW(r.surchargeAmount)}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
