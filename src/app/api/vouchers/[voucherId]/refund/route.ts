import { NextResponse } from 'next/server';
import { refundVoucher } from '@/lib/voucher/voucher-engine';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ voucherId: string }> }
) {
  try {
    const { voucherId } = await params;
    const result = await refundVoucher(voucherId);

    return NextResponse.json({
      success: true,
      refundAmount: result.refundAmount,
      reason: result.reason,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: '환불 처리 실패' }, { status: 500 });
  }
}
