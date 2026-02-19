const TOSS_API_URL = 'https://api.tosspayments.com/v1';

function getAuthHeader(): string {
  const secretKey = process.env.TOSS_SECRET_KEY || '';
  return `Basic ${Buffer.from(secretKey + ':').toString('base64')}`;
}

export interface TossPaymentResult {
  paymentKey: string;
  orderId: string;
  status: string;
  method: string;
  totalAmount: number;
  approvedAt: string;
  receipt: { url: string } | null;
  card?: { number: string; company: string };
  easyPay?: { provider: string };
}

export async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<TossPaymentResult> {
  const response = await fetch(`${TOSS_API_URL}/payments/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`결제 확인 실패: ${error.message || error.code}`);
  }

  return response.json();
}

export async function cancelTossPayment(
  paymentKey: string,
  cancelReason: string,
  cancelAmount?: number
): Promise<{ cancels: { cancelAmount: number; canceledAt: string }[] }> {
  const body: Record<string, unknown> = { cancelReason };
  if (cancelAmount) body.cancelAmount = cancelAmount;

  const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`결제 취소 실패: ${error.message || error.code}`);
  }

  return response.json();
}

export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `HAP-${timestamp}-${random}`;
}
