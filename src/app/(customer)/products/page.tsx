import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/product/product-card';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '숙박권 상품 | 호텔어라운드 평창',
  description: '호텔어라운드 평창 모바일 숙박권 4종 패키지를 확인하세요.',
};

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">모바일 숙박권</h1>
        <p className="text-muted">선결제로 합리적인 가격에, 유효기간 내 자유롭게 예약하세요</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            productCode={product.productCode}
            name={product.name}
            totalNights={product.totalNights}
            price={product.price}
            pricePerNight={product.pricePerNight}
            targetSegment={product.targetSegment}
            benefits={product.benefits as string[]}
            validityDays={product.validityDays}
          />
        ))}
      </div>

      <div className="mt-12 bg-blue-50 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">숙박권 이용 안내</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted">
          <div>
            <h3 className="font-medium text-foreground mb-1">구매 후 예약</h3>
            <p>숙박권 구매 후 유효기간 내 원하는 날짜를 선택하여 예약합니다.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">분할 사용</h3>
            <p>5박 이상 패키지는 여러 번에 나누어 사용할 수 있습니다.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">성수기 추가요금</h3>
            <p>성수기(여름, 연말연시, 설/추석)에는 1박당 30,000원의 추가요금이 발생합니다.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">변경/취소</h3>
            <p>투숙일 3일 전까지 무료 변경/취소 가능합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
