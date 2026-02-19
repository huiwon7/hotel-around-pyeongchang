import QRCode from 'qrcode';
import { generateHmacSignature, verifyHmacSignature } from '@/lib/utils/crypto';

export function generateQrPayload(voucherCode: string, expiresAt: Date): {
  payload: string;
  signature: string;
} {
  const data = `${voucherCode}|${expiresAt.toISOString()}`;
  const signature = generateHmacSignature(data);
  return {
    payload: `${data}|${signature}`,
    signature,
  };
}

export function verifyQrPayload(payload: string): {
  valid: boolean;
  voucherCode?: string;
  expiresAt?: Date;
} {
  const parts = payload.split('|');
  if (parts.length !== 3) return { valid: false };

  const [voucherCode, expiresAtStr, signature] = parts;
  const data = `${voucherCode}|${expiresAtStr}`;

  if (!verifyHmacSignature(data, signature)) {
    return { valid: false };
  }

  const expiresAt = new Date(expiresAtStr);
  if (isNaN(expiresAt.getTime())) {
    return { valid: false };
  }

  return { valid: true, voucherCode, expiresAt };
}

export async function generateQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });
}
