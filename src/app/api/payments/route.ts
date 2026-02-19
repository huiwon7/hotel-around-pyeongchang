import { NextResponse } from 'next/server';
import { paymentInitSchema } from '@/validators/payment';
import { initiatePayment } from '@/lib/payment/payment-processor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = paymentInitSchema.parse(body);

    const result = await initiatePayment(validated);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: '결제 초기화 실패' }, { status: 500 });
  }
}
