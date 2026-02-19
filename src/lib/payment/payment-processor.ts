import { prisma } from '@/lib/prisma';
import { confirmTossPayment, generateOrderId } from './toss-client';
import { issueVoucher } from '@/lib/voucher/voucher-engine';
import { PRODUCT_DEFINITIONS } from '@/lib/constants/products';

export async function initiatePayment(params: {
  productCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  marketingConsent: boolean;
}) {
  const productDef = PRODUCT_DEFINITIONS.find(p => p.productCode === params.productCode);
  if (!productDef) throw new Error('존재하지 않는 상품입니다');

  const product = await prisma.product.findUnique({
    where: { productCode: params.productCode },
  });
  if (!product || !product.isActive) throw new Error('현재 판매중이 아닌 상품입니다');

  const customer = await prisma.customer.upsert({
    where: { phone: params.customerPhone },
    update: {
      name: params.customerName,
      email: params.customerEmail,
      marketingConsent: params.marketingConsent,
    },
    create: {
      name: params.customerName,
      phone: params.customerPhone,
      email: params.customerEmail,
      marketingConsent: params.marketingConsent,
    },
  });

  const orderId = generateOrderId();

  const payment = await prisma.payment.create({
    data: {
      tossOrderId: orderId,
      amount: product.price,
      status: 'PENDING',
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      productName: product.name,
    },
  });

  return {
    orderId,
    paymentId: payment.id,
    amount: product.price,
    productName: product.name,
    customerName: params.customerName,
    customerId: customer.id,
    productId: product.id,
    productCode: product.productCode,
    totalNights: product.totalNights,
    validityDays: product.validityDays,
  };
}

export async function confirmPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const payment = await prisma.payment.findUnique({
    where: { tossOrderId: params.orderId },
  });

  if (!payment) throw new Error('결제 정보를 찾을 수 없습니다');
  if (payment.status !== 'PENDING') throw new Error('이미 처리된 결제입니다');
  if (payment.amount !== params.amount) throw new Error('결제 금액이 일치하지 않습니다');

  const tossResult = await confirmTossPayment(params.paymentKey, params.orderId, params.amount);

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      tossPaymentKey: params.paymentKey,
      status: 'COMPLETED',
      method: tossResult.method === '카드' ? 'CARD' : 'EASY_PAY',
      paidAt: new Date(tossResult.approvedAt),
      receiptUrl: tossResult.receipt?.url,
      metadata: JSON.parse(JSON.stringify(tossResult)),
    },
  });

  const customer = await prisma.customer.findUnique({
    where: { phone: payment.customerPhone },
  });
  if (!customer) throw new Error('고객 정보를 찾을 수 없습니다');

  const product = await prisma.product.findFirst({
    where: { name: payment.productName },
  });
  if (!product) throw new Error('상품 정보를 찾을 수 없습니다');

  const voucher = await issueVoucher({
    customerId: customer.id,
    productId: product.id,
    productCode: product.productCode,
    totalNights: product.totalNights,
    purchasePrice: payment.amount,
    validityDays: product.validityDays,
    paymentId: updatedPayment.id,
    channel: 'DIRECT',
  });

  return { payment: updatedPayment, voucher };
}
