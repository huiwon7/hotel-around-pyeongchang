import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productCode: string }> }
) {
  const { productCode } = await params;

  const product = await prisma.product.findUnique({
    where: { productCode: productCode.toUpperCase() },
  });

  if (!product) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json(product);
}
