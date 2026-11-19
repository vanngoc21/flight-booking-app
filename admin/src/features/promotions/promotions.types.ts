export type PromotionDiscountType = 'percentage' | 'fixed';
export type PromotionApplicability = 'all' | 'domestic' | 'international';

export interface Promotion {
  _id: string;
  code: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  campaignType?: 'coupon' | 'event';
  eventTitle?: string;
  eventTitleEn?: string;
  bannerImageUrl?: string;
  airlineCode?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minimumBaseFare: number;
  applicability: PromotionApplicability;
  startsAt: string;
  endsAt: string;
  active: boolean;
  seeded: boolean;
}

export interface PromotionPayload {
  code: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  campaignType: 'coupon' | 'event';
  eventTitle: string;
  eventTitleEn: string;
  bannerImageUrl: string;
  airlineCode: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minimumBaseFare: number;
  applicability: PromotionApplicability;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export interface PromotionsResponse {
  success?: boolean;
  data: Promotion[];
}

export interface PromotionResponse {
  success?: boolean;
  data: Promotion;
}
