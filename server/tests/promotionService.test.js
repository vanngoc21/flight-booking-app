jest.mock('../src/models/Promotion', () => ({
  findOne: jest.fn(),
}));

const Promotion = require('../src/models/Promotion');
const {
  applyPromotion,
  calculateDiscount,
} = require('../src/services/promotionService');

describe('promotion service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies percentage discounts to base fare and respects the cap', () => {
    expect(calculateDiscount({
      discountType: 'percentage',
      discountValue: 20,
      maxDiscount: 150_000,
      minimumBaseFare: 0,
    }, 1_000_000)).toBe(150_000);
  });

  it('does not allow a fixed discount to exceed the base fare', () => {
    expect(calculateDiscount({
      discountType: 'fixed',
      discountValue: 500_000,
      maxDiscount: null,
      minimumBaseFare: 0,
    }, 100_000)).toBe(100_000);
  });

  it('rejects codes below their minimum base fare', () => {
    expect(() => calculateDiscount({
      discountType: 'fixed',
      discountValue: 50_000,
      maxDiscount: null,
      minimumBaseFare: 1_000_000,
    }, 999_999)).toThrow('Tổng giá vé cơ bản tối thiểu');
  });

  it('normalizes codes and returns the promotion snapshot for a valid booking', async () => {
    Promotion.findOne.mockResolvedValue({
      _id: 'promotion-id',
      code: 'WELCOME10',
      title: 'Ưu đãi chào mừng',
      titleEn: 'Welcome offer',
      discountType: 'percentage',
      discountValue: 10,
      maxDiscount: 200_000,
      minimumBaseFare: 500_000,
      applicability: 'all',
      startsAt: new Date(Date.now() - 60_000),
      endsAt: new Date(Date.now() + 60_000),
      active: true,
    });

    await expect(applyPromotion({
      code: ' welcome10 ',
      baseFare: 1_000_000,
    })).resolves.toEqual({
      id: 'promotion-id',
      code: 'WELCOME10',
      title: 'Ưu đãi chào mừng',
      titleEn: 'Welcome offer',
      discountAmount: 100_000,
    });
    expect(Promotion.findOne).toHaveBeenCalledWith({ code: 'WELCOME10' });
  });

  it('rejects an international-only offer for a domestic booking', async () => {
    Promotion.findOne.mockResolvedValue({
      code: 'INTL15',
      title: 'International offer',
      discountType: 'percentage',
      discountValue: 15,
      maxDiscount: null,
      minimumBaseFare: 0,
      applicability: 'international',
      startsAt: new Date(Date.now() - 60_000),
      endsAt: new Date(Date.now() + 60_000),
      active: true,
    });

    await expect(applyPromotion({
      code: 'INTL15',
      baseFare: 1_000_000,
      isInternational: false,
    })).rejects.toThrow('không áp dụng cho hành trình này');
  });

  it('limits airline-specific event discounts to matching flight legs', async () => {
    Promotion.findOne.mockResolvedValue({
      code: 'BLACKFRIDAY',
      title: 'Black Friday Sale',
      discountType: 'percentage',
      discountValue: 10,
      maxDiscount: null,
      minimumBaseFare: 0,
      applicability: 'all',
      airlineCode: 'VJ',
      startsAt: new Date(Date.now() - 60_000),
      endsAt: new Date(Date.now() + 60_000),
      active: true,
    });

    await expect(applyPromotion({
      code: 'BLACKFRIDAY',
      baseFare: 1_300_000,
      flightAirlineCodes: ['VJ', 'VN'],
      legBaseFares: [500_000, 800_000],
    })).resolves.toEqual({
      id: undefined,
      code: 'BLACKFRIDAY',
      title: 'Black Friday Sale',
      titleEn: '',
      discountAmount: 50_000,
    });
  });

  it('rejects airline-specific event discounts when no selected leg matches', async () => {
    Promotion.findOne.mockResolvedValue({
      code: 'BLACKFRIDAY',
      title: 'Black Friday Sale',
      discountType: 'percentage',
      discountValue: 10,
      maxDiscount: null,
      minimumBaseFare: 0,
      applicability: 'all',
      airlineCode: 'VJ',
      startsAt: new Date(Date.now() - 60_000),
      endsAt: new Date(Date.now() + 60_000),
      active: true,
    });

    await expect(applyPromotion({
      code: 'BLACKFRIDAY',
      baseFare: 800_000,
      flightAirlineCodes: ['VN'],
      legBaseFares: [800_000],
    })).rejects.toThrow('không áp dụng cho hãng bay');
  });
});
