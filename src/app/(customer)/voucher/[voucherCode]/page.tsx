'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { formatKRW } from '@/lib/utils/currency';

interface VoucherDetail {
  id: string;
  voucherCode: string;
  status: string;
  totalNights: number;
  usedNights: number;
  heldNights: number;
  remainingNights: number;
  purchasePrice: number;
  issuedAt: string;
  expiresAt: string;
  product: { name: string; productCode: string };
  customer: { name: string; phone: string };
  reservations: Array<{
    id: string;
    checkInDate: string;
    checkOutDate: string;
    nightsCount: number;
    status: string;
    surchargeAmount: number;
  }>;
}

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

const RES_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: '예약확정', CHECKED_IN: '체크인', COMPLETED: '투숙완료',
  CANCELLED: '취소', NO_SHOW: '노쇼',
};

export default function VoucherDetailPage({ params }: { params: Promise<{ voucherCode: string }> }) {
  const { voucherCode } = use(params);
  const [voucher, setVoucher] = useState<VoucherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchVoucher() {
      try {
        const res = await fetch(`/api/vouchers?phone=&code=${voucherCode}`);
        if (!res.ok) throw new Error('바우처를 찾을 수 없습니다');
        const vouchers = await res.json();
        const found = vouchers.find((v: VoucherDetail) => v.voucherCode === voucherCode);
        if (!found) throw new Error('바우처를 찾을 수 없습니다');

        const detailRes = await fetch(`/api/vouchers/${found.id}`);
        if (!detailRes.ok) throw new Error('바우처 상세 조회 실패');
        setVoucher(await detailRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : '조회 실패');
      } finally {
        setLoading(false);
      }
    }
    fetchVoucher();
  }, [voucherCode]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-danger mb-4">{error || '바우처를 찾을 수 없습니다'}</p>
        <Link href="/voucher" className="text-primary hover:underline">내 바우처로 돌아가기</Link>
      </div>
    );
  }

  const canReserve = ['ACTIVE', 'RESERVED'].includes(voucher.status) && voucher.remainingNights > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-muted mb-1">{voucher.product.name}</p>
          <h1 className="text-2xl font-bold font-mono">{voucher.voucherCode}</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[voucher.status] || 'bg-gray-100'}`}>
          {STATUS_LABELS[voucher.status] || voucher.status}
        </span>
      </div>

      {/* Nights Progress */}
      <div className="bg-white border border-border rounded-xl p-6 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted">박수 현황</span>
          <span className="font-medium">총 {voucher.totalNights}박</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 mb-3">
          <div className="flex h-4 rounded-full overflow-hidden">
            <div className="bg-gray-400" style={{ width: `${(voucher.usedNights / voucher.totalNights) * 100}%` }} title={`사용 ${voucher.usedNights}박`} />
            <div className="bg-blue-400" style={{ width: `${(voucher.heldNights / voucher.totalNights) * 100}%` }} title={`예약 ${voucher.heldNights}박`} />
            <div className="bg-green-400" style={{ width: `${(voucher.remainingNights / voucher.totalNights) * 100}%` }} title={`잔여 ${voucher.remainingNights}박`} />
          </div>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-400 rounded" /> 사용 {voucher.usedNights}박</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded" /> 예약 {voucher.heldNights}박</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded" /> 잔여 {voucher.remainingNights}박</span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white border border-border rounded-xl p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted mb-1">구매자</p>
            <p className="font-medium">{voucher.customer.name}</p>
          </div>
          <div>
            <p className="text-muted mb-1">구매 금액</p>
            <p className="font-medium">{formatKRW(voucher.purchasePrice)}</p>
          </div>
          <div>
            <p className="text-muted mb-1">발행일</p>
            <p className="font-medium">{new Date(voucher.issuedAt).toLocaleDateString('ko-KR')}</p>
          </div>
          <div>
            <p className="text-muted mb-1">만료일</p>
            <p className="font-medium">{new Date(voucher.expiresAt).toLocaleDateString('ko-KR')}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {canReserve && (
        <Link
          href={`/voucher/${voucher.voucherCode}/reserve`}
          className="block w-full text-center py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors mb-6"
        >
          예약하기 (잔여 {voucher.remainingNights}박)
        </Link>
      )}

      {/* Reservation History */}
      {voucher.reservations && voucher.reservations.length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-bold">예약 이력</h2>
          </div>
          <div className="divide-y divide-border">
            {voucher.reservations.map(r => (
              <div key={r.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">
                    {new Date(r.checkInDate).toLocaleDateString('ko-KR')} ~ {new Date(r.checkOutDate).toLocaleDateString('ko-KR')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                    r.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                    r.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {RES_STATUS_LABELS[r.status] || r.status}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-muted">
                  <span>{r.nightsCount}박</span>
                  {r.surchargeAmount > 0 && <span>추가요금 {formatKRW(r.surchargeAmount)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
