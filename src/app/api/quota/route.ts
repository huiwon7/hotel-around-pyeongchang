import { NextResponse } from 'next/server';
import { getQuotaRange } from '@/lib/quota/quota-manager';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'from, to 파라미터가 필요합니다' }, { status: 400 });
  }

  const quotas = await getQuotaRange(new Date(from), new Date(to));
  return NextResponse.json(quotas);
}
