import { prisma } from '@/lib/prisma';
import { computeLuhnMod36Checksum } from '@/lib/utils/crypto';
import { formatYearMonth } from '@/lib/utils/date';

export async function generateVoucherCode(productCode: string): Promise<string> {
  const yearMonth = formatYearMonth(new Date());

  const seq = await prisma.$transaction(async (tx) => {
    const result = await tx.voucherSequence.upsert({
      where: {
        productCode_yearMonth: { productCode, yearMonth },
      },
      update: { lastSeq: { increment: 1 } },
      create: { productCode, yearMonth, lastSeq: 1 },
    });
    return result.lastSeq;
  });

  const seqStr = String(seq).padStart(6, '0');
  const body = `HAP${productCode}${yearMonth}${seqStr}`;
  const checksum = computeLuhnMod36Checksum(body);

  return `HAP-${productCode}-${yearMonth}-${seqStr}-${checksum}`;
}

export function parseVoucherCode(code: string): {
  valid: boolean;
  productCode?: string;
  yearMonth?: string;
  sequence?: number;
} {
  const parts = code.split('-');
  if (parts.length !== 5 || parts[0] !== 'HAP') {
    return { valid: false };
  }

  const [, productCode, yearMonth, seqStr, checksum] = parts;

  if (!['HS', 'WW', 'FL', 'PA'].includes(productCode)) {
    return { valid: false };
  }

  const body = `HAP${productCode}${yearMonth}${seqStr}`;
  const expectedChecksum = computeLuhnMod36Checksum(body);

  if (checksum !== expectedChecksum) {
    return { valid: false };
  }

  return {
    valid: true,
    productCode,
    yearMonth,
    sequence: parseInt(seqStr, 10),
  };
}
