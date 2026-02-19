export const CANCELLATION_RULES = {
  FREE_CANCEL_DAYS_BEFORE: 3,
  LATE_CANCEL_PENALTY_NIGHTS: 1,
  NO_SHOW_PENALTY_NIGHTS: 1,
} as const;

export const REFUND_RULES = {
  FULL_REFUND_DAYS: 7,
} as const;

export const QUOTA_RULES = {
  DEFAULT_MAX_ROOMS: 30,
  PEAK_MAX_ROOMS: 15,
  SUMMER_PEAK_MAX_ROOMS: 20,
} as const;

export const SURCHARGE_RATES = {
  PEAK: 30000,
  HIGH: 15000,
  NORMAL: 0,
  LOW: 0,
} as const;

export const SALES_CHANNELS = {
  DIRECT: { label: '자사몰', feeRate: 0.03 },
  NAVER: { label: '네이버 스마트스토어', feeRate: 0.0374 },
  KAKAO: { label: '카카오톡 선물하기', feeRate: 0.125 },
  WELFARE: { label: '기업 복지몰', feeRate: 0.115 },
  PHONE: { label: '전화/현장', feeRate: 0.025 },
} as const;
