'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { formatKRW } from '@/lib/utils/currency';

interface ReservationDetail {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  nightsCount: number;
  status: string;
  surchargeAmount: number;
  createdAt: string;
  voucher: {
    voucherCode: string;
    product: { name: string };
  };
  customer: { name: string; phone: string };
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

export default function ReservationDetailPage({ params }: { params: Promise<{ reservationId: string }> }) {
  const { reservationId } = use(params);
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/reservations?id=${reservationId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReservation(data[0] || null);
        } else {
          setReservation(data);
        }
      })
      .catch(() => setError('예약 정보를 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  }, [reservationId]);

  async function handleCancel() {
    if (!confirm('정말 예약을 취소하시겠습니까?')) return;
    setCancelling(true);
    setError('');

    try {
      const res = await fetch(`/api/reservations/${reservationId}/cancel`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const updated = await res.json();
      setReservation(prev => prev ? { ...prev, status: updated.status || 'CANCELLED' } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '취소 실패');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-danger mb-4">{error || '예약을 찾을 수 없습니다'}</p>
        <Link href="/reservation" className="text-primary hover:underline">예약 목록으로 돌아가기</Link>
      </div>
    );
  }

  const canCancel = reservation.status === 'CONFIRMED';

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <Link href="/reservation" className="text-sm text-muted hover:text-primary mb-4 inline-block">&larr; 예약 목록</Link>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold">예약 상세</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[reservation.status] || 'bg-gray-100'}`}>
          {STATUS_LABELS[reservation.status] || reservation.status}
        </span>
      </div>

      <div className="bg-white border border-border rounded-xl p-6 mb-6">
        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">상품</span>
            <span className="font-medium">{reservation.voucher.product.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">바우처</span>
            <Link href={`/voucher/${reservation.voucher.voucherCode}`} className="font-mono text-primary hover:underline">
              {reservation.voucher.voucherCode}
            </Link>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">예약자</span>
            <span>{reservation.customer.name}</span>
          </div>
          <hr className="border-border" />
          <div className="flex justify-between">
            <span className="text-muted">체크인</span>
            <span className="font-medium">{new Date(reservation.checkInDate).toLocaleDateString('ko-KR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">체크아웃</span>
            <span className="font-medium">{new Date(reservation.checkOutDate).toLocaleDateString('ko-KR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">숙박</span>
            <span className="font-bold">{reservation.nightsCount}박</span>
          </div>
          {reservation.surchargeAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">성수기 추가요금</span>
              <span className="text-accent font-medium">{formatKRW(reservation.surchargeAmount)}</span>
            </div>
          )}
          <hr className="border-border" />
          <div className="flex justify-between">
            <span className="text-muted">예약일</span>
            <span>{new Date(reservation.createdAt).toLocaleDateString('ko-KR')}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full py-3 border border-danger text-danger rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
        >
          {cancelling ? '취소 처리 중...' : '예약 취소'}
        </button>
      )}
    </div>
  );
}
