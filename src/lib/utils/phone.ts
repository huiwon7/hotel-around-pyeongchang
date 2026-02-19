export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function isValidKoreanPhone(phone: string): boolean {
  const cleaned = normalizePhone(phone);
  return /^01[016789]\d{7,8}$/.test(cleaned);
}

export function maskPhone(phone: string): string {
  const cleaned = normalizePhone(phone);
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-****-${cleaned.slice(7)}`;
  }
  return `${cleaned.slice(0, 3)}-***-${cleaned.slice(6)}`;
}
