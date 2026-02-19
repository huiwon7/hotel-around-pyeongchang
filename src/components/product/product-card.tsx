import Link from 'next/link';
import { formatKRW, formatNumber } from '@/lib/utils/currency';

interface ProductCardProps {
  productCode: string;
  name: string;
  totalNights: number;
  price: number;
  pricePerNight: number;
  targetSegment: string;
  benefits: string[];
  validityDays: number;
}

export default function ProductCard({
  productCode, name, totalNights, price, pricePerNight,
  targetSegment, benefits, validityDays,
}: ProductCardProps) {
  return (
    <Link href={`/products/${productCode}`}>
      <div className="bg-white rounded-xl border border-border shadow-sm hover:shadow-lg transition-all p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
            {targetSegment}
          </span>
          <span className="text-sm text-muted">{validityDays / 30}개월</span>
        </div>

        <h3 className="text-xl font-bold mb-1">{name}</h3>
        <p className="text-3xl font-bold text-primary mb-1">
          {totalNights}<span className="text-lg">박</span>
        </p>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold">{formatKRW(price)}</span>
          <span className="text-sm text-muted">1박 {formatNumber(pricePerNight)}원</span>
        </div>

        <div className="flex-1">
          <ul className="space-y-1.5 mb-4">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {benefit}
              </li>
            ))}
            {totalNights > 2 && (
              <li className="flex items-center gap-2 text-sm text-blue-600">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                분할 사용 가능
              </li>
            )}
          </ul>
        </div>

        <div className="mt-auto pt-4 border-t border-border">
          <span className="block w-full text-center py-2.5 bg-primary text-white rounded-lg font-medium">
            구매하기
          </span>
        </div>
      </div>
    </Link>
  );
}
