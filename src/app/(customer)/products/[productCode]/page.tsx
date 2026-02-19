import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatKRW, formatNumber } from '@/lib/utils/currency';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productCode: string }>;
}) {
  const { productCode } = await params;

  const product = await prisma.product.findUnique({
    where: { productCode: productCode.toUpperCase() },
  });

  if (!product) notFound();

  const benefits = product.benefits as string[];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
          <p className="text-blue-200 text-sm mb-2">{product.targetSegment}</p>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-4xl font-bold">
            {product.totalNights}<span className="text-xl">박</span>
          </p>
        </div>

        <div className="p-8">
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold">{formatKRW(product.price)}</span>
            <span className="text-muted">1박당 {formatNumber(product.pricePerNight)}원</span>
          </div>

          <p className="text-muted leading-relaxed mb-8">{product.description}</p>

          <div className="mb-8">
            <h2 className="font-bold mb-3">포함 혜택</h2>
            <ul className="space-y-2">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <h2 className="font-bold mb-3 text-sm">이용 조건</h2>
            <div className="grid grid-cols-2 gap-3 text-sm text-muted">
              <div><span className="text-foreground font-medium">유효기간:</span> {product.validityDays / 30}개월</div>
              <div><span className="text-foreground font-medium">분할 사용:</span> {product.totalNights > 2 ? '가능' : '불가'}</div>
              <div><span className="text-foreground font-medium">무료 취소:</span> 투숙 D-3 이전</div>
              <div><span className="text-foreground font-medium">전액 환불:</span> 구매 후 7일 이내</div>
            </div>
          </div>

          <Link
            href={`/purchase?product=${product.productCode}`}
            className="block w-full text-center py-3 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition-colors"
          >
            {formatKRW(product.price)}에 구매하기
          </Link>
        </div>
      </div>
    </div>
  );
}
