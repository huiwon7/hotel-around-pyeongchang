import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { expireVoucher } from '@/lib/voucher/voucher-engine';

export async function POST() {
  const expiredVouchers = await prisma.voucher.findMany({
    where: {
      expiresAt: { lt: new Date() },
      status: { notIn: ['USED', 'EXPIRED', 'REFUNDED'] },
    },
  });

  const results = [];
  for (const voucher of expiredVouchers) {
    try {
      await expireVoucher(voucher.id);
      results.push({ voucherCode: voucher.voucherCode, success: true });
    } catch (error) {
      results.push({
        voucherCode: voucher.voucherCode,
        success: false,
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}
