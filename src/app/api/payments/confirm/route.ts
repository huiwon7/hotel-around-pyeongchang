import { NextResponse } from 'next/server';
import { paymentConfirmSchema } from '@/validators/payment';
import { confirmPayment } from '@/lib/payment/payment-processor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = paymentConfirmSchema.parse(body);

    const { payment, voucher } = await confirmPayment(validated);

    return NextResponse.json({
      success: true,
      voucherCode: voucher.voucherCode,
      voucherId: voucher.id,
      expiresAt: voucher.expiresAt,
      totalNights: voucher.totalNights,
      paymentId: payment.id,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message, success: false }, { status: 400 });
    }
    return NextResponse.json({ error: '결제 확인 실패', success: false }, { status: 500 });
  }
}
