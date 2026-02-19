import Link from 'next/link';

export const metadata = {
  title: '구매 완료 | 호텔어라운드 평창',
};

export default function PurchaseSuccessPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold mb-2">숙박권 구매 완료!</h1>
      <p className="text-muted mb-8">
        카카오 알림톡으로 바우처 번호와 QR코드가 발송됩니다.<br />
        내 바우처 페이지에서 예약을 진행해주세요.
      </p>

      <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left">
        <h2 className="font-bold mb-3">다음 단계</h2>
        <ol className="space-y-2 text-sm text-muted">
          <li className="flex gap-2">
            <span className="text-primary font-bold">1.</span>
            내 바우처 페이지에서 바우처를 확인하세요.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">2.</span>
            원하는 날짜를 선택하여 예약하세요.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">3.</span>
            체크인 시 QR코드를 제시해주세요.
          </li>
        </ol>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/voucher" className="block w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors">
          내 바우처 보기
        </Link>
        <Link href="/products" className="block w-full py-3 border border-border rounded-lg font-medium hover:bg-gray-50 transition-colors">
          더 둘러보기
        </Link>
      </div>
    </div>
  );
}
