-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('DIRECT', 'NAVER', 'KAKAO', 'WELFARE', 'PHONE');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('ISSUED', 'ACTIVE', 'RESERVED', 'CHECKED_IN', 'USED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('PEAK', 'HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "CustomerSegment" AS ENUM ('WORKATION', 'FAMILY', 'HEALING', 'SKI', 'MICE', 'GENERAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIAL_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'EASY_PAY', 'VIRTUAL_ACCOUNT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PURCHASE_CONFIRM', 'RESERVATION_CONFIRM', 'RESERVATION_CANCEL', 'CHECK_IN_REMINDER', 'EXPIRY_D30', 'EXPIRY_D15', 'EXPIRY_D7', 'CHECKOUT_REVIEW', 'REFUND_CONFIRM');

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "productCode" VARCHAR(2) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "totalNights" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "pricePerNight" INTEGER NOT NULL,
    "validityDays" INTEGER NOT NULL,
    "targetSegment" VARCHAR(50) NOT NULL,
    "benefits" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "email" VARCHAR(100),
    "segment" "CustomerSegment" NOT NULL DEFAULT 'GENERAL',
    "totalPurchases" INTEGER NOT NULL DEFAULT 0,
    "totalStays" INTEGER NOT NULL DEFAULT 0,
    "lifetimeValue" INTEGER NOT NULL DEFAULT 0,
    "firstPurchaseAt" TIMESTAMP(3),
    "lastStayAt" TIMESTAMP(3),
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "kakaoChannelId" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" UUID NOT NULL,
    "voucherCode" VARCHAR(25) NOT NULL,
    "customerId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "paymentId" UUID,
    "channel" "SalesChannel" NOT NULL DEFAULT 'DIRECT',
    "status" "VoucherStatus" NOT NULL DEFAULT 'ISSUED',
    "totalNights" INTEGER NOT NULL,
    "usedNights" INTEGER NOT NULL DEFAULT 0,
    "heldNights" INTEGER NOT NULL DEFAULT 0,
    "purchasePrice" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "qrCodeData" TEXT,
    "qrSignature" VARCHAR(128),
    "giftFlag" BOOLEAN NOT NULL DEFAULT false,
    "giftSenderId" UUID,
    "giftReceiverId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_status_history" (
    "id" UUID NOT NULL,
    "voucherId" UUID NOT NULL,
    "fromStatus" "VoucherStatus",
    "toStatus" "VoucherStatus" NOT NULL,
    "reason" VARCHAR(255),
    "actorType" VARCHAR(20) NOT NULL,
    "actorId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "voucherId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "checkInDate" DATE NOT NULL,
    "checkOutDate" DATE NOT NULL,
    "nightsCount" INTEGER NOT NULL,
    "roomType" VARCHAR(50),
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "surchargeAmount" INTEGER NOT NULL DEFAULT 0,
    "surchargePaid" BOOLEAN NOT NULL DEFAULT false,
    "pmsReservationId" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_quotas" (
    "quotaDate" DATE NOT NULL,
    "maxVoucherRooms" INTEGER NOT NULL DEFAULT 30,
    "reservedRooms" INTEGER NOT NULL DEFAULT 0,
    "isBlackout" BOOLEAN NOT NULL DEFAULT false,
    "surchargePerNight" INTEGER NOT NULL DEFAULT 0,
    "seasonType" "SeasonType" NOT NULL DEFAULT 'NORMAL',
    "notes" VARCHAR(255),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_quotas_pkey" PRIMARY KEY ("quotaDate")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "tossPaymentKey" VARCHAR(200),
    "tossOrderId" VARCHAR(100) NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod",
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "customerName" VARCHAR(50) NOT NULL,
    "customerPhone" VARCHAR(15) NOT NULL,
    "productName" VARCHAR(200) NOT NULL,
    "receiptUrl" VARCHAR(500),
    "failReason" VARCHAR(500),
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundAmount" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "recipientPhone" VARCHAR(15) NOT NULL,
    "recipientName" VARCHAR(50) NOT NULL,
    "templateCode" VARCHAR(50) NOT NULL,
    "templateVars" JSONB NOT NULL,
    "kakaoMessageId" VARCHAR(100),
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "errorMessage" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_sequences" (
    "productCode" VARCHAR(2) NOT NULL,
    "yearMonth" VARCHAR(4) NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "voucher_sequences_pkey" PRIMARY KEY ("productCode","yearMonth")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_productCode_key" ON "products"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_segment_idx" ON "customers"("segment");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_voucherCode_key" ON "vouchers"("voucherCode");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_paymentId_key" ON "vouchers"("paymentId");

-- CreateIndex
CREATE INDEX "vouchers_customerId_idx" ON "vouchers"("customerId");

-- CreateIndex
CREATE INDEX "vouchers_status_idx" ON "vouchers"("status");

-- CreateIndex
CREATE INDEX "vouchers_expiresAt_idx" ON "vouchers"("expiresAt");

-- CreateIndex
CREATE INDEX "voucher_status_history_voucherId_idx" ON "voucher_status_history"("voucherId");

-- CreateIndex
CREATE INDEX "reservations_voucherId_idx" ON "reservations"("voucherId");

-- CreateIndex
CREATE INDEX "reservations_customerId_idx" ON "reservations"("customerId");

-- CreateIndex
CREATE INDEX "reservations_checkInDate_idx" ON "reservations"("checkInDate");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_tossPaymentKey_key" ON "payments"("tossPaymentKey");

-- CreateIndex
CREATE UNIQUE INDEX "payments_tossOrderId_key" ON "payments"("tossOrderId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_tossOrderId_idx" ON "payments"("tossOrderId");

-- CreateIndex
CREATE INDEX "notification_logs_recipientPhone_idx" ON "notification_logs"("recipientPhone");

-- CreateIndex
CREATE INDEX "notification_logs_type_idx" ON "notification_logs"("type");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_giftSenderId_fkey" FOREIGN KEY ("giftSenderId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_giftReceiverId_fkey" FOREIGN KEY ("giftReceiverId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_status_history" ADD CONSTRAINT "voucher_status_history_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
