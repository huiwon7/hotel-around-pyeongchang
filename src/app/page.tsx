import Link from 'next/link';
import CustomerHeader from '@/components/layout/customer-header';
import CustomerFooter from '@/components/layout/customer-footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <CustomerHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
          <div className="max-w-5xl mx-auto px-4 py-20 md:py-32">
            <div className="max-w-2xl">
              <p className="text-blue-200 text-sm font-medium mb-4">호텔어라운드 평창</p>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
                모바일 숙박권으로<br />
                <span className="text-blue-300">합리적인 평창 스테이</span>
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed mb-8">
                선결제 바우처로 최대 33% 할인된 가격에 원하는 날짜에 자유롭게 예약하세요.
                2박부터 30박까지, 당신의 라이프스타일에 맞는 패키지를 선택하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-900 font-bold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  숙박권 보기
                </Link>
                <Link
                  href="/voucher"
                  className="inline-flex items-center justify-center px-6 py-3 border border-white/30 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
                >
                  내 바우처 확인
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">왜 숙박권인가요?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">%</div>
              <h3 className="font-bold mb-2">최대 33% 할인</h3>
              <p className="text-sm text-muted">선결제 바우처로 1박당 33,000원부터. 장기 투숙일수록 더 큰 혜택을 누리세요.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">+</div>
              <h3 className="font-bold mb-2">자유로운 날짜 선택</h3>
              <p className="text-sm text-muted">유효기간 내 원하는 날짜에 예약. 분할 사용으로 여러 번에 나누어 투숙 가능합니다.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">*</div>
              <h3 className="font-bold mb-2">다양한 혜택 포함</h3>
              <p className="text-sm text-muted">조식, 비즈니스센터, 스위트 업그레이드 등 패키지별 특별 혜택이 포함됩니다.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">지금 바로 시작하세요</h2>
            <p className="text-muted mb-8">4가지 패키지 중 나에게 맞는 숙박권을 선택하고, 평창의 힐링을 경험하세요.</p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors"
            >
              숙박권 둘러보기
            </Link>
          </div>
        </section>
      </main>
      <CustomerFooter />
    </div>
  );
}
