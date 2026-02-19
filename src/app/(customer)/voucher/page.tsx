'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatKRW } from '@/lib/utils/currency';

interface VoucherData {
  id: string;
  voucherCode: string;
  status: string;
  totalNights: number;
  usedNights: number;
  heldNights: number;
  remainingNights: number;
  purchasePrice: number;
  expiresAt: string;
  product: { name: string; productCode: string };
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '활성', RESERVED: '예약됨', CHECKED_IN: '투숙중',
  USED: '사용완료', EXPIRED: '만료', REFUNDED: '환불됨',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800', RESERVED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-purple-100 text-purple-800', USED: 'bg-gray-200 text-gray-600',
  EXPIRED: 'bg-red-100 text-red-800', REFUNDED: 'bg-yellow-100 text-yellow-800',
};

export default function VoucherListPage() {
  const [phone, setPhone] = useState('');
  const [vouchers, setVouchers] = useState<VoucherData[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const cleaned = phone.replace(/\D/g, '');
    const res = await fetch(`/api/vouchers?phone=${cleaned}`);
    if (res.ok) {
      setVouchers(await res.json());
    } else {
      setVouchers([]);
    }
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">내 바우처</h1>

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

      {searched && vouchers.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p className="mb-4">등록된 바우처가 없습니다.</p>
          <Link href="/products" className="text-primary font-medium hover:underline">
            숙박권 구매하기
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {vouchers.map(v => (
          <Link key={v.id} href={`/voucher/${v.voucherCode}`}>
            <div className="bg-white border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-lg">{v.product.name}</p>
                  <p className="text-sm text-muted font-mono">{v.voucherCode}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[v.status] || 'bg-gray-100'}`}>
                  {STATUS_LABELS[v.status] || v.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted mb-3">
                <span>{formatKRW(v.purchasePrice)}</span>
                <span>만료: {new Date(v.expiresAt).toLocaleDateString('ko-KR')}</span>
              </div>

              {/* Nights Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-3 mb-1">
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div className="bg-gray-400" style={{ width: `${(v.usedNights / v.totalNights) * 100}%` }} />
                  <div className="bg-blue-400" style={{ width: `${(v.heldNights / v.totalNights) * 100}%` }} />
                  <div className="bg-green-400" style={{ width: `${(v.remainingNights / v.totalNights) * 100}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>사용 {v.usedNights}박 / 예약 {v.heldNights}박 / 잔여 {v.remainingNights}박</span>
                <span>총 {v.totalNights}박</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
