import Link from 'next/link';

export default function CustomerFooter() {
  return (
    <footer className="bg-gray-50 border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-foreground mb-3">호텔어라운드 평창</h3>
            <p className="text-sm text-muted leading-relaxed">
              강원도 평창군 봉평면<br />
              Tel: 033-000-0000<br />
              Email: info@hotelaround.kr
            </p>
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-3">숙박권 안내</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/products" className="hover:text-primary">상품 보기</Link></li>
              <li><Link href="/voucher" className="hover:text-primary">내 바우처</Link></li>
              <li><Link href="/reservation" className="hover:text-primary">예약 확인</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-3">고객 지원</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>이용약관</li>
              <li>개인정보처리방침</li>
              <li>환불/취소 규정</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} 호텔어라운드 평창. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
