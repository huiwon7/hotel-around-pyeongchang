'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { formatKRW } from '@/lib/utils/currency';

interface QuotaDay {
  date: string;
  availableRooms: number;
  isBlackout: boolean;
  surchargePerNight: number;
  seasonType: string;
}

export default function ReservePage({ params }: { params: Promise<{ voucherCode: string }> }) {
  const { voucherCode } = use(params);
  const router = useRouter();
  const [voucher, setVoucher] = useState<Record<string, unknown> | null>(null);
  const [quota, setQuota] = useState<QuotaDay[]>([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/vouchers?phone=&code=${voucherCode}`)
      .catch(() => {});
  }, [voucherCode]);

  useEffect(() => {
    const now = new Date();
    const from = now.toISOString().split('T')[0];
    const to = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    fetch(`/api/quota?from=${from}&to=${to}`)
      .then(res => res.json())
      .then(setQuota);
  }, []);

  const nights = checkIn && checkOut
    ? Math.max(0, Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const surcharge = checkIn && checkOut
    ? quota
        .filter(q => q.date >= checkIn && q.date < checkOut)
        .reduce((sum, q) => sum + q.surchargePerNight, 0)
    : 0;

  async function handleReserve() {
    if (!voucher && !checkIn) return;
    setLoading(true);
    setError('');

    try {
      const voucherRes = await fetch(`/api/vouchers?phone=`);
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherId: (voucher as Record<string, unknown>)?.id || '',
          checkInDate: checkIn,
          checkOutDate: checkOut,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      router.push('/reservation');
    } catch (err) {
      setError(err instanceof Error ? err.message : '예약 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">날짜 선택</h1>
      <p className="text-muted mb-8">바우처: {voucherCode}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">체크인</label>
          <input
            type="date"
            value={checkIn}
            onChange={e => setCheckIn(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">체크아웃</label>
          <input
            type="date"
            value={checkOut}
            onChange={e => setCheckOut(e.target.value)}
            min={checkIn || new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {nights > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-muted">숙박 기간</span>
            <span className="font-bold">{nights}박</span>
          </div>
          {surcharge > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted">성수기 추가요금</span>
              <span className="text-accent font-bold">{formatKRW(surcharge)} (현장 결제)</span>
            </div>
          )}
        </div>
      )}

      {/* Quota Calendar Mini */}
      <div className="mb-6">
        <h2 className="font-bold mb-3 text-sm">가용 현황 (향후 14일)</h2>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {quota.slice(0, 14).map(q => {
            const day = new Date(q.date).getDate();
            const isAvailable = q.availableRooms > 0 && !q.isBlackout;
            return (
              <div
                key={q.date}
                className={`text-center p-1.5 rounded ${
                  q.isBlackout ? 'bg-gray-800 text-white' :
                  q.availableRooms > 10 ? 'bg-green-100 text-green-800' :
                  q.availableRooms > 0 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}
                title={`${q.date}: ${q.availableRooms}실 가용`}
              >
                <div className="font-bold">{day}</div>
                <div>{isAvailable ? q.availableRooms : 'X'}</div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-muted">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 rounded" /> 여유</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 rounded" /> 부족</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded" /> 마감</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-800 rounded" /> 블랙아웃</span>
        </div>
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      <button
        onClick={handleReserve}
        disabled={!checkIn || !checkOut || nights < 1 || loading}
        className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '예약 중...' : `${nights}박 예약 확정`}
      </button>
    </div>
  );
}
