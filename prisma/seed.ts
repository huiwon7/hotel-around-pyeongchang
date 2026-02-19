import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { addDays, isWithinInterval, parseISO } from 'date-fns';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/hotel_around_pyeongchang';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const PRODUCTS = [
  {
    productCode: 'HS',
    name: '힐링 스타터',
    description: '바쁜 일상에서 벗어나 평창의 자연 속에서 힐링하는 2박 패키지입니다. 조식 2회와 웰컴드링크가 포함되어 있습니다.',
    totalNights: 2,
    price: 99000,
    pricePerNight: 49500,
    validityDays: 180,
    targetSegment: '힐링/단기',
    benefits: ['조식 2회', '웰컴드링크'],
    sortOrder: 1,
  },
  {
    productCode: 'WW',
    name: '워케이션 위크',
    description: '일과 여가를 함께 즐기는 5박 워케이션 패키지입니다. 비즈니스센터 이용과 출력 무료 혜택이 제공됩니다.',
    totalNights: 5,
    price: 199000,
    pricePerNight: 39800,
    validityDays: 180,
    targetSegment: '리모트워커',
    benefits: ['비즈니스센터 이용', '출력 무료'],
    sortOrder: 2,
  },
  {
    productCode: 'FL',
    name: '패밀리 롱스테이',
    description: '가족과 함께하는 14박 장기 투숙 패키지입니다. 동반 3인 무료와 조식 14회 혜택이 포함됩니다.',
    totalNights: 14,
    price: 490000,
    pricePerNight: 35000,
    validityDays: 365,
    targetSegment: '가족',
    benefits: ['동반 3인 무료', '조식 14회'],
    sortOrder: 3,
  },
  {
    productCode: 'PA',
    name: '프리미엄 올시즌',
    description: '사계절 평창을 자유롭게 즐기는 30박 프리미엄 패키지입니다. 스위트 업그레이드와 F&B 10만 크레딧이 포함됩니다.',
    totalNights: 30,
    price: 990000,
    pricePerNight: 33000,
    validityDays: 365,
    targetSegment: '장기/법인',
    benefits: ['스위트 업그레이드', 'F&B 10만 크레딧'],
    sortOrder: 4,
  },
];

interface PeakPeriod {
  from: string;
  to: string;
  surcharge: number;
  maxRooms: number;
  seasonType: 'PEAK' | 'HIGH' | 'NORMAL' | 'LOW';
}

function getPeakPeriods(year: number): PeakPeriod[] {
  return [
    { from: `${year}-07-20`, to: `${year}-08-15`, surcharge: 30000, maxRooms: 20, seasonType: 'PEAK' },
    { from: `${year}-12-22`, to: `${year}-12-31`, surcharge: 30000, maxRooms: 15, seasonType: 'PEAK' },
    { from: `${year + 1}-01-01`, to: `${year + 1}-01-03`, surcharge: 30000, maxRooms: 15, seasonType: 'PEAK' },
    // 2026 설날
    { from: '2026-02-16', to: '2026-02-18', surcharge: 30000, maxRooms: 15, seasonType: 'PEAK' },
    // 2026 추석
    { from: '2026-10-04', to: '2026-10-06', surcharge: 30000, maxRooms: 15, seasonType: 'PEAK' },
    // 2027 설날
    { from: '2027-02-05', to: '2027-02-07', surcharge: 30000, maxRooms: 15, seasonType: 'PEAK' },
  ];
}

async function main() {
  console.log('Seeding database...');

  // 1. Products
  for (const product of PRODUCTS) {
    await prisma.product.upsert({
      where: { productCode: product.productCode },
      update: product,
      create: product,
    });
    console.log(`  Product: ${product.name} (${product.productCode})`);
  }

  // 2. Daily Quotas - 365 days from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const peakPeriods = [...getPeakPeriods(2026), ...getPeakPeriods(2027)];

  const quotaData = [];
  for (let i = 0; i < 365; i++) {
    const date = addDays(today, i);
    let maxRooms = 30;
    let surcharge = 0;
    let seasonType: 'PEAK' | 'HIGH' | 'NORMAL' | 'LOW' = 'NORMAL';
    let isBlackout = false;

    for (const period of peakPeriods) {
      const from = parseISO(period.from);
      const to = parseISO(period.to);
      if (isWithinInterval(date, { start: from, end: to })) {
        maxRooms = period.maxRooms;
        surcharge = period.surcharge;
        seasonType = period.seasonType;
        break;
      }
    }

    quotaData.push({
      quotaDate: date,
      maxVoucherRooms: maxRooms,
      reservedRooms: 0,
      isBlackout,
      surchargePerNight: surcharge,
      seasonType,
      updatedAt: new Date(),
    });
  }

  for (const quota of quotaData) {
    await prisma.dailyQuota.upsert({
      where: { quotaDate: quota.quotaDate },
      update: quota,
      create: quota,
    });
  }
  console.log(`  DailyQuota: ${quotaData.length} days created`);

  // 3. Admin User
  const adminPasswordHash = await bcrypt.hash('admin1234!', 12);
  await prisma.adminUser.upsert({
    where: { email: 'admin@hotelaround.kr' },
    update: {},
    create: {
      email: 'admin@hotelaround.kr',
      passwordHash: adminPasswordHash,
      name: '관리자',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('  Admin: admin@hotelaround.kr (pw: admin1234!)');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
