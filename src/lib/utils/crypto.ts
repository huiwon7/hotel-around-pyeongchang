import { createHmac, randomBytes } from 'crypto';

const QR_SECRET = process.env.VOUCHER_QR_HMAC_SECRET || 'dev-secret-change-in-production';

export function generateHmacSignature(data: string): string {
  return createHmac('sha256', QR_SECRET).update(data).digest('hex');
}

export function verifyHmacSignature(data: string, signature: string): boolean {
  const expected = generateHmacSignature(data);
  return expected === signature;
}

export function generateRandomHex(length: number): string {
  return randomBytes(length).toString('hex');
}

export function generateOTP(): string {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

const CHARSET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function computeLuhnMod36Checksum(input: string): string {
  const clean = input.replace(/[^0-9A-Z]/gi, '').toUpperCase();
  let factor = 2;
  let sum = 0;
  const n = CHARSET.length;

  for (let i = clean.length - 1; i >= 0; i--) {
    let codePoint = CHARSET.indexOf(clean[i]);
    if (codePoint === -1) codePoint = 0;

    let addend = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / n) + (addend % n);
    sum += addend;
  }

  const remainder = sum % n;
  const checkDigit1 = CHARSET[(n - remainder) % n];

  sum += CHARSET.indexOf(checkDigit1);
  const remainder2 = sum % n;
  const checkDigit2 = CHARSET[(n - remainder2) % n];

  return `${checkDigit1}${checkDigit2}`;
}

export function validateChecksum(code: string): boolean {
  const parts = code.split('-');
  if (parts.length !== 5) return false;
  if (parts[0] !== 'HAP') return false;

  const body = parts.slice(0, 4).join('');
  const expected = computeLuhnMod36Checksum(body);
  return parts[4] === expected;
}
