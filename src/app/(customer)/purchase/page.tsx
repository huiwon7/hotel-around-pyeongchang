'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { formatKRW } from '@/lib/utils/currency';

interface Product {
  productCode: string;
  name: string;
  price: number;
  totalNights: number;
  validityDays: number;
  benefits: string[];
}

function PurchaseForm() {
  const searchParams = useSearchParams();
  const productCode = searchParams.get('product') || 'HS';

  const [product, setProduct] = useState<Product | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', email: '', marketingConsent: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/products/${productCode}`)
      .then(res => res.json())
      .then(setProduct);
  }, [productCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCode,
          customerName: form.name,
          customerPhone: form.phone.replace(/-/g, ''),
          customerEmail: form.email || undefined,
          marketingConsent: form.marketingConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // In production, this would redirect to Toss Payments widget
      // For MVP, simulate payment success
      setStep(3);
      sessionStorage.setItem('pendingPayment', JSON.stringify(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 초기화에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  if (!product) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-primary' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Step 1: Product Summary */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted">선택 상품</p>
            <p className="font-bold">{product.name} ({product.totalNights}박)</p>
          </div>
          <p className="text-xl font-bold text-primary">{formatKRW(product.price)}</p>
        </div>
      </div>

      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
          <h2 className="text-xl font-bold mb-6">구매자 정보</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">이름 *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">휴대전화 *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="01012345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="example@email.com"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.marketingConsent}
                onChange={e => setForm(f => ({ ...f, marketingConsent: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-muted">마케팅 정보 수신에 동의합니다 (선택)</span>
            </label>
          </div>
          <button
            type="submit"
            className="w-full mt-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
          >
            다음
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-6">결제 확인</h2>
          <div className="bg-white border border-border rounded-xl p-6 mb-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">상품</span><span>{product.name}</span></div>
              <div className="flex justify-between"><span className="text-muted">박수</span><span>{product.totalNights}박</span></div>
              <div className="flex justify-between"><span className="text-muted">유효기간</span><span>{product.validityDays / 30}개월</span></div>
              <div className="flex justify-between"><span className="text-muted">구매자</span><span>{form.name}</span></div>
              <div className="flex justify-between"><span className="text-muted">연락처</span><span>{form.phone}</span></div>
              <hr className="border-border" />
              <div className="flex justify-between text-lg font-bold">
                <span>결제 금액</span><span className="text-primary">{formatKRW(product.price)}</span>
              </div>
            </div>
          </div>
          {error && <p className="text-danger text-sm mb-4">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-border rounded-lg font-medium hover:bg-gray-50">
              이전
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50">
              {loading ? '처리 중...' : `${formatKRW(product.price)} 결제하기`}
            </button>
          </div>
          <p className="text-xs text-muted text-center mt-4">
            결제 시 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
          </p>
        </form>
      )}

      {step === 3 && (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">i</div>
          <h2 className="text-xl font-bold mb-2">결제 페이지로 이동합니다</h2>
          <p className="text-muted mb-6">토스페이먼츠 결제창이 열립니다.<br/>테스트 모드에서는 결제가 시뮬레이션됩니다.</p>
          <a href="/purchase/success" className="inline-block px-8 py-3 bg-primary text-white rounded-lg font-bold">
            결제 완료 (테스트)
          </a>
        </div>
      )}
    </div>
  );
}

export default function PurchasePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
      <PurchaseForm />
    </Suspense>
  );
}
