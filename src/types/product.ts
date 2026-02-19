export interface ProductInfo {
  id: string;
  productCode: string;
  name: string;
  description: string;
  totalNights: number;
  price: number;
  pricePerNight: number;
  validityDays: number;
  targetSegment: string;
  benefits: string[];
  isActive: boolean;
}

export const PRODUCT_CODES = {
  HS: 'HS',
  WW: 'WW',
  FL: 'FL',
  PA: 'PA',
} as const;

export type ProductCode = (typeof PRODUCT_CODES)[keyof typeof PRODUCT_CODES];
